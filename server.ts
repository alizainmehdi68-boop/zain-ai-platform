import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { db, initDatabase } from './src/server/db.js';
import {
  AuthenticatedRequest,
  generateToken,
  requireAdmin,
  requireAuth,
} from './src/server/auth.js';
import { generateWithGemini } from './src/server/geminiService.js';
import { verifyTronTransaction } from './src/server/tronVerification.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seeds
initDatabase();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to fetch application settings
function getSetting(key: string, defaultValue: any = null) {
  const row = db.prepare('SELECT value_json FROM application_settings WHERE key = ?').get(key) as any;
  if (!row) return defaultValue;
  try {
    return JSON.parse(row.value_json);
  } catch {
    return defaultValue;
  }
}

function setSetting(key: string, value: any) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO application_settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), now);
}

// Helper to get active user subscription
function getUserActiveSubscription(userId: string) {
  const now = new Date().toISOString();
  const sub = db.prepare(`
    SELECT s.*, p.slug as plan_slug, p.name as plan_name, p.daily_limit, p.max_words, p.features_json
    FROM user_subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status = 'active' AND s.end_date > ?
    ORDER BY s.end_date DESC
    LIMIT 1
  `).get(userId, now) as any;

  if (sub) {
    return {
      ...sub,
      features: JSON.parse(sub.features_json || '[]'),
    };
  }

  // Fallback to default free plan
  const freePlan = db.prepare('SELECT * FROM subscription_plans WHERE slug = ?').get('free') as any;
  return {
    id: 'sub_default_free',
    user_id: userId,
    plan_id: freePlan?.id || 'plan_free',
    plan_slug: 'free',
    plan_name: 'Free Plan',
    daily_limit: freePlan?.daily_limit || 15,
    max_words: freePlan?.max_words || 1500,
    status: 'active',
    billing_cycle: 'free',
    start_date: new Date().toISOString(),
    end_date: '2099-12-31T23:59:59.000Z',
    features: JSON.parse(freePlan?.features_json || '[]'),
  };
}

// Count user generations today
function getUserTodayGenerationsCount(userId: string): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM ai_usage_records
    WHERE user_id = ? AND created_at >= ?
  `).get(userId, todayStart.toISOString()) as any;
  return row?.count || 0;
}

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    // Auto-promote to admin if email matches admin platform email
    const isAdmin = cleanEmail === 'alizainmehdi68@gmail.com' || cleanEmail === 'admin@zainai.com';
    const role = isAdmin ? 'admin' : 'user';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
    `).run(userId, cleanEmail, passwordHash, name.trim(), role, now, now);

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, bio, preferred_language, created_at, updated_at)
      VALUES (?, ?, ?, 'English', ?, ?)
    `).run(`prof_${userId}`, userId, 'Creative AI Enthusiast', now, now);

    // Create free subscription record
    const freePlan = db.prepare('SELECT id FROM subscription_plans WHERE slug = ?').get('free') as any;
    db.prepare(`
      INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, start_date, end_date, auto_renew, created_at, updated_at)
      VALUES (?, ?, ?, 'free', 'active', ?, '2099-12-31T23:59:59.000Z', 1, ?, ?)
    `).run(`sub_${userId}`, userId, freePlan?.id || 'plan_free', now, now, now);

    const authUser = { id: userId, email: cleanEmail, role: role as 'user' | 'admin', name: name.trim() };
    const token = generateToken(authUser);

    return res.json({
      token,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role,
        email_verified: 1,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const authUser = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(authUser);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Google Authentication (Instant single-click Google Sign-In)
app.post('/api/auth/google', (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    const now = new Date().toISOString();

    if (!user) {
      const userId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);
      const isAdmin = cleanEmail === 'alizainmehdi68@gmail.com' || cleanEmail === 'admin@zainai.com';
      const role = isAdmin ? 'admin' : 'user';

      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)
      `).run(userId, cleanEmail, randomPassword, name || 'Google User', role, now, now);

      db.prepare(`
        INSERT INTO user_profiles (id, user_id, avatar_url, bio, preferred_language, created_at, updated_at)
        VALUES (?, ?, ?, 'Google Account User', 'English', ?, ?)
      `).run(`prof_${userId}`, userId, avatarUrl || '', now, now);

      const freePlan = db.prepare('SELECT id FROM subscription_plans WHERE slug = ?').get('free') as any;
      db.prepare(`
        INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, start_date, end_date, auto_renew, created_at, updated_at)
        VALUES (?, ?, ?, 'free', 'active', ?, '2099-12-31T23:59:59.000Z', 1, ?, ?)
      `).run(`sub_${userId}`, userId, freePlan?.id || 'plan_free', now, now, now);

      user = { id: userId, email: cleanEmail, name: name || 'Google User', role, email_verified: 1 };
    }

    const authUser = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(authUser);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: 1,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});

// Get current user profile & subscription
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, is_active, email_verified, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user!.id) as any;
    const subscription = getUserActiveSubscription(req.user!.id);
    const todayGenerations = getUserTodayGenerationsCount(req.user!.id);

    return res.json({
      user,
      profile: profile || {},
      subscription,
      usage: {
        todayGenerations,
        dailyLimit: subscription.daily_limit,
        remainingToday: Math.max(0, subscription.daily_limit - todayGenerations),
        maxWordsPerGen: subscription.max_words,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.post('/api/auth/update-profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, country, company, preferredLanguage, avatarUrl } = req.body;
    const now = new Date().toISOString();

    if (name) {
      db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(name.trim(), now, req.user!.id);
    }

    db.prepare(`
      UPDATE user_profiles
      SET bio = ?, country = ?, company = ?, preferred_language = ?, avatar_url = ?, updated_at = ?
      WHERE user_id = ?
    `).run(bio || '', country || 'US', company || '', preferredLanguage || 'English', avatarUrl || '', now, req.user!.id);

    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Change Password
app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, new Date().toISOString(), req.user!.id);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify email toggle
app.post('/api/auth/verify-email', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(req.user!.id);
  return res.json({ success: true, message: 'Email verified successfully!' });
});

// Forgot password simulation
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // In SaaS platform, return simulated security token reset message
  return res.json({
    success: true,
    message: 'If an account with that email exists, password reset instructions have been dispatched.',
  });
});

/* ==========================================================================
   SUBSCRIPTION PLANS & PAYMENTS (USDT TRC20)
   ========================================================================== */

// Public plans
app.get('/api/plans', (_req: Request, res: Response) => {
  const plans = db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly ASC').all() as any[];
  const formatted = plans.map((p) => ({
    ...p,
    features: JSON.parse(p.features_json || '[]'),
  }));
  return res.json({ plans: formatted });
});

// Current user subscription
app.get('/api/subscriptions/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const subscription = getUserActiveSubscription(req.user!.id);
  return res.json({ subscription });
});

// Cancel subscription auto-renewal
app.post('/api/subscriptions/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare(`
    UPDATE user_subscriptions
    SET auto_renew = 0, updated_at = ?
    WHERE user_id = ? AND status = 'active'
  `).run(new Date().toISOString(), req.user!.id);
  return res.json({ success: true, message: 'Auto-renewal has been cancelled. Plan remains active until expiration.' });
});

// Create Payment Intent for USDT TRC20
app.post('/api/payments/create-intent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planSlug, billingCycle } = req.body;
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE slug = ?').get(planSlug) as any;

    if (!plan || plan.slug === 'free') {
      return res.status(400).json({ error: 'Invalid paid subscription plan selected.' });
    }

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const receivingAddress = getSetting('usdt_trc20_address', 'TJqZCyxBU6hnn1w2nzVFJVL1NYG28ahkh4');

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO payment_transactions (id, user_id, plan_id, billing_cycle, amount_usdt, currency, receiving_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'USDT_TRC20', ?, 'pending', ?)
    `).run(paymentId, req.user!.id, plan.id, billingCycle, amount, receivingAddress, now);

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(receivingAddress, {
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return res.json({
      paymentId,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
      },
      billingCycle,
      amountUsdt: amount,
      receivingAddress,
      network: 'TRON (TRC20)',
      usdtContract: getSetting('usdt_contract', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
      qrCodeDataUrl: qrDataUrl,
      expiresInMinutes: 60,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit TXID for Payment Verification
app.post('/api/payments/submit-txid', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, txHash } = req.body;
    if (!paymentId || !txHash) {
      return res.status(400).json({ error: 'Payment ID and Transaction Hash (TXID) are required.' });
    }

    const cleanHash = txHash.trim();

    // Check payment record
    const payment = db.prepare('SELECT * FROM payment_transactions WHERE id = ? AND user_id = ?').get(paymentId, req.user!.id) as any;
    if (!payment) {
      return res.status(404).json({ error: 'Payment intent not found.' });
    }

    if (payment.status === 'approved') {
      return res.json({ success: true, status: 'approved', message: 'Payment is already confirmed and active!' });
    }

    // Check duplicate TXID across all transactions to prevent double-spending
    const duplicate = db.prepare('SELECT id FROM payment_transactions WHERE tx_hash = ? AND id != ?').get(cleanHash, paymentId);
    if (duplicate) {
      return res.status(400).json({ error: 'This Transaction Hash (TXID) has already been used on ZainAI.' });
    }

    // Update TXID on payment record
    db.prepare('UPDATE payment_transactions SET tx_hash = ? WHERE id = ?').run(cleanHash, paymentId);

    // Run TRON blockchain on-chain verification
    const verification = await verifyTronTransaction(cleanHash, payment.receiving_address, payment.amount_usdt);

    const now = new Date().toISOString();

    if (verification.verified) {
      // Auto-approve payment!
      db.prepare(`
        UPDATE payment_transactions
        SET status = 'approved', verified_at = ?, admin_note = 'Auto-verified on TRON blockchain'
        WHERE id = ?
      `).run(now, paymentId);

      // Activate subscription
      const days = payment.billing_cycle === 'yearly' ? 365 : 30;
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      // Deactivate any existing active subscriptions
      db.prepare(`UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`).run(req.user!.id);

      db.prepare(`
        INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, start_date, end_date, auto_renew, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?, 1, ?, ?)
      `).run(`sub_${Date.now()}`, req.user!.id, payment.plan_id, payment.billing_cycle, now, endDate, now, now);

      return res.json({
        success: true,
        status: 'approved',
        message: 'Cryptocurrency payment verified successfully! Your subscription is now active.',
        details: verification,
      });
    }

    // If verification requires admin review (e.g. pending confirmation or rate-limited TronScan API)
    db.prepare(`
      UPDATE payment_transactions
      SET status = 'pending', admin_note = ?
      WHERE id = ?
    `).run(verification.error || 'Awaiting automated block confirmation or manual administrator approval.', paymentId);

    return res.json({
      success: true,
      status: 'pending',
      message: 'Transaction submitted! Your payment is being verified on the TRON network. You can also contact support for expedited approval.',
      details: verification,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Check payment status
app.get('/api/payments/status/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const payment = db.prepare(`
    SELECT p.*, s.name as plan_name, s.slug as plan_slug
    FROM payment_transactions p
    JOIN subscription_plans s ON p.plan_id = s.id
    WHERE p.id = ? AND p.user_id = ?
  `).get(req.params.id, req.user!.id) as any;

  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });
  return res.json({ payment });
});

// User payment history
app.get('/api/payments/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const history = db.prepare(`
    SELECT p.*, s.name as plan_name, s.slug as plan_slug
    FROM payment_transactions p
    JOIN subscription_plans s ON p.plan_id = s.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user!.id);

  return res.json({ payments: history });
});

/* ==========================================================================
   AI TOOL GENERATION ENGINE (REAL GEMINI API)
   ========================================================================== */

// Premium tool IDs list for backend plan restriction enforcement
const PREMIUM_TOOL_IDS = new Set([
  'long-form-article',
  'seo-writer',
  'keyword-research',
  'content-planner',
  'bulk-article',
  'email-marketing',
  'business-plan',
  'research-assistant',
  'pdf-summarizer',
  'chat-pdf',
  'resume-builder',
  'cover-letter',
  'text-to-speech',
  'image-generator',
  'image-enhancer',
  'social-calendar',
  'grammar-assistant',
  'website-copy',
  'product-research',
  'youtube-studio',
]);

app.post('/api/ai/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toolId, toolName, inputs } = req.body;
    if (!toolId || !inputs) {
      return res.status(400).json({ error: 'Tool ID and inputs are required.' });
    }

    const userId = req.user!.id;
    const subscription = getUserActiveSubscription(userId);
    const isAdmin = req.user!.role === 'admin';

    // 1. Enforce Plan Restrictions for Premium Tools
    const isPremium = PREMIUM_TOOL_IDS.has(toolId);
    if (isPremium && !isAdmin && subscription.plan_slug === 'free') {
      return res.status(403).json({
        error: 'This tool is exclusively available on Pro and Business plans. Please upgrade your subscription to access premium AI tools.',
        requiresUpgrade: true,
      });
    }

    // 2. Enforce Daily Limit
    const todayCount = getUserTodayGenerationsCount(userId);
    if (!isAdmin && todayCount >= subscription.daily_limit) {
      return res.status(429).json({
        error: `You have reached your daily limit of ${subscription.daily_limit} generations. Please upgrade to a higher tier or wait until tomorrow.`,
        limitReached: true,
      });
    }

    // 3. Call real Gemini AI
    const result = await generateWithGemini({
      toolId,
      toolName: toolName || toolId,
      inputs,
      maxWords: subscription.max_words,
    });

    const now = new Date().toISOString();

    // 4. Record usage in database
    db.prepare(`
      INSERT INTO ai_usage_records (id, user_id, tool_id, tool_name, word_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`use_${Date.now()}`, userId, toolId, toolName || toolId, result.wordCount, now);

    // 5. Save to Generation History
    const historyId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO generation_history (id, user_id, tool_id, tool_name, inputs_json, output_text, word_count, is_favorite, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(historyId, userId, toolId, toolName || toolId, JSON.stringify(inputs), result.text, result.wordCount, now);

    return res.json({
      success: true,
      id: historyId,
      text: result.text,
      wordCount: result.wordCount,
      usageRemaining: Math.max(0, subscription.daily_limit - (todayCount + 1)),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI generation failed.' });
  }
});

// Generation History List
app.get('/api/ai/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const history = db.prepare(`
    SELECT * FROM generation_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.user!.id) as any[];

  const formatted = history.map((item) => ({
    ...item,
    inputs: JSON.parse(item.inputs_json || '{}'),
  }));

  return res.json({ history: formatted });
});

// Delete history item
app.delete('/api/ai/history/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare('DELETE FROM generation_history WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  return res.json({ success: true });
});

// Toggle Favorite history item
app.post('/api/ai/history/:id/favorite', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.prepare(`
    UPDATE generation_history
    SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user!.id);
  return res.json({ success: true });
});

/* ==========================================================================
   CONTACT & SUPPORT
   ========================================================================== */

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const id = `msg_${Date.now()}`;
  db.prepare(`
    INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'unread', ?)
  `).run(id, name, email, subject || 'General Inquiry', message, new Date().toISOString());

  return res.json({ success: true, message: 'Thank you! Your message has been received by ZainAI support.' });
});

/* ==========================================================================
   ADMINISTRATOR DASHBOARD & API
   ========================================================================== */

// Admin Overview Metrics
app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const activeSubs = (db.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active' AND plan_id != 'plan_free'").get() as any).count;
  const totalGenerations = (db.prepare('SELECT COUNT(*) as count FROM ai_usage_records').get() as any).count;
  const totalRevenue = (db.prepare("SELECT SUM(amount_usdt) as sum FROM payment_transactions WHERE status = 'approved'").get() as any).sum || 0;
  const pendingPayments = (db.prepare("SELECT COUNT(*) as count FROM payment_transactions WHERE status = 'pending'").get() as any).count;

  return res.json({
    metrics: {
      totalUsers,
      activeSubs,
      totalGenerations,
      totalRevenue,
      pendingPayments,
    },
  });
});

// Admin Users List & Search
app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const search = req.query.q ? `%${req.query.q}%` : '%';
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.is_active, u.email_verified, u.created_at,
           p.country, p.company,
           s.status as subscription_status, pl.name as plan_name, pl.slug as plan_slug,
           (SELECT COUNT(*) FROM ai_usage_records WHERE user_id = u.id) as total_generations
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN user_subscriptions s ON u.id = s.user_id AND s.status = 'active'
    LEFT JOIN subscription_plans pl ON s.plan_id = pl.id
    WHERE u.email LIKE ? OR u.name LIKE ?
    ORDER BY u.created_at DESC
  `).all(search, search);

  return res.json({ users });
});

// Admin Toggle User Active / Blocked
app.post('/api/admin/users/:id/toggle-status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const user = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newStatus = user.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(newStatus, new Date().toISOString(), req.params.id);

  return res.json({ success: true, is_active: newStatus });
});

// Admin Change User Role
app.post('/api/admin/users/:id/role', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role' });
  }
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, new Date().toISOString(), req.params.id);
  return res.json({ success: true, role });
});

// Admin Payments List
app.get('/api/admin/payments', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const payments = db.prepare(`
    SELECT p.*, u.email as user_email, u.name as user_name, s.name as plan_name, s.slug as plan_slug
    FROM payment_transactions p
    JOIN users u ON p.user_id = u.id
    JOIN subscription_plans s ON p.plan_id = s.id
    ORDER BY p.created_at DESC
  `).all();

  return res.json({ payments });
});

// Admin Approve Payment
app.post('/api/admin/payments/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { note } = req.body;
  const payment = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(req.params.id) as any;
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const now = new Date().toISOString();

  // Approve payment
  db.prepare(`
    UPDATE payment_transactions
    SET status = 'approved', verified_at = ?, admin_note = ?
    WHERE id = ?
  `).run(now, note || 'Approved manually by Administrator', req.params.id);

  // Activate subscription
  const days = payment.billing_cycle === 'yearly' ? 365 : 30;
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`).run(payment.user_id);

  db.prepare(`
    INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, start_date, end_date, auto_renew, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, 1, ?, ?)
  `).run(`sub_${Date.now()}`, payment.user_id, payment.plan_id, payment.billing_cycle, now, endDate, now, now);

  return res.json({ success: true, message: 'Payment approved and user subscription activated.' });
});

// Admin Reject Payment
app.post('/api/admin/payments/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  db.prepare(`
    UPDATE payment_transactions
    SET status = 'rejected', admin_note = ?
    WHERE id = ?
  `).run(reason || 'Rejected by Administrator: Invalid TXID or unconfirmed transfer.', req.params.id);

  return res.json({ success: true, message: 'Payment rejected.' });
});

// Admin Settings: Get & Update
app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.prepare('SELECT * FROM application_settings').all() as any[];
  const mapped: Record<string, any> = {};
  for (const s of settings) {
    try {
      mapped[s.key] = JSON.parse(s.value_json);
    } catch {
      mapped[s.key] = s.value_json;
    }
  }
  return res.json({ settings: mapped });
});

app.post('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required.' });
  }

  for (const [key, val] of Object.entries(settings)) {
    setSetting(key, val);
  }

  return res.json({ success: true, message: 'Settings updated successfully.' });
});

// Admin Contact Messages
app.get('/api/admin/messages', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  return res.json({ messages });
});

/* ==========================================================================
   DEVELOPMENT VITE MIDDLEWARE OR PRODUCTION STATIC SERVE
   ========================================================================== */

if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`[ZainAI] Production-ready SaaS Server running at http://localhost:${port}`);
});

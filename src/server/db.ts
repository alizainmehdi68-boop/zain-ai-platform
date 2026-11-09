import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'zainai.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
      is_active INTEGER NOT NULL DEFAULT 1,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // User profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      country TEXT DEFAULT 'US',
      company TEXT,
      preferred_language TEXT DEFAULT 'English',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Subscription plans
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL, -- 'free' | 'pro' | 'business'
      name TEXT NOT NULL,
      price_monthly REAL NOT NULL,
      price_yearly REAL NOT NULL,
      daily_limit INTEGER NOT NULL,
      max_words INTEGER NOT NULL,
      features_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // User subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      billing_cycle TEXT NOT NULL, -- 'monthly' | 'yearly'
      status TEXT NOT NULL, -- 'active' | 'cancelled' | 'expired' | 'pending'
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );
  `);

  // Payment transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      amount_usdt REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USDT_TRC20',
      receiving_address TEXT NOT NULL,
      tx_hash TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'expired'
      admin_note TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );
  `);

  // AI usage records
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tool_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Generation history
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tool_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      output_text TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Application settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS application_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Contact messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unread',
      created_at TEXT NOT NULL
    );
  `);

  // Seed default subscription plans if empty
  const planCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as { count: number };
  if (planCount.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO subscription_plans (id, slug, name, price_monthly, price_yearly, daily_limit, max_words, features_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPlan.run(
      'plan_free',
      'free',
      'Free Plan',
      0,
      0,
      15,
      1500,
      JSON.stringify([
        '20 Standard AI Tools',
        '15 generations per day',
        '1,500 words per generation limit',
        'Standard generation speed',
        'Basic personal dashboard',
        'Community support'
      ]),
      1
    );

    insertPlan.run(
      'plan_pro',
      'pro',
      'Pro Plan',
      9,
      89,
      150,
      5000,
      JSON.stringify([
        'All 40 Free & Premium AI Tools',
        '150 generations per day',
        'Up to 5,000 words per generation',
        'Advanced SEO & Keyword Assistant',
        'PDF Summarizer & Chat with PDF',
        'AI Image & Text-to-Speech generation',
        'Priority processing queue',
        'Full generation export & history'
      ]),
      1
    );

    insertPlan.run(
      'plan_business',
      'business',
      'Business Plan',
      19,
      189,
      1000,
      10000,
      JSON.stringify([
        'Everything in Pro Plan',
        'Long-Form Articles (up to 10,000 words)',
        '1,000 generations per day (Unlimited tier)',
        'Bulk Article Generator & Planner',
        'Team workspace & shared folders',
        'Full Business Plan & Research tools',
        'Dedicated VIP Priority processing',
        '24/7 Priority support'
      ]),
      1
    );
  }

  // Seed default application settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM application_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO application_settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertSetting.run('usdt_trc20_address', JSON.stringify('TJqZCyxBU6hnn1w2nzVFJVL1NYG28ahkh4'), now);
    insertSetting.run('usdt_contract', JSON.stringify('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'), now);
    insertSetting.run('network', JSON.stringify('TRON (TRC20)'), now);
    insertSetting.run('ai_model', JSON.stringify('gemini-3.8-flash'), now);
    insertSetting.run('platform_name', JSON.stringify('ZainAI'), now);
    insertSetting.run('tagline', JSON.stringify('Your All-in-One AI Productivity Platform'), now);
  }

  // Seed initial Admin & Demo User
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const now = new Date().toISOString();
    const adminPasswordHash = bcrypt.hashSync('Admin12345!', 10);
    const demoPasswordHash = bcrypt.hashSync('Demo12345!', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertProfile = db.prepare(`
      INSERT INTO user_profiles (id, user_id, avatar_url, bio, country, company, preferred_language, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSub = db.prepare(`
      INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, start_date, end_date, auto_renew, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin User
    const adminId = 'usr_admin_01';
    insertUser.run(adminId, 'admin@zainai.com', adminPasswordHash, 'Ali Zain (Admin)', 'admin', 1, 1, now, now);
    insertProfile.run('prof_admin_01', adminId, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'Platform Administrator & Founder', 'US', 'ZainAI Inc.', 'English', now, now);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    insertSub.run('sub_admin_01', adminId, 'plan_business', 'yearly', 'active', now, nextYear, 1, now, now);

    // 2. Demo User (with active Pro subscription)
    const demoId = 'usr_demo_01';
    insertUser.run(demoId, 'demo@zainai.com', demoPasswordHash, 'Sarah Jenkins', 'user', 1, 1, now, now);
    insertProfile.run('prof_demo_01', demoId, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'Digital Marketer & Content Creator', 'GB', 'GrowthLab Agency', 'English', now, now);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    insertSub.run('sub_demo_01', demoId, 'plan_pro', 'monthly', 'active', now, nextMonth, 1, now, now);
  }
}

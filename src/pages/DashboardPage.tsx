import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { AITool, GenerationRecord, PaymentTransaction } from '../types/index.js';
import { AI_TOOLS } from '../data/toolsData.js';
import { DynamicIcon } from '../components/DynamicIcon.js';
import {
  User,
  Zap,
  Clock,
  CreditCard,
  Settings,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  CheckCircle,
  ExternalLink,
  Shield,
  RotateCw,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface DashboardPageProps {
  openToolRunner: (tool: AITool) => void;
  openCheckout: (planSlug?: 'pro' | 'business') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ openToolRunner, openCheckout }) => {
  const { user, profile, subscription, usage, token, refreshUser, verifyEmail, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'settings'>('overview');

  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Settings form states
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [country, setCountry] = useState(profile?.country || 'US');
  const [company, setCompany] = useState(profile?.company || '');
  const [preferredLang, setPreferredLang] = useState(profile?.preferred_language || 'English');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [histRes, payRes] = await Promise.all([
          fetch('/api/ai/history', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/payments/history', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (isMounted) {
          if (histRes.ok) {
            const hData = await histRes.json();
            setHistory(hData.history || []);
          }
          if (payRes.ok) {
            const pData = await payRes.json();
            setPayments(pData.payments || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          bio,
          country,
          company,
          preferredLanguage: preferredLang,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        await refreshUser();
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Error updating profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error changing password.' });
    }
  };

  const handleCopyHistory = (item: GenerationRecord) => {
    navigator.clipboard.writeText(item.output_text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const dailyUsed = usage?.todayGenerations || 0;
  const dailyLimit = usage?.dailyLimit || 15;
  const usagePercentage = Math.min(100, Math.round((dailyUsed / dailyLimit) * 100));

  const planName = subscription?.plan_name || 'Free Plan';
  const isFree = subscription?.plan_slug === 'free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-md shadow-blue-500/20">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={user?.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              user?.name ? user.name[0] : 'U'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user?.name || 'Creator'}!
              </h1>
              {user?.email_verified === 1 ? (
                <span title="Email Verified" className="text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                </span>
              ) : (
                <button
                  onClick={verifyEmail}
                  className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                >
                  Verify Email
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email} · Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFree ? (
            <button
              onClick={() => openCheckout('pro')}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              Upgrade to Pro ($9/mo)
            </button>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {planName} Active
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Overview & Usage', icon: Sparkles },
          { id: 'payments', label: 'Payment & Receipts', icon: CreditCard },
          { id: 'settings', label: 'Account Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & USAGE */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Subscription Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Active Subscription
              </span>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">{planName}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold uppercase">
                  {subscription?.billing_cycle || 'free'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Word Limit: up to {subscription?.max_words || 1500} words per output
              </p>
              {isFree && (
                <button
                  onClick={() => openCheckout('pro')}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 flex items-center justify-center gap-1"
                >
                  Unlock 40 Tools with Pro <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Daily Usage Progress Meter */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  Daily Usage Allowance
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {dailyUsed} / {dailyLimit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    usagePercentage > 85
                      ? 'bg-red-500'
                      : usagePercentage > 60
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{usage?.remainingToday ?? 0} runs remaining today</span>
                <span>Resets at midnight</span>
              </div>
            </div>

            {/* Total Generations Metric */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Content Archive Count
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {history.length}
              </div>
              <p className="text-xs text-slate-500">
                Total drafts, articles, and summaries created across all tools.
              </p>
            </div>
          </div>

          {/* Quick Launch Preferred Tools */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Quick Launch Tools
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {AI_TOOLS.slice(0, 4).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => openToolRunner(tool)}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <DynamicIcon name={tool.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{tool.name}</div>
                    <span className="text-[10px] text-slate-500">{tool.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Generations Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Recent Generation History
              </h3>
              <span className="text-xs text-slate-500">Last 10 outputs</span>
            </div>

            {isLoadingData ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading history...</div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.tool_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.word_count} words
                        </span>
                        <span className="text-xs text-slate-400">
                          · {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.output_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyHistory(item)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs flex items-center gap-1"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You haven't run any AI tools yet.
                </p>
                <button
                  onClick={() => openToolRunner(AI_TOOLS[0])}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Generate your first article now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT & RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">USDT TRC20 Payment History</h3>
              <p className="text-xs text-slate-500">Track and review all cryptocurrency subscriptions and transaction hashes</p>
            </div>
            <button
              onClick={() => openCheckout('pro')}
              className="py-2 px-3.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              New Payment
            </button>
          </div>

          {payments.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Plan</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Network</th>
                      <th className="p-3.5">Transaction Hash (TXID)</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white capitalize">
                          {p.plan_name || p.plan_slug} ({p.billing_cycle})
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          ${p.amount_usdt} USDT
                        </td>
                        <td className="p-3.5 text-slate-500">TRON (TRC20)</td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {p.tx_hash ? (
                            <a
                              href={`https://tronscan.org/#/transaction/${p.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <span>{p.tx_hash.slice(0, 10)}...{p.tx_hash.slice(-8)}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No TXID submitted</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              p.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : p.status === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No payment transactions found.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Details Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Details</h3>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200'
                }`}
              >
                {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us what you create..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h3>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200'
                }`}
              >
                {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold"
              >
                Update Password
              </button>
            </form>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={logout}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Sign out of this session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

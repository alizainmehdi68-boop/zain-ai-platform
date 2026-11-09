import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Settings,
  Sliders,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  RotateCw,
  AlertTriangle,
  Lock,
  Wallet,
  Cpu,
  Mail,
  Check,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'payments' | 'users' | 'settings' | 'messages'>('metrics');

  const [metrics, setMetrics] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Editable settings fields
  const [walletAddress, setWalletAddress] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.8-flash');
  const [network, setNetwork] = useState('TRON (TRC20)');
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [metRes, payRes, usrRes, setRes, msgRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/messages', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (metRes.ok) {
        const d = await metRes.json();
        setMetrics(d.metrics);
      }
      if (payRes.ok) {
        const d = await payRes.json();
        setPayments(d.payments || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setUsersList(d.users || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSettings(d.settings || {});
        setWalletAddress(d.settings?.usdt_trc20_address || 'TJqZCyxBU6hnn1w2nzVFJVL1NYG28ahkh4');
        setAiModel(d.settings?.ai_model || 'gemini-3.8-flash');
        setNetwork(d.settings?.network || 'TRON (TRC20)');
      }
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d.messages || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <Lock className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Prohibited</h2>
        <p className="text-xs text-slate-500">
          This section is restricted to ZainAI system administrators only.
        </p>
      </div>
    );
  }

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: 'Manually verified on TronScan and approved by Admin' }),
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Enter rejection reason for user:') || 'Invalid or unconfirmed transaction on TRON network';
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settings: {
            usdt_trc20_address: walletAddress.trim(),
            ai_model: aiModel.trim(),
            network: network.trim(),
          },
        }),
      });
      if (res.ok) {
        setSettingsSaveMsg('Configuration updated and synced across all checkout endpoints.');
        setTimeout(() => setSettingsSaveMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">ZainAI Administrator Panel</h1>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded">
                SuperAdmin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              USDT TRC20 payment approval, user rights management, and global platform controls.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'metrics', label: 'Platform Metrics', icon: Activity },
          { id: 'payments', label: `USDT Payments (${metrics?.pendingPayments || 0} Pending)`, icon: CreditCard },
          { id: 'users', label: `Users (${usersList.length})`, icon: Users },
          { id: 'settings', label: 'Wallet & AI Settings', icon: Settings },
          { id: 'messages', label: `Support Inquiries (${messages.length})`, icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS OVERVIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ${metrics?.totalRevenue || 0} USDT
              </div>
              <p className="text-[11px] text-slate-400">Total approved on-chain subscriptions</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Active Subscriptions</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {metrics?.activeSubs || 0}
              </div>
              <p className="text-[11px] text-slate-400">Pro & Business recurring accounts</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Registered Users</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {metrics?.totalUsers || 0}
              </div>
              <p className="text-[11px] text-slate-400">Global registered accounts in database</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total AI Generations</span>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                {metrics?.totalGenerations || 0}
              </div>
              <p className="text-[11px] text-slate-400">Gemini 3.8 Flash model runs</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USDT PAYMENTS APPROVAL & REJECTION */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              USDT TRC20 Transactions & Verification Queue
            </h3>
            <span className="text-xs text-slate-500">
              Receiving Address: <span className="font-mono text-slate-800 dark:text-slate-200">{walletAddress}</span>
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Transaction Hash (TXID)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Admin Note / Details</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{p.user_name}</div>
                        <div className="text-[11px] text-slate-500">{p.user_email}</div>
                      </td>
                      <td className="p-3.5 capitalize font-semibold">
                        {p.plan_name || p.plan_slug} ({p.billing_cycle})
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        ${p.amount_usdt} USDT
                      </td>
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
                          <span className="text-slate-400 italic">No TXID</span>
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
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {p.admin_note || '—'}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold text-[11px] hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Users & Status</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search user email or name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Generations</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {u.plan_name || 'Free Plan'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{u.total_generations || 0}</td>
                      <td className="p-3.5">
                        {u.is_active === 1 ? (
                          <span className="text-emerald-600 font-medium">Active</span>
                        ) : (
                          <span className="text-red-500 font-medium">Blocked</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              u.is_active === 1
                                ? 'bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_active === 1 ? 'Block Account' : 'Activate Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WALLET & AI CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              USDT TRC20 Receiving Wallet & System Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates made here instantly update checkout QR codes, address verification, and payment routing.
            </p>
          </div>

          {settingsSaveMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4" />
              <span>{settingsSaveMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                USDT TRC20 Receiving Address (Official Wallet)
              </label>
              <input
                type="text"
                required
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Provided wallet: <code>TJqZCyxBU6hnn1w2nzVFJVL1NYG28ahkh4</code>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target AI Model
                </label>
                <input
                  type="text"
                  required
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cryptocurrency Network
                </label>
                <input
                  type="text"
                  required
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
            >
              Save Configuration Changes
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SUPPORT INQUIRIES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Support Inquiries</h3>

          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{m.name} ({m.email})</span>
                    <span className="text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{m.subject}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              No customer messages submitted yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

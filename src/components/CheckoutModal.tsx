import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CheckoutModalProps {
  initialPlanSlug?: 'pro' | 'business';
  onClose: () => void;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  initialPlanSlug = 'pro',
  onClose,
  onSuccess,
}) => {
  const { user, token, refreshUser, openAuthModal } = useAuth();
  const [planSlug, setPlanSlug] = useState<'pro' | 'business'>(initialPlanSlug);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState<boolean>(true);
  const [txHash, setTxHash] = useState<string>('');
  const [isSubmittingTx, setIsSubmittingTx] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Prices
  const prices = {
    pro: { monthly: 9, yearly: 89 },
    business: { monthly: 19, yearly: 189 },
  };

  const amountUsdt = prices[planSlug][billingCycle];

  // Fetch or create payment intent when plan or cycle changes
  useEffect(() => {
    if (!user) {
      setIsLoadingIntent(false);
      return;
    }

    let isMounted = true;
    const createIntent = async () => {
      setIsLoadingIntent(true);
      setError(null);
      setVerificationResult(null);
      try {
        const res = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planSlug,
            billingCycle,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (res.ok) {
            setPaymentIntent(data);
          } else {
            setError(data.error || 'Failed to initialize payment.');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Payment server unavailable.');
      } finally {
        if (isMounted) setIsLoadingIntent(false);
      }
    };

    createIntent();
    return () => {
      isMounted = false;
    };
  }, [user, token, planSlug, billingCycle]);

  const handleCopyAddress = () => {
    if (!paymentIntent?.receivingAddress) return;
    navigator.clipboard.writeText(paymentIntent.receivingAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTxid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setError('Please enter your TRON transaction hash (TXID).');
      return;
    }

    if (!paymentIntent?.paymentId) {
      setError('Payment intent expired. Please refresh.');
      return;
    }

    setIsSubmittingTx(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/submit-txid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: paymentIntent.paymentId,
          txHash: txHash.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed. Please review your TXID.');
      } else {
        setVerificationResult(data);
        await refreshUser();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Verification service error.');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Required</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Please log in or create a free ZainAI account before proceeding with subscription payment.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                openAuthModal('register');
              }}
              className="flex-1 py-2 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Subscribe with USDT (TRC20)</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                0% Gateway Fee
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant activation via TRON blockchain verification
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Plan & Cycle selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlanSlug('pro')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                planSlug === 'pro'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Pro Plan</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  ${billingCycle === 'yearly' ? '89/yr' : '9/mo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">40 AI Tools, 150 gens/day</p>
            </button>

            <button
              onClick={() => setPlanSlug('business')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                planSlug === 'business'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">Business Plan</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  ${billingCycle === 'yearly' ? '189/yr' : '19/mo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">10k Word Articles & Bulk</p>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs mx-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Yearly (Save 17%)</span>
            </button>
          </div>

          {isLoadingIntent ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RotateCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500">Preparing secure TRON deposit address & QR...</p>
            </div>
          ) : paymentIntent ? (
            <div className="space-y-6">
              {/* Payment Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    Amount to Send
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{amountUsdt} USDT</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      TRC20 Only
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
                  <div>Network: <strong>TRON (TRC20)</strong></div>
                  <div>Token: <strong>Tether USD (USDT)</strong></div>
                </div>
              </div>

              {/* QR Code and Wallet Address */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* QR Code */}
                <div className="w-36 h-36 p-1.5 bg-white rounded-xl shadow-md border border-slate-100 shrink-0 flex items-center justify-center">
                  {paymentIntent.qrCodeDataUrl ? (
                    <img
                      src={paymentIntent.qrCodeDataUrl}
                      alt="USDT TRC20 QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-400" />
                  )}
                </div>

                {/* Address and details */}
                <div className="flex-1 space-y-3 text-center sm:text-left min-w-0">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Receiving Wallet Address (TRC20):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all flex-1 border border-slate-200 dark:border-slate-700">
                        {paymentIntent.receivingAddress}
                      </div>
                      <button
                        onClick={handleCopyAddress}
                        className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Send only <strong>USDT via TRON TRC20 network</strong>. Sending via ERC20 or BSC will result in permanent loss of funds.
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Hash Submission Form */}
              <div className="space-y-3 pt-2">
                <form onSubmit={handleSubmitTxid} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Enter Your Transaction Hash (TXID):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder="e.g. 5a1b3c9d7e8f... (64 hex characters from your wallet or exchange)"
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
                  >
                    {isSubmittingTx ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        Verifying on TRON Blockchain...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify & Activate Subscription
                      </>
                    )}
                  </button>
                </form>

                {/* Status or Result Banner */}
                {verificationResult && (
                  <div
                    className={`p-4 rounded-xl border space-y-2 animate-in fade-in ${
                      verificationResult.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {verificationResult.status === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          Payment Confirmed & Subscription Activated!
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                          Transaction Queued for Verification
                        </>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed">{verificationResult.message}</p>
                    {verificationResult.status === 'approved' && (
                      <button
                        onClick={onClose}
                        className="mt-2 py-1.5 px-4 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
                      >
                        Start Using Premium AI Tools <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

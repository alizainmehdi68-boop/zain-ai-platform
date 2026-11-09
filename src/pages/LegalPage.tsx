import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  Mail,
  HelpCircle,
  RotateCcw,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';

interface LegalPageProps {
  page: string;
  onClose: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onClose }) => {
  const [activeTab, setActiveTab] = useState(page || 'terms');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setContactStatus(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus({ type: 'success', text: data.message });
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      } else {
        setContactStatus({ type: 'error', text: data.error || 'Failed to send message.' });
      }
    } catch (err: any) {
      setContactStatus({ type: 'error', text: err.message || 'Error submitting message.' });
    } finally {
      setIsSending(false);
    }
  };

  const navLinks = [
    { id: 'about', label: 'About Us', icon: Building },
    { id: 'contact', label: 'Contact Us', icon: Mail },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'refund', label: 'Refund Policy', icon: RotateCcw },
    { id: 'subscription-policy', label: 'Subscription Policy', icon: CreditCard },
    { id: 'crypto-policy', label: 'Crypto Payment Policy', icon: Shield },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            ZainAI Policies & Information
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Sidebar Nav */}
          <div className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 space-y-1 shrink-0">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed Content View */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {/* ABOUT US */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">About ZainAI</h3>
                <p>
                  <strong>ZainAI</strong> is an international, enterprise-grade AI productivity platform designed to unify the fragmented landscape of artificial intelligence tools. Founded with the mission to democratize state-of-the-art generative intelligence, ZainAI equips creators, agencies, founders, and researchers with 40+ specialized tools across writing, marketing, search engine optimization, document synthesis, and creative ideation.
                </p>
                <p>
                  Unlike traditional platforms constrained by territorial credit card billing, ZainAI welcomes international digital citizens by offering friction-free cryptocurrency subscriptions in USDT TRC20 over the TRON blockchain, ensuring immediate activation and transparent global access.
                </p>
              </div>
            )}

            {/* CONTACT US */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact ZainAI Support</h3>
                <p>
                  Have questions regarding your subscription, cryptocurrency verification, or custom enterprise tool requirements? Fill in the form below to reach our dedicated support team.
                </p>

                {contactStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      contactStatus.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200'
                    }`}
                  >
                    {contactStatus.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{contactStatus.text}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Jordan Smith"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g. USDT Payment TXID Verification"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
                <p>
                  At ZainAI, privacy and confidentiality are paramount. We strictly respect user data rights and operate in compliance with international data protection frameworks, including the EU GDPR and CCPA.
                </p>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Zero Model Training on Private Inputs</h4>
                <p>
                  Any text, documents, or data submitted into ZainAI tools are transmitted through encrypted channels to our backend and are <strong>never used to train base foundation AI models</strong>. Your intellectual property remains exclusively yours.
                </p>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Data Retention</h4>
                <p>
                  Generation histories are stored solely for your personal dashboard retrieval and may be permanently deleted at any moment with a single click.
                </p>
              </div>
            )}

            {/* TERMS & CONDITIONS */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Terms & Conditions</h3>
                <p>
                  By accessing and using ZainAI, you agree to abide by these Terms of Service. You retain full ownership and commercial distribution rights to all content generated using your paid or free account.
                </p>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Acceptable Use</h4>
                <p>
                  You agree not to use ZainAI to generate illegal material, malware, hate speech, or non-consensual content. Automated bot scraping of the user interface without prior written authorization is prohibited.
                </p>
              </div>
            )}

            {/* REFUND POLICY */}
            {activeTab === 'refund' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Refund Policy</h3>
                <p>
                  Because cryptocurrency transactions executed on the TRON blockchain are irreversible by nature, USDT payments sent to our receiving wallet cannot be automatically refunded via the blockchain network.
                </p>
                <p>
                  However, if a technical error occurs wherein your funds are confirmed on-chain but your account is not upgraded, our system administrators will either manually credit your subscription immediately or issue a replacement credit upon verification of your transaction hash (TXID).
                </p>
              </div>
            )}

            {/* SUBSCRIPTION POLICY */}
            {activeTab === 'subscription-policy' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Policy</h3>
                <p>
                  ZainAI offers Pro ($9/mo, $89/yr) and Business ($19/mo, $189/yr) subscription tiers. Subscriptions remain active for 30 calendar days (monthly) or 365 calendar days (yearly) from the date of confirmation.
                </p>
                <p>
                  Users may disable auto-renewal at any time from their User Dashboard. If cancelled, your access to premium features remains unhindered until the active cycle expiration date.
                </p>
              </div>
            )}

            {/* CRYPTO PAYMENT POLICY */}
            {activeTab === 'crypto-policy' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cryptocurrency Payment Policy</h3>
                <p>
                  ZainAI exclusively accepts <strong>Tether (USDT) on the TRON (TRC20) network</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Official receiving wallet address: <code>TJqZCyxBU6hnn1w2nzVFJVL1NYG28ahkh4</code></li>
                  <li>Do NOT send funds via Ethereum (ERC20), Binance Smart Chain (BEP20), or Solana.</li>
                  <li>Transactions are confirmed on-chain via TronScan / TronGrid indexers.</li>
                  <li>Duplicate submission of previously credited transaction hashes is automatically detected and rejected.</li>
                </ul>
              </div>
            )}

            {/* FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">How fast is payment verification?</h5>
                    <p className="text-slate-500">TRC20 network verification typically completes within 30 to 90 seconds after block inclusion.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Can I download my generation history?</h5>
                    <p className="text-slate-500">Yes, you can download all generated content as Markdown or plain text files directly from your dashboard or tool runner.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

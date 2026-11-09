import React from 'react';
import { Sparkles, Shield, Lock, Cpu, Globe, ArrowRight } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  openLegalModal: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab, openLegalModal }) => {
  return (
    <footer className="w-full bg-slate-900 dark:bg-black text-slate-400 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Zain<span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Your All-in-One AI Productivity Platform. 40+ professional AI tools for creators, marketers, founders, and teams worldwide with native USDT TRC20 cryptocurrency subscriptions.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                TRC20 Blockchain Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-400" />
                256-bit Encrypted
              </span>
            </div>
          </div>

          {/* AI Tools */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">AI Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => setCurrentTab('tools')} className="hover:text-white transition-colors">
                  All 40 AI Tools
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('tools')} className="hover:text-white transition-colors">
                  AI Article & Blog Writer
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('tools')} className="hover:text-white transition-colors">
                  SEO & Keyword Research
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('tools')} className="hover:text-white transition-colors">
                  Chat with PDF & Summarizer
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('tools')} className="hover:text-white transition-colors">
                  AI YouTube Content Studio
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('pricing')} className="hover:text-white transition-colors">
                  Subscription Plans ($9/mo)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Policies & Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => openLegalModal('terms')} className="hover:text-white transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('refund')} className="hover:text-white transition-colors">
                  Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('subscription-policy')} className="hover:text-white transition-colors">
                  Subscription Policy
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('crypto-policy')} className="hover:text-white transition-colors">
                  Crypto Payment Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Company */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company & Help</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => openLegalModal('about')} className="hover:text-white transition-colors">
                  About ZainAI
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('contact')} className="hover:text-white transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('faq')} className="hover:text-white transition-colors">
                  FAQ & Documentation
                </button>
              </li>
              <li>
                <span className="inline-block text-xs text-slate-500 pt-2">
                  TRC20 Wallet:
                  <br />
                  <span className="font-mono text-[10px] text-slate-400 select-all">TJqZCyx...kh4</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ZainAI. All rights reserved. Your All-in-One AI Productivity Platform.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">TRON Network (TRC20 USDT)</span>
            <span>·</span>
            <span className="text-slate-500">Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

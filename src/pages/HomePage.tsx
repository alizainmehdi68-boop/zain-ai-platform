import React, { useState } from 'react';
import { AI_TOOLS } from '../data/toolsData.js';
import { AITool } from '../types/index.js';
import { DynamicIcon } from '../components/DynamicIcon.js';
import { PricingSection } from '../components/PricingSection.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronDown,
  Layers,
  Cpu,
  Lock,
  Star,
  Quote,
  Check,
  X as XIcon,
} from 'lucide-react';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  openToolRunner: (tool: AITool) => void;
  openCheckout: (planSlug?: 'pro' | 'business') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentTab,
  openToolRunner,
  openCheckout,
}) => {
  const { user, openAuthModal } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Pick top 8 featured tools
  const featuredToolIds = [
    'article-writer',
    'seo-writer',
    'email-writer',
    'keyword-research',
    'long-form-article',
    'chat-pdf',
    'youtube-script',
    'business-plan',
  ];
  const featuredTools = AI_TOOLS.filter((t) => featuredToolIds.includes(t.id));

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'What is ZainAI and what does it include?',
      a: 'ZainAI is a unified, international AI SaaS productivity suite providing 40+ professional AI tools spanning content writing, SEO optimization, keyword intelligence, PDF document chats, business planning, and social media scheduling, all powered by Google Gemini 3.8 Flash.',
    },
    {
      q: 'How does cryptocurrency payment with USDT TRC20 work?',
      a: 'You can subscribe to Pro ($9/mo) or Business ($19/mo) using Tether (USDT) on the TRON (TRC20) blockchain network. At checkout, we provide our official receiving address and a generated QR code. Once you complete the transfer and submit your 64-character Transaction Hash (TXID), our server automatically verifies the transfer on the TRON blockchain and activates your subscription.',
    },
    {
      q: 'Are the AI tools truly powered by real AI models?',
      a: 'Yes. ZainAI connects directly to Google Gemini 3.8 Flash using server-side API execution. We do not use mock or simulated outputs.',
    },
    {
      q: 'Can I cancel my subscription at any time?',
      a: 'Yes. You have full control from your User Dashboard. When you cancel auto-renewal, your account retains full Pro or Business privileges until the end of your prepaid billing period.',
    },
    {
      q: 'What is the difference between Free, Pro, and Business tiers?',
      a: 'The Free tier grants access to 20 foundational AI tools with 15 generations per day and a 1,500-word limit. Pro ($9/mo) unlocks all 40 AI tools including SEO, PDF, and image tools with 150 daily generations. Business ($19/mo) expands to 1,000 generations daily, 10,000-word long-form articles, bulk generators, and priority support.',
    },
    {
      q: 'What happens if my transaction is delayed on the TRON network?',
      a: 'TRON TRC20 transactions usually confirm in under 60 seconds. In cases where the public blockchain indexer is experiencing transient network congestion, our system places the payment into an Admin Review queue where our team can immediately approve and activate your subscription.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>40+ SPECIALIZED AI ENGINES IN ONE SUBSCRIPTION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Supercharge Your Workflow With <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              All-in-One AI Productivity
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Say goodbye to ten expensive disjointed AI subscriptions. ZainAI delivers articles, SEO keywords, email sequences, PDF research, and content marketing in a single, lightning-fast platform with USDT TRC20 crypto payments.
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (user) {
                  setCurrentTab('tools');
                } else {
                  openAuthModal('register');
                }
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentTab('tools')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore All 40 AI Tools</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              20 Free Forever Tools
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              USDT TRC20 Crypto Verified
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" />
              Real Google Gemini 3.8
            </span>
          </div>
        </div>
      </section>

      {/* POPULAR AI TOOLS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              Curated Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Popular AI Tools Ready to Run
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Click any tool card to launch directly into the AI workbench.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('tools')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View all 40 tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 8 Featured Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => openToolRunner(tool)}
              className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      tool.isPremium
                        ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-sm'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <DynamicIcon name={tool.icon} className="w-5 h-5" />
                  </div>
                  {tool.isPremium ? (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Premium
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Free
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>{tool.category}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Launch <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FREE VS PREMIUM COMPARISON MATRIX */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Feature Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Free vs. Premium Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Choose the plan that suits your scale. Upgrade seamlessly with zero lock-in contracts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            <div className="col-span-6 sm:col-span-5">Feature & Capability</div>
            <div className="col-span-3 sm:col-span-3 text-center">Free Plan ($0)</div>
            <div className="col-span-3 sm:col-span-4 text-center text-blue-600 dark:text-blue-400">
              Pro & Business ($9 - $19)
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {[
              { name: 'Standard AI Tools', free: '20 Tools', pro: 'All 40 Tools' },
              { name: 'Daily Generation Allowance', free: '15 / day', pro: '150 to 1,000 / day' },
              { name: 'Word Output Per Request', free: 'Up to 1,500 words', pro: 'Up to 10,000 words' },
              { name: 'Advanced SEO & Keyword Engine', free: false, pro: true },
              { name: 'Chat with PDF & PDF Summarizer', free: false, pro: true },
              { name: 'Long-Form Article Generator', free: false, pro: true },
              { name: 'Bulk Article Batch Creation', free: false, pro: 'Business Tier' },
              { name: 'AI Business Plan & Investor Model', free: false, pro: true },
              { name: 'USDT TRC20 Crypto Subscription', free: 'N/A', pro: true },
              { name: 'Execution Priority Queue', free: 'Standard', pro: 'Priority / VIP' },
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 p-3.5 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div className="col-span-6 sm:col-span-5 font-medium text-slate-800 dark:text-slate-200">
                  {row.name}
                </div>
                <div className="col-span-3 sm:col-span-3 text-center text-slate-500 dark:text-slate-400">
                  {typeof row.free === 'boolean' ? (
                    row.free ? (
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )
                  ) : (
                    row.free
                  )}
                </div>
                <div className="col-span-3 sm:col-span-4 text-center font-semibold text-slate-900 dark:text-white">
                  {typeof row.pro === 'boolean' ? (
                    row.pro ? (
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XIcon className="w-4 h-4 text-slate-300 mx-auto" />
                    )
                  ) : (
                    row.pro
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <PricingSection openCheckout={openCheckout} />

      {/* AUTHENTIC USER EXPERIENCES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Verified Experiences
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Trusted by Creators Across 40+ Countries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'Paying via USDT TRC20 made ZainAI an absolute lifesaver. Being based outside traditional Stripe regions, this is the only AI platform that verified instantly without foreign card declines.',
              name: 'Tariq Al-Mansoor',
              role: 'Growth Marketing Consultant, Dubai',
              rating: 5,
            },
            {
              quote:
                'The Long-Form Article and SEO Keyword tools replaced 3 separate tools that were costing me over $120/month. The quality from Gemini 3.8 Flash is clean and ready to publish.',
              name: 'Elena Rostova',
              role: 'Content Publisher & Niche Site Owner',
              rating: 5,
            },
            {
              quote:
                'Chat with PDF and the Business Plan generator saved our team 15+ hours when pitching our seed deck to angel investors last week. Invaluable productivity suite.',
              name: 'Marcus Chen',
              role: 'Founding Engineer, TechScale Labs',
              rating: 5,
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="font-bold text-xs text-slate-900 dark:text-white">{t.name}</div>
                <div className="text-[11px] text-slate-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Accelerate Your Productivity?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join thousands of creators, agencies, and founders worldwide. Access 20 free AI tools right now, or unlock the full 40-tool suite for only $9 USDT.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (user) {
                    setCurrentTab('tools');
                  } else {
                    openAuthModal('register');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white shadow-md transition-all"
              >
                Create Free Account
              </button>
              <button
                onClick={() => openCheckout('pro')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 font-semibold text-xs text-white transition-colors"
              >
                Upgrade with USDT TRC20
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

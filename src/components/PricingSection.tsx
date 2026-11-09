import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface PricingSectionProps {
  openCheckout: (planSlug?: 'pro' | 'business') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ openCheckout }) => {
  const { user, subscription, openAuthModal } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      slug: 'free',
      name: 'Free Tier',
      tagline: 'Ideal for testing basic AI capabilities and personal quick drafts.',
      priceMonthly: 0,
      priceYearly: 0,
      popular: false,
      dailyLimit: '15 generations / day',
      wordLimit: '1,500 words per generation',
      features: [
        '20 Standard AI Tools (Articles, Emails, Social, Summarizer)',
        '15 daily generations',
        'Up to 1,500 words per run',
        'Personal history archive',
        'Standard processing speed',
        'Community documentation support',
      ],
      cta: user ? 'Current Free Plan' : 'Start Free',
      isCurrent: subscription?.plan_slug === 'free',
    },
    {
      slug: 'pro',
      name: 'Pro Plan',
      tagline: 'For professionals, bloggers, digital marketers, and power creators.',
      priceMonthly: 9,
      priceYearly: 89,
      popular: true,
      dailyLimit: '150 generations / day',
      wordLimit: '5,000 words per generation',
      features: [
        'All 40 Free & Premium AI Tools',
        '150 daily generations (10x Free)',
        'Up to 5,000 words per generation',
        'Advanced SEO & Keyword Research Assistant',
        'Chat with PDF & PDF Summarizer',
        'AI Image & Voiceover Scripts',
        'USDT TRC20 instant activation',
        'Priority queue processing',
      ],
      cta: subscription?.plan_slug === 'pro' ? 'Current Active Plan' : 'Upgrade to Pro ($9 USDT)',
      isCurrent: subscription?.plan_slug === 'pro',
    },
    {
      slug: 'business',
      name: 'Business Plan',
      tagline: 'For agencies, founders, content teams, and high-volume operations.',
      priceMonthly: 19,
      priceYearly: 189,
      popular: false,
      dailyLimit: '1,000 generations / day (Unlimited)',
      wordLimit: '10,000 words (Long-Form Masterclass)',
      features: [
        'Everything included in Pro Plan',
        'Long-Form Article Generator (up to 10,000 words)',
        'Bulk Article & Batch Outline Generator',
        '1,000 generations / day soft cap',
        'AI Business Plan & Investor Model Generator',
        'Team workspace & shared project folders',
        'VIP priority execution lane',
        '24/7 Priority support channel',
      ],
      cta: subscription?.plan_slug === 'business' ? 'Current Active Plan' : 'Get Business ($19 USDT)',
      isCurrent: subscription?.plan_slug === 'business',
    },
  ];

  const handlePlanClick = (slug: string) => {
    if (!user) {
      openAuthModal('register');
      return;
    }
    if (slug === 'free') return;
    openCheckout(slug as 'pro' | 'business');
  };

  return (
    <section className="py-20 bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>TRANSPARENT CRYPTOCURRENCY PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple, Honest Plans for Every Creator
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Pay safely with <strong>USDT TRC20</strong> on the TRON network. No surprise auto-debits, no hidden foreign exchange conversion fees.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => {
            const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
            return (
              <div
                key={p.slug}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  p.popular
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-md">
                      Most Popular Choice
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                    {p.isCurrent && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">{p.tagline}</p>

                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      USDT / {billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  <div className="pt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <div>{p.dailyLimit}</div>
                    <div className="text-slate-500">{p.wordLimit}</div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

                {/* Features list */}
                <ul className="flex-1 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="pt-8">
                  <button
                    disabled={p.isCurrent && p.slug === 'free'}
                    onClick={() => handlePlanClick(p.slug)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      p.isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                        : p.popular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.99]'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.99]'
                    }`}
                  >
                    <span>{p.cta}</span>
                    {!p.isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Crypto Assurance Card */}
        <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                100% On-Chain USDT TRC20 Verification
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every subscription is verified against TRON blockchain transactions. No chargebacks, non-custodial address safety, and instantaneous activation.
              </p>
            </div>
          </div>
          <button
            onClick={() => openCheckout('pro')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 transition-colors"
          >
            Pay with USDT TRC20
          </button>
        </div>
      </div>
    </section>
  );
};

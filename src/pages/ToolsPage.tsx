import React, { useState, useMemo } from 'react';
import { AI_TOOLS } from '../data/toolsData.js';
import { AITool } from '../types/index.js';
import { DynamicIcon } from '../components/DynamicIcon.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Search,
  Sparkles,
  Lock,
  ArrowRight,
  Filter,
  Layers,
  Zap,
} from 'lucide-react';

interface ToolsPageProps {
  openToolRunner: (tool: AITool) => void;
  openCheckout: (planSlug?: 'pro' | 'business') => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ openToolRunner, openCheckout }) => {
  const { user, subscription } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', 'Writing', 'Marketing', 'SEO', 'Productivity', 'Social & Video', 'Creative'];

  const isUserPremium =
    subscription?.plan_slug === 'pro' || subscription?.plan_slug === 'business' || user?.role === 'admin';

  const filteredTools = useMemo(() => {
    return AI_TOOLS.filter((tool) => {
      // Search
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Tier
      const matchesTier =
        tierFilter === 'all' ||
        (tierFilter === 'free' && !tool.isPremium) ||
        (tierFilter === 'premium' && tool.isPremium);

      // Category
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;

      return matchesSearch && matchesTier && matchesCategory;
    });
  }, [searchQuery, tierFilter, categoryFilter]);

  const freeCount = AI_TOOLS.filter((t) => !t.isPremium).length;
  const premiumCount = AI_TOOLS.filter((t) => t.isPremium).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span>40 SPECIALIZED PRODUCTION AI TOOLS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore the ZainAI Tool Suite
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          From quick email polishing and social captions to 10,000-word long-form guides, SEO cluster matrices, and PDF chat analysis.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40 AI tools by name, topic, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Tier Filter Segments */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto shrink-0">
            <button
              onClick={() => setTierFilter('all')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tierFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All (40)
            </button>
            <button
              onClick={() => setTierFilter('free')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tierFilter === 'free'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Free Tools ({freeCount})
            </button>
            <button
              onClick={() => setTierFilter('premium')}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tierFilter === 'premium'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Premium ({premiumCount})
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTools.map((tool) => {
            const isLocked = tool.isPremium && !isUserPremium;
            return (
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

                    <div className="flex items-center gap-1.5">
                      {tool.isPremium ? (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          Premium
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Free
                        </span>
                      )}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
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

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span>{tool.category}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Layers className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No tools found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or reset your category and tier filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTierFilter('all');
              setCategoryFilter('all');
            }}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

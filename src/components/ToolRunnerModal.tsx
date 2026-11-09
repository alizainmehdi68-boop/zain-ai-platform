import React, { useState, useEffect } from 'react';
import { AITool } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { DynamicIcon } from './DynamicIcon.js';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Download,
  Lock,
  Volume2,
  VolumeX,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';

interface ToolRunnerModalProps {
  tool: AITool | null;
  onClose: () => void;
  openCheckout: (planSlug?: 'pro' | 'business') => void;
}

export const ToolRunnerModal: React.FC<ToolRunnerModalProps> = ({ tool, onClose, openCheckout }) => {
  const { user, subscription, token, refreshUser, openAuthModal } = useAuth();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize input defaults when tool changes
  useEffect(() => {
    if (tool) {
      const initial: Record<string, string> = {};
      tool.inputs.forEach((inp) => {
        initial[inp.name] = inp.defaultValue || '';
      });
      setInputs(initial);
      setOutput('');
      setWordCount(0);
      setError(null);
    }
  }, [tool]);

  if (!tool) return null;

  const isUserPremium = subscription?.plan_slug === 'pro' || subscription?.plan_slug === 'business' || user?.role === 'admin';
  const isLocked = tool.isPremium && !isUserPremium;

  const handleInputChange = (field: string, val: string) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
    if (error) setError(null);
  };

  const handleGenerate = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (isLocked) {
      openCheckout('pro');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toolId: tool.id,
          toolName: tool.name,
          inputs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresUpgrade) {
          setError(data.error);
        } else {
          throw new Error(data.error || 'Failed to generate content. Please try again.');
        }
      } else {
        setOutput(data.text);
        setWordCount(data.wordCount);
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please check server settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(output);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tool.isPremium
                  ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md'
                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              }`}
            >
              <DynamicIcon name={tool.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tool.name}</h3>
                {tool.isPremium ? (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Premium Tool
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Free Tool
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{tool.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Split layout on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Inputs Column */}
          <div className="lg:col-span-5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Tool Parameters
              </span>
              <span className="text-xs text-slate-500">
                Limit: {subscription?.max_words || 1500} words
              </span>
            </div>

            {/* Input fields */}
            <div className="space-y-4">
              {tool.inputs.map((inp) => (
                <div key={inp.name} className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {inp.label} {inp.required && <span className="text-red-500">*</span>}
                  </label>

                  {inp.type === 'select' ? (
                    <select
                      value={inputs[inp.name] || inp.defaultValue || ''}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {inp.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : inp.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      value={inputs[inp.name] || ''}
                      placeholder={inp.placeholder}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={inputs[inp.name] || ''}
                      placeholder={inp.placeholder}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Premium Lock Callout */}
            {isLocked && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Subscription Required
                </div>
                <p className="text-xs leading-relaxed">
                  This tool requires an active <strong>Pro ($9/mo)</strong> or <strong>Business ($19/mo)</strong> subscription. Instant activation available with USDT TRC20 crypto payments.
                </p>
                <button
                  onClick={() => openCheckout('pro')}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 shadow-sm transition-all"
                >
                  Upgrade to Pro ($9 USDT)
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                disabled={isLoading || isLocked}
                onClick={handleGenerate}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                  isLocked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/20 active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Generating with Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-7 p-6 flex flex-col bg-slate-50/30 dark:bg-slate-950/20 min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Generated Result
                </span>
                {wordCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ({wordCount} words)
                  </span>
                )}
              </div>

              {output && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleSpeech}
                    title="Audio Read Aloud"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4 text-indigo-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={() => handleDownload('md')}
                    title="Download Markdown"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    disabled={isLoading}
                    onClick={handleGenerate}
                    title="Regenerate"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Output Viewport */}
            <div className="flex-1 mt-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 overflow-y-auto max-h-[500px]">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Gemini AI is crafting your {tool.name}...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Processing semantic context and formatting output
                  </p>
                </div>
              ) : output ? (
                <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {output}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-2 text-slate-400 dark:text-slate-500">
                  <FileText className="w-10 h-10 stroke-[1.2]" />
                  <p className="text-sm font-medium">Your generated output will appear here</p>
                  <p className="text-xs max-w-xs">
                    Fill in the parameters on the left and click "Generate Content" to start.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

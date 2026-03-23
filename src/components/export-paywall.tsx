'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Lock, DownloadSimple, Check, Sparkle, ShieldCheck, WarningCircle, Crown, Gift } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { trackInitiateCheckout } from '@/lib/tiktok';
import { trackClarityEvent } from '@/lib/clarity';

interface ExportPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  thesisTitle: string;
  thesisId: string;
  expiresAt?: Date | null;
}

const proFeatures = [
  'Export unlimited theses',
  'PDF, DOCX & LaTeX formats',
  'No thesis expiry',
  'Priority processing',
  'Copy & paste enabled',
];

export function ExportPaywall({ 
  isOpen, 
  onClose, 
  thesisTitle,
  thesisId,
  expiresAt 
}: ExportPaywallProps) {
  const [loading, setLoading] = useState<'onetime' | 'monthly' | 'unlimited' | 'redeem' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ available: number; creditsPerExport: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/referral')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setCredits({
              available: (data.credits?.earned ?? 0) - (data.credits?.used ?? 0),
              creditsPerExport: data.creditsPerExport ?? 3,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleRedeemCredits = async () => {
    setLoading('redeem');
    setError(null);
    trackClarityEvent('referral_redeem_credits');
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem credits');
      }
      toast.success('Credits redeemed! Your thesis is now unlocked.');
      onClose();
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Redemption failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleOneTimeExport = async () => {
    setLoading('onetime');
    setError(null);
    trackClarityEvent('checkout_onetime_export');

    // Track TikTok InitiateCheckout
    trackInitiateCheckout({
      contentId: 'thesis_export',
      contentName: 'One-Time Export',
      value: 4
    });
    
    try {
      const response = await fetch('/api/checkout/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (data.fallback) {
          toast.error(data.error || 'One-time export not available');
          // Redirect to upgrade page as fallback
          window.location.href = data.fallback;
          return;
        }
        throw new Error(data.error || 'Failed to create checkout');
      }
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleSubscriptionCheckout = async (planId: 'monthly' | 'unlimited') => {
    setLoading(planId);
    setError(null);
    trackClarityEvent(`checkout_subscription_${planId}`);

    const prices = { monthly: 9, unlimited: 19 };
    const names = { monthly: 'Pro', unlimited: 'Pro Unlimited' };
    
    // Track TikTok InitiateCheckout
    trackInitiateCheckout({
      contentId: `thesis_${planId}`,
      contentName: names[planId],
      value: prices[planId]
    });
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  // No longer showing countdown - removed to reduce anxiety at conversion moment

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-2">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <Lock size={32} weight="duotone" className="text-amber-500" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Your Thesis is Ready
        </h3>
        
        <p className="text-slate-600 mb-4">
          Download instantly in PDF, DOCX, or LaTeX
        </p>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4 border border-red-200">
            <WarningCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Thesis being exported */}
        <p className="text-sm text-slate-600 mb-5 truncate">
          &ldquo;{thesisTitle}&rdquo;
        </p>

        {/* Plan nudge */}
        <p className="text-xs text-slate-600 mb-3">Planning to write more? Save with a plan</p>

        {/* Subscription plans */}
        <div className="space-y-5 mb-4">
          {/* Pro - $9/mo - HERO */}
          <div className="relative">
            <button
              onClick={() => handleSubscriptionCheckout('monthly')}
              disabled={loading !== null}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left group disabled:opacity-50 ${
                loading === 'monthly'
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    loading === 'monthly' ? 'bg-blue-100' : 'bg-blue-100/50 group-hover:bg-blue-100'
                  }`}>
                    {loading === 'monthly' ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkle size={20} weight="duotone" className="text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {loading === 'monthly' ? 'Connecting to payment...' : '5 Downloads / Month'}
                    </h4>
                    <p className="text-xs text-blue-600">Just $1.80 per thesis</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">$9</span>
                  <span className="text-xs text-slate-600">/mo</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-x-4 gap-y-1">
                {['PDF, DOCX & LaTeX', 'No thesis expiry', 'Copy & paste'].map((f) => (
                  <span key={f} className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Check size={12} className="text-blue-500 flex-shrink-0" />
                    {f}
                  </span>
                ))}
              </div>
            </button>
            <span className="absolute -top-2.5 left-4 bg-blue-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              Most Popular
            </span>
          </div>

          {/* Pro Unlimited - $19/mo - Best Value */}
          <div className="relative">
            <button
              onClick={() => handleSubscriptionCheckout('unlimited')}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border transition-all text-left group disabled:opacity-50 ${
                loading === 'unlimited'
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    loading === 'unlimited' ? 'bg-slate-100' : 'bg-slate-50 group-hover:bg-slate-100'
                  }`}>
                    {loading === 'unlimited' ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Crown size={20} weight="duotone" className="text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {loading === 'unlimited' ? 'Connecting to payment...' : 'Unlimited Downloads'}
                    </h4>
                    <p className="text-xs text-slate-600">No limits · Priority processing</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">$19</span>
                  <span className="text-xs text-slate-600">/mo</span>
                </div>
              </div>
            </button>
            <span className="absolute -top-2.5 left-4 bg-amber-50 text-amber-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              Unlimited
            </span>
          </div>
        </div>

        {/* Referral credits redemption */}
        {credits && credits.available >= credits.creditsPerExport && (
          <>
            <div className="flex items-center gap-3 text-xs text-slate-600 mb-4">
              <div className="flex-1 border-t border-emerald-200" />
              <span className="text-emerald-600 font-medium">You have {credits.available} referral credits!</span>
              <div className="flex-1 border-t border-emerald-200" />
            </div>
            <button
              onClick={handleRedeemCredits}
              disabled={loading !== null}
              className={`w-full p-3.5 rounded-xl border-2 transition-all disabled:opacity-50 mb-4 ${
                loading === 'redeem'
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2.5">
                {loading === 'redeem' ? (
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Gift size={18} weight="duotone" className="text-emerald-600" />
                )}
                <span className="font-semibold text-emerald-700">
                  {loading === 'redeem' ? 'Redeeming...' : `Use ${credits.creditsPerExport} Credits — Free Download`}
                </span>
              </div>
              <p className="text-[11px] text-emerald-500 mt-1">From your referral rewards · PDF, DOCX & LaTeX</p>
            </button>
          </>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-slate-600 mb-4">
          <div className="flex-1 border-t border-slate-200" />
          <span>Or download just this thesis</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* One-time $4 - Secondary CTA */}
        <button
          onClick={handleOneTimeExport}
          disabled={loading !== null}
          className={`w-full p-3.5 rounded-xl border-2 transition-all disabled:opacity-50 group ${
            loading === 'onetime'
              ? 'border-slate-400 bg-slate-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2.5">
            {loading === 'onetime' ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <DownloadSimple size={18} weight="bold" className="text-slate-900" />
            )}
            <span className="font-semibold text-slate-900">
              {loading === 'onetime' ? 'Connecting to payment...' : 'Download This Thesis — $4'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">One-time · PDF, DOCX & LaTeX</p>
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-600 mt-4">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} />
            Secure payment
          </span>
          <span className="text-slate-300">•</span>
          <span>Cancel anytime</span>
          <span className="text-slate-300">•</span>
          <span>30-day guarantee</span>
        </div>
      </div>
    </Modal>
  );
}

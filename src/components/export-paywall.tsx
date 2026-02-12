'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Lock, Download, Check, Sparkles, Clock, Shield, CreditCard, AlertCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { trackInitiateCheckout } from '@/lib/tiktok';

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
  const [loading, setLoading] = useState<'onetime' | 'monthly' | 'yearly' | 'lifetime' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOneTimeExport = async () => {
    setLoading('onetime');
    setError(null);
    
    // Track TikTok InitiateCheckout
    trackInitiateCheckout({
      contentId: 'thesis_export',
      contentName: 'One-Time Export',
      value: 4.99
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

  const handleSubscriptionCheckout = async (planId: 'monthly' | 'yearly' | 'lifetime') => {
    setLoading(planId);
    setError(null);
    
    const prices = { monthly: 9.99, yearly: 79.99, lifetime: 199.99 };
    const names = { monthly: 'Pro Monthly', yearly: 'Pro Yearly', lifetime: 'Lifetime Access' };
    
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

  // Calculate days remaining
  const daysRemaining = expiresAt 
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-2">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Export is Locked
        </h3>
        
        <p className="text-slate-600 mb-2">
          Your thesis is ready! Unlock export to download.
        </p>

        {daysRemaining !== null && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-sm px-3 py-1.5 rounded-full mb-4">
            <Clock className="w-4 h-4" />
            <span>{daysRemaining} days left to export</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Thesis Preview */}
        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm truncate">{thesisTitle}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Ready for PDF, DOCX, or LaTeX export</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-5">
          {/* One-Time Export */}
          <div className="relative">
            <button
              onClick={handleOneTimeExport}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left group disabled:opacity-50 ${
                loading === 'onetime' 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    loading === 'onetime' ? 'bg-blue-200' : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    {loading === 'onetime' ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {loading === 'onetime' ? 'Connecting to payment...' : 'One-Time Export'}
                    </h4>
                    <p className="text-xs text-slate-500">Export this thesis only</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">$4.99</span>
                  <p className="text-[10px] text-slate-500">One-time</p>
                </div>
              </div>
            </button>
            <span className="absolute -top-2 left-4 bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Quick Export
            </span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 border-t border-slate-200" />
            <span>OR UPGRADE</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Monthly Pro */}
          <button
            onClick={() => handleSubscriptionCheckout('monthly')}
            disabled={loading !== null}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left group disabled:opacity-50 ${
              loading === 'monthly' 
                ? 'border-slate-400 bg-slate-50' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  loading === 'monthly' ? 'bg-slate-200' : 'bg-slate-100 group-hover:bg-slate-200'
                }`}>
                  {loading === 'monthly' ? (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 text-sm">
                    {loading === 'monthly' ? 'Connecting...' : 'Pro Monthly'}
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900">$9.99</span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
            </div>
          </button>

          {/* Yearly Pro - Best Value */}
          <div className="relative">
            <button
              onClick={() => handleSubscriptionCheckout('yearly')}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left group disabled:opacity-50 ${
                loading === 'yearly' 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    loading === 'yearly' ? 'bg-green-200' : 'bg-green-100'
                  }`}>
                    {loading === 'yearly' ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {loading === 'yearly' ? 'Connecting to payment...' : 'Pro Yearly'}
                    </h4>
                    <p className="text-xs text-slate-500">Unlimited exports for a year</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">$79.99</span>
                  <p className="text-[10px] text-slate-500">/year</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="grid grid-cols-2 gap-1.5">
                  {proFeatures.slice(0, 4).map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            <span className="absolute -top-2 left-4 bg-green-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Save 33%
            </span>
          </div>

          {/* Lifetime */}
          <div className="relative">
            <button
              onClick={() => handleSubscriptionCheckout('lifetime')}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left group disabled:opacity-50 ${
                loading === 'lifetime' 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    loading === 'lifetime' ? 'bg-purple-200' : 'bg-purple-100 group-hover:bg-purple-200'
                  }`}>
                    {loading === 'lifetime' ? (
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Crown className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {loading === 'lifetime' ? 'Connecting to payment...' : 'Lifetime Access'}
                    </h4>
                    <p className="text-xs text-slate-500">Pay once, use forever</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">$199.99</span>
                  <p className="text-[10px] text-slate-500">One-time</p>
                </div>
              </div>
            </button>
            <span className="absolute -top-2 left-4 bg-purple-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Forever
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Secure payment
          </span>
          <span>•</span>
          <span>Cancel anytime</span>
          <span>•</span>
          <span>30-day guarantee</span>
        </div>
      </div>
    </Modal>
  );
}

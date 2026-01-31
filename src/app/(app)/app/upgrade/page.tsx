'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/constants';
import { toast } from 'sonner';

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { subscription } = useAuth();

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);

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

      // Redirect to LemonSqueezy checkout
      window.location.href = data.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast.error(message);
      setLoading(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscription || !subscription.isActive) return planId === 'free';
    return subscription.planType === planId;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upgrade Your Plan</h1>
        <p className="text-slate-600">
          Get unlimited thesis generations and priority support
        </p>
      </div>

      {/* Current Plan */}
      {subscription?.status === 'active' && (
        <Card className="p-4 mb-8 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                You&apos;re on the {subscription.planType === 'lifetime' ? 'Lifetime' : 
                  subscription.planType === 'yearly' ? 'Pro (Yearly)' : 'Pro (Monthly)'} plan
              </p>
              <p className="text-sm text-green-700">
                {subscription.planType === 'lifetime' 
                  ? 'Lifetime access with no recurring charges'
                  : `Renews on ${subscription.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : 'N/A'}`
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => (
          <Card 
            key={plan.id}
            className={`p-6 relative ${
              plan.popular 
                ? 'border-blue-500 border-2 shadow-xl' 
                : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                MOST POPULAR
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-slate-900">{plan.name}</h3>
                {plan.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    {plan.badge}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500">/{plan.interval === 'lifetime' ? 'once' : plan.interval}</span>
              </div>
              {plan.savings && (
                <p className="text-sm text-green-600">{plan.savings}</p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {isCurrentPlan(plan.id) ? (
              <Button variant="secondary" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12 text-center">
        <p className="text-slate-600 mb-4">
          Questions about pricing?{' '}
          <a href="mailto:support@thesisai.io" className="text-blue-600 hover:underline">
            Contact us
          </a>
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span>🔒 Secure checkout</span>
          <span>💳 Cancel anytime</span>
          <span>📧 24/7 support</span>
        </div>
      </div>
    </div>
  );
}

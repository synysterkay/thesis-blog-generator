'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, ArrowCounterClockwise, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { PRICING_PLANS } from '@/lib/constants';
import { toast } from 'sonner';
import { trackInitiateCheckout, identifyUser } from '@/lib/tiktok';
import { trackClarityEvent } from '@/lib/clarity';
import { createClient } from '@/lib/supabase/client';

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUser({ id: user.id, email: user.email });
      }
    });
  }, []);

  const handlePaidPlanClick = async (planId: string) => {
    // If not signed in, redirect to signup with plan info
    if (!user) {
      window.location.href = `/auth/signup?plan=${planId}`;
      return;
    }
    
    setLoading(true);
    setSelectedPlan(planId);
    
    const plan = PRICING_PLANS.find(p => p.id === planId);
    
    // Track TikTok InitiateCheckout
    identifyUser({ email: user.email });
    trackInitiateCheckout({
      contentId: `thesis_${planId}`,
      contentName: plan?.name || planId,
      value: plan?.price || 0
    });
    
    try {
      trackClarityEvent(`pricing_checkout_${planId}`);
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
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
      setLoading(false);
    }
  };

  const getButtonText = (planId: string) => {
    if (planId === 'free') {
      return 'Start Free';
    }
    return 'Get Started';
  };

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-6">
            Start free, upgrade when you need more
          </p>
          
          {/* Money-back guarantee badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-slate-900" size={20} />
              <span className="font-semibold text-slate-900">30-Day Money-Back Guarantee</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <ArrowCounterClockwise className="text-slate-900" size={16} />
              <span className="text-slate-700 text-sm">No questions asked</span>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl ${
                plan.popular 
                  ? 'bg-slate-900 border border-slate-700 text-white shadow-xl shadow-slate-900/10 scale-105 z-10' 
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}
              
              <h3 className={`font-semibold text-lg mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                {plan.price > 0 && (
                  <span className={plan.popular ? 'text-slate-400' : 'text-slate-600'}>
                    /mo
                  </span>
                )}
              </div>
              
              <div className="mb-4" />
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className={`flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-slate-900'}`} size={16} />
                    <span className={`text-sm ${plan.popular ? 'text-slate-200' : 'text-slate-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.id === 'free' ? (
                <Link href={user ? "/app" : "/auth/signup"}>
                  <Button 
                    className="w-full"
                    variant="outline"
                  >
                    {user ? 'Go to App' : getButtonText(plan.id)}
                  </Button>
                </Link>
              ) : (
                <Button 
                  className={`w-full ${plan.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : ''}`}
                  variant={plan.popular ? 'secondary' : 'default'}
                  onClick={() => handlePaidPlanClick(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                >
                  {loading && selectedPlan === plan.id ? (
                    <SpinnerGap className="animate-spin" size={16} />
                  ) : (
                    getButtonText(plan.id)
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Trust badges below pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-500 mb-4">
            Trusted by 10,000+ researchers • Cancel anytime • Instant access
          </p>
          <div className="flex justify-center items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm">Secure Payments</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

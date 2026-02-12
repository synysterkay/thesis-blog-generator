'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, RotateCcw, X, Mail, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRICING_PLANS } from '@/lib/constants';
import { toast } from 'sonner';
import { trackInitiateCheckout, identifyUser } from '@/lib/tiktok';
import { createClient } from '@/lib/supabase/client';

export function PricingSection() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState('');
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
    // If user is signed in, go directly to checkout
    if (user) {
      setLoading(true);
      setSelectedPlan(planId);
      
      const plan = PRICING_PLANS.find(p => p.id === planId);
      identifyUser({ email: user.email });
      trackInitiateCheckout({
        contentId: `thesis_${planId}`,
        contentName: plan?.name || planId,
        value: plan?.price || 0
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

        window.location.href = data.url;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Checkout failed';
        toast.error(message);
        setLoading(false);
      }
      return;
    }
    
    // Not signed in - show email modal for guest checkout
    setSelectedPlan(planId);
    setShowEmailModal(true);
  };

  const handleGuestCheckout = async () => {
    if (!email || !selectedPlan) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Identify user and track TikTok InitiateCheckout
    const plan = PRICING_PLANS.find(p => p.id === selectedPlan);
    identifyUser({ email });
    trackInitiateCheckout({
      contentId: `thesis_${selectedPlan}`,
      contentName: plan?.name || selectedPlan,
      value: plan?.price || 0
    });
    
    try {
      const response = await fetch('/api/checkout/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, email }),
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

  const getPlanName = (planId: string) => {
    const plan = PRICING_PLANS.find(p => p.id === planId);
    return plan?.name || planId;
  };

  const getButtonText = (planId: string) => {
    if (planId === 'free') {
      return 'Start Free';
    }
    return 'Get Started';
  };

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-6">
            Start free, upgrade when you need more
          </p>
          
          {/* Money-back guarantee badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">30-Day Money-Back Guarantee</span>
            </div>
            <span className="text-green-600">•</span>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm">No questions asked</span>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl scale-105 z-10' 
                  : 'bg-white border border-slate-200 shadow-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}
              
              {plan.badge && !plan.popular && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{plan.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {!plan.badge && (
                <h3 className={`font-semibold text-lg mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
              )}
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold">{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                {plan.price > 0 && (
                  <span className={plan.popular ? 'text-blue-200' : 'text-slate-500'}>
                    /{plan.interval === 'lifetime' ? 'once' : plan.interval}
                  </span>
                )}
              </div>
              
              {plan.savings && (
                <p className={`text-sm mb-4 ${plan.popular ? 'text-blue-200' : 'text-green-600'}`}>
                  {plan.savings}
                </p>
              )}
              
              {!plan.savings && <div className="mb-4" />}
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-white' : 'text-slate-700'}`}>{feature}</span>
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
                  className={`w-full ${plan.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : ''}`}
                  variant={plan.popular ? 'secondary' : 'default'}
                  onClick={() => handlePaidPlanClick(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                >
                  {loading && selectedPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    getButtonText(plan.id)
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Email Collection Modal for Guest Checkout */}
        <AnimatePresence>
          {showEmailModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => !loading && setShowEmailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Get {getPlanName(selectedPlan!)}</h3>
                    <p className="text-sm text-slate-600">Enter your email to continue to checkout</p>
                  </div>
                  <button 
                    onClick={() => !loading && setShowEmailModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <Sparkles className="w-5 h-5" />
                    Quick checkout - no account needed yet!
                  </div>
                  <p className="text-sm text-blue-700">
                    Pay now, create your account after. Your subscription will be automatically linked.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuestCheckout()}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleGuestCheckout}
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      'Continue to Payment'
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-blue-600 hover:underline">
                      Sign in first
                    </Link>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
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

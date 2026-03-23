'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Envelope, Lock, Eye, EyeSlash, User, ArrowRight, Check, Crown, Sparkle, SpinnerGap } from '@phosphor-icons/react';
import { LogoIcon } from '@/components/ui/logo';
import { toast } from 'sonner';
import { trackCompletePayment, identifyUser } from '@/lib/tiktok';
import { trackClarityEvent } from '@/lib/clarity';
import { trackGoogleAdsPurchase } from '@/lib/google-ads';

function SignupContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check if user just paid (guest checkout flow) or wants to pay (signup first flow)
  const isPaidUser = searchParams.get('paid') === 'true';
  const planToPurchase = searchParams.get('plan'); // Plan they want to buy after signup
  const paidPlan = isPaidUser ? planToPurchase : null;

  // Pre-fill email from URL if provided (from LemonSqueezy checkout)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Read Facebook click/browser cookies for conversion tracking
  function getFbCookies() {
    const cookies = document.cookie.split('; ').reduce((acc: Record<string, string>, c) => {
      const [k, ...v] = c.split('=');
      acc[k] = v.join('=');
      return acc;
    }, {});
    return { fbc: cookies['_fbc'] || null, fbp: cookies['_fbp'] || null, fbclid: cookies['fbclid'] || null };
  }

  // Track TikTok CompletePayment, Google Ads, and Meta conversion when user arrives after payment
  useEffect(() => {
    if (isPaidUser) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        identifyUser({ email: decodeURIComponent(emailParam) });
      }
      
      const prices: Record<string, number> = { unlimited: 19, monthly: 9, export: 4 };
      const names: Record<string, string> = { unlimited: 'Pro Unlimited', monthly: 'Pro Monthly', export: 'One-Time Export' };
      const plan = paidPlan || 'monthly';
      
      // Track TikTok conversion
      trackCompletePayment({
        contentId: `thesis_${plan}`,
        contentName: names[plan] || plan,
        value: prices[plan] || 9.99
      });
      
      // Track Google Ads conversion
      trackGoogleAdsPurchase({
        planType: plan,
        value: prices[plan] || 9.99,
      });

      // Track Meta (Facebook) Pixel Purchase (client-side)
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Purchase', {
          value: prices[plan] || 9.99,
          currency: 'USD',
          content_name: names[plan] || plan,
          content_ids: [`thesis_${plan}`],
          content_type: 'product',
        });
      }
    }
  }, [isPaidUser, paidPlan, searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fbData = getFbCookies();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            // Mark this user as having paid before signup
            paid_before_signup: isPaidUser ? 'true' : 'false',
            paid_plan: paidPlan || null,
            // Facebook conversion tracking data
            fbc: fbData.fbc,
            fbp: fbData.fbp,
            fbclid: fbData.fbclid,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback${isPaidUser ? '?link_subscription=true' : ''}`,
        },
      });

      if (error) throw error;

      trackClarityEvent('signup_completed');

      // Track referral if user signed up via a referral link
      if (data.user) {
        const refCode = document.cookie.match(/ref_code=([a-f0-9]{8})/i)?.[1];
        if (refCode) {
          fetch('/api/referral/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: refCode, referredUserId: data.user.id }),
          }).catch(() => {}); // Fire-and-forget
          // Clear the cookie
          document.cookie = 'ref_code=; path=/; max-age=0';
        }
      }

      // Subscribe to email drip sequence (non-paid users only)
      if (!isPaidUser && data.user) {
        fetch('/api/email/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, user_id: data.user.id }),
        }).catch(() => {}); // Fire-and-forget
      }

      // If user paid before signup, try to link subscription immediately
      if (isPaidUser && data.user) {
        try {
          await fetch('/api/subscription/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: data.user.id, 
              email: email,
              planType: paidPlan 
            }),
          });
        } catch (linkError) {
          console.error('Failed to link subscription:', linkError);
          // Don't fail signup, subscription will be linked on email confirmation
        }
      }

      if (isPaidUser) {
        toast.success('Account created! You can start using Thesis Generator now.');
        // Paid users go directly to the app - they already paid so let them in
        router.push('/app');
      } else if (planToPurchase) {
        // User signed up to purchase a plan - redirect to checkout
        toast.success('Account created! Redirecting to checkout...');
        try {
          const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: planToPurchase }),
          });
          const checkoutData = await response.json();
          if (response.ok && checkoutData.url) {
            window.location.href = checkoutData.url;
          } else {
            router.push('/app/upgrade');
          }
        } catch {
          router.push('/app/upgrade');
        }
      } else {
        toast.success('Check your email to confirm your account');
        router.push('/auth/verify');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      // Build redirect URL based on intent
      let redirectUrl = `${window.location.origin}/auth/callback`;
      const params = new URLSearchParams();
      if (isPaidUser) {
        params.set('link_subscription', 'true');
        params.set('email', email);
      } else if (planToPurchase) {
        params.set('checkout_plan', planToPurchase);
      }
      // Pass referral code through callback
      const refCode = document.cookie.match(/ref_code=([a-f0-9]{8})/i)?.[1];
      if (refCode) {
        params.set('ref', refCode);
      }
      if (params.toString()) {
        redirectUrl += `?${params.toString()}`;
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up with Google');
      setGoogleLoading(false);
    }
  };

  const benefits = isPaidUser || planToPurchase ? [
    'Unlimited thesis generations',
    'All export formats (PDF, DOCX, LaTeX)',
    'Priority AI processing',
    'No thesis expiration',
    'Premium support',
  ] : [
    '1 free thesis generation',
    'Export to PDF, DOCX, LaTeX',
    'AI-powered humanization',
    'Auto tables & charts',
  ];

  // Determine page title/subtitle based on intent
  const getPageTitle = () => {
    if (isPaidUser) return '🎉 Payment Successful!';
    if (planToPurchase) return 'Create Your Account';
    return 'Start Creating Your Thesis Today';
  };

  const getPageSubtitle = () => {
    if (isPaidUser) return 'Just one more step! Create your account to activate your Pro subscription.';
    if (planToPurchase) return 'Sign up to continue with your purchase and unlock Pro features.';
    return 'Join thousands of researchers who have transformed their writing process.';
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Branding */}
      <div className={`hidden lg:flex flex-1 ${isPaidUser || planToPurchase ? 'bg-slate-50 border-r border-slate-100' : 'bg-slate-50 border-r border-slate-100'} items-center justify-center p-12`}>
        <div className="max-w-md text-slate-900">
          <div className={`w-20 h-20 ${isPaidUser || planToPurchase ? 'bg-white shadow-sm border border-slate-200' : 'bg-white shadow-sm border border-slate-200'} rounded-2xl flex items-center justify-center mb-8`}>
            {isPaidUser || planToPurchase ? <Crown size={40} className="text-emerald-600" /> : <LogoIcon size="xl" />}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {getPageTitle()}
          </h2>
          <p className={`${isPaidUser || planToPurchase ? 'text-slate-500' : 'text-slate-500'} text-lg mb-8`}>
            {getPageSubtitle()}
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${isPaidUser || planToPurchase ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'} flex items-center justify-center`}>
                  {isPaidUser || planToPurchase ? <Sparkle size={16} /> : <Check size={16} />}
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          {isPaidUser && (
            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-medium text-emerald-800">
                💡 Use the same email you used for payment to automatically activate your subscription.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <LogoIcon size="lg" />
            <span className="font-bold text-2xl text-slate-900">Thesis Generator</span>
          </Link>

          {isPaidUser && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-700 font-medium mb-1">
                <Crown size={20} />
                Pro {paidPlan === 'unlimited' ? 'Unlimited' : 'Monthly'} Plan Purchased!
              </div>
              <p className="text-sm text-emerald-600">
                Create your account below to activate your subscription.
              </p>
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isPaidUser ? 'Complete your account' : 'Create your free account'}
          </h1>
          <p className="text-slate-500 mb-4">
            {isPaidUser 
              ? 'Enter your details to activate your Pro subscription'
              : 'Get started with 1 free thesis generation'}
          </p>
          {!isPaidUser && !planToPurchase && (
            <p className="text-xs text-slate-500 mb-6 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1"><Check size={12} weight="bold" /> No credit card required</span>
              <span>·</span>
              <span>Join 12,000+ researchers</span>
            </p>
          )}

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <SpinnerGap className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span className="font-medium text-slate-600">{googleLoading ? 'Redirecting...' : 'Sign up with Google'}</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-slate-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-slate-600 hover:underline">Privacy Policy</Link>
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="ml-2" size={16} />}
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SpinnerGap className="animate-spin text-slate-400" size={32} />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  );
}

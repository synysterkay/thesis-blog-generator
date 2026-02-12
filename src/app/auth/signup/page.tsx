'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { LogoIcon } from '@/components/ui/logo';
import { toast } from 'sonner';
import { trackCompletePayment, identifyUser } from '@/lib/tiktok';

function SignupContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check if user just paid (guest checkout flow)
  const isPaidUser = searchParams.get('paid') === 'true';
  const paidPlan = searchParams.get('plan');

  // Pre-fill email from URL if provided (from LemonSqueezy checkout)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Track TikTok CompletePayment when user arrives after payment
  useEffect(() => {
    if (isPaidUser) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        identifyUser({ email: decodeURIComponent(emailParam) });
      }
      
      const prices: Record<string, number> = { lifetime: 199.99, yearly: 79.99, monthly: 9.99, export: 4.99 };
      const names: Record<string, string> = { lifetime: 'Lifetime Access', yearly: 'Pro Yearly', monthly: 'Pro Monthly', export: 'One-Time Export' };
      const plan = paidPlan || 'monthly';
      
      trackCompletePayment({
        contentId: `thesis_${plan}`,
        contentName: names[plan] || plan,
        value: prices[plan] || 9.99
      });
    }
  }, [isPaidUser, paidPlan, searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            // Mark this user as having paid before signup
            paid_before_signup: isPaidUser ? 'true' : 'false',
            paid_plan: paidPlan || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback${isPaidUser ? '?link_subscription=true' : ''}`,
        },
      });

      if (error) throw error;

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
        toast.success('Account created! Check your email to activate your Pro subscription.');
      } else {
        toast.success('Check your email to confirm your account');
      }
      router.push('/auth/verify');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${isPaidUser ? '?link_subscription=true&email=' + encodeURIComponent(email) : ''}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up with Google');
    }
  };

  const benefits = isPaidUser ? [
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className={`hidden lg:flex flex-1 ${isPaidUser ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'} items-center justify-center p-12`}>
        <div className="max-w-md text-white">
          <div className={`w-20 h-20 ${isPaidUser ? 'bg-white/30' : 'bg-white/20'} rounded-2xl flex items-center justify-center mb-8`}>
            {isPaidUser ? <Crown className="w-10 h-10" /> : <LogoIcon size="xl" variant="white" />}
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {isPaidUser ? '🎉 Payment Successful!' : 'Start Creating Your Thesis Today'}
          </h2>
          <p className={`${isPaidUser ? 'text-amber-100' : 'text-blue-100'} text-lg mb-8`}>
            {isPaidUser 
              ? 'Just one more step! Create your account to activate your Pro subscription.'
              : 'Join thousands of researchers who have transformed their writing process.'}
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${isPaidUser ? 'bg-white/30' : 'bg-white/20'} flex items-center justify-center`}>
                  {isPaidUser ? <Sparkles className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          {isPaidUser && (
            <div className="mt-8 p-4 bg-white/20 rounded-xl">
              <p className="text-sm font-medium">
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
            <span className="font-bold text-2xl" style={{ color: '#2560EA' }}>Thesis Generator</span>
          </Link>

          {isPaidUser && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                <Crown className="w-5 h-5" />
                Pro {paidPlan === 'lifetime' ? 'Lifetime' : paidPlan === 'yearly' ? 'Yearly' : 'Monthly'} Plan Purchased!
              </div>
              <p className="text-sm text-amber-700">
                Create your account below to activate your subscription.
              </p>
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isPaidUser ? 'Complete your account' : 'Create your account'}
          </h1>
          <p className="text-slate-600 mb-8">
            {isPaidUser 
              ? 'Enter your details to activate your Pro subscription'
              : 'Get started with 1 free thesis generation'}
          </p>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mb-6"
          >
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
            <span className="font-medium text-slate-700">Sign up with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
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
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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

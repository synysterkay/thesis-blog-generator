'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { LogoIcon } from '@/components/ui/logo';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Check your email</h1>
          <p className="text-slate-600 mb-8">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>

          <Link href="/auth/login">
            <Button variant="secondary">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <LogoIcon size="lg" />
          <span className="font-bold text-2xl" style={{ color: '#2560EA' }}>Thesis Generator</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset your password</h1>
        <p className="text-slate-600 mb-8">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
            {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>

        <Link href="/auth/login" className="flex items-center justify-center gap-2 mt-8 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}

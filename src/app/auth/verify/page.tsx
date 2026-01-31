import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Check your email</h1>
        <p className="text-slate-600 mb-8">
          We&apos;ve sent you a verification link. Click the link in your email to confirm your account 
          and start using Thesis Generator.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8">
          <p className="text-sm text-slate-600">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              try again with a different email
            </Link>
          </p>
        </div>

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

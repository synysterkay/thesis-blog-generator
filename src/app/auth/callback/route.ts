import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { enrollInSequence } from '@/lib/email/lifecycle-enroll';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  const linkSubscription = searchParams.get('link_subscription') === 'true';
  const emailParam = searchParams.get('email');
  const checkoutPlan = searchParams.get('checkout_plan');
  const refCode = searchParams.get('ref');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // If this is a guest checkout flow, try to link the subscription
      if (linkSubscription) {
        try {
          const userEmail = emailParam || data.user.email;
          await fetch(`${origin}/api/subscription/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: data.user.id, 
              email: userEmail 
            }),
          });
        } catch (linkError) {
          console.error('Failed to link subscription in callback:', linkError);
          // Continue anyway - the database trigger should handle it
        }
      }
      
      // If user signed up to purchase a plan, redirect to checkout
      if (checkoutPlan) {
        try {
          const checkoutResponse = await fetch(`${origin}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: checkoutPlan }),
          });
          const checkoutData = await checkoutResponse.json();
          if (checkoutResponse.ok && checkoutData.url) {
            return NextResponse.redirect(checkoutData.url);
          }
        } catch (checkoutError) {
          console.error('Failed to create checkout in callback:', checkoutError);
        }
        // Fallback to upgrade page if checkout fails
        return NextResponse.redirect(`${origin}/app/upgrade`);
      }
      
      // Track referral if user came via a referral link
      if (refCode && data.user) {
        try {
          await fetch(`${origin}/api/referral/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: refCode, referredUserId: data.user.id }),
          });
        } catch (refError) {
          console.error('Failed to track referral:', refError);
        }
      }

      // Enroll new user in onboarding email sequence
      try {
        const svc = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        await enrollInSequence(
          svc,
          data.user.id,
          data.user.email!,
          'onboarding',
          data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        );
      } catch (e) {
        console.error('Failed to enroll in onboarding:', e);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}

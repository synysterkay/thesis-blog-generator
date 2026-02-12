import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  const linkSubscription = searchParams.get('link_subscription') === 'true';
  const emailParam = searchParams.get('email');

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
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role for linking subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, email, planType } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    console.log(`Attempting to link subscription for user ${userId} with email ${email}`);

    // Find unlinked subscription by email (guest checkout creates subscription with email but no user_id)
    // We look for subscriptions that have no user_id OR have the guest marker
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`user_id.is.null,lemonsqueezy_subscription_id.like.guest-%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (findError) {
      console.error('Error finding subscription:', findError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Also check for subscriptions stored in a pending_subscriptions table or by customer email
    // Try to find by looking at the lemonsqueezy customer email
    const { data: pendingByEmail } = await supabase
      .from('subscriptions')
      .select('*')
      .ilike('lemonsqueezy_customer_id', `%${email.toLowerCase()}%`)
      .is('user_id', null)
      .single();

    let subscriptionToLink = pendingByEmail;

    if (!subscriptionToLink && subscription && subscription.length > 0) {
      // Find the most recent unlinked subscription
      subscriptionToLink = subscription.find(s => !s.user_id);
    }

    if (!subscriptionToLink) {
      // No pending subscription found - this is okay, the webhook might not have fired yet
      // Store a marker so we can link it when the webhook does fire
      console.log(`No pending subscription found for ${email}. Will be linked by webhook.`);
      
      // Store pending link request
      await supabase
        .from('pending_subscription_links')
        .upsert({
          user_id: userId,
          email: email.toLowerCase(),
          plan_type: planType,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'email'
        });

      return NextResponse.json({ 
        linked: false, 
        message: 'Subscription will be linked when payment is processed' 
      });
    }

    // Link the subscription to the user
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionToLink.id);

    if (updateError) {
      console.error('Error linking subscription:', updateError);
      return NextResponse.json({ error: 'Failed to link subscription' }, { status: 500 });
    }

    console.log(`Successfully linked subscription ${subscriptionToLink.id} to user ${userId}`);

    return NextResponse.json({ 
      linked: true, 
      subscription: {
        planType: subscriptionToLink.plan_type,
        status: subscriptionToLink.status,
      }
    });
  } catch (error: any) {
    console.error('Link subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

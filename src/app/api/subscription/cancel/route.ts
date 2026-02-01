import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription || !subscription.lemonsqueezy_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Check if it's a lifetime subscription (can't be cancelled)
    if (subscription.plan_type === 'lifetime' || subscription.lemonsqueezy_subscription_id.startsWith('lifetime-')) {
      return NextResponse.json({ error: 'Lifetime subscriptions cannot be cancelled' }, { status: 400 });
    }

    // Cancel subscription via LemonSqueezy API
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LemonSqueezy cancel error:', errorData);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // Update local subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

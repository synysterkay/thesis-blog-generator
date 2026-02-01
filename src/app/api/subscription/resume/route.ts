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
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Resume subscription via LemonSqueezy API (un-cancel)
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
        body: JSON.stringify({
          data: {
            type: 'subscriptions',
            id: subscription.lemonsqueezy_subscription_id,
            attributes: {
              cancelled: false,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LemonSqueezy resume error:', errorData);
      return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
    }

    // Update local subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, message: 'Subscription resumed successfully' });
  } catch (error: any) {
    console.error('Resume subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}

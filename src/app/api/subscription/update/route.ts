import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newPlanVariantId } = body;

    if (!newPlanVariantId) {
      return NextResponse.json({ error: 'New plan variant ID required' }, { status: 400 });
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

    // Non-subscription plans can't be changed via this endpoint
    if (!subscription.lemonsqueezy_subscription_id) {
      return NextResponse.json({ error: 'No subscription to modify' }, { status: 400 });
    }

    // Update subscription via LemonSqueezy API
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
              variant_id: parseInt(newPlanVariantId),
              invoice_immediately: false, // Prorate at next billing
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LemonSqueezy update error:', errorData);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription updated successfully' });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

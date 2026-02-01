import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;

export async function GET() {
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

    if (!subscription || !subscription.lemonsqueezy_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Get customer portal URL from LemonSqueezy
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${subscription.lemonsqueezy_customer_id}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to get portal URL' }, { status: 500 });
    }

    const data = await response.json();
    const portalUrl = data.data.attributes.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json({ error: 'Portal URL not available' }, { status: 404 });
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error('Get portal URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get portal URL' },
      { status: 500 }
    );
  }
}

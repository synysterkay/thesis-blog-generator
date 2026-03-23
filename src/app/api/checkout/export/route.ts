import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { trackServerInitiateCheckout } from '@/lib/tiktok-server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId } = await request.json();

    if (!thesisId) {
      return NextResponse.json({ error: 'Missing thesis ID' }, { status: 400 });
    }

    // Verify thesis belongs to user
    const { data: thesis } = await supabase
      .from('theses')
      .select('id, title')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (!thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    // Get env vars
    const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
    const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
    const EXPORT_VARIANT_ID = process.env.NEXT_PUBLIC_LEMONSQUEEZY_EXPORT_VARIANT_ID;

    console.log('Export checkout - Store ID:', LEMONSQUEEZY_STORE_ID);
    console.log('Export checkout - Variant ID:', EXPORT_VARIANT_ID);

    if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID) {
      console.error('LemonSqueezy config missing');
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    // If no export variant is set, we need to create one in LemonSqueezy first
    // For now, return a helpful error
    if (!EXPORT_VARIANT_ID) {
      console.error('Export variant ID not configured. Set NEXT_PUBLIC_LEMONSQUEEZY_EXPORT_VARIANT_ID');
      return NextResponse.json({ 
        error: 'One-time export not yet configured. Please subscribe for full access.',
        fallback: '/app/upgrade'
      }, { status: 400 });
    }

    const checkoutPayload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              user_id: user.id,
              thesis_id: thesisId,
              type: 'single_export',
            },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/thesis/${thesisId}?export=unlocked`,
            receipt_button_text: 'Download Your Thesis',
            receipt_thank_you_note: 'Your thesis export is now unlocked! Click below to download.',
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(LEMONSQUEEZY_STORE_ID),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(EXPORT_VARIANT_ID),
            },
          },
        },
      },
    };

    console.log('Checkout payload:', JSON.stringify(checkoutPayload, null, 2));

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LemonSqueezy checkout error:', JSON.stringify(errorData, null, 2));
      return NextResponse.json({ 
        error: errorData?.errors?.[0]?.detail || 'Failed to create checkout',
        details: errorData 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Checkout created successfully:', data.data?.attributes?.url);
    
    // Track InitiateCheckout server-side (bypasses ad blockers)
    await trackServerInitiateCheckout({
      email: user.email,
      userId: user.id,
      contentId: 'export',
      contentName: 'Single Export Unlock',
      value: 4,
      currency: 'USD',
    });
    
    return NextResponse.json({ checkoutUrl: data.data.attributes.url });
  } catch (error) {
    console.error('Export checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}

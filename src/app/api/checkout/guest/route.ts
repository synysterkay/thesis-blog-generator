import { NextResponse } from 'next/server';
import { trackServerInitiateCheckout } from '@/lib/tiktok-server';

export async function POST(request: Request) {
  try {
    const { planId, email, discountCode } = await request.json();

    if (!planId || !email) {
      return NextResponse.json({ error: 'Missing plan ID or email' }, { status: 400 });
    }

    // Validate planId
    if (!['monthly', 'yearly', 'lifetime'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
    const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

    // Get variant ID based on plan
    const variantIds: Record<string, string | undefined> = {
      monthly: process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID,
      yearly: process.env.NEXT_PUBLIC_LEMONSQUEEZY_YEARLY_VARIANT_ID,
      lifetime: process.env.NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME_VARIANT_ID,
    };
    const variantId = variantIds[planId];

    if (!variantId || !LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID) {
      console.error('Missing configuration for guest checkout');
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    console.log('Creating guest checkout:', { planId, email, variantId, discountCode });

    // Build checkout attributes
    const checkoutAttributes: Record<string, unknown> = {
      checkout_data: {
        email: email,
        discount_code: discountCode || undefined, // Apply discount code if provided
        custom: {
          // Mark this as a guest checkout - no user_id yet
          guest_checkout: 'true',
          plan_type: planId,
        },
      },
      product_options: {
        // Redirect to signup page after payment with customer info
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/signup?paid=true&plan=${planId}&email=${encodeURIComponent(email)}`,
        receipt_button_text: 'Complete Your Account',
        receipt_thank_you_note: 'Payment successful! Click below to create your account and start using Thesis Generator.',
      },
    };

    // Create checkout with email but NO user_id - user will sign up after payment
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: checkoutAttributes,
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: LEMONSQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LemonSqueezy guest checkout error:', JSON.stringify(errorData, null, 2));
      return NextResponse.json({ 
        error: errorData?.errors?.[0]?.detail || 'Failed to create checkout' 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Guest checkout created:', data.data.attributes.url);
    
    // Track InitiateCheckout server-side (bypasses ad blockers)
    const priceMap: Record<string, number> = {
      monthly: 9.99,
      yearly: 79.99,
      lifetime: 199.99,
    };
    await trackServerInitiateCheckout({
      email,
      contentId: `thesis_${planId}`,
      contentName: `Thesis Generator ${planId}`,
      value: priceMap[planId] || 9.99,
      currency: 'USD',
    });
    
    return NextResponse.json({ url: data.data.attributes.url });
  } catch (error: unknown) {
    console.error('Guest checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import crypto from 'crypto';

// Define plan metadata (prices, names)
export const THESIS_PLANS = {
  monthly: {
    name: 'Thesis Generator Pro',
    price: 9,
    interval: 'month' as const,
  },
  unlimited: {
    name: 'Thesis Generator Pro Unlimited',
    price: 19,
    interval: 'month' as const,
  },
};

export type PlanType = keyof typeof THESIS_PLANS;

// Get variant ID at runtime to ensure env vars are loaded
function getVariantId(plan: PlanType): string {
  const variantIds: Record<PlanType, string | undefined> = {
    monthly: process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID,
    unlimited: process.env.NEXT_PUBLIC_LEMONSQUEEZY_UNLIMITED_VARIANT_ID,
  };
  return variantIds[plan] || '';
}

export async function createCheckout(
  userId: string,
  email: string,
  plan: PlanType
): Promise<string> {
  // Get env vars at runtime
  const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
  const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = getVariantId(plan);
  
  if (!variantId) {
    console.error(`Variant ID not configured for plan: ${plan}. Available env vars:`, {
      monthly: process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID ? 'set' : 'missing',
      unlimited: process.env.NEXT_PUBLIC_LEMONSQUEEZY_UNLIMITED_VARIANT_ID ? 'set' : 'missing',
    });
    throw new Error(`Variant ID not configured for plan: ${plan}`);
  }

  if (!LEMONSQUEEZY_API_KEY) {
    console.error('LEMONSQUEEZY_API_KEY is not set');
    throw new Error('LemonSqueezy API key not configured');
  }

  if (!LEMONSQUEEZY_STORE_ID) {
    console.error('LEMONSQUEEZY_STORE_ID is not set');
    throw new Error('LemonSqueezy store ID not configured');
  }

  console.log('Creating checkout:', { plan, variantId, storeId: LEMONSQUEEZY_STORE_ID });

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
        attributes: {
          checkout_data: {
            email: email,
            custom: {
              user_id: userId,
            },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?success=true`,
            receipt_button_text: 'Go to Dashboard',
            receipt_thank_you_note: 'Thank you for subscribing to Thesis Generator! Start generating your thesis now.',
          },
        },
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
    console.error('LemonSqueezy checkout error:', JSON.stringify(errorData, null, 2));
    throw new Error(`Failed to create checkout session: ${errorData?.errors?.[0]?.detail || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('Checkout created successfully:', data.data.attributes.url);
  return data.data.attributes.url;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  try {
    const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
    if (!LEMONSQUEEZY_API_KEY) return null;
    
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data.attributes.urls?.customer_portal || null;
  } catch {
    return null;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
    if (!LEMONSQUEEZY_API_KEY) return false;
    
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

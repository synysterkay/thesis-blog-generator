import crypto from 'crypto';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;

export const THESIS_PLANS = {
  monthly: {
    variantId: process.env.LEMONSQUEEZY_THESIS_MONTHLY_VARIANT_ID!,
    name: 'Thesis Generator Pro Monthly',
    price: 9.99,
    interval: 'month' as const,
  },
  yearly: {
    variantId: process.env.LEMONSQUEEZY_THESIS_YEARLY_VARIANT_ID!,
    name: 'Thesis Generator Pro Yearly',
    price: 79.99,
    interval: 'year' as const,
  },
  lifetime: {
    variantId: process.env.LEMONSQUEEZY_THESIS_LIFETIME_VARIANT_ID!,
    name: 'Thesis Generator Lifetime',
    price: 199.99,
    interval: 'lifetime' as const,
  },
};

export type PlanType = keyof typeof THESIS_PLANS;

export async function createCheckout(
  userId: string,
  email: string,
  plan: PlanType
): Promise<string> {
  const variant = THESIS_PLANS[plan];
  
  if (!variant.variantId) {
    throw new Error(`Variant ID not configured for plan: ${plan}`);
  }

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
          checkout_options: {
            dark: false,
            accent_color: '#2563EB',
            logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
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
              id: variant.variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('LemonSqueezy checkout error:', errorData);
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
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

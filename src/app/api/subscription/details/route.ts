import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'unknown';
  brand: string | null;
  lastFour: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  paypalEmail: string | null;
}

export interface SubscriptionDetails {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused' | 'on_trial';
  planType: 'free' | 'monthly' | 'yearly' | 'lifetime';
  planName: string;
  price: number;
  currency: string;
  interval: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  endsAt: string | null;
  cancelledAt: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  paymentMethod: PaymentMethod | null;
  customerEmail: string | null;
  customerPortalUrl: string | null;
  updatePaymentMethodUrl: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Default free plan response
    const freePlanResponse: SubscriptionDetails = {
      id: 'free',
      status: 'active',
      planType: 'free',
      planName: 'Free Plan',
      price: 0,
      currency: 'USD',
      interval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewsAt: null,
      endsAt: null,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      paymentMethod: null,
      customerEmail: user.email || null,
      customerPortalUrl: null,
      updatePaymentMethodUrl: null,
    };

    if (!subscription || !subscription.lemonsqueezy_subscription_id) {
      return NextResponse.json(freePlanResponse);
    }

    // Handle lifetime subscriptions
    if (subscription.plan_type === 'lifetime' || subscription.lemonsqueezy_subscription_id.startsWith('lifetime-')) {
      return NextResponse.json({
        ...freePlanResponse,
        id: subscription.id,
        planType: 'lifetime',
        planName: 'Lifetime Access',
        price: 199.99,
        status: 'active',
        currentPeriodStart: subscription.created_at,
        currentPeriodEnd: null,
      });
    }

    // Fetch detailed subscription info from LemonSqueezy
    try {
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_subscription_id}`,
        {
          headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from LemonSqueezy');
      }

      const data = await response.json();
      const attrs = data.data.attributes;

      // Determine plan type
      let planType: 'monthly' | 'yearly' | 'lifetime' = 'monthly';
      let planName = 'Pro Monthly';
      let price = 9.99;
      
      if (attrs.variant_id?.toString() === process.env.NEXT_PUBLIC_LEMONSQUEEZY_YEARLY_VARIANT_ID) {
        planType = 'yearly';
        planName = 'Pro Yearly';
        price = 79.99;
      } else if (attrs.variant_id?.toString() === process.env.NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME_VARIANT_ID) {
        planType = 'lifetime';
        planName = 'Lifetime Access';
        price = 199.99;
      }

      // Get customer details for portal URL
      let customerPortalUrl = null;
      let updatePaymentMethodUrl = null;
      
      if (attrs.customer_id) {
        try {
          const customerResponse = await fetch(
            `https://api.lemonsqueezy.com/v1/customers/${attrs.customer_id}`,
            {
              headers: {
                'Accept': 'application/vnd.api+json',
                'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
              },
            }
          );
          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            customerPortalUrl = customerData.data.attributes.urls?.customer_portal || null;
            updatePaymentMethodUrl = customerData.data.attributes.urls?.update_payment_method || null;
          }
        } catch (e) {
          console.error('Error fetching customer details:', e);
        }
      }

      // Determine payment method type
      let paymentMethod: PaymentMethod | null = null;
      if (attrs.card_brand || attrs.card_last_four) {
        paymentMethod = {
          type: 'card',
          brand: attrs.card_brand,
          lastFour: attrs.card_last_four,
          expiryMonth: attrs.card_expiry_month || null,
          expiryYear: attrs.card_expiry_year || null,
          paypalEmail: null,
        };
      } else if (attrs.billing_anchor || attrs.first_subscription_item) {
        // Check if PayPal was used (LemonSqueezy doesn't always expose this clearly)
        paymentMethod = {
          type: 'unknown',
          brand: null,
          lastFour: null,
          expiryMonth: null,
          expiryYear: null,
          paypalEmail: null,
        };
      }

      const details: SubscriptionDetails = {
        id: subscription.id,
        status: attrs.status,
        planType,
        planName,
        price,
        currency: 'USD',
        interval: planType === 'lifetime' ? null : planType === 'yearly' ? 'year' : 'month',
        currentPeriodStart: attrs.current_period_start,
        currentPeriodEnd: attrs.current_period_end,
        renewsAt: attrs.renews_at,
        endsAt: attrs.ends_at,
        cancelledAt: attrs.cancelled ? attrs.updated_at : null,
        cancelAtPeriodEnd: attrs.cancelled || false,
        trialEndsAt: attrs.trial_ends_at,
        paymentMethod,
        customerEmail: attrs.user_email || user.email,
        customerPortalUrl,
        updatePaymentMethodUrl,
      };

      return NextResponse.json(details);
    } catch (apiError) {
      // Fallback to local data if API fails
      console.error('LemonSqueezy API error, using local data:', apiError);
      
      return NextResponse.json({
        ...freePlanResponse,
        id: subscription.id,
        status: subscription.status,
        planType: subscription.plan_type as 'monthly' | 'yearly' | 'lifetime',
        planName: subscription.plan_type === 'yearly' ? 'Pro Yearly' : 'Pro Monthly',
        price: subscription.plan_type === 'yearly' ? 79.99 : 9.99,
        interval: subscription.plan_type === 'yearly' ? 'year' : 'month',
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      });
    }
  } catch (error: any) {
    console.error('Subscription details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription details' },
      { status: 500 }
    );
  }
}

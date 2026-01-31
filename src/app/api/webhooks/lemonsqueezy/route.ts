import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';

// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventName = event.meta.event_name;
    const data = event.data;

    console.log(`Processing webhook: ${eventName}`);

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        const userId = data.attributes.custom_data?.user_id;
        if (!userId) {
          console.error('No user_id in custom_data');
          break;
        }

        const status = data.attributes.status;
        const planId = data.attributes.variant_id?.toString();
        const currentPeriodEnd = data.attributes.renews_at 
          ? new Date(data.attributes.renews_at).toISOString()
          : null;

        // Upsert subscription
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            lemonsqueezy_subscription_id: data.id,
            lemonsqueezy_customer_id: data.attributes.customer_id?.toString(),
            plan_id: planId,
            status: status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'inactive',
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error upserting subscription:', error);
        }
        break;
      }

      case 'subscription_cancelled': {
        const userId = data.attributes.custom_data?.user_id;
        if (!userId) break;

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error cancelling subscription:', error);
        }
        break;
      }

      case 'order_created': {
        // Handle one-time purchases (lifetime)
        const userId = data.attributes.custom_data?.user_id;
        if (!userId) break;

        const isLifetime = data.attributes.first_order_item?.variant_id?.toString() === process.env.LEMONSQUEEZY_LIFETIME_VARIANT_ID;
        
        if (isLifetime) {
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              lemonsqueezy_subscription_id: `lifetime-${data.id}`,
              lemonsqueezy_customer_id: data.attributes.customer_id?.toString(),
              plan_id: 'lifetime',
              status: 'active',
              current_period_end: null, // Lifetime has no end
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Error creating lifetime subscription:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

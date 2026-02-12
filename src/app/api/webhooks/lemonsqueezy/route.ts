import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';
import { trackServerCompletePayment } from '@/lib/tiktok-server';

// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map variant IDs to plan types
function getPlanTypeFromVariantId(variantId: string): 'monthly' | 'yearly' | 'lifetime' | null {
  const monthlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID;
  const yearlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_YEARLY_VARIANT_ID;
  const lifetimeVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME_VARIANT_ID;

  if (variantId === monthlyVariantId) return 'monthly';
  if (variantId === yearlyVariantId) return 'yearly';
  if (variantId === lifetimeVariantId) return 'lifetime';
  return null;
}

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
    console.log('Webhook data.attributes:', JSON.stringify(data.attributes, null, 2).substring(0, 1000));

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        // Custom data can come from different places
        const customData = data.attributes.custom_data || data.meta?.custom_data || {};
        let userId = customData.user_id;
        const isGuestCheckout = customData.guest_checkout === 'true';
        const customerEmail = data.attributes.user_email || data.attributes.customer_email;
        
        // For guest checkouts, try to find the user by email or store for later linking
        if (!userId && isGuestCheckout && customerEmail) {
          console.log(`Guest checkout subscription for email: ${customerEmail}`);
          
          // Try to find user by email
          const { data: userData } = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', customerEmail.toLowerCase())
            .single();
          
          if (userData) {
            userId = userData.id;
            console.log(`Found user ${userId} for guest checkout email ${customerEmail}`);
          } else {
            // Check pending subscription links
            const { data: pendingLink } = await supabase
              .from('pending_subscription_links')
              .select('user_id')
              .eq('email', customerEmail.toLowerCase())
              .single();
            
            if (pendingLink) {
              userId = pendingLink.user_id;
              console.log(`Found pending link for user ${userId}`);
              
              // Delete the pending link
              await supabase
                .from('pending_subscription_links')
                .delete()
                .eq('email', customerEmail.toLowerCase());
            }
          }
        }
        
        if (!userId) {
          // Store subscription without user_id for later linking
          console.log('No user_id found - storing subscription for later linking');
          
          const status = data.attributes.status;
          const variantId = data.attributes.variant_id?.toString();
          const planType = getPlanTypeFromVariantId(variantId) || customData.plan_type;
          
          // Store with a special marker so we can find it later
          const { error } = await supabase
            .from('subscriptions')
            .insert({
              user_id: null, // Will be linked later
              lemonsqueezy_subscription_id: data.id,
              lemonsqueezy_customer_id: data.attributes.customer_id?.toString(),
              lemonsqueezy_customer_email: customerEmail?.toLowerCase(),
              plan_id: variantId,
              plan_type: planType || 'monthly',
              status: status === 'active' ? 'active' : 'inactive',
              current_period_start: new Date().toISOString(),
              current_period_end: data.attributes.renews_at 
                ? new Date(data.attributes.renews_at).toISOString()
                : null,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            });
          
          if (error) {
            console.error('Error storing unlinked subscription:', error);
          } else {
            console.log(`Unlinked subscription stored for email: ${customerEmail}`);
          }
          break;
        }

        const status = data.attributes.status;
        const variantId = data.attributes.variant_id?.toString();
        const planType = getPlanTypeFromVariantId(variantId);
        const currentPeriodEnd = data.attributes.renews_at 
          ? new Date(data.attributes.renews_at).toISOString()
          : null;
        const currentPeriodStart = data.attributes.created_at
          ? new Date(data.attributes.created_at).toISOString()
          : new Date().toISOString();

        console.log(`Subscription webhook: userId=${userId}, variantId=${variantId}, planType=${planType}, status=${status}`);

        // Upsert subscription
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            lemonsqueezy_subscription_id: data.id,
            lemonsqueezy_customer_id: data.attributes.customer_id?.toString(),
            plan_id: variantId,
            plan_type: planType || 'monthly', // Default to monthly if unknown
            status: status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'inactive',
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: data.attributes.cancelled || false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error upserting subscription:', error);
        } else {
          console.log(`Subscription created/updated for user ${userId}, plan: ${planType}, status: ${status}`);
          
          // Track TikTok CompletePayment event
          if (eventName === 'subscription_created' && status === 'active') {
            const priceMap: Record<string, number> = {
              monthly: 9.99,
              yearly: 79.99,
              lifetime: 199.99,
            };
            await trackServerCompletePayment({
              email: customerEmail,
              userId,
              contentId: planType || 'subscription',
              contentName: `Thesis Generator ${planType || 'subscription'}`,
              value: priceMap[planType || 'monthly'] || 9.99,
              currency: 'USD',
            });
          }
        }
        break;
      }

      case 'subscription_cancelled': {
        const customData = data.attributes.custom_data || data.meta?.custom_data || {};
        const userId = customData.user_id;
        if (!userId) {
          console.error('No user_id in cancelled subscription custom_data');
          break;
        }

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
        // Handle one-time purchases (lifetime or single export)
        // Custom data can come from different places depending on the event
        const customData = data.attributes.custom_data || data.meta?.custom_data || {};
        const userId = customData.user_id;
        if (!userId) {
          console.error('No user_id in order custom_data. Full data:', JSON.stringify(data, null, 2));
          break;
        }

        // Get variant ID from first order item or from the order itself
        const variantId = data.attributes.first_order_item?.variant_id?.toString() ||
                          data.attributes.variant_id?.toString();
        const exportVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_EXPORT_VARIANT_ID;
        const lifetimeVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME_VARIANT_ID;
        
        const isLifetime = variantId === lifetimeVariantId;
        const isExport = variantId === exportVariantId;
        const thesisId = customData.thesis_id;
        
        console.log(`Order webhook: userId=${userId}, variantId=${variantId}, exportVariantId=${exportVariantId}, isLifetime=${isLifetime}, isExport=${isExport}, thesisId=${thesisId}`);

        if (isLifetime) {
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              lemonsqueezy_subscription_id: `lifetime-${data.id}`,
              lemonsqueezy_customer_id: data.attributes.customer_id?.toString(),
              plan_id: variantId,
              plan_type: 'lifetime',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: null, // Lifetime has no end
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Error creating lifetime subscription:', error);
          } else {
            console.log(`Lifetime subscription created for user ${userId}`);
            
            // Track TikTok CompletePayment for lifetime purchase
            const customerEmail = data.attributes.user_email || data.attributes.customer_email;
            await trackServerCompletePayment({
              email: customerEmail,
              userId,
              contentId: 'lifetime',
              contentName: 'Thesis Generator Lifetime',
              value: 199.99,
              currency: 'USD',
            });
          }
        } else if (isExport && thesisId) {
          // Single export unlock purchase
          console.log(`Creating export unlock for thesis ${thesisId}`);
          
          const { error } = await supabase
            .from('export_unlocks')
            .upsert({
              user_id: userId,
              thesis_id: thesisId,
              lemonsqueezy_order_id: data.id?.toString(),
              amount_paid: data.attributes.total || 499, // cents
            }, {
              onConflict: 'user_id,thesis_id'
            });

          if (error) {
            console.error('Error creating export unlock:', error);
          } else {
            console.log(`Export unlock created for user ${userId}, thesis ${thesisId}`);
            
            // Track TikTok CompletePayment for export purchase
            const customerEmail = data.attributes.user_email || data.attributes.customer_email;
            await trackServerCompletePayment({
              email: customerEmail,
              userId,
              contentId: 'export',
              contentName: 'Single Export Unlock',
              value: 4.99,
              currency: 'USD',
            });
          }
        }
        break;
      }

      case 'subscription_payment_success': {
        // Payment was successful - ensure subscription is active
        const customData = data.attributes.custom_data || data.meta?.custom_data || {};
        const userId = customData.user_id;
        
        if (!userId) {
          console.log('subscription_payment_success without user_id, checking subscription_id');
          // Try to find by subscription_id
          const subscriptionId = data.attributes.subscription_id?.toString();
          if (subscriptionId) {
            const { error } = await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('lemonsqueezy_subscription_id', subscriptionId);
            
            if (error) {
              console.error('Error activating subscription by ID:', error);
            } else {
              console.log(`Subscription ${subscriptionId} activated via payment_success`);
            }
          }
          break;
        }

        // Update subscription to active
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error activating subscription:', error);
        } else {
          console.log(`Subscription activated for user ${userId}`);
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

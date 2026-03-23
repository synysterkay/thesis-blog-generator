import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';
import { trackServerCompletePayment } from '@/lib/tiktok-server';
import { trackMetaPurchase } from '@/lib/meta-server';
import { enrollInSequence, deactivateSequence } from '@/lib/email/lifecycle-enroll';

// Webhook handler v2 — reads custom_data from event.meta (fixed 2026-03-03)
// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map variant IDs to plan types
function getPlanTypeFromVariantId(variantId: string): 'monthly' | 'unlimited' | null {
  const monthlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID;
  const unlimitedVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_UNLIMITED_VARIANT_ID;

  if (variantId === monthlyVariantId) return 'monthly';
  if (variantId === unlimitedVariantId) return 'unlimited';
  return null;
}

/**
 * Look up Facebook tracking cookies (fbc, fbp) from user metadata.
 * These are stored during signup in raw_user_meta_data.
 */
async function getUserFbData(userId: string): Promise<{ fbc?: string; fbp?: string }> {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    const meta = data?.user?.user_metadata;
    return { fbc: meta?.fbc || undefined, fbp: meta?.fbp || undefined };
  } catch {
    return {};
  }
}

/**
 * Resolve a user_id from an email address by checking the profiles table.
 * This is the reliable fallback when custom_data.user_id is missing.
 */
async function findUserByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  return data?.id || null;
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
    console.log('Webhook meta.custom_data:', JSON.stringify(event.meta?.custom_data));
    console.log('Webhook data.attributes:', JSON.stringify(data.attributes, null, 2).substring(0, 1000));

    // --- Product filtering: only process events for Thesis Generator products ---
    const THESIS_VARIANT_IDS = new Set(
      [
        process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID,
        process.env.NEXT_PUBLIC_LEMONSQUEEZY_UNLIMITED_VARIANT_ID,
        process.env.NEXT_PUBLIC_LEMONSQUEEZY_EXPORT_VARIANT_ID,
      ].filter(Boolean)
    );

    const eventVariantId =
      data.attributes?.variant_id?.toString() ||
      data.attributes?.first_order_item?.variant_id?.toString();

    if (eventVariantId && !THESIS_VARIANT_IDS.has(eventVariantId)) {
      console.log(`Skipping event — variant ${eventVariantId} is not a Thesis Generator product`);
      return NextResponse.json({ received: true, skipped: true });
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        // LemonSqueezy sends checkout custom data in event.meta.custom_data
        const customData = event.meta?.custom_data || data.attributes.custom_data || {};
        let userId = customData.user_id;
        const customerEmail = data.attributes.user_email || data.attributes.customer_email;
        
        // If no user_id from custom_data, look up by email (covers guest checkouts + any missed custom_data)
        if (!userId && customerEmail) {
          console.log(`No user_id in custom_data — looking up by email: ${customerEmail}`);
          userId = await findUserByEmail(customerEmail);
          if (userId) {
            console.log(`Found user ${userId} by email ${customerEmail}`);
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
          
          // Track conversions on new active subscription (payment)
          if (eventName === 'subscription_created' && status === 'active') {
            const priceMap: Record<string, number> = {
              monthly: 9,
              unlimited: 19,
            };
            const trackValue = priceMap[planType || 'monthly'] || 9.99;

            // TikTok CompletePayment
            await trackServerCompletePayment({
              email: customerEmail,
              userId,
              contentId: planType || 'subscription',
              contentName: `Thesis Generator ${planType || 'subscription'}`,
              value: trackValue,
              currency: 'USD',
            });

            // Meta (Facebook) Conversions API — Purchase event
            const fbData = userId ? await getUserFbData(userId) : {};
            await trackMetaPurchase({
              email: customerEmail,
              userId,
              fbc: fbData.fbc,
              fbp: fbData.fbp,
              value: trackValue,
              contentName: `Thesis Generator ${planType || 'subscription'}`,
              contentId: planType || 'subscription',
            });

            // Mark email lead as converted (stop drip sequence)
            if (customerEmail) {
              await (supabase as any)
                .from('email_leads')
                .update({ converted: true, sequence_active: false })
                .eq('email', customerEmail.toLowerCase());
            }

            // Lifecycle: enroll in retention, deactivate conversion
            await enrollInSequence(supabase, userId, customerEmail, 'retention');
            await deactivateSequence(supabase, userId, 'conversion');
            await deactivateSequence(supabase, userId, 'onboarding');
          }
        }
        break;
      }

      case 'subscription_cancelled': {
        const customData = event.meta?.custom_data || data.attributes.custom_data || {};
        let userId = customData.user_id;
        const cancelEmail = data.attributes.user_email || data.attributes.customer_email;

        if (!userId && cancelEmail) {
          userId = await findUserByEmail(cancelEmail);
        }
        if (!userId) {
          // Last resort: try by LS subscription ID
          const subId = data.id?.toString();
          if (subId) {
            await supabase.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('lemonsqueezy_subscription_id', subId);
            console.log(`Cancelled subscription by LS ID ${subId} (no user_id)`);
          } else {
            console.error('No user_id or subscription_id in cancelled event');
          }
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
        // Handle one-time purchases (single export)
        // LemonSqueezy sends checkout custom data in event.meta.custom_data
        const customData = event.meta?.custom_data || data.attributes.custom_data || {};
        let userId = customData.user_id;
        const orderEmail = data.attributes.user_email || data.attributes.customer_email;

        if (!userId && orderEmail) {
          userId = await findUserByEmail(orderEmail);
          if (userId) console.log(`Found user ${userId} by email for order`);
        }
        if (!userId) {
          console.error('No user_id in order — email lookup also failed. Email:', orderEmail);
          break;
        }

        // Get variant ID from first order item or from the order itself
        const variantId = data.attributes.first_order_item?.variant_id?.toString() ||
                          data.attributes.variant_id?.toString();
        const exportVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_EXPORT_VARIANT_ID;
        
        const isExport = variantId === exportVariantId;
        const thesisId = customData.thesis_id;
        
        console.log(`Order webhook: userId=${userId}, variantId=${variantId}, exportVariantId=${exportVariantId}, isExport=${isExport}, thesisId=${thesisId}`);

        if (isExport && thesisId) {
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
              value: 4,
              currency: 'USD',
            });

            // Meta (Facebook) Conversions API — Purchase event
            const fbData = userId ? await getUserFbData(userId) : {};
            await trackMetaPurchase({
              email: customerEmail,
              userId,
              fbc: fbData.fbc,
              fbp: fbData.fbp,
              value: 4,
              contentName: 'Single Export Unlock',
              contentId: 'export',
            });
          }
        }
        break;
      }

      case 'subscription_payment_success': {
        // Payment was successful - ensure subscription is active
        const customData = event.meta?.custom_data || data.attributes.custom_data || {};
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

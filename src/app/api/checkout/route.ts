import { createClient } from '@/lib/supabase/server';
import { createCheckout, PlanType } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';
import { trackServerInitiateCheckout } from '@/lib/tiktok-server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    // Validate planId is a valid plan type
    if (!['monthly', 'unlimited'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const checkoutUrl = await createCheckout(
      user.id,
      user.email!,
      planId as PlanType
    );

    // Track InitiateCheckout server-side (bypasses ad blockers)
    const priceMap: Record<string, number> = {
      monthly: 9,
      unlimited: 19,
    };
    await trackServerInitiateCheckout({
      email: user.email,
      userId: user.id,
      contentId: `thesis_${planId}`,
      contentName: `Thesis Generator ${planId}`,
      value: priceMap[planId] || 9.99,
      currency: 'USD',
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

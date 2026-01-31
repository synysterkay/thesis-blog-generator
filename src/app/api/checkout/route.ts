import { createClient } from '@/lib/supabase/server';
import { createCheckout, PlanType } from '@/lib/lemonsqueezy';
import { NextResponse } from 'next/server';

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
    if (!['monthly', 'yearly', 'lifetime'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const checkoutUrl = await createCheckout(
      user.id,
      user.email!,
      planId as PlanType
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

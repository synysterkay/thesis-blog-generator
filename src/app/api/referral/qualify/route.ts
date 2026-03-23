import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Called internally when a user generates their first thesis
// Checks if they were referred and qualifies the referral
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Check if this user was referred (has a pending referral entry)
    const { data: referral } = await admin
      .from('referrals')
      .select('id, referrer_id, status')
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .single();

    if (!referral) {
      return NextResponse.json({ qualified: false, reason: 'No pending referral' });
    }

    // Check referrer's lifetime credit cap
    let { data: credits } = await admin
      .from('referral_credits')
      .select('credits_earned, credits_used')
      .eq('user_id', referral.referrer_id)
      .single();

    if (!credits) {
      // Create credits row for referrer
      const { data: newCredits, error } = await admin
        .from('referral_credits')
        .insert({ user_id: referral.referrer_id, credits_earned: 0, credits_used: 0 })
        .select()
        .single();
      
      if (error || !newCredits) {
        return NextResponse.json({ error: 'Failed to create credits' }, { status: 500 });
      }
      credits = newCredits;
    }

    // Lifetime cap: 9 credits (3 free exports)
    if (credits!.credits_earned >= 9) {
      // Still qualify the referral but don't add credits
      await admin
        .from('referrals')
        .update({ status: 'qualified', qualified_at: new Date().toISOString() })
        .eq('id', referral.id);
      
      return NextResponse.json({ qualified: true, creditAdded: false, reason: 'Credit cap reached' });
    }

    // Qualify the referral and add 1 credit
    await admin
      .from('referrals')
      .update({ status: 'qualified', qualified_at: new Date().toISOString() })
      .eq('id', referral.id);

    await admin
      .from('referral_credits')
      .update({ credits_earned: credits!.credits_earned + 1 })
      .eq('user_id', referral.referrer_id);

    return NextResponse.json({ qualified: true, creditAdded: true });
  } catch (error: any) {
    console.error('Referral qualify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

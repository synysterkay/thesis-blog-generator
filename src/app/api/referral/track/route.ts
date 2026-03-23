import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Called at signup when a user has a referral code
// Creates a pending referral entry
export async function POST(request: Request) {
  try {
    const { referralCode, referredUserId } = await request.json();
    
    if (!referralCode || !referredUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Look up referral code to find referrer
    const { data: codeData } = await admin
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single();

    if (!codeData) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Prevent self-referral
    if (codeData.user_id === referredUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if this user was already referred
    const { data: existing } = await admin
      .from('referrals')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User already has a referrer' }, { status: 409 });
    }

    // Create pending referral
    const { error: insertError } = await admin
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_user_id: referredUserId,
        status: 'pending',
      });

    if (insertError) {
      console.error('Failed to create referral:', insertError);
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
    }

    // Ensure referrer has a credits row
    const { data: credits } = await admin
      .from('referral_credits')
      .select('id')
      .eq('user_id', codeData.user_id)
      .single();

    if (!credits) {
      await admin
        .from('referral_credits')
        .insert({ user_id: codeData.user_id, credits_earned: 0, credits_used: 0 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Referral track error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

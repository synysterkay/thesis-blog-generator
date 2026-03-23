import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const getSupabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// GET: Fetch user's referral code + stats
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Get or create referral code
    let { data: referralCode } = await admin
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single();

    if (!referralCode) {
      // Generate a short unique code
      const code = crypto.randomBytes(4).toString('hex');
      const { data: newCode, error } = await admin
        .from('referral_codes')
        .insert({ user_id: user.id, code })
        .select('code')
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
      }
      referralCode = newCode;
    }

    // Get credits
    let { data: credits } = await admin
      .from('referral_credits')
      .select('credits_earned, credits_used')
      .eq('user_id', user.id)
      .single();

    if (!credits) {
      credits = { credits_earned: 0, credits_used: 0 };
    }

    // Get referral history
    const { data: referrals } = await admin
      .from('referrals')
      .select('id, status, qualified_at, created_at, referred_user_id')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    // Get referred user emails for display
    const referralList = [];
    if (referrals) {
      for (const ref of referrals) {
        const { data: refUser } = await admin.auth.admin.getUserById(ref.referred_user_id);
        referralList.push({
          id: ref.id,
          status: ref.status,
          email: refUser?.user?.email ? maskEmail(refUser.user.email) : 'Unknown',
          qualifiedAt: ref.qualified_at,
          createdAt: ref.created_at,
        });
      }
    }

    return NextResponse.json({
      code: referralCode.code,
      creditsEarned: credits.credits_earned,
      creditsUsed: credits.credits_used,
      creditsAvailable: credits.credits_earned - credits.credits_used,
      referrals: referralList,
      maxCredits: 9, // Lifetime cap (3 free exports * 3 credits each)
      creditsPerExport: 3,
    });
  } catch (error: any) {
    console.error('Referral GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST: Redeem credits for an export
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId } = await request.json();
    if (!thesisId) {
      return NextResponse.json({ error: 'Missing thesisId' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Verify thesis belongs to user
    const { data: thesis, error: thesisError } = await supabase
      .from('theses')
      .select('id, title')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (thesisError || !thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    // Check credits
    const { data: credits } = await admin
      .from('referral_credits')
      .select('credits_earned, credits_used')
      .eq('user_id', user.id)
      .single();

    if (!credits || (credits.credits_earned - credits.credits_used) < 3) {
      return NextResponse.json({ error: 'Not enough credits. You need 3 credits.' }, { status: 403 });
    }

    // Deduct credits
    const { error: updateError } = await admin
      .from('referral_credits')
      .update({ credits_used: credits.credits_used + 3 })
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to redeem credits' }, { status: 500 });
    }

    // Grant export access - mark thesis as export-allowed by adding to exports or updating subscription
    // We'll add a record to a lightweight approach: grant a one-time export permission
    const { error: grantError } = await admin
      .from('theses')
      .update({ 
        copy_protected: false,
        expires_at: null,
      })
      .eq('id', thesisId);

    if (grantError) {
      // Rollback credits
      await admin
        .from('referral_credits')
        .update({ credits_used: credits.credits_used })
        .eq('user_id', user.id);
      return NextResponse.json({ error: 'Failed to grant export access' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Export unlocked! You can now download this thesis.',
      creditsRemaining: credits.credits_earned - credits.credits_used - 3,
    });
  } catch (error: any) {
    console.error('Referral redeem error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

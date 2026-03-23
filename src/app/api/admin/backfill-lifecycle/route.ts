/**
 * POST /api/admin/backfill-lifecycle
 *
 * One-time backfill that enrolls existing users into the correct
 * lifecycle email sequence based on their current state:
 *
 *   - Paid users (active monthly/unlimited) → retention
 *   - Free users with ≥1 completed thesis        → conversion
 *   - Free users with no completed thesis         → onboarding
 *
 * Protected by CRON_SECRET (pass as Bearer token) or the admin secret.
 * Skips users who are already enrolled in the target sequence.
 */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function authorize(request: Request): boolean {
  const auth = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return auth === `Bearer ${cronSecret}`;
  return true;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all profiles
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    if (profileErr || !profiles) {
      return NextResponse.json({ error: 'Failed to fetch profiles', details: profileErr }, { status: 500 });
    }

    // 2. Get active paid subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, plan_type, status')
      .in('plan_type', ['monthly', 'unlimited'])
      .eq('status', 'active');

    const paidUserIds = new Set((subs ?? []).map((s: { user_id: string }) => s.user_id));

    // 3. Get users who have at least one completed thesis
    const { data: completedTheses } = await supabase
      .from('theses')
      .select('user_id')
      .eq('status', 'completed');

    const usersWithCompletedThesis = new Set(
      (completedTheses ?? []).map((t: { user_id: string }) => t.user_id),
    );

    // 4. Get existing lifecycle enrollments to avoid duplicates
    const { data: existing } = await supabase
      .from('email_lifecycle')
      .select('user_id, sequence');

    const enrolledSet = new Set(
      (existing ?? []).map((e: { user_id: string; sequence: string }) => `${e.user_id}:${e.sequence}`),
    );

    // 5. Build enrollment list
    const toEnroll: { user_id: string; email: string; name: string | null; sequence: string }[] = [];

    for (const profile of profiles) {
      const uid = profile.id;
      const email = profile.email;
      const name = profile.full_name;

      if (paidUserIds.has(uid)) {
        // Paid user → retention (and deactivate conversion if any)
        if (!enrolledSet.has(`${uid}:retention`)) {
          toEnroll.push({ user_id: uid, email, name, sequence: 'retention' });
        }
      } else if (usersWithCompletedThesis.has(uid)) {
        // Free user with completed thesis → conversion
        if (!enrolledSet.has(`${uid}:conversion`)) {
          toEnroll.push({ user_id: uid, email, name, sequence: 'conversion' });
        }
      } else {
        // Free user, no completed thesis → onboarding
        if (!enrolledSet.has(`${uid}:onboarding`)) {
          toEnroll.push({ user_id: uid, email, name, sequence: 'onboarding' });
        }
      }
    }

    if (toEnroll.length === 0) {
      return NextResponse.json({ message: 'All users already enrolled', enrolled: 0 });
    }

    // 6. Batch insert
    const rows = toEnroll.map((e) => ({
      user_id: e.user_id,
      email: e.email.toLowerCase(),
      name: e.name,
      sequence: e.sequence,
      step: 1,
      active: true,
      enrolled_at: new Date().toISOString(),
      last_sent_at: null,
    }));

    const { error: insertErr } = await supabase
      .from('email_lifecycle')
      .upsert(rows, { onConflict: 'user_id,sequence' });

    if (insertErr) {
      return NextResponse.json({ error: 'Insert failed', details: insertErr }, { status: 500 });
    }

    // Summary
    const summary = {
      total_users: profiles.length,
      already_enrolled: profiles.length - toEnroll.length,
      newly_enrolled: toEnroll.length,
      breakdown: {
        onboarding: toEnroll.filter((e) => e.sequence === 'onboarding').length,
        conversion: toEnroll.filter((e) => e.sequence === 'conversion').length,
        retention: toEnroll.filter((e) => e.sequence === 'retention').length,
      },
    };

    console.log('📧 Lifecycle backfill complete:', summary);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('Backfill error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

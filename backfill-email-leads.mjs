/**
 * Backfill existing non-paying users into the email drip sequence.
 * 
 * Usage:
 *   node backfill-email-leads.mjs
 * 
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * This script:
 * 1. Fetches all users from auth.users
 * 2. Checks which ones have active subscriptions
 * 3. Inserts non-paying users into email_leads with sequence_day=1
 *    (they'll start receiving from Day 2 on the next cron run)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Run with: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node backfill-email-leads.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('Starting backfill...');

  // 1. Get all users
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    process.exit(1);
  }

  const users = usersData?.users || [];
  console.log(`Found ${users.length} total users`);

  // 2. Get all users with REAL paid subscriptions (not free-tier)
  // A real paid subscription has a LemonSqueezy ID or a non-free plan_type
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type, lemonsqueezy_subscription_id')
    .eq('status', 'active')
    .neq('plan_type', 'free');

  if (subError) {
    console.error('Error fetching subscriptions:', subError);
    process.exit(1);
  }

  const paidUserIds = new Set((subscriptions || []).map((s) => s.user_id));
  console.log(`Found ${paidUserIds.size} truly paid users (excluding free-tier)`);

  // 3. Get existing email leads to avoid duplicates
  const { data: existingLeads } = await supabase
    .from('email_leads')
    .select('email');

  const existingEmails = new Set((existingLeads || []).map((l) => l.email.toLowerCase()));
  console.log(`Found ${existingEmails.size} existing email leads`);

  // 4. Filter to non-paying users not already in email_leads
  const leadsToInsert = users
    .filter((user) => {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (paidUserIds.has(user.id)) return false;
      if (existingEmails.has(email)) return false;
      return true;
    })
    .map((user) => ({
      email: user.email.toLowerCase(),
      name: user.user_metadata?.full_name || null,
      user_id: user.id,
      subscribed: true,
      converted: false,
      sequence_day: 1, // They'll get Day 1 (welcome) immediately, then Day 2+ from cron
      sequence_active: true,
      last_email_sent_at: new Date().toISOString(), // Pretend Day 1 was just sent
    }));

  console.log(`${leadsToInsert.length} non-paying users to backfill`);

  if (leadsToInsert.length === 0) {
    console.log('Nothing to backfill. Done!');
    return;
  }

  // 5. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('email_leads')
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: true });

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      failed += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} leads)`);
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\nThese users will start receiving Day 2 emails on the next cron run.`);
  console.log(`To send them Day 1 (welcome) emails now, you can trigger:`);
  console.log(`  curl -X GET https://www.thesisgenerator.io/api/email/drip`);
}

main().catch(console.error);

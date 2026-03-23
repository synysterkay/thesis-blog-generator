#!/usr/bin/env node

/**
 * Script to grant unlimited access to a user
 * Usage: npx ts-node grant-access.ts email@example.com
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cfnhzwgspklimqxifmqk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx ts-node grant-access.ts email@example.com');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function grantAccess() {
  console.log(`Granting unlimited access to: ${email}`);

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching users:', userError);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error(`User not found: ${email}`);
    console.log('Available users:', users.users.map(u => u.email).join(', '));
    process.exit(1);
  }

  console.log(`Found user: ${user.id}`);

  // Create profile if doesn't exist
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  }

  // Check if subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingSub) {
    // Update existing subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        lemonsqueezy_subscription_id: `admin-grant-${Date.now()}`,
        plan_type: 'unlimited',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (subError) {
      console.error('Error updating subscription:', subError);
      process.exit(1);
    }
  } else {
    // Create new subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        lemonsqueezy_subscription_id: `admin-grant-${Date.now()}`,
        lemonsqueezy_customer_id: null,
        plan_type: 'unlimited',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: null,
        cancel_at_period_end: false,
      });

    if (subError) {
      console.error('Error creating subscription:', subError);
      process.exit(1);
    }
  }

  console.log(`✅ Unlimited access granted to ${email}`);
}

grantAccess();

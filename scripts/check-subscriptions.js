const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('All subscriptions:\n');
  data.forEach(sub => {
    console.log('User ID:', sub.user_id);
    console.log('Plan Type:', sub.plan_type);
    console.log('Status:', sub.status);
    console.log('LemonSqueezy ID:', sub.lemonsqueezy_subscription_id);
    console.log('Customer ID:', sub.lemonsqueezy_customer_id);
    console.log('Current Period End:', sub.current_period_end);
    console.log('Current Period Start:', sub.current_period_start);
    console.log('Cancel at Period End:', sub.cancel_at_period_end);
    console.log('---\n');
  });
}

check();

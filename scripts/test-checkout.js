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

async function testCheckout() {
  const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
  const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID;

  console.log('Testing checkout with:');
  console.log('- API Key:', LEMONSQUEEZY_API_KEY ? 'Set (length: ' + LEMONSQUEEZY_API_KEY.length + ')' : 'MISSING');
  console.log('- Store ID:', LEMONSQUEEZY_STORE_ID);
  console.log('- Variant ID (monthly):', variantId);
  console.log('- Site URL:', process.env.NEXT_PUBLIC_SITE_URL);

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: 'test@example.com',
            custom: {
              user_id: 'test-user-123',
            },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?success=true`,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    }),
  });

  console.log('\nResponse status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testCheckout();

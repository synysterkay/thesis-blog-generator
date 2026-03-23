// Meta (Facebook) Conversions API for server-side tracking
// Provides reliable conversion tracking that bypasses ad blockers

import crypto from 'crypto';

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN;

// SHA-256 hash (Meta requires hashed PII)
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

interface MetaEventParams {
  eventName: string;
  email?: string;
  userId?: string;
  fbc?: string; // _fbc cookie value (click ID)
  fbp?: string; // _fbp cookie value (browser ID)
  value: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
  sourceUrl?: string;
}

export async function trackMetaConversion(params: MetaEventParams): Promise<boolean> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn('Meta Pixel ID or Conversions API token not configured — skipping');
    return false;
  }

  const eventId = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  const userData: Record<string, unknown> = {};
  if (params.email) userData.em = [sha256(params.email)];
  if (params.userId) userData.external_id = [sha256(params.userId)];
  if (params.fbc) userData.fbc = params.fbc;
  if (params.fbp) userData.fbp = params.fbp;

  const event: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: timestamp,
    event_id: eventId,
    action_source: 'website',
    event_source_url: params.sourceUrl || 'https://www.thesisgenerator.io',
    user_data: userData,
    custom_data: {
      value: params.value,
      currency: params.currency || 'USD',
      content_name: params.contentName || 'Thesis Generator Subscription',
      content_ids: params.contentId ? [params.contentId] : undefined,
      content_type: 'product',
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [event],
          access_token: META_ACCESS_TOKEN,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Meta Conversions API error:', error);
      return false;
    }

    const result = await response.json();
    console.log(`Meta Conversions API: ${params.eventName} sent — events_received: ${result.events_received}`);
    return true;
  } catch (error) {
    console.error('Meta Conversions API exception:', error);
    return false;
  }
}

// Convenience: track a Purchase event
export async function trackMetaPurchase(params: {
  email?: string;
  userId?: string;
  fbc?: string;
  fbp?: string;
  value: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
}): Promise<boolean> {
  return trackMetaConversion({ ...params, eventName: 'Purchase' });
}

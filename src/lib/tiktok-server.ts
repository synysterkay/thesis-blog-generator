// TikTok Events API for server-side tracking
// This bypasses ad blockers and provides more reliable conversion tracking

import crypto from 'crypto';

const TIKTOK_PIXEL_ID = 'D63O03RC77U6E0JT80VG';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN; // Add this to your env

interface TikTokEvent {
  event: string;
  event_id?: string;
  event_time: number;
  user: {
    email?: string; // SHA256 hashed
    external_id?: string; // SHA256 hashed
    ip?: string;
    user_agent?: string;
  };
  properties?: {
    contents?: Array<{
      content_id: string;
      content_type: string;
      content_name: string;
      price?: number;
    }>;
    value?: number;
    currency?: string;
  };
}

// SHA-256 hash function
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Send event to TikTok Events API
export async function trackTikTokEvent(params: {
  event: string;
  email?: string;
  userId?: string;
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  ip?: string;
  userAgent?: string;
}): Promise<boolean> {
  if (!TIKTOK_ACCESS_TOKEN) {
    console.warn('TikTok Access Token not configured - skipping server-side tracking');
    return false;
  }

  const eventData: TikTokEvent = {
    event: params.event,
    event_id: `${params.event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_time: Math.floor(Date.now() / 1000),
    user: {},
    properties: {
      contents: [
        {
          content_id: params.contentId,
          content_type: 'product',
          content_name: params.contentName,
          price: params.value,
        },
      ],
      value: params.value,
      currency: params.currency || 'USD',
    },
  };

  // Add hashed user identifiers
  if (params.email) {
    eventData.user.email = sha256(params.email);
    eventData.user.external_id = sha256(params.email);
  } else if (params.userId) {
    eventData.user.external_id = sha256(params.userId);
  }

  if (params.ip) {
    eventData.user.ip = params.ip;
  }
  if (params.userAgent) {
    eventData.user.user_agent = params.userAgent;
  }

  try {
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        pixel_code: TIKTOK_PIXEL_ID,
        event_source: 'web',
        event_source_id: TIKTOK_PIXEL_ID,
        data: [eventData],
      }),
    });

    const result = await response.json();
    
    if (result.code === 0) {
      console.log(`TikTok Event sent successfully: ${params.event}`, {
        contentId: params.contentId,
        value: params.value,
      });
      return true;
    } else {
      console.error('TikTok Events API error:', result);
      return false;
    }
  } catch (error) {
    console.error('Failed to send TikTok event:', error);
    return false;
  }
}

// Track CompletePayment event (server-side)
export async function trackServerCompletePayment(params: {
  email?: string;
  userId?: string;
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}): Promise<boolean> {
  return trackTikTokEvent({
    event: 'CompletePayment',
    ...params,
  });
}

// Track InitiateCheckout event (server-side)
export async function trackServerInitiateCheckout(params: {
  email?: string;
  userId?: string;
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}): Promise<boolean> {
  return trackTikTokEvent({
    event: 'InitiateCheckout',
    ...params,
  });
}

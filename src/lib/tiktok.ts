'use client';

// TikTok Pixel ID
const TIKTOK_PIXEL_ID = 'D63O03RC77U6E0JT80VG';

// SHA-256 hash function for PII
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get TikTok pixel instance
function getTTQ() {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    return (window as any).ttq;
  }
  return null;
}

// Identify user with hashed PII
export async function identifyUser(params: {
  email?: string;
  phone?: string;
  externalId?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  const identifyData: Record<string, string> = {};
  
  if (params.email) {
    const hashedEmail = await sha256(params.email);
    identifyData.email = hashedEmail;
    identifyData.external_id = hashedEmail;
  }
  
  if (params.phone) {
    identifyData.phone_number = await sha256(params.phone);
  }
  
  if (params.externalId) {
    identifyData.external_id = await sha256(params.externalId);
  }
  
  if (Object.keys(identifyData).length > 0) {
    ttq.identify(identifyData);
  }
}

// Track InitiateCheckout
export function trackInitiateCheckout(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('InitiateCheckout', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName
      }
    ],
    value: params.value,
    currency: params.currency || 'USD'
  });
}

// Track AddPaymentInfo
export function trackAddPaymentInfo(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('AddPaymentInfo', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName
      }
    ],
    value: params.value,
    currency: params.currency || 'USD'
  });
}

// Track CompletePayment/Purchase
export function trackCompletePayment(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('CompletePayment', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName,
        price: params.value
      }
    ],
    value: params.value,
    currency: params.currency || 'USD'
  });
}

// Track ViewContent (for product pages)
export function trackViewContent(params: {
  contentId: string;
  contentName: string;
  value?: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('ViewContent', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName
      }
    ],
    value: params.value || 0,
    currency: params.currency || 'USD'
  });
}

// Track AddToCart
export function trackAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('AddToCart', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName
      }
    ],
    value: params.value,
    currency: params.currency || 'USD'
  });
}

// Track Purchase (alias for CompletePayment)
export function trackPurchase(params: {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}) {
  const ttq = getTTQ();
  if (!ttq) return;
  
  ttq.track('Purchase', {
    contents: [
      {
        content_id: params.contentId,
        content_type: 'product',
        content_name: params.contentName,
        price: params.value
      }
    ],
    value: params.value,
    currency: params.currency || 'USD'
  });
}

// Google Ads Conversion Tracking
// Conversion ID: AW-17949582063

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GOOGLE_ADS_ID = 'AW-17949582063';

// Conversion labels for different events
const CONVERSION_LABELS = {
  purchase: '-UeQCL-_wfcbEO_Fg-9C',
};

/**
 * Track a Google Ads conversion event
 */
export function trackGoogleAdsConversion({
  conversionLabel,
  value,
  currency = 'USD',
  transactionId,
}: {
  conversionLabel?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
}) {
  if (typeof window === 'undefined' || !window.gtag) {
    console.log('Google Ads gtag not available');
    return;
  }

  const label = conversionLabel || CONVERSION_LABELS.purchase;

  window.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value: value,
    currency: currency,
    transaction_id: transactionId,
  });

  console.log('Google Ads conversion tracked:', { label, value, currency, transactionId });
}

/**
 * Track purchase conversion (for LemonSqueezy payments)
 */
export function trackGoogleAdsPurchase({
  planType,
  value,
  orderId,
}: {
  planType: string;
  value: number;
  orderId?: string;
}) {
  trackGoogleAdsConversion({
    value,
    currency: 'USD',
    transactionId: orderId || `${planType}_${Date.now()}`,
  });
}

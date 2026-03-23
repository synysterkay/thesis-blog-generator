'use client';

/** Fire a custom Microsoft Clarity event */
export function trackClarityEvent(name: string) {
  if (typeof window !== 'undefined' && typeof (window as any).clarity === 'function') {
    (window as any).clarity('event', name);
  }
}

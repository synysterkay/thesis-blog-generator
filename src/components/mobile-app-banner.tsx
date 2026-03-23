'use client';

import { useState, useEffect } from 'react';
import { X, GooglePlayLogo, AppStoreLogo, DeviceMobile } from '@phosphor-icons/react';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.thesis.generator.ai';
const IOS_URL = 'https://apps.apple.com/app/thesis-generator-essay-ai/id6739264844';

function getMobilePlatform(): 'android' | 'ios' | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  return null;
}

export function MobileAppBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    const detected = getMobilePlatform();
    if (!detected) return;

    // Don't show if user dismissed within last 7 days
    const dismissed = localStorage.getItem('app_banner_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) return;

    setPlatform(detected);
    // Small delay so page renders first
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('app_banner_dismissed', Date.now().toString());
  };

  if (!visible || !platform) return null;

  const isAndroid = platform === 'android';
  const url = isAndroid ? ANDROID_URL : IOS_URL;
  const storeName = isAndroid ? 'Google Play' : 'App Store';
  const Icon = isAndroid ? GooglePlayLogo : AppStoreLogo;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] animate-slide-up">
      <div className="mx-3 mb-3 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-black/10 p-4">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <DeviceMobile size={22} className="text-slate-900" weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">Get the app</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Generate theses on the go — available on {storeName}
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <Icon size={18} weight="fill" />
          Open in {storeName}
        </a>
      </div>
    </div>
  );
}

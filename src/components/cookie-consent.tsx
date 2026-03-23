'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, ShieldCheck } from '@phosphor-icons/react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'thesis-cookie-consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to let user discover the page first
      const timer = setTimeout(() => setShowBanner(true), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-2xl shadow-black/10 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Cookie size={20} className="text-slate-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">We value your privacy</h3>
              <p className="text-sm text-slate-500">
                We use cookies to enhance your browsing experience, analyze site traffic, and improve our services. 
                By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
                <Link href="/privacy" className="text-slate-900 hover:underline">
                  Privacy Policy
                </Link>
              </p>
              
              {showDetails && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Necessary Cookies</p>
                      <p className="text-slate-500 text-xs">Required for the website to function properly</p>
                    </div>
                    <span className="text-slate-900 text-xs font-medium">Always Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Analytics Cookies</p>
                      <p className="text-slate-500 text-xs">Help us understand how visitors use our site</p>
                    </div>
                    <span className="text-slate-500 text-xs">Optional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Marketing Cookies</p>
                      <p className="text-slate-500 text-xs">Used to deliver relevant ads</p>
                    </div>
                    <span className="text-slate-500 text-xs">Disabled</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              {showDetails ? 'Hide Details' : 'Cookie Settings'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={acceptNecessary}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              Necessary Only
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Accept All
            </Button>
          </div>
        </div>
        
        {/* GDPR Compliance Note */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
          <ShieldCheck size={14} className="text-slate-400" />
          <p className="text-xs text-slate-400">
            GDPR & CCPA Compliant • Your data is encrypted and never sold •{' '}
            <Link href="/terms" className="text-slate-900 hover:underline">Terms</Link>
            {' '}•{' '}
            <Link href="/privacy" className="text-slate-900 hover:underline">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

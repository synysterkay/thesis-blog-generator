'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, Shield } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'thesis-cookie-consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent layout shift on initial load
      const timer = setTimeout(() => setShowBanner(true), 1000);
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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-2xl shadow-slate-900/10 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">We value your privacy 🍪</h3>
              <p className="text-sm text-slate-600">
                We use cookies to enhance your browsing experience, analyze site traffic, and improve our services. 
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
              
              {showDetails && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Necessary Cookies</p>
                      <p className="text-slate-500 text-xs">Required for the website to function properly</p>
                    </div>
                    <span className="text-green-600 text-xs font-medium">Always Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Analytics Cookies</p>
                      <p className="text-slate-500 text-xs">Help us understand how visitors use our site</p>
                    </div>
                    <span className="text-slate-400 text-xs">Optional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Marketing Cookies</p>
                      <p className="text-slate-500 text-xs">Used to deliver relevant ads</p>
                    </div>
                    <span className="text-slate-400 text-xs">Disabled</span>
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
              className="text-slate-600"
            >
              {showDetails ? 'Hide Details' : 'Cookie Settings'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={acceptNecessary}
            >
              Necessary Only
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Accept All
            </Button>
          </div>
        </div>
        
        {/* GDPR Compliance Note */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <Shield className="w-3.5 h-3.5 text-green-600" />
          <p className="text-xs text-slate-500">
            GDPR & CCPA Compliant • Your data is encrypted and never sold •{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
            {' '}•{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

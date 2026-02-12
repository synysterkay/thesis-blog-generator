'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.thesis.generator.ai';
const IOS_APP_URL = 'https://apps.apple.com/app/thesis-generator-essay-ai/id6739264844';

type Platform = 'android' | 'ios' | null;

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check if it's a mobile device first
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  if (!isMobile) return null;
  
  // Detect specific platform
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
  
  return null;
}

export function MobileAppPopup() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('app-popup-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    
    // Show popup after a short delay if on mobile
    if (detectedPlatform) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
    sessionStorage.setItem('app-popup-dismissed', 'true');
  };

  const handleGetApp = () => {
    const url = platform === 'android' ? ANDROID_APP_URL : IOS_APP_URL;
    window.open(url, '_blank');
    handleDismiss();
  };

  if (!showPopup || dismissed || !platform) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#2560EA] to-indigo-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Smartphone className="w-8 h-8 text-[#2560EA]" />
          </div>
          <h3 className="text-xl font-bold mb-1">Get the App!</h3>
          <p className="text-blue-100 text-sm">
            Better experience on your {platform === 'android' ? 'Android' : 'iPhone'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</span>
              Faster thesis generation
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</span>
              Offline access to your work
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</span>
              Push notifications when ready
            </li>
          </ul>

          <div className="space-y-3">
            <Button 
              onClick={handleGetApp}
              className="w-full bg-[#2560EA] hover:bg-[#1e4fc7] text-white py-6"
            >
              {platform === 'android' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.341c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91zm-11.046 0c-.5 0-.91.41-.91.91s.41.91.91.91.91-.41.91-.91-.41-.91-.91-.91zm11.405-6.5l1.932-3.391c.11-.19.044-.433-.147-.541-.19-.11-.433-.044-.541.147l-1.96 3.438C15.565 7.902 13.85 7.5 12 7.5s-3.565.402-5.166 1.094l-1.96-3.438c-.11-.19-.352-.257-.541-.147-.19.11-.257.352-.147.541l1.932 3.391C2.638 11.121 0 14.854 0 19.5h24c0-4.646-2.638-8.379-6.118-10.659z"/>
                  </svg>
                  Get on Google Play
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Get on App Store
                </span>
              )}
            </Button>
            
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Continue on web
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

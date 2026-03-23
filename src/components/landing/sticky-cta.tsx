'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from '@phosphor-icons/react';
import { useAuth } from '@/providers/auth-provider';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (~700px)
      setVisible(window.scrollY > 700);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show if user is logged in (they already have the app) or dismissed
  if (user || dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <p className="hidden sm:block text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Generate your thesis in minutes.</span>{' '}
            Join 50,000+ researchers already using Thesis Generator.
          </p>
          <p className="sm:hidden text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Write your thesis with AI</span>
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/auth/signup">
              <button className="h-9 px-5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5">
                Start Writing Free
                <ArrowRight size={14} weight="bold" />
              </button>
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-slate-600 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

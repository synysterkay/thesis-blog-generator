'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Warning, Sparkle } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ThesisExpiryTimerProps {
  expiresAt: Date | string | null;
  onExpired?: () => void;
}

export function ThesisExpiryTimer({ expiresAt, onExpired }: ThesisExpiryTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  } | null>(null);
  const expiredFired = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;
    expiredFired.current = false;

    const calculateTimeLeft = () => {
      const expiry = new Date(expiresAt);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
        if (!expiredFired.current) {
          expiredFired.current = true;
          onExpired?.();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!timeLeft || !expiresAt) return null;

  const isUrgent = timeLeft.days < 2;
  const isCritical = timeLeft.days === 0;

  if (timeLeft.expired) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Warning size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-sm">Free Preview Ended</h3>
            <p className="text-xs text-red-500 mt-0.5">
              Your thesis is still saved. Upgrade to Pro to regain access.
            </p>
            <Link href="/app/upgrade" className="inline-block mt-2">
              <Button size="sm" className="gap-1.5">
                <Sparkle size={14} />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${
      isCritical 
        ? 'bg-red-500/10 border border-red-500/20' 
        : isUrgent 
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'bg-slate-50 border border-slate-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCritical 
              ? 'bg-red-500/20' 
              : isUrgent 
                ? 'bg-amber-500/20'
                : 'bg-slate-100'
          }`}>
            <Clock size={20} className={
              isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-600'
            } />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${
              isCritical 
                ? 'text-red-300' 
                : isUrgent 
                  ? 'text-amber-300'
                  : 'text-slate-900'
            }`}>
              {isCritical ? '⚠️ Expires Today!' : isUrgent ? 'Expiring Soon' : 'Free Tier Access'}
            </h3>
            <p className={`text-xs mt-0.5 ${
              isCritical 
                ? 'text-red-400' 
                : isUrgent 
                  ? 'text-amber-400'
                  : 'text-slate-600'
            }`}>
              {isCritical ? 'Download today to keep your thesis' : 'Upgrade anytime to keep full access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-right">
            {timeLeft.days > 0 && (
              <div className={`px-2 py-1 rounded-lg ${
                isCritical ? 'bg-red-500/20' : isUrgent ? 'bg-amber-500/20' : 'bg-slate-100'
              }`}>
                <span className={`text-lg font-bold ${
                  isCritical ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-slate-900'
                }`}>{timeLeft.days}</span>
                <span className={`text-[10px] ml-0.5 ${
                  isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-600'
                }`}>d</span>
              </div>
            )}
            <div className={`px-2 py-1 rounded-lg ${
              isCritical ? 'bg-red-500/20' : isUrgent ? 'bg-amber-500/20' : 'bg-slate-100'
            }`}>
              <span className={`text-lg font-bold ${
                isCritical ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-slate-900'
              }`}>{timeLeft.hours}</span>
              <span className={`text-[10px] ml-0.5 ${
                isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-600'
              }`}>h</span>
            </div>
            <div className={`px-2 py-1 rounded-lg ${
              isCritical ? 'bg-red-500/20' : isUrgent ? 'bg-amber-500/20' : 'bg-slate-100'
            }`}>
              <span className={`text-lg font-bold ${
                isCritical ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-slate-900'
              }`}>{timeLeft.minutes}</span>
              <span className={`text-[10px] ml-0.5 ${
                isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-600'
              }`}>m</span>
            </div>
          </div>

          <Link href="/app/upgrade">
            <Button size="sm" variant={isCritical ? 'default' : 'outline'} className="gap-1.5">
              <Sparkle size={14} />
              {isCritical ? 'Unlock Now' : 'Upgrade'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

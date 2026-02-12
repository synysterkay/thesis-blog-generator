'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const expiry = new Date(expiresAt);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
        onExpired?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!timeLeft || !expiresAt) return null;

  const isUrgent = timeLeft.days < 2;
  const isCritical = timeLeft.days === 0;

  if (timeLeft.expired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 text-sm">Thesis Expired</h3>
            <p className="text-xs text-red-600 mt-0.5">
              This thesis is no longer accessible. Upgrade to Pro for unlimited access.
            </p>
            <Link href="/app/upgrade" className="inline-block mt-2">
              <Button size="sm" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
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
        ? 'bg-red-50 border border-red-200' 
        : isUrgent 
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCritical 
              ? 'bg-red-100' 
              : isUrgent 
                ? 'bg-amber-100'
                : 'bg-blue-100'
          }`}>
            <Clock className={`w-5 h-5 ${
              isCritical 
                ? 'text-red-600' 
                : isUrgent 
                  ? 'text-amber-600'
                  : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${
              isCritical 
                ? 'text-red-800' 
                : isUrgent 
                  ? 'text-amber-800'
                  : 'text-blue-800'
            }`}>
              {isCritical ? '⚠️ Expires Today!' : isUrgent ? 'Expiring Soon' : 'Free Tier Access'}
            </h3>
            <p className={`text-xs mt-0.5 ${
              isCritical 
                ? 'text-red-600' 
                : isUrgent 
                  ? 'text-amber-600'
                  : 'text-blue-600'
            }`}>
              Export before it&apos;s gone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-right">
            {timeLeft.days > 0 && (
              <div className={`px-2 py-1 rounded-lg ${
                isCritical 
                  ? 'bg-red-100' 
                  : isUrgent 
                    ? 'bg-amber-100'
                    : 'bg-blue-100'
              }`}>
                <span className={`text-lg font-bold ${
                  isCritical 
                    ? 'text-red-700' 
                    : isUrgent 
                      ? 'text-amber-700'
                      : 'text-blue-700'
                }`}>{timeLeft.days}</span>
                <span className={`text-[10px] ml-0.5 ${
                  isCritical 
                    ? 'text-red-500' 
                    : isUrgent 
                      ? 'text-amber-500'
                      : 'text-blue-500'
                }`}>d</span>
              </div>
            )}
            <div className={`px-2 py-1 rounded-lg ${
              isCritical 
                ? 'bg-red-100' 
                : isUrgent 
                  ? 'bg-amber-100'
                  : 'bg-blue-100'
            }`}>
              <span className={`text-lg font-bold ${
                isCritical 
                  ? 'text-red-700' 
                  : isUrgent 
                    ? 'text-amber-700'
                    : 'text-blue-700'
              }`}>{timeLeft.hours}</span>
              <span className={`text-[10px] ml-0.5 ${
                isCritical 
                  ? 'text-red-500' 
                  : isUrgent 
                    ? 'text-amber-500'
                    : 'text-blue-500'
              }`}>h</span>
            </div>
            <div className={`px-2 py-1 rounded-lg ${
              isCritical 
                ? 'bg-red-100' 
                : isUrgent 
                  ? 'bg-amber-100'
                  : 'bg-blue-100'
            }`}>
              <span className={`text-lg font-bold ${
                isCritical 
                  ? 'text-red-700' 
                  : isUrgent 
                    ? 'text-amber-700'
                    : 'text-blue-700'
              }`}>{timeLeft.minutes}</span>
              <span className={`text-[10px] ml-0.5 ${
                isCritical 
                  ? 'text-red-500' 
                  : isUrgent 
                    ? 'text-amber-500'
                    : 'text-blue-500'
              }`}>m</span>
            </div>
          </div>

          <Link href="/app/upgrade">
            <Button size="sm" variant={isCritical ? 'default' : 'outline'} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isCritical ? 'Unlock Now' : 'Upgrade'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { ShareNetwork, Copy, Check, Users, Gift, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { trackClarityEvent } from '@/lib/clarity';

interface ReferralDownsellProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralDownsell({ isOpen, onClose }: ReferralDownsellProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [creditsAvailable, setCreditsAvailable] = useState(0);
  const [creditsPerExport, setCreditsPerExport] = useState(3);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReferralData();
      trackClarityEvent('referral_downsell_shown');
    }
  }, [isOpen]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referral');
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.code);
        setCreditsAvailable(data.creditsAvailable);
        setCreditsPerExport(data.creditsPerExport);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${referralCode}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied!');
      trackClarityEvent('referral_link_copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    trackClarityEvent('referral_share_clicked');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Thesis Generator',
          text: 'I used this to write my thesis in minutes. Try it out!',
          url: referralLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const remaining = creditsPerExport - creditsAvailable;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-2">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-200">
          <Gift size={32} weight="duotone" className="text-emerald-600" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Get Your Export Free
        </h3>
        
        <p className="text-slate-500 mb-6">
          Invite {creditsPerExport} friends who generate a thesis, and download yours for free.
        </p>

        {/* Progress */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Your progress</span>
            <span className="text-sm font-semibold text-emerald-600">
              {Math.min(creditsAvailable, creditsPerExport)}/{creditsPerExport} friends
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((creditsAvailable / creditsPerExport) * 100, 100)}%` }}
            />
          </div>
          {creditsAvailable >= creditsPerExport ? (
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              You have enough credits! Use them in the export screen.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              {remaining > 0 ? `${remaining} more friend${remaining === 1 ? '' : 's'} needed` : ''}
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="text-left space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <p className="text-sm text-slate-600">Share your personal link with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <p className="text-sm text-slate-600">They sign up and generate a thesis</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
            <p className="text-sm text-slate-600">You earn 1 credit per friend — {creditsPerExport} credits = 1 free export</p>
          </div>
        </div>

        {/* Referral Link */}
        {loading ? (
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-4" />
        ) : referralCode ? (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-600 truncate">{referralLink}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <Check size={18} className="text-emerald-500" />
              ) : (
                <Copy size={18} className="text-slate-600" />
              )}
            </button>
          </div>
        ) : null}

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={!referralCode}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShareNetwork size={20} weight="bold" />
          Share with Friends
        </button>

        {/* Skip */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Maybe later
        </button>

        {/* Stats */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-3">
          <Users size={14} />
          <span>Credits track in your Settings page</span>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Lock, Check, ArrowRight, Sparkles, Download, Shield } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const benefits = [
  'Export to PDF, DOCX & LaTeX',
  'No thesis expiry (unlimited access)',
  'Copy & paste enabled',
  'Priority AI processing',
  'Premium support',
];

export function PaywallModal({ isOpen, onClose, feature }: PaywallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center py-4">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-blue-600" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          Upgrade to Pro
        </h3>
        
        <p className="text-slate-600 mb-6">
          {feature 
            ? `You need a Pro subscription to ${feature}.`
            : "Unlock full access to all features including export."
          }
        </p>

        {/* Benefits */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-medium text-slate-900 mb-3">Pro includes:</p>
          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing preview */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl font-bold text-slate-900">$9.99</span>
          <span className="text-slate-500">/month</span>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link href="/app/upgrade" className="block">
            <Button className="w-full" size="lg">
              <Sparkles className="mr-2 w-5 h-5" />
              View All Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          
          <Button variant="ghost" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout • Cancel anytime • 30-day money-back guarantee</span>
        </div>
      </div>
    </Modal>
  );
}

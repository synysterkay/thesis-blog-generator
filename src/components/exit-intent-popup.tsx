'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Clock, Envelope, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { identifyUser } from '@/lib/tiktok';

export function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const alreadyShown = sessionStorage.getItem('exitPopupShown');
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    // Only show on landing page
    if (window.location.pathname !== '/') {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect exit intent (mouse leaving viewport from top)
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    };

    // Add small delay before enabling exit intent
    const timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleClaimDiscount = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Identify user for tracking
    identifyUser({ email });
    
    try {
      const response = await fetch('/api/email/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send discount email');
      }

      setSuccess(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg my-4">
              {/* Header */}
              <div className="p-6 pb-4 relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
                >
                  <X size={16} />
                </button>
                
                {success ? (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle size={24} weight="fill" className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Discount sent!</p>
                      <h3 className="text-xl font-bold text-slate-900">Check Your Email</h3>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Gift size={24} className="text-slate-900" />
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Wait! Before you go...</p>
                        <h3 className="text-xl font-bold text-slate-900">Get 10% OFF Your First Month</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={16} />
                      <span>Limited time offer • Expires in 48 hours</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6">
                {success ? (
                  <div className="text-center py-4">
                    <p className="text-slate-600 mb-4">
                      We just sent your <span className="font-semibold text-slate-900">10% discount code</span> to <span className="font-semibold text-slate-900">{email}</span>.
                    </p>
                    <p className="text-slate-600 text-sm mb-6">
                      Open the email and click the link to claim your discount at checkout.
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                      onClick={handleClose}
                    >
                      Got it!
                    </Button>
                  </div>
                ) : (
                  <>
                <div className="mb-6">
                  <p className="text-slate-600 mb-4">
                    We noticed you were checking out our thesis generator. Here&apos;s an exclusive offer just for you:
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Pro</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">$9</span>
                            <span className="text-sm text-slate-600">/mo</span>
                          </div>
                        </div>
                        <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                          5 THESES/MO
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-900 font-medium">Pro Unlimited</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded">Best Value</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">$19</span>
                            <span className="text-sm text-slate-600">/mo</span>
                          </div>
                        </div>
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          UNLIMITED
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-xs">✓</span>
                      All export formats (PDF, DOCX, LaTeX)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-xs">✓</span>
                      All citation styles included
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-xs">✓</span>
                      30-day money-back guarantee
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-600 focus:border-slate-400"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleClaimDiscount()}
                    />
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                    onClick={handleClaimDiscount}
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <SpinnerGap size={16} className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send My 10% Discount
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <button
                    onClick={handleClose}
                    className="w-full text-sm text-slate-600 hover:text-slate-600 transition-colors py-2"
                    disabled={loading}
                  >
                    No thanks, I&apos;ll pay full price later
                  </button>
                </div>
                
                <p className="text-xs text-slate-600 text-center mt-4">
                  Discount code <span className="font-mono font-semibold text-slate-700">THESIS10</span> auto-applied at checkout
                </p>
                  </>
                )}
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

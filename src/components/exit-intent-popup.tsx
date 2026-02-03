'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Wait! Before you go...</p>
                    <h3 className="text-xl font-bold">Get 20% OFF Your First Month</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <Clock className="w-4 h-4" />
                  <span>Limited time offer • Expires in 24 hours</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-slate-600 mb-4">
                    We noticed you were checking out our thesis generator. Here&apos;s an exclusive offer just for you:
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Pro Monthly</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-green-700">$7.99</span>
                          <span className="text-sm text-green-600 line-through">$9.99</span>
                        </div>
                      </div>
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        SAVE 20%
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span>
                      Unlimited thesis generation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span>
                      All export formats (PDF, DOCX, LaTeX)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">✓</span>
                      30-day money-back guarantee
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <Link href="/auth/signup?discount=EXIT20" className="block">
                    <Button size="lg" className="w-full h-12">
                      Claim My 20% Discount
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  
                  <button
                    onClick={handleClose}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
                  >
                    No thanks, I&apos;ll pay full price later
                  </button>
                </div>
                
                <p className="text-xs text-slate-400 text-center mt-4">
                  Use code <span className="font-mono font-semibold text-slate-600">EXIT20</span> at checkout
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

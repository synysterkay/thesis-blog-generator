'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 text-center"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Write Your Thesis?
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Join thousands of researchers who have transformed their writing process. 
          Start generating your thesis today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <button 
              className="w-full sm:w-auto h-14 px-10 text-lg font-semibold bg-white text-blue-600 rounded-xl shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center"
            >
              Start Writing Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </Link>
          <Link href="#pricing">
            <Button 
              variant="outline" 
              size="xl" 
              className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
            >
              View Pricing
            </Button>
          </Link>
        </div>
        <p className="text-sm text-white/90 mt-6">
          No credit card required • Free thesis included • Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}

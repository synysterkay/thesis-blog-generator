'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING_PLANS } from '@/lib/constants';

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600">
            Start free, upgrade when you need more
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl scale-105' 
                  : 'bg-white border border-slate-200 shadow-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}
              
              {plan.badge && !plan.popular && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{plan.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              {!plan.badge && (
                <h3 className={`font-semibold text-lg mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
              )}
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className={plan.popular ? 'text-blue-200' : 'text-slate-500'}>
                  /{plan.interval === 'lifetime' ? 'once' : plan.interval}
                </span>
              </div>
              
              {plan.savings && (
                <p className={`text-sm mb-6 ${plan.popular ? 'text-blue-200' : 'text-green-600'}`}>
                  {plan.savings}
                </p>
              )}
              
              {!plan.savings && <div className="mb-6" />}
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={plan.popular ? 'text-white' : 'text-slate-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/auth/signup">
                <Button 
                  className={`w-full ${plan.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : ''}`}
                  variant={plan.popular ? 'secondary' : 'default'}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

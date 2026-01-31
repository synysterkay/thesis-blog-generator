'use client';

import { HOW_IT_WORKS_STEPS } from '@/lib/constants';
import { motion } from 'framer-motion';

export function HowItWorks() {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            From Topic to Thesis in Minutes
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our AI handles the heavy lifting while you maintain full control
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className={`w-16 h-16 rounded-2xl ${colorClasses[step.color]} flex items-center justify-center mb-4`}>
                <span className="text-2xl font-bold">{step.number}</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
              
              {/* Connector line (hidden on mobile and last item) */}
              {index < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-slate-200 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

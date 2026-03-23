'use client';

import { motion } from 'framer-motion';
import { X, Check } from '@phosphor-icons/react';

export function ComparisonSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Stop Wasting Months on Your Thesis
          </h2>
          <p className="text-xl text-slate-600">
            See the difference AI makes in your research workflow
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <X className="text-slate-500" size={20} />
              </div>
              <h3 className="font-semibold text-lg text-slate-900">Traditional Writing</h3>
            </div>
            <ul className="space-y-4">
              {[
                '3-6 months of writing',
                'Manual research & organization',
                'Create tables manually in Excel',
                'Struggle with formatting',
                "Writer's block delays",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="text-slate-300 mt-0.5 flex-shrink-0" size={20} />
                  <span className="text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* Thesis Generator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-2xl bg-slate-900 border border-slate-700 text-white"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Check className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-lg">With Thesis Generator</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Complete thesis in 30-60 minutes',
                'AI structures your research perfectly',
                'Auto-generated tables & charts',
                'Professional formatting built-in',
                'Never stare at a blank page again',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="text-white mt-0.5 flex-shrink-0" size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

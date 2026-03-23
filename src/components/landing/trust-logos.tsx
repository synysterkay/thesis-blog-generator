'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Buildings, Globe, Certificate } from '@phosphor-icons/react';

const universities = [
  'MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge',
  'Yale', 'Princeton', 'Columbia', 'Berkeley', 'ETH Zürich',
];

export function TrustLogos() {
  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
            Trusted by students & researchers at
          </p>
        </motion.div>

        {/* University names marquee */}
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap mb-10">
          {universities.map((uni, i) => (
            <motion.span
              key={uni}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-slate-300 font-semibold text-lg md:text-xl tracking-tight select-none"
            >
              {uni}
            </motion.span>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-6 md:gap-10 flex-wrap"
        >
          <div className="flex items-center gap-2 text-slate-600">
            <GraduationCap size={18} weight="duotone" />
            <span className="text-xs font-medium">50,000+ Theses Generated</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 text-slate-600">
            <Buildings size={18} weight="duotone" />
            <span className="text-xs font-medium">500+ Universities</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 text-slate-600">
            <Globe size={18} weight="duotone" />
            <span className="text-xs font-medium">120+ Countries</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2 text-slate-600">
            <Certificate size={18} weight="duotone" />
            <span className="text-xs font-medium">Privacy Guaranteed</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

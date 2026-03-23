'use client';

import { motion } from 'framer-motion';
import { Star } from '@phosphor-icons/react';
import { TESTIMONIALS } from '@/lib/constants';

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Loved by Researchers Worldwide
          </h2>
          <p className="text-xl text-slate-600">
            See what our users are saying
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-amber-400" size={20} weight="fill" />
                ))}
              </div>
              <p className="text-slate-600 mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{testimonial.author}</p>
                  <p className="text-xs text-slate-600">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Product Hunt Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center mt-12"
        >
          <p className="text-sm text-slate-600 mb-3">Leave us a review on Product Hunt</p>
          <a 
            href="https://www.producthunt.com/products/thesisgenerator-tech/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-thesisgenerator-tech" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1086240&theme=neutral" 
              alt="ThesisGenerator.io - Instant thesis statements, powered by AI | Product Hunt" 
              width="250" 
              height="54"
              className="h-[54px] w-[250px]"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

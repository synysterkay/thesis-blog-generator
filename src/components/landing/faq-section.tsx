'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react';
import { FAQ_ITEMS } from '@/lib/constants';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-5 text-left"
      >
        <span className="font-medium text-slate-900">{question}</span>
        <CaretDown 
          className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          size={20}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 text-slate-600">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

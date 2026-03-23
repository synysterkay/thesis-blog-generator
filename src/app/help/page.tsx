'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Question, 
  MagnifyingGlass, 
  CaretDown,
  BookOpen,
  ChatCircle,
  Envelope
} from '@phosphor-icons/react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Thesis Generator?',
        a: 'Thesis Generator is an AI-powered platform that helps students and researchers generate complete academic theses. It creates properly structured documents with auto-generated tables, charts, and human-like academic writing.',
      },
      {
        q: 'Is Thesis Generator suitable for all academic levels?',
        a: "Yes! Thesis Generator supports Bachelor's, Master's, and PhD level theses across various academic fields including Computer Science, Business, Engineering, Psychology, and many more.",
      },
      {
        q: 'How long does it take to generate a thesis?',
        a: 'A complete thesis (90+ pages) typically takes 15-30 minutes to generate, depending on the complexity and length. You can monitor the progress in real-time from your dashboard.',
      },
    ],
  },
  {
    category: 'Features',
    questions: [
      {
        q: 'Does Thesis Generator generate tables and charts?',
        a: 'Yes! Thesis Generator automatically generates relevant tables and charts based on your thesis topic. These are properly formatted and include appropriate captions and references.',
      },
      {
        q: 'What export formats are supported?',
        a: 'You can export your thesis in PDF, DOCX, and LaTeX formats. LaTeX export is available for Pro users and is perfect for technical dissertations.',
      },
      {
        q: 'What is the humanization feature?',
        a: 'Our humanization engine processes the AI-generated content to make it read naturally, with varied sentence structures and academic tone that matches human writing patterns.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    questions: [
      {
        q: 'What does the free plan include?',
        a: 'The free plan includes 1 thesis per month with up to 5 chapters, basic text export, and community support. Perfect for trying out the platform!',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
      },
      {
        q: 'Do you offer refunds?',
        a: "We offer a 7-day money-back guarantee for new subscribers. If you're not satisfied, contact us at hello@thesisgenerator.tech for a full refund.",
      },
    ],
  },
  {
    category: 'Academic Integrity',
    questions: [
      {
        q: 'Is using Thesis Generator considered plagiarism?',
        a: "Thesis Generator generates original content. However, it's your responsibility to use the tool in accordance with your institution's policies. We recommend using Thesis Generator as a writing assistant and always reviewing/editing the output.",
      },
      {
        q: 'Should I disclose that I used AI assistance?',
        a: 'We recommend following your institution\'s guidelines on AI tool disclosure. Many institutions now have specific policies about declaring AI assistance in academic work.',
      },
      {
        q: 'Is the generated content unique?',
        a: 'Yes, each thesis is uniquely generated based on your specific inputs. We recommend running the final document through your institution\'s plagiarism checker for peace of mind.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What browsers are supported?',
        a: 'Thesis Generator works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.',
      },
      {
        q: 'Is my data secure?',
        a: 'Absolutely. We use industry-standard encryption and never share your data with third parties. Your theses and personal information are protected.',
      },
      {
        q: 'Can I access my theses from multiple devices?',
        a: 'Yes! Your account and all your theses are synced across devices. Log in from anywhere to access your work.',
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-700 flex items-center justify-center">
              <Question size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Help Center</h1>
            <p className="text-xl text-slate-600 mb-8">
              Find answers to common questions about Thesis Generator
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/documentation" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
              <BookOpen size={20} className="text-slate-400 group-hover:text-slate-600" />
              <span className="font-medium text-slate-700 group-hover:text-slate-900">Documentation</span>
            </Link>
            <Link href="/contact" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
              <ChatCircle size={20} className="text-slate-400 group-hover:text-slate-600" />
              <span className="font-medium text-slate-700 group-hover:text-slate-900">Chat Support</span>
            </Link>
            <a href="mailto:hello@thesisgenerator.tech" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group">
              <Envelope size={20} className="text-slate-400 group-hover:text-slate-600" />
              <span className="font-medium text-slate-700 group-hover:text-slate-900">Email Support</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{category.category}</h2>
              <Card className="divide-y divide-slate-100">
                {category.questions.map((faq, index) => {
                  const itemId = `${category.category}-${index}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <div key={index}>
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-900 pr-4">{faq.q}</span>
                        <CaretDown 
                          size={20}
                          className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="px-4 pb-4 text-slate-600">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </Card>
            </motion.div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No results found for &quot;{searchQuery}&quot;</p>
              <Link href="/contact" className="text-slate-600 hover:underline">
                Contact support for help
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h2>
          <p className="text-slate-600 mb-6">
            Our support team is ready to help you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors"
            >
              <ChatCircle size={20} />
              Chat with AI Support
            </Link>
            <a
              href="mailto:hello@thesisgenerator.tech"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Envelope size={20} />
              Email Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

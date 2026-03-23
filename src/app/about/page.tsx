'use client';

import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { motion } from 'framer-motion';
import { Crosshair, Users, Lightbulb, ShieldCheck, Globe } from '@phosphor-icons/react';
import { LogoIcon } from '@/components/ui/logo';

const values = [
  {
    icon: Crosshair,
    title: 'Mission-Driven',
    description: 'Empowering students and researchers to achieve their academic goals through intelligent technology.',
  },
  {
    icon: Users,
    title: 'User-Centric',
    description: 'Every feature is designed with our users in mind, making thesis writing accessible to everyone.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Continuously pushing the boundaries of AI to deliver the most advanced writing assistance.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    description: 'Promoting responsible AI use while maintaining the highest standards of academic ethics.',
  },
];

const stats = [
  { value: '10,000+', label: 'Researchers Worldwide' },
  { value: '50,000+', label: 'Theses Generated' },
  { value: '150+', label: 'Countries' },
  { value: '4.9/5', label: 'User Rating' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/25">
              <LogoIcon size="lg" variant="white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              About Thesis Generator
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We&apos;re on a mission to democratize academic writing by making AI-powered research assistance available to students and researchers everywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
            <div className="prose prose-lg prose-slate">
              <p className="text-slate-600 mb-4">
                Thesis Generator was born from a simple observation: writing a thesis is one of the most challenging and time-consuming tasks in academia, yet the tools available to help researchers haven&apos;t evolved much in decades.
              </p>
              <p className="text-slate-600 mb-4">
                Our founders, having experienced the thesis writing process firsthand during their graduate studies, envisioned a future where AI could serve as an intelligent research companion—helping with structure, content generation, and formatting while preserving the researcher&apos;s unique voice and insights.
              </p>
              <p className="text-slate-600 mb-4">
                Today, Thesis Generator serves thousands of researchers across 150+ countries, helping them generate comprehensive thesis documents, complete with properly formatted tables, charts, and citations. We&apos;re proud to be part of their academic journey.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-slate-700 mb-2">{stat.value}</p>
                <p className="text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Values</h2>
            <p className="text-xl text-slate-600">The principles that guide everything we do</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-200"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <value.icon size={24} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe size={48} className="mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            Trusted by Researchers Globally
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            From Stanford to Oxford, from MIT to Cambridge—students and researchers at top institutions worldwide trust Thesis Generator to help them succeed.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

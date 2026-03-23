'use client';

import { motion } from 'framer-motion';
import { Sparkle, PenNib, ChartBar, FileText, PencilSimple, Lightning, Check } from '@phosphor-icons/react';

const features = [
  {
    title: '90+ Page Generation',
    description: 'Generate complete academic theses with chapters, sections, and proper academic structure in minutes.',
    icon: Sparkle,
    tags: ['5-7 Chapters', 'Auto Outlines', 'References'],
    large: true,
    gradient: true,
  },
  {
    title: 'Human-Like Writing',
    description: 'Advanced humanization that passes AI detection and reads naturally',
    icon: PenNib,
    color: 'green',
  },
  {
    title: 'Auto Tables & Charts',
    description: 'AI generates relevant data visualizations for each chapter automatically',
    icon: ChartBar,
    color: 'purple',
  },
  {
    title: 'Export Anywhere',
    description: 'Download in PDF, DOCX, LaTeX, or Markdown for any submission requirement',
    icon: FileText,
    color: 'orange',
  },
  {
    title: 'Full Editor Control',
    description: 'Edit any section, regenerate parts, or add your own content seamlessly',
    icon: PencilSimple,
    color: 'cyan',
  },
  {
    title: 'Real-Time Progress',
    description: 'Watch your thesis come to life with live progress tracking and chapter status.',
    icon: Lightning,
    large: true,
    dark: true,
  },
];

const colorClasses: Record<string, string> = {
  green: 'bg-slate-100 text-slate-900',
  purple: 'bg-slate-100 text-slate-900',
  orange: 'bg-slate-100 text-slate-900',
  cyan: 'bg-slate-100 text-slate-900',
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Everything You Need to Write Better
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Professional-grade thesis generation with features that actually matter
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            // Large gradient card
            if (feature.gradient) {
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-96 h-96 bg-slate-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                      <Icon size={24} className="text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 mb-6">{feature.description}</p>
                    {feature.tags && (
                      <div className="flex gap-3 flex-wrap">
                        {feature.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            }
            
            // Large dark card
            if (feature.dark) {
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                      <Icon size={24} className="text-slate-900" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 mb-6">{feature.description}</p>
                    
                    {/* Progress preview */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-slate-900" />
                        <span className="text-sm text-slate-700">Chapter 1: Introduction</span>
                        <span className="text-xs text-slate-600 ml-auto">2,340 words</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-slate-900" />
                        <span className="text-sm text-slate-700">Chapter 2: Literature Review</span>
                        <span className="text-xs text-slate-600 ml-auto">4,120 words</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-slate-300 animate-pulse" />
                        <span className="text-sm text-slate-700">Chapter 3: Methodology</span>
                        <span className="text-xs text-slate-600 ml-auto">Generating...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }
            
            // Regular small card
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color || 'green']} flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

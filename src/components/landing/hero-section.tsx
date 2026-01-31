'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
    {/* Video Modal */}
    <AnimatePresence>
      {isVideoOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsVideoOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/_5tT1IfqNS8?autoplay=1"
              title="Thesis Generator Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <section className="relative min-h-screen overflow-hidden bg-white pt-16">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))]" />
      
      {/* Floating grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        {/* Badge */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            AI-Powered Academic Writing
          </span>
        </motion.div>
        
        {/* Headline */}
        <motion.h1 
          className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Generate Complete
          <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Academic Theses
          </span>
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p 
          className="max-w-2xl mx-auto text-center text-lg md:text-xl text-slate-600 leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Create 90+ page research papers with proper structure, 
          auto-generated tables & charts, and human-like academic writing.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="/auth/signup">
            <Button size="xl" className="w-full sm:w-auto">
              Start Writing Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          
          <Button 
            variant="secondary" 
            size="xl" 
            className="w-full sm:w-auto"
            onClick={() => setIsVideoOpen(true)}
          >
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </Button>
        </motion.div>
        
        {/* Social proof */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-slate-500 mb-4">Trusted by 10,000+ researchers worldwide</p>
          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap opacity-70">
            {/* University/Institution logos as text */}
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <span className="font-semibold text-sm">Stanford</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <span className="font-semibold text-sm">MIT</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <span className="font-semibold text-sm">Oxford</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <span className="font-semibold text-sm">Harvard</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
              </svg>
              <span className="font-semibold text-sm">Cambridge</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Hero visual - Floating thesis preview */}
      <motion.div 
        className="relative max-w-5xl mx-auto px-6 pb-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      >
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-900/10 bg-white">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-500">
                thesisai.io/app/generate
              </div>
            </div>
          </div>
          
          {/* App preview - Live typing animation */}
          <div className="aspect-[16/10] bg-gradient-to-br from-slate-50 to-white p-6 overflow-hidden">
            <div className="h-full bg-white rounded-lg shadow-inner border border-slate-100 p-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600">Generating Chapter 3: Methodology</span>
              </div>
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="font-semibold">3.1 Research Design</span>
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-slate-600 text-xs"
                >
                  This study employs a mixed-methods approach, combining quantitative data analysis with qualitative insights...
                </motion.p>
                
                {/* Auto-generated Table */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="my-3"
                >
                  <p className="text-xs font-semibold text-slate-700 mb-2">Table 3.1: Research Methodology Overview</p>
                  <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-200">Method</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-200">Sample</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-200">Analysis</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-1.5">Survey</td>
                          <td className="px-2 py-1.5">n=245</td>
                          <td className="px-2 py-1.5">SPSS v28</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-1.5">Interviews</td>
                          <td className="px-2 py-1.5">n=18</td>
                          <td className="px-2 py-1.5">NVivo</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5">Case Study</td>
                          <td className="px-2 py-1.5">n=3</td>
                          <td className="px-2 py-1.5">Thematic</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                {/* Auto-generated Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="my-3"
                >
                  <p className="text-xs font-semibold text-slate-700 mb-2">Figure 3.1: Data Collection Timeline</p>
                  <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                    <div className="flex items-end justify-between gap-1 h-16">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '40%' }}
                        transition={{ delay: 2.2, duration: 0.5 }}
                        className="flex-1 bg-blue-400 rounded-t-sm"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '65%' }}
                        transition={{ delay: 2.4, duration: 0.5 }}
                        className="flex-1 bg-blue-500 rounded-t-sm"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '85%' }}
                        transition={{ delay: 2.6, duration: 0.5 }}
                        className="flex-1 bg-blue-600 rounded-t-sm"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ delay: 2.8, duration: 0.5 }}
                        className="flex-1 bg-cyan-500 rounded-t-sm"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: '70%' }}
                        transition={{ delay: 3, duration: 0.5 }}
                        className="flex-1 bg-cyan-400 rounded-t-sm"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Q1</span>
                      <span>Q2</span>
                      <span>Q3</span>
                      <span>Q4</span>
                      <span>Q5</span>
                    </div>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.2 }}
                  className="text-slate-600 text-xs"
                >
                  The research framework integrates theoretical foundations with empirical observations...
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 3.5, duration: 1, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-blue-500 ml-1"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <motion.div 
          className="absolute -top-6 -left-6 p-4 rounded-xl bg-white shadow-xl border border-slate-100"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Chapter Generated</p>
              <p className="text-xs text-slate-500">2,340 words</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute -bottom-4 -right-4 p-4 rounded-xl bg-white shadow-xl border border-slate-100"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Chart Created</p>
              <p className="text-xs text-slate-500">Revenue Analysis</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
    </>
  );
}

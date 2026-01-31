'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Rocket, 
  Settings, 
  FileText, 
  Palette, 
  Download,
  ChevronRight,
  Search,
  Zap,
  Shield,
  CreditCard
} from 'lucide-react';

const categories = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'Getting Started',
    description: 'Learn the basics and create your first thesis',
    articles: [
      { title: 'Creating Your Account', slug: 'creating-account' },
      { title: 'Your First Thesis', slug: 'first-thesis' },
      { title: 'Understanding the Dashboard', slug: 'dashboard-overview' },
      { title: 'Choosing Your Field & Degree', slug: 'field-degree' },
    ],
  },
  {
    id: 'features',
    icon: Zap,
    title: 'Features',
    description: 'Explore all Thesis Generator capabilities',
    articles: [
      { title: 'AI Thesis Generation', slug: 'ai-generation' },
      { title: 'Auto-Generated Tables', slug: 'tables' },
      { title: 'Chart & Graph Creation', slug: 'charts' },
      { title: 'Humanization Engine', slug: 'humanization' },
      { title: 'Citation Management', slug: 'citations' },
    ],
  },
  {
    id: 'export',
    icon: Download,
    title: 'Export & Formatting',
    description: 'Download your thesis in various formats',
    articles: [
      { title: 'Exporting to PDF', slug: 'export-pdf' },
      { title: 'Exporting to DOCX', slug: 'export-docx' },
      { title: 'LaTeX Export (Pro)', slug: 'export-latex' },
      { title: 'Formatting Options', slug: 'formatting' },
    ],
  },
  {
    id: 'account',
    icon: Settings,
    title: 'Account & Settings',
    description: 'Manage your account and preferences',
    articles: [
      { title: 'Profile Settings', slug: 'profile' },
      { title: 'Notification Preferences', slug: 'notifications' },
      { title: 'Language Settings', slug: 'language' },
      { title: 'Deleting Your Account', slug: 'delete-account' },
    ],
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing & Subscriptions',
    description: 'Manage payments and subscriptions',
    articles: [
      { title: 'Subscription Plans', slug: 'plans' },
      { title: 'Upgrading Your Plan', slug: 'upgrade' },
      { title: 'Billing FAQ', slug: 'billing-faq' },
      { title: 'Refund Policy', slug: 'refunds' },
    ],
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy & Security',
    description: 'How we protect your data',
    articles: [
      { title: 'Data Security', slug: 'security' },
      { title: 'Privacy Practices', slug: 'privacy' },
      { title: 'Academic Integrity', slug: 'integrity' },
      { title: 'GDPR Compliance', slug: 'gdpr' },
    ],
  },
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => 
    category.articles.length > 0 || 
    category.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Documentation</h1>
            <p className="text-xl text-slate-600 mb-8">
              Everything you need to know about using Thesis Generator
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900">{category.title}</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article.slug}>
                        <Link
                          href={`/documentation/${category.id}/${article.slug}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors group"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Popular Articles</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: 'Create Your First Thesis', href: '/documentation/getting-started/first-thesis' },
              { icon: Palette, title: 'Customize Formatting', href: '/documentation/export/formatting' },
              { icon: Download, title: 'Export to PDF', href: '/documentation/export/export-pdf' },
            ].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Can&apos;t find what you&apos;re looking for?</h2>
            <p className="text-blue-100 mb-6">
              Our support team is here to help you with any questions
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              Contact Support
            </Link>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}

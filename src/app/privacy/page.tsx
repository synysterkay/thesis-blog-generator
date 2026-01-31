'use client';

import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
            <p className="text-slate-500 mb-8">Last updated: January 31, 2026</p>
            
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-slate-600 mb-4">
                Thesis Generator (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Personal Information</h3>
              <p className="text-slate-600 mb-4">We may collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Name and email address</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely by our payment provider)</li>
                <li>Thesis content and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Automatically Collected Information</h3>
              <p className="text-slate-600 mb-4">We automatically collect certain information when you use our service:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage patterns and preferences</li>
                <li>Cookies and similar technologies</li>
              </ul>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 mb-4">We use the collected information for:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Providing and improving our thesis generation service</li>
                <li>Processing transactions and managing subscriptions</li>
                <li>Communicating with you about your account and updates</li>
                <li>Analyzing usage to improve our platform</li>
                <li>Preventing fraud and ensuring security</li>
              </ul>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Data Security</h2>
              <p className="text-slate-600 mb-4">
                We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure server infrastructure, and regular security audits. However, no method of transmission over the Internet is 100% secure.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Data Retention</h2>
              <p className="text-slate-600 mb-4">
                We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Third-Party Services</h2>
              <p className="text-slate-600 mb-4">We may use third-party services for:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Payment processing (LemonSqueezy)</li>
                <li>Authentication (Supabase)</li>
                <li>Analytics (privacy-respecting analytics)</li>
                <li>AI processing (DeepSeek)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Your Rights</h2>
              <p className="text-slate-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. GDPR Compliance</h2>
              <p className="text-slate-600 mb-4">
                For users in the European Economic Area, we comply with GDPR requirements. We process data based on consent, contractual necessity, and legitimate interests.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-slate-600 mb-4">
                Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">10. Changes to This Policy</h2>
              <p className="text-slate-600 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">11. Contact Us</h2>
              <p className="text-slate-600 mb-4">
                For questions about this Privacy Policy or your data, please contact us at{' '}
                <a href="mailto:hello@thesisgenerator.tech" className="text-blue-600 hover:underline">
                  hello@thesisgenerator.tech
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

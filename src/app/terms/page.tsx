'use client';

import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
            <p className="text-slate-500 mb-8">Last updated: January 31, 2026</p>
            
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 mb-4">
                By accessing and using Thesis Generator (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 mb-4">
                Thesis Generator provides AI-powered thesis and academic writing generation tools. The Service is designed to assist users in creating academic content, including research papers, thesis documents, and related materials.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. User Responsibilities</h2>
              <p className="text-slate-600 mb-4">Users of Thesis Generator agree to:</p>
              <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-2">
                <li>Use the Service for lawful purposes only</li>
                <li>Comply with their institution&apos;s academic integrity policies</li>
                <li>Review and edit all AI-generated content before submission</li>
                <li>Not misrepresent AI-generated content as entirely their own work where prohibited</li>
                <li>Maintain the security of their account credentials</li>
              </ul>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Academic Integrity</h2>
              <p className="text-slate-600 mb-4">
                Thesis Generator is intended to be used as a research and writing assistance tool. Users are responsible for ensuring their use of the Service complies with their academic institution&apos;s policies regarding AI-assisted writing. We encourage users to disclose AI assistance where required.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Intellectual Property</h2>
              <p className="text-slate-600 mb-4">
                Content generated through Thesis Generator is licensed to the user for their personal and academic use. Users retain ownership of their original input and prompts. The underlying AI models, software, and technology remain the property of Thesis Generator.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Subscription and Payments</h2>
              <p className="text-slate-600 mb-4">
                Thesis Generator offers various subscription plans. By subscribing, you agree to pay the applicable fees. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are handled according to our refund policy.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Limitation of Liability</h2>
              <p className="text-slate-600 mb-4">
                Thesis Generator is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from the use of the Service, including but not limited to academic consequences, data loss, or service interruptions.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. Changes to Terms</h2>
              <p className="text-slate-600 mb-4">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. Contact Information</h2>
              <p className="text-slate-600 mb-4">
                For questions about these Terms of Service, please contact us at{' '}
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

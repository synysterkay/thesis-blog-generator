import Link from 'next/link';
import { LogoWithText } from '@/components/ui/logo';
import { ShieldCheck, GlobeHemisphereWest, Lightning, GooglePlayLogo, AppStoreLogo } from '@phosphor-icons/react/dist/ssr';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Documentation', href: '/documentation' },
    { label: 'Help Center', href: '/help' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="py-16 bg-slate-950 text-white border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <LogoWithText size="md" variant="white" />
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              AI-powered thesis generation for researchers and students worldwide.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.thesis.generator.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <GooglePlayLogo size={14} weight="duotone" />
                Android
              </a>
              <a
                href="https://apps.apple.com/app/thesis-generator-essay-ai/id6739264844"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <AppStoreLogo size={14} weight="duotone" />
                iOS
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Thesis Generator. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-400 text-sm">
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} weight="duotone" /> SOC 2 Compliant</span>
            <span className="flex items-center gap-1.5"><GlobeHemisphereWest size={16} weight="duotone" /> GDPR Ready</span>
            <span className="flex items-center gap-1.5"><Lightning size={16} weight="duotone" /> 99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

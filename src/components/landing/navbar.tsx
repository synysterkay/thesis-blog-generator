'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { LogoIcon } from '@/components/ui/logo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <LogoIcon size="sm" variant="white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Thesis Generator</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">
              Blog
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-9 bg-slate-100 rounded-lg animate-pulse" />
            ) : user ? (
              <Link href="/app">
                <Button>Go to App</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100">
          <div className="px-6 py-4 space-y-4">
            <Link 
              href="#features" 
              className="block text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#how-it-works" 
              className="block text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="#pricing" 
              className="block text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="block text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {user ? (
                <Link href="/app" className="block">
                  <Button className="w-full">Go to App</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="block">
                    <Button variant="secondary" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

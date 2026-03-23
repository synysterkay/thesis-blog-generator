'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, X } from '@phosphor-icons/react';
import { useAuth } from '@/providers/auth-provider';
import { LogoWithText } from '@/components/ui/logo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - reduced size, more spacing */}
          <Link href="/" className="mr-12">
            <LogoWithText size="md" />
          </Link>

          {/* Desktop Navigation - reordered, font-medium */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-[15px]">
              How It Works
            </Link>
            <Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-[15px]">
              Features
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-[15px]">
              Pricing
            </Link>
            <Link href="/blog" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-[15px]">
              Resources
            </Link>
          </div>

          {/* Auth Buttons - refined styling */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-slate-100 rounded-lg animate-pulse" />
            ) : user ? (
              <Link href="/app">
                <Button size="sm" className="h-9 px-5 font-semibold">Go to App</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="font-medium h-9">Log in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="h-9 px-5 font-semibold">Start Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-900"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200">
          <div className="px-6 py-4 space-y-4">
            <Link 
              href="#how-it-works" 
              className="block text-slate-600 hover:text-slate-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="#features" 
              className="block text-slate-600 hover:text-slate-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="block text-slate-600 hover:text-slate-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="block text-slate-600 hover:text-slate-900 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Resources
            </Link>
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {user ? (
                <Link href="/app" className="block">
                  <Button className="w-full font-semibold">Go to App</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="block">
                    <Button variant="secondary" className="w-full font-medium">Log in</Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full font-semibold">Start Free</Button>
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

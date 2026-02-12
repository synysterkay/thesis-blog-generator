'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings, 
  LogOut,
  Menu,
  X,
  CreditCard,
  ChevronRight,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/ui/logo';
import { toast } from 'sonner';
import { Export } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'My Theses', href: '/app/theses', icon: FileText },
  { label: 'New Thesis', href: '/app/new', icon: Plus },
  { label: 'Exports', href: '/app/exports', icon: Download },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processingExports, setProcessingExports] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, subscription, loading } = useAuth();
  const supabase = createClient();

  // Track processing exports for indicator
  useEffect(() => {
    if (!user) return;

    const fetchProcessingExports = async () => {
      const { data } = await supabase
        .from('exports')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing']);
      setProcessingExports(data?.length || 0);
    };

    fetchProcessingExports();

    // Subscribe to export changes
    const channel = supabase
      .channel('layout-exports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exports',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProcessingExports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Link href="/app" className="flex items-center gap-2">
              <LogoIcon size="lg" />
              <span className="font-bold text-lg" style={{ color: '#2560EA' }}>Thesis Generator</span>
            </Link>
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              const isExportsWithProcessing = item.href === '/app/exports' && processingExports > 0;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isExportsWithProcessing ? 'animate-pulse' : ''}`} />
                    {isExportsWithProcessing && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                    )}
                    {isExportsWithProcessing && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {isExportsWithProcessing && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-600 rounded-full">
                      {processingExports}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Subscription Status */}
          <div className="p-4 border-t border-slate-100">
            {subscription?.isActive ? (
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>{subscription.planType === 'lifetime' ? 'Lifetime' : 
                    subscription.planType === 'yearly' ? 'Pro (Yearly)' : 'Pro'} Plan</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Unlimited generations</p>
              </div>
            ) : (
              <Link href="/app/upgrade">
                <div className="p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-700">Upgrade to Pro</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Get unlimited generations</p>
                </div>
              </Link>
            )}
          </div>

          {/* User */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/app" className="flex items-center gap-2">
              <LogoIcon size="lg" />
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

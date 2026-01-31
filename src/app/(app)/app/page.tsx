'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  FileText, 
  Clock, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  BookOpen,
  Loader2,
  Play
} from 'lucide-react';
import { Thesis } from '@/types';

export default function DashboardPage() {
  const { user, subscription } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTheses = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('theses')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      setTheses(data || []);
      setLoading(false);
    };

    fetchTheses();

    // Subscribe to real-time updates for thesis status changes
    const channel = supabase
      .channel('dashboard-theses')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theses',
          filter: `user_id=eq.${user?.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('theses')
            .select('*')
            .eq('user_id', user?.id)
            .order('updated_at', { ascending: false })
            .limit(5);
          setTheses(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const stats = [
    { 
      label: 'Total Theses', 
      value: theses.length, 
      icon: FileText, 
      color: 'blue' 
    },
    { 
      label: 'This Month', 
      value: theses.filter(t => {
        const date = new Date(t.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length, 
      icon: Clock, 
      color: 'green' 
    },
    { 
      label: 'Completed', 
      value: theses.filter(t => t.status === 'completed').length, 
      icon: TrendingUp, 
      color: 'purple' 
    },
    { 
      label: subscription?.status === 'active' ? 'Unlimited' : 'Free Tier', 
      value: subscription?.status === 'active' ? '∞' : '1', 
      icon: Sparkles, 
      color: 'orange' 
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Researcher'}!
        </h1>
        <p className="text-slate-600">
          Ready to create something amazing today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/app/new">
          <Card hover className="p-6 h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Create New Thesis</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Start generating your complete academic thesis with AI
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  Get Started <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/app/theses">
          <Card hover className="p-6 h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">View All Theses</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Continue working on your existing projects
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  Browse Library <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className={`w-10 h-10 rounded-lg ${colorClasses[stat.color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Theses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Theses</h2>
          <Link href="/app/theses" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : theses.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No theses yet</h3>
            <p className="text-slate-600 mb-4">Create your first thesis to get started</p>
            <Link href="/app/new">
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                Create Thesis
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {theses.map((thesis) => (
              <Link key={thesis.id} href={`/app/thesis/${thesis.id}`}>
                <Card hover className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    thesis.status === 'completed' ? 'bg-green-100 text-green-600' :
                    thesis.status === 'generating' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {thesis.status === 'generating' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{thesis.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{thesis.academic_field || 'No field'} • {thesis.writing_style || 'Academic'}</p>
                  </div>
                  <div className="hidden sm:block">
                    {thesis.status === 'draft' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                        <Play className="w-3 h-3" /> Continue
                      </span>
                    ) : thesis.status === 'generating' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating
                      </span>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        thesis.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

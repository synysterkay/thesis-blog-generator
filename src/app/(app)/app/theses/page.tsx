'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  MagnifyingGlass, 
  Funnel,
  ArrowRight,
  Clock,
  Check,
  WarningCircle,
  SpinnerGap,
  Trash,
  DotsThreeVertical,
  Play,
  Books,
  Sparkle
} from '@phosphor-icons/react';
import { Thesis } from '@/types';
import { toast } from 'sonner';

export default function ThesesPage() {
  const { user } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    const fetchTheses = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('theses')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setTheses(data || []);
      
      // Fetch actual chapter counts for each thesis
      if (data && data.length > 0) {
        const counts: Record<string, number> = {};
        for (const thesis of data) {
          const { count } = await supabase
            .from('chapters')
            .select('*', { count: 'exact', head: true })
            .eq('thesis_id', thesis.id);
          counts[thesis.id] = count || 0;
        }
        setChapterCounts(counts);
      }
      
      setLoading(false);
    };

    fetchTheses();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('theses-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'theses',
          filter: `user_id=eq.${user?.id}`,
        },
        async () => {
          // Refetch theses on any change
          const { data } = await supabase
            .from('theses')
            .select('*')
            .eq('user_id', user?.id)
            .order('updated_at', { ascending: false });
          setTheses(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const deleteThesis = async (e: React.MouseEvent, thesisId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this thesis?')) return;
    
    setDeletingId(thesisId);
    try {
      await supabase.from('chapters').delete().eq('thesis_id', thesisId);
      const { error } = await supabase.from('theses').delete().eq('id', thesisId);
      if (error) throw error;
      
      setTheses(prev => prev.filter(t => t.id !== thesisId));
      toast.success('Thesis deleted');
    } catch {
      toast.error('Failed to delete thesis');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTheses = theses.filter((thesis) => {
    const matchesSearch = thesis.title.toLowerCase().includes(search.toLowerCase()) ||
                         thesis.academic_field?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || thesis.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={16} weight="bold" className="text-slate-900" />;
      case 'generating':
        return <SpinnerGap size={16} className="text-slate-900 animate-spin" />;
      case 'exported':
        return <Check size={16} weight="bold" className="text-slate-900" />;
      default:
        return <Clock size={16} weight="duotone" className="text-slate-600" />;
    }
  };

  return (
    <div className="relative min-h-screen max-w-6xl mx-auto">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-slate-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-slate-100/50 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
            <Books size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              My Library
            </h1>
            <p className="text-sm text-slate-600">{filteredTheses.length} project{filteredTheses.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link href="/app/new">
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-sm h-9">
            <Plus size={14} weight="bold" className="mr-1.5" />
            New Thesis
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search theses..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-slate-900 placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'draft', 'generating', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Theses List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTheses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-8 bg-white border border-slate-200 text-center"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} weight="duotone" className="text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {search || filter !== 'all' ? 'No matching theses' : 'No theses yet'}
          </h3>
          <p className="text-xs text-slate-600 mb-4 max-w-xs mx-auto">
            {search || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first AI-powered thesis'
            }
          </p>
          {!search && filter === 'all' && (
            <Link href="/app/new">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus size={14} weight="bold" className="mr-1.5" />
                Create Thesis
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTheses.map((thesis, index) => (
            <motion.div
              key={thesis.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link href={`/app/thesis/${thesis.id}`}>
                <div className="group relative rounded-xl p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteThesis(e, thesis.id)}
                    disabled={deletingId === thesis.id}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all z-10"
                  >
                    {deletingId === thesis.id ? (
                      <SpinnerGap size={14} className="animate-spin" />
                    ) : (
                      <Trash size={14} />
                    )}
                  </button>

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 text-slate-900">
                      {thesis.status === 'generating' ? (
                        <SpinnerGap size={16} className="animate-spin" />
                      ) : (
                        <FileText size={16} weight="duotone" />
                      )}
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-900">
                      {statusIcon(thesis.status)}
                      {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-medium text-slate-900 mb-1.5 line-clamp-2 group-hover:text-slate-600 transition-colors">
                    {thesis.title}
                  </h3>
                  
                  <p className="text-xs text-slate-600 mb-3 line-clamp-1 flex-1">
                    {thesis.topic || `${thesis.academic_field || 'General'} • ${thesis.writing_style || 'Academic'}`}
                  </p>

                  {/* Progress bar */}
                  {thesis.total_chapters > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-600">
                          {chapterCounts[thesis.id] ?? 0}/{thesis.total_chapters} chapters
                        </span>
                        <span className="text-[10px] font-medium text-slate-600">
                          {Math.round(((chapterCounts[thesis.id] ?? 0) / thesis.total_chapters) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            thesis.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-900'
                          }`}
                          style={{ width: `${Math.min(((chapterCounts[thesis.id] ?? 0) / thesis.total_chapters) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                      {new Date(thesis.updated_at).toLocaleDateString()}
                    </span>
                    {thesis.status === 'draft' ? (
                      <span className="text-[10px] text-slate-900 font-medium flex items-center gap-1">
                        <Play size={10} weight="fill" /> Continue
                      </span>
                    ) : thesis.status === 'generating' ? (
                      <span className="text-[10px] text-slate-900 font-medium flex items-center gap-1">
                        <SpinnerGap size={10} className="animate-spin" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 flex items-center gap-1">
                        <Sparkle size={10} weight="duotone" />
                        {chapterCounts[thesis.id] ?? thesis.total_chapters ?? 0} chapters
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

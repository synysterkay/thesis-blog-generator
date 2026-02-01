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
  Search, 
  Filter,
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  MoreVertical,
  Play,
  Library,
  Sparkles
} from 'lucide-react';
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
        return <Check className="w-4 h-4 text-green-600" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'exported':
        return <Check className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative min-h-screen max-w-6xl mx-auto">
      {/* Subtle Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-purple-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              My Library
            </h1>
            <p className="text-sm text-slate-500">{filteredTheses.length} project{filteredTheses.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link href="/app/new">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-sm h-9">
            <Plus className="mr-1.5 w-3.5 h-3.5" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search theses..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'draft', 'generating', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          className="rounded-xl p-8 bg-slate-50 border border-slate-200 text-center"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            {search || filter !== 'all' ? 'No matching theses' : 'No theses yet'}
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
            {search || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first AI-powered thesis'
            }
          </p>
          {!search && filter === 'all' && (
            <Link href="/app/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-1.5 w-3.5 h-3.5" />
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
                <div className="group relative rounded-xl p-4 bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteThesis(e, thesis.id)}
                    disabled={deletingId === thesis.id}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all z-10"
                  >
                    {deletingId === thesis.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      thesis.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : thesis.status === 'generating' 
                        ? 'bg-blue-100 text-blue-600' 
                        : thesis.status === 'exported' 
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {thesis.status === 'generating' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      thesis.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : thesis.status === 'generating' 
                        ? 'bg-blue-50 text-blue-600' 
                        : thesis.status === 'exported' 
                        ? 'bg-violet-50 text-violet-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {statusIcon(thesis.status)}
                      {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-medium text-slate-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {thesis.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mb-3 line-clamp-1 flex-1">
                    {thesis.topic || `${thesis.academic_field || 'General'} • ${thesis.writing_style || 'Academic'}`}
                  </p>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(thesis.updated_at).toLocaleDateString()}
                    </span>
                    {thesis.status === 'draft' ? (
                      <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                        <Play className="w-2.5 h-2.5" /> Continue
                      </span>
                    ) : thesis.status === 'generating' ? (
                      <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
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

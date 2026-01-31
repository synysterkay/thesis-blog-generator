'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Play
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My Theses</h1>
          <p className="text-slate-600">Manage and continue your thesis projects</p>
        </div>
        <Link href="/app/new">
          <Button>
            <Plus className="mr-2 w-4 h-4" />
            New Thesis
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search theses..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'generating', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Theses List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTheses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">
            {search || filter !== 'all' ? 'No matching theses' : 'No theses yet'}
          </h3>
          <p className="text-slate-600 mb-4">
            {search || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first thesis to get started'
            }
          </p>
          {!search && filter === 'all' && (
            <Link href="/app/new">
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                Create Thesis
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTheses.map((thesis) => (
            <Link key={thesis.id} href={`/app/thesis/${thesis.id}`}>
              <Card hover className="p-5 h-full flex flex-col group relative">
                {/* Delete button */}
                <button
                  onClick={(e) => deleteThesis(e, thesis.id)}
                  disabled={deletingId === thesis.id}
                  className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all z-10"
                >
                  {deletingId === thesis.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    thesis.status === 'completed' ? 'bg-green-100' :
                    thesis.status === 'generating' ? 'bg-blue-100' :
                    thesis.status === 'exported' ? 'bg-purple-100' :
                    'bg-slate-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      thesis.status === 'completed' ? 'text-green-600' :
                      thesis.status === 'generating' ? 'text-blue-600' :
                      thesis.status === 'exported' ? 'text-purple-600' :
                      'text-slate-600'
                    }`} />
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    thesis.status === 'completed' ? 'bg-green-100 text-green-700' :
                    thesis.status === 'generating' ? 'bg-blue-100 text-blue-700' :
                    thesis.status === 'exported' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {statusIcon(thesis.status)}
                    {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                  </span>
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                  {thesis.title}
                </h3>
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {thesis.topic || `${thesis.academic_field || 'General'} • ${thesis.writing_style || 'Academic'}`}
                </p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {new Date(thesis.updated_at).toLocaleDateString()}
                  </span>
                  {thesis.status === 'draft' ? (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Play className="w-3 h-3" /> Continue
                    </span>
                  ) : thesis.status === 'generating' ? (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> In Progress
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {thesis.total_chapters || 0} chapters
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

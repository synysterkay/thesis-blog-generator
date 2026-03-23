'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Sparkle,
  ArrowRight,
  SpinnerGap,
  Play,
  Clock,
  Lightning,
  CheckCircle,
  BookOpen,
  ChatCircle,
  CaretRight,
  Export as ExportIcon,
  WarningCircle,
  Trash
} from '@phosphor-icons/react';
import { Thesis, Export } from '@/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, subscription } = useAuth();
  const router = useRouter();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const supabase = createClient();

  // Fetch exports
  const fetchExports = async () => {
    try {
      const res = await fetch('/api/export/background');
      if (res.ok) {
        const data = await res.json();
        setExports(data.exports || []);
      }
    } catch (err) {
      console.error('Failed to fetch exports:', err);
    }
  };

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

      // Auto-redirect first-time users to thesis creation
      if (!data || data.length === 0) {
        router.push('/app/new');
        return;
      }
      
      // Fetch actual chapter counts
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
    fetchExports();

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

    // Subscribe to export changes
    const exportsChannel = supabase
      .channel('dashboard-exports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exports',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          // Show notification for completed exports
          if (payload.eventType === 'UPDATE' && payload.new) {
            const exportRecord = payload.new as Export;
            if (exportRecord.status === 'completed') {
              toast.success(`Export ready: ${exportRecord.thesis_title}`, {
                description: `Your ${exportRecord.format.toUpperCase()} is ready to download`,
                action: {
                  label: 'Download',
                  onClick: () => handleDownload(exportRecord.id),
                },
              });
            } else if (exportRecord.status === 'failed') {
              toast.error(`Export failed: ${exportRecord.thesis_title}`, {
                description: exportRecord.error_message || 'Please try again',
              });
            }
          }
          fetchExports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(exportsChannel);
    };
  }, [user, supabase]);

  // Download handler
  const handleDownload = async (exportId: string) => {
    try {
      const response = await fetch(`/api/export/download/${exportId}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'export';
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  // Delete handler
  const handleDeleteExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/export/download/${exportId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      toast.success('Export deleted');
      fetchExports();
    } catch (err) {
      toast.error('Failed to delete export');
    }
  };

  const isPro = subscription?.status === 'active';
  
  // Get the most recent active thesis (draft or generating)
  const activeThesis = theses.find(t => t.status === 'draft' || t.status === 'generating');
  const completedTheses = theses.filter(t => t.status === 'completed');
  
  // Calculate insights
  const totalWords = theses.reduce((acc, t) => acc + (t.total_words || 0), 0);
  const avgChapters = theses.length > 0 
    ? Math.round(theses.reduce((acc, t) => acc + (t.total_chapters || 0), 0) / theses.length) 
    : 0;
  // ~250 words/hour for academic writing → hours saved
  const hoursSaved = Math.round(totalWords / 250);

  // Time since last edit
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      <motion.div 
        className="max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Minimal Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-slate-600 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-xl font-medium text-slate-900 mt-1">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
          </h1>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TIER 1: Hero Action - Continue or Create */}
            <motion.div variants={itemVariants}>
              {loading ? (
                <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ) : activeThesis ? (
                // Continue Working Card
                <Link href={`/app/thesis/${activeThesis.id}`}>
                  <div className="group relative rounded-2xl p-6 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {activeThesis.status === 'generating' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-medium">
                              <SpinnerGap size={12} className="animate-spin" />
                              Generating
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-medium">
                              <Clock size={12} weight="duotone" />
                              In Progress
                            </span>
                          )}
                          <span className="text-xs text-slate-600">
                            {getTimeAgo(activeThesis.updated_at)}
                          </span>
                        </div>
                        
                        <h2 className="text-lg font-medium text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">
                          {activeThesis.title}
                        </h2>
                        
                        <p className="text-sm text-slate-600 mb-1">
                          {activeThesis.total_chapters || 0} chapters • {activeThesis.academic_field || 'Academic'} • {activeThesis.writing_style || 'Formal'}
                        </p>
                        <p className="text-xs text-slate-600 mb-4">
                          APA 7 • University-ready
                        </p>
                        
                        {/* Progress indicator - based on chapters, not words */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all bg-slate-900"
                              style={{ width: `${activeThesis.total_chapters ? Math.min(((activeThesis.outline?.chapters?.length || 0) / activeThesis.total_chapters) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">
                            {activeThesis.outline?.chapters?.length || 0}/{activeThesis.total_chapters || 0} chapters
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                          <Play size={16} weight="fill" className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {activeThesis.status === 'generating' ? 'View Progress' : 'Continue Writing'}
                      </span>
                      <ArrowRight size={16} className="text-slate-900 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ) : (
                // Create New Card
                <Link href="/app/new">
                  <div className="group relative rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-900/80 text-xs font-medium mb-3">
                          <Lightning size={12} weight="fill" />
                          AI-Powered
                        </div>
                        
                        <h2 className="text-lg font-medium text-slate-900 mb-1">
                          Create New Thesis
                        </h2>
                        
                        <p className="text-sm text-slate-600 mb-4">
                          Generate a complete academic thesis in minutes
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>APA 7</span>
                          <span>•</span>
                          <span>MLA</span>
                          <span>•</span>
                          <span>Chicago</span>
                        </div>
                      </div>
                      
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Plus size={20} className="text-slate-900" />
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        Get Started
                      </span>
                      <ArrowRight size={16} className="text-slate-900 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>

            {/* Submission-Ready Theses */}
            {completedTheses.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-600">Submission-Ready</h3>
                  <Link href="/app/theses" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1">
                    View all <CaretRight size={12} />
                  </Link>
                </div>
                
                <div className="space-y-2">
                  {completedTheses.slice(0, 3).map((thesis) => (
                    <Link key={thesis.id} href={`/app/thesis/${thesis.id}`}>
                      <div className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <CheckCircle size={16} weight="duotone" className="text-slate-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-600 transition-colors">
                            {thesis.title}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {thesis.total_words?.toLocaleString() || 0} words • {chapterCounts[thesis.id] ?? thesis.total_chapters ?? 0} chapters
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions Row */}
            {activeThesis && (
              <motion.div variants={itemVariants}>
                <Link href="/app/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Plus size={16} className="text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-600">Start another thesis</span>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right Column - AI Assistant & Insights */}
          <div className="space-y-6">
            
            {/* AI Assistant Panel */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl p-5 bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ChatCircle size={14} weight="duotone" className="text-slate-900" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">AI Assistant</span>
                </div>
                
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {activeThesis 
                    ? `Ready to help with "${activeThesis.title.slice(0, 30)}${activeThesis.title.length > 30 ? '...' : ''}"`
                    : 'Create a thesis and I\'ll help you write, refine, and perfect it.'
                  }
                </p>
                
                {activeThesis ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                        Suggested
                      </span>
                    </div>
                    <Link href={`/app/thesis/${activeThesis.id}`}>
                      <Button size="sm" variant="secondary" className="w-full justify-start text-xs h-8">
                        <Sparkle size={12} weight="duotone" className="mr-2" />
                        Generate next chapter
                      </Button>
                    </Link>
                    <Link href="/app/new">
                      <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-8 text-slate-600">
                        <Plus size={12} className="mr-2" />
                        New thesis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/app/new">
                    <Button size="sm" className="w-full text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white">
                      <Lightning size={12} weight="fill" className="mr-2" />
                      Create Thesis
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Insights Panel - Replace Stats */}
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl p-5 bg-white border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-4">Insights</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Total written</span>
                    <span className="text-sm font-medium text-slate-900">
                      {totalWords.toLocaleString()} words
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Hours saved</span>
                    <span className="text-sm font-medium text-slate-900">
                      ~{hoursSaved}h of writing
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Avg. chapters</span>
                    <span className="text-sm font-medium text-slate-900">
                      {avgChapters} per thesis
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Completed</span>
                    <span className="text-sm font-medium text-slate-900">
                      {completedTheses.length} submission-ready
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Formatting</span>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">APA</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">MLA</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">Chicago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pro Banner */}
            {!isPro && (
              <motion.div variants={itemVariants}>
                <Link href="/app/upgrade">
                  <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkle size={16} weight="duotone" />
                      <span className="text-xs font-medium text-slate-600">Pro Plan</span>
                    </div>
                    <p className="text-sm font-medium mb-1">Unlimited theses</p>
                    <p className="text-xs text-slate-600 mb-3">
                      All chapters • Priority generation
                    </p>
                    <div className="flex items-center text-xs font-medium">
                      Upgrade <ArrowRight size={12} className="ml-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Exports Panel */}
            {exports.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="rounded-2xl p-5 bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ExportIcon size={16} className="text-slate-600" />
                      <h3 className="text-sm font-medium text-slate-600">Exports</h3>
                    </div>
                    {exports.filter(e => e.status === 'pending' || e.status === 'processing').length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                        <SpinnerGap size={10} className="animate-spin" />
                        Processing
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {exports.slice(0, 5).map((exp) => (
                      <div 
                        key={exp.id} 
                        className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-slate-100 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center bg-slate-100`}>
                          {exp.status === 'completed' ? (
                            <CheckCircle size={12} weight="duotone" className="text-slate-900" />
                          ) : exp.status === 'failed' ? (
                            <WarningCircle size={12} className="text-red-400" />
                          ) : (
                            <SpinnerGap size={12} className="text-slate-900 animate-spin" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-600 truncate">
                            {exp.thesis_title}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {exp.format.toUpperCase()} • {exp.file_size ? `${(exp.file_size / 1024).toFixed(0)} KB` : getTimeAgo(exp.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {exp.status === 'completed' && (
                            <button
                              onClick={() => handleDownload(exp.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                              title="Download"
                            >
                              <ExportIcon size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExport(exp.id)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Academic Standards */}
            <motion.div variants={itemVariants}>
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} weight="duotone" className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-600">Academic Standards</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  All theses follow university formatting guidelines and citation standards. Export in PDF, DOCX, or LaTeX.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

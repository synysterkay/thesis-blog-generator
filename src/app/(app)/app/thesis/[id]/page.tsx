'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Play,
  Download,
  FileText,
  Check,
  Loader2,
  Clock,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Lock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Thesis, Chapter } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface ChapterContent {
  subchapters?: string[];
  text?: string;
  currentOutlineIndex?: number;
  totalOutlines?: number;
}

export default function ThesisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const fetchThesis = async () => {
      if (!user) return;

      // Fetch thesis
      const { data: thesisData, error: thesisError } = await supabase
        .from('theses')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('user_id', user.id)
        .single();

      if (thesisError || !thesisData) {
        toast.error('Thesis not found');
        router.push('/app/theses');
        return;
      }

      setThesis(thesisData);

      // Fetch chapters
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('thesis_id', resolvedParams.id)
        .order('chapter_number', { ascending: true });

      setChapters(chaptersData || []);
      setLoading(false);
    };

    fetchThesis();

    // Subscribe to real-time updates
    const thesisChannel = supabase
      .channel(`thesis-${resolvedParams.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'theses',
          filter: `id=eq.${resolvedParams.id}`,
        },
        (payload) => {
          setThesis(payload.new as Thesis);
        }
      )
      .subscribe();

    const chaptersChannel = supabase
      .channel(`chapters-${resolvedParams.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `thesis_id=eq.${resolvedParams.id}`,
        },
        async () => {
          // Refetch chapters on any change
          const { data } = await supabase
            .from('chapters')
            .select('*')
            .eq('thesis_id', resolvedParams.id)
            .order('chapter_number', { ascending: true });
          setChapters(data || []);
          
          // Auto-expand the chapter that is currently generating
          const generatingChapter = data?.find(c => c.status === 'generating');
          if (generatingChapter) {
            setExpandedChapters(prev => new Set([...prev, generatingChapter.id]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(thesisChannel);
      supabase.removeChannel(chaptersChannel);
    };
  }, [user, resolvedParams.id, supabase, router]);

  const startGeneration = async () => {
    if (!thesis) return;
    setGenerating(true);

    // Immediately update UI to show generating state
    setThesis({ ...thesis, status: 'generating' });
    
    // Update chapters to show pending/generating state immediately
    if (chapters.length > 0) {
      setChapters(chapters.map((ch, idx) => ({
        ...ch,
        status: idx === 0 ? 'generating' : (ch.status === 'locked' ? 'locked' : 'pending')
      })));
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId: thesis.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Revert UI state on error
        setThesis({ ...thesis, status: 'draft' });
        throw new Error(data.error || 'Generation failed');
      }

      toast.success('Generation started! You can leave this page - we\'ll continue in the background.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start generation';
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const deleteThesis = async () => {
    if (!thesis) return;
    if (!confirm('Are you sure you want to delete this thesis? This action cannot be undone.')) return;
    
    setDeleting(true);
    try {
      // Delete chapters first (cascade should handle this but being explicit)
      await supabase.from('chapters').delete().eq('thesis_id', thesis.id);
      
      // Delete thesis
      const { error } = await supabase.from('theses').delete().eq('id', thesis.id);
      if (error) throw error;
      
      toast.success('Thesis deleted');
      router.push('/app');
    } catch (error) {
      toast.error('Failed to delete thesis');
    } finally {
      setDeleting(false);
    }
  };

  const toggleChapterExpanded = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const parseChapterContent = (content: string | null): ChapterContent => {
    if (!content) return { subchapters: [], text: '' };
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      // Handle both old format (string[]) and new format (object[] with title)
      let subchapters: string[] = [];
      if (parsed.subchaptersWithVisuals && Array.isArray(parsed.subchaptersWithVisuals)) {
        // New format: extract titles from objects
        subchapters = parsed.subchaptersWithVisuals.map((s: { title: string }) => s.title);
      } else if (parsed.subchapters && Array.isArray(parsed.subchapters)) {
        // Could be string[] or object[]
        subchapters = parsed.subchapters.map((s: string | { title: string }) => 
          typeof s === 'string' ? s : s.title
        );
      }
      return {
        subchapters,
        text: parsed.text || (typeof content === 'string' && !content.startsWith('{') ? content : ''),
        currentOutlineIndex: parsed.currentOutlineIndex,
        totalOutlines: parsed.totalOutlines,
      };
    } catch {
      return { subchapters: [], text: content || '' };
    }
  };

  const exportThesis = async (format: 'pdf' | 'docx' | 'latex') => {
    if (!thesis) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId: thesis.id, format }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${thesis.title}.${format === 'latex' ? 'tex' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  const chapterStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'editing':
        return <FileText className="w-4 h-4 text-orange-600" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!thesis) return null;

  const completedChapters = chapters.filter(c => c.status === 'completed').length;
  const lockedChapters = chapters.filter(c => c.status === 'locked').length;
  const totalChapters = chapters.length || thesis.total_chapters;
  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/app/theses')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Theses
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{thesis.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>{thesis.academic_field || 'General'}</span>
              <span>•</span>
              <span className="capitalize">{thesis.writing_style}</span>
              <span>•</span>
              <span>{thesis.language}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {thesis.status === 'draft' ? (
              <>
                <Button onClick={startGeneration} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={deleteThesis} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : thesis.status === 'generating' ? (
              <Button variant="secondary" disabled>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Generating...
              </Button>
            ) : null}

            {(thesis.status === 'completed' || thesis.status === 'exported') && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => exportThesis('pdf')}>
                  <Download className="mr-2 w-4 h-4" />
                  PDF
                </Button>
                <Button variant="ghost" onClick={() => exportThesis('docx')}>
                  DOCX
                </Button>
                <Button variant="ghost" onClick={() => exportThesis('latex')}>
                  LaTeX
                </Button>
                <Button variant="ghost" onClick={deleteThesis} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      {thesis.status !== 'draft' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                {thesis.status === 'generating' ? 'Generating Your Thesis...' : 'Generation Progress'}
              </h3>
              <p className="text-sm text-slate-600">
                {thesis.status === 'generating' ? (
                  <>
                    {completedChapters === 0 ? (
                      'Starting generation, please wait...'
                    ) : (
                      `${completedChapters} of ${totalChapters - lockedChapters} chapters completed`
                    )}
                  </>
                ) : (
                  `${completedChapters} of ${totalChapters} chapters completed`
                )}
              </p>
              {thesis.status === 'generating' && (
                <p className="text-xs text-blue-600 mt-1">
                  ✨ You can leave this page - generation continues in the background
                </p>
              )}
            </div>
            <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} />
          
          {/* Current generating chapter indicator */}
          {thesis.status === 'generating' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {(() => {
                const generatingChapter = chapters.find(c => c.status === 'generating');
                if (generatingChapter) {
                  const genContent = parseChapterContent(generatingChapter.content as string | null);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating: <strong>Chapter {generatingChapter.chapter_number}: {generatingChapter.title}</strong></span>
                      </div>
                      {genContent.currentOutlineIndex !== undefined && genContent.subchapters && (
                        <div className="ml-6 text-xs text-slate-500">
                          Writing section {generatingChapter.chapter_number}.{genContent.currentOutlineIndex + 1}: {genContent.subchapters[genContent.currentOutlineIndex]}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing chapters...</span>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}

      {/* Chapters */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Chapters</h2>
        
        {chapters.length === 0 && thesis.status === 'generating' ? (
          // Show skeleton loading while chapters are being created
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
            <p className="text-center text-sm text-slate-500 mt-4">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Creating chapter structure...
            </p>
          </div>
        ) : chapters.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No chapters yet</h3>
            <p className="text-slate-600 mb-4">
              Start generating to create your thesis chapters
            </p>
            {thesis.status === 'draft' && (
              <Button onClick={startGeneration} disabled={generating}>
                <Play className="mr-2 w-4 h-4" />
                Start Generation
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const chapterContent = parseChapterContent(chapter.content as string | null);
              const isExpanded = expandedChapters.has(chapter.id);
              const hasSubchapters = chapterContent.subchapters && chapterContent.subchapters.length > 0;
              
              return (
                <Card 
                  key={chapter.id} 
                  className={`overflow-hidden ${chapter.status === 'locked' ? 'opacity-75 bg-slate-50' : ''}`}
                >
                  <div 
                    className={`p-4 flex items-center gap-4 ${chapter.status === 'completed' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                    onClick={() => {
                      if (chapter.status === 'completed') {
                        router.push(`/app/thesis/${thesis.id}/chapter/${chapter.id}`);
                      } else if (hasSubchapters && chapter.status !== 'locked') {
                        toggleChapterExpanded(chapter.id);
                      }
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      chapter.status === 'completed' ? 'bg-green-100' :
                      chapter.status === 'generating' ? 'bg-blue-100' :
                      chapter.status === 'editing' ? 'bg-orange-100' :
                      chapter.status === 'locked' ? 'bg-slate-200' :
                      'bg-slate-100'
                    }`}>
                      {chapterStatusIcon(chapter.status)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                      {chapter.status === 'locked' ? (
                        <p className="text-sm text-slate-500">Upgrade to unlock this chapter</p>
                      ) : chapter.status === 'generating' ? (
                        <p className="text-sm text-blue-600">
                          {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                            <>Generating outline {chapterContent.currentOutlineIndex + 1} of {chapterContent.totalOutlines}...</>
                          ) : (
                            <>Generating content...</>
                          )}
                        </p>
                      ) : chapter.word_count > 0 ? (
                        <p className="text-sm text-slate-500">{chapter.word_count.toLocaleString()} words</p>
                      ) : hasSubchapters ? (
                        <p className="text-sm text-slate-500">{chapterContent.subchapters?.length} outlines</p>
                      ) : null}
                    </div>

                    {hasSubchapters && chapter.status !== 'locked' && chapter.status !== 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleChapterExpanded(chapter.id); }}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </button>
                    )}

                    {chapter.status === 'completed' && (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    
                    {chapter.status === 'locked' && (
                      <Link href="/app/upgrade" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="gap-1">
                          <Sparkles className="w-3 h-3" />
                          Unlock
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Subchapters list - always show when generating, otherwise only when expanded */}
                  {((isExpanded || chapter.status === 'generating') && hasSubchapters && chapter.status !== 'locked') && (
                    <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                      <div className="pt-3 space-y-2">
                        {chapterContent.subchapters?.map((sub, idx) => {
                          // Default to 0 if currentOutlineIndex is undefined but chapter is generating
                          const currentIdx = chapterContent.currentOutlineIndex ?? (chapter.status === 'generating' ? 0 : -1);
                          const isCurrentlyGenerating = chapter.status === 'generating' && idx === currentIdx;
                          const isCompleted = chapter.status === 'generating' && idx < currentIdx;
                          const isPending = chapter.status === 'generating' && idx > currentIdx;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-3 text-sm py-1 px-2 rounded ${
                                isCurrentlyGenerating ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                            >
                              <span className={`w-8 font-mono ${
                                isCurrentlyGenerating ? 'text-blue-600 font-medium' :
                                isCompleted ? 'text-green-600' :
                                'text-slate-400'
                              }`}>
                                {chapter.chapter_number}.{idx + 1}
                              </span>
                              <span className={`flex-1 ${
                                isCurrentlyGenerating ? 'text-blue-700 font-medium' :
                                isCompleted ? 'text-slate-700' :
                                isPending ? 'text-slate-400' :
                                'text-slate-600'
                              }`}>
                                {sub}
                              </span>
                              {isCurrentlyGenerating && (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              )}
                              {isCompleted && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                              {isPending && (
                                <Clock className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {chapter.status === 'generating' && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <Progress 
                        value={chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines 
                          ? ((chapterContent.currentOutlineIndex) / chapterContent.totalOutlines) * 100 
                          : 10
                        } 
                        className="h-1 mt-3" 
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                          <>Writing: <strong>{chapter.chapter_number}.{chapterContent.currentOutlineIndex + 1}</strong> {chapterContent.subchapters?.[chapterContent.currentOutlineIndex]}</>
                        ) : (
                          <>Starting generation...</>
                        )}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
            
            {/* Show upgrade banner if there are locked chapters */}
            {lockedChapters > 0 && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {lockedChapters} chapters locked
                    </h3>
                    <p className="text-sm text-slate-600">
                      Upgrade to Pro to generate all chapters and unlock the full thesis
                    </p>
                  </div>
                  <Link href="/app/upgrade">
                    <Button>
                      <Sparkles className="mr-2 w-4 h-4" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Topic */}
      {thesis.topic && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Research Topic</h3>
          <p className="text-slate-600">{thesis.topic}</p>
        </Card>
      )}
    </div>
  );
}

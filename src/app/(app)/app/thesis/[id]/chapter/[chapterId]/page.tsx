'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Check,
  Clock,
  Lock,
  Table as TableIcon,
  BarChart3,
  Pencil,
  Eye,
  Save,
  RotateCcw,
  Wand2,
  Shield
} from 'lucide-react';
import { Thesis, Chapter } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ChartRenderer, ChartThemeSelector, ChartTheme } from '@/components/thesis/chart-renderer';
import { TableRenderer, TableStyleSelector, TableStyle } from '@/components/thesis/table-renderer';

// Extended Thesis type with copy protection
interface ThesisWithProtection extends Thesis {
  copy_protected?: boolean;
  expires_at?: string | null;
}

// Random style selectors for variety
const TABLE_STYLES: TableStyle[] = ['academic', 'modern', 'minimal', 'striped', 'bordered'];
const CHART_THEMES: ChartTheme[] = ['academic', 'colorful', 'monochrome', 'warm', 'cool'];

function getRandomTableStyle(): TableStyle {
  return TABLE_STYLES[Math.floor(Math.random() * TABLE_STYLES.length)];
}

function getRandomChartTheme(): ChartTheme {
  return CHART_THEMES[Math.floor(Math.random() * CHART_THEMES.length)];
}

interface ChapterContent {
  subchapters?: string[];
  subchaptersWithVisuals?: Array<{ title: string; hasTable?: boolean; hasChart?: boolean }>;
  text?: string;
  tables?: Array<{ caption: string; columns: string[]; rows: string[][]; source: string; section?: string }>;
  charts?: Array<{ caption: string; type: string; labels: string[]; data: number[]; xlabel?: string; ylabel?: string; source?: string; section?: string }>;
}

export default function ChapterPage({ 
  params 
}: { 
  params: Promise<{ id: string; chapterId: string }> 
}) {
  const resolvedParams = use(params);
  const [thesis, setThesis] = useState<ThesisWithProtection | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [parsedContent, setParsedContent] = useState<ChapterContent>({});
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Visual styles - randomized on each chapter load for variety
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => getRandomTableStyle());
  const [chartTheme, setChartTheme] = useState<ChartTheme>(() => getRandomChartTheme());
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Calculate word count
  const wordCount = editedContent.split(/\s+/).filter(w => w.length > 0).length;

  const parseChapterContent = useCallback((content: string | null): ChapterContent => {
    if (!content) return {};
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      let subchapters: string[] = [];
      if (parsed.subchaptersWithVisuals && Array.isArray(parsed.subchaptersWithVisuals)) {
        subchapters = parsed.subchaptersWithVisuals.map((s: { title?: string } | string) => 
          typeof s === 'string' ? s : (s?.title || 'Untitled Section')
        );
      } else if (parsed.subchapters && Array.isArray(parsed.subchapters)) {
        subchapters = parsed.subchapters.map((s: string | { title?: string }) => 
          typeof s === 'string' ? s : (s?.title || 'Untitled Section')
        );
      }
      return {
        ...parsed,
        subchapters,
      };
    } catch {
      return { text: content };
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, plan_type')
        .eq('user_id', user.id)
        .single();
      
      const userIsPremium = subscription?.status === 'active' && 
        subscription?.plan_type && subscription.plan_type !== 'free';
      setIsPremium(userIsPremium);

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

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('thesis_id', resolvedParams.id)
        .order('chapter_number', { ascending: true });

      setChapters(chaptersData || []);

      const currentChapter = chaptersData?.find(c => c.id === resolvedParams.chapterId);
      
      if (!currentChapter) {
        toast.error('Chapter not found');
        router.push(`/app/thesis/${resolvedParams.id}`);
        return;
      }

      setChapter(currentChapter);
      
      const parsed = parseChapterContent(currentChapter.content as string | null);
      setParsedContent(parsed);
      const textContent = parsed.text || '';
      setEditedContent(textContent);
      setOriginalContent(textContent);
      
      setLoading(false);
    };

    fetchData();

    const chapterChannel = supabase
      .channel(`chapter-${resolvedParams.chapterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chapters',
          filter: `id=eq.${resolvedParams.chapterId}`,
        },
        (payload) => {
          if (!isEditing) {
            setChapter(payload.new as Chapter);
            const parsed = parseChapterContent((payload.new as Chapter).content as string | null);
            setParsedContent(parsed);
            const textContent = parsed.text || '';
            setEditedContent(textContent);
            setOriginalContent(textContent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chapterChannel);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, resolvedParams.id, resolvedParams.chapterId, supabase, router, isEditing, parseChapterContent]);

  // Save content to database
  const saveContent = useCallback(async (content: string) => {
    if (!chapter) return;
    
    setIsSaving(true);
    
    try {
      const existingContent = parseChapterContent(chapter.content as string | null);
      const newWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      const updatedContent = JSON.stringify({
        subchapters: existingContent.subchapters,
        subchaptersWithVisuals: existingContent.subchaptersWithVisuals,
        text: content,
        tables: existingContent.tables,
        charts: existingContent.charts,
      });
      
      const { error } = await supabase
        .from('chapters')
        .update({
          content: updatedContent,
          word_count: newWordCount,
          status: 'editing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapter.id);
      
      if (error) throw error;
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setOriginalContent(content);
      
      setChapter(prev => prev ? {
        ...prev,
        word_count: newWordCount,
        status: 'editing',
      } : null);
      
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [chapter, supabase, parseChapterContent]);

  // Auto-save with debounce
  const handleContentChange = useCallback((newContent: string) => {
    setEditedContent(newContent);
    setHasUnsavedChanges(newContent !== originalContent);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (newContent !== originalContent) {
      saveTimeoutRef.current = setTimeout(() => {
        saveContent(newContent);
      }, 2000);
    }
  }, [originalContent, saveContent]);

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveContent(editedContent);
    toast.success('Changes saved');
  };

  const handleRevert = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setEditedContent(originalContent);
    setHasUnsavedChanges(false);
    toast.info('Reverted to last saved version');
  };

  const handleMarkComplete = async () => {
    if (!chapter) return;
    
    if (hasUnsavedChanges) {
      await saveContent(editedContent);
    }
    
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status: 'completed' })
        .eq('id', chapter.id);
      
      if (error) throw error;
      
      setChapter(prev => prev ? { ...prev, status: 'completed' } : null);
      setIsEditing(false);
      toast.success('Chapter marked as complete');
    } catch (error) {
      console.error('Failed to mark complete:', error);
      toast.error('Failed to update status');
    }
  };

  const handleRegenerate = async () => {
    if (!chapter || !thesis) return;
    
    const confirmed = window.confirm(
      'This will regenerate the entire chapter content. Your current edits will be lost. Continue?'
    );
    
    if (!confirmed) return;
    
    setIsRegenerating(true);
    
    try {
      const response = await fetch('/api/regenerate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thesisId: thesis.id,
          chapterId: chapter.id,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Regeneration failed');
      }
      
      toast.success('Chapter regeneration started');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getAdjacentChapters = () => {
    if (!chapter || chapters.length === 0) return { prev: null, next: null };
    
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    
    return { prev, next };
  };

  const { prev, next } = getAdjacentChapters();

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!thesis || !chapter) return null;

  const content = parsedContent;

  // Chapter is still generating
  if (chapter.status === 'generating' || chapter.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/app/thesis/${thesis.id}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Thesis
          </button>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h1>
          <p className="text-slate-600">{thesis.title}</p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {chapter.status === 'generating' ? 'Generating Chapter...' : 'Waiting to Generate...'}
              </h3>
              <p className="text-sm text-slate-500">
                {chapter.status === 'generating' 
                  ? 'AI is writing this chapter. This may take a minute or two.'
                  : 'This chapter is queued for generation.'}
              </p>
            </div>
            
            {content.subchapters && content.subchapters.length > 0 && (
              <div className="mt-4 text-left w-full max-w-md">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Outline</p>
                <div className="space-y-1">
                  {content.subchapters.map((sub, idx) => (
                    <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="text-slate-400">{chapter.chapter_number}.{idx + 1}</span>
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Chapter is locked
  if (chapter.status === 'locked') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/app/thesis/${thesis.id}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Thesis
          </button>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h1>
        </div>

        <Card className="p-12 text-center bg-slate-50">
          <Lock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Chapter Locked</h3>
          <p className="text-slate-600 mb-6">
            Upgrade to Pro to unlock this chapter and access all thesis features.
          </p>
          <Link href="/app/upgrade">
            <Button>Upgrade to Pro</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Chapter is completed or editing - show content with edit capability
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => {
            if (hasUnsavedChanges) {
              const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
              if (!confirmed) return;
            }
            router.push(`/app/thesis/${thesis.id}`);
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Thesis
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Chapter {chapter.chapter_number}: {chapter.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>{(isEditing ? wordCount : chapter.word_count)?.toLocaleString() || 0} words</span>
              <span>•</span>
              {isSaving ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-3 h-3" />
                  Unsaved changes
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              ) : chapter.status === 'completed' ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  Completed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500">
                  <Pencil className="w-3 h-3" />
                  Editing
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevert}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Revert
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-1" />
                  )}
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="flex items-center justify-between mb-6">
        {prev ? (
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
                if (!confirmed) return;
              }
              router.push(`/app/thesis/${thesis.id}/chapter/${prev.id}`);
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Chapter {prev.chapter_number}: {prev.title}</span>
            <span className="sm:hidden">Previous</span>
          </button>
        ) : (
          <div />
        )}
        
        {next && next.status !== 'locked' ? (
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
                if (!confirmed) return;
              }
              router.push(`/app/thesis/${thesis.id}/chapter/${next.id}`);
            }}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <span className="hidden sm:inline">Chapter {next.chapter_number}: {next.title}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : next?.status === 'locked' ? (
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Chapter {next.chapter_number} (Locked)</span>
          </span>
        ) : (
          <div />
        )}
      </div>

      {/* Chapter Content */}
      <Card className="p-8 mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Editing mode • Markdown supported</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[600px] font-mono text-sm leading-relaxed resize-y"
              placeholder="Start writing your chapter content..."
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Auto-saves 2 seconds after you stop typing
              </p>
              {chapter.status === 'editing' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkComplete}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        ) : content.text || editedContent ? (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{editedContent || content.text || ''}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p>No content generated yet</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Start Writing
            </Button>
          </div>
        )}
      </Card>

      {/* Tables */}
      {parsedContent.tables && Array.isArray(parsedContent.tables) && parsedContent.tables.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-900">Tables</h3>
            </div>
            <TableStyleSelector 
              value={tableStyle} 
              onChange={setTableStyle} 
            />
          </div>
          <div className="space-y-8">
            {parsedContent.tables!.map((table, idx) => (
              <TableRenderer
                key={idx}
                table={table}
                style={tableStyle}
                tableNumber={idx + 1}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      {parsedContent.charts && Array.isArray(parsedContent.charts) && parsedContent.charts.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Charts</h3>
            </div>
            <ChartThemeSelector 
              value={chartTheme} 
              onChange={setChartTheme} 
            />
          </div>
          <div className="space-y-8">
            {parsedContent.charts!.map((chart, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                <ChartRenderer
                  chart={chart as any}
                  theme={chartTheme}
                  height={350}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        {prev && (prev.status === 'completed' || prev.status === 'editing') ? (
          <Button
            variant="secondary"
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
                if (!confirmed) return;
              }
              router.push(`/app/thesis/${thesis.id}/chapter/${prev.id}`);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Chapter
          </Button>
        ) : (
          <div />
        )}
        
        {next && (next.status === 'completed' || next.status === 'editing') ? (
          <Button
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
                if (!confirmed) return;
              }
              router.push(`/app/thesis/${thesis.id}/chapter/${next.id}`);
            }}
          >
            Next Chapter
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
                if (!confirmed) return;
              }
              router.push(`/app/thesis/${thesis.id}`);
            }}
          >
            Back to Overview
          </Button>
        )}
      </div>

      {/* Copy Protection Banner for Free Users */}
      {!isPremium && thesis?.copy_protected && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700">Copy/paste disabled</span>
            <Link href="/app/upgrade" className="text-xs font-medium text-amber-800 underline">
              Upgrade to unlock
            </Link>
          </div>
        </div>
      )}

      {/* Copy Protection CSS for Free Users */}
      {!isPremium && thesis?.copy_protected && (
        <style jsx global>{`
          .prose {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          .prose::selection {
            background: transparent;
          }
        `}</style>
      )}
    </div>
  );
}

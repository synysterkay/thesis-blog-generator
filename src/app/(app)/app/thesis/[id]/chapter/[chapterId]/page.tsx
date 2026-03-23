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
  CaretLeft,
  CaretRight,
  SpinnerGap,
  FileText,
  Check,
  Clock,
  Lock,
  Table as TableIcon,
  ChartBar,
  PencilSimple,
  Eye,
  FloppyDisk,
  ArrowCounterClockwise,
  MagicWand,
  ShieldCheck
} from '@phosphor-icons/react';
import { Thesis, Chapter } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ChartRenderer, ChartThemeSelector, ChartTheme } from '@/components/thesis/chart-renderer';
import { TableRenderer, TableStyleSelector, TableStyle } from '@/components/thesis/table-renderer';
import { ExportPaywall } from '@/components/export-paywall';
import { ReferralDownsell } from '@/components/referral-downsell';
import { trackClarityEvent } from '@/lib/clarity';

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
  const [hasExportUnlock, setHasExportUnlock] = useState(false);
  const [exportPaywallOpen, setExportPaywallOpen] = useState(false);
  const [referralDownsellOpen, setReferralDownsellOpen] = useState(false);
  const [paywallClosedOnce, setPaywallClosedOnce] = useState(false);
  
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

      // Check for export unlock for this thesis
      const { data: exportUnlock } = await supabase
        .from('export_unlocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('thesis_id', resolvedParams.id)
        .maybeSingle();
      setHasExportUnlock(!!exportUnlock);

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

  // Right-click & keyboard copy prevention for free users
  useEffect(() => {
    if (isPremium || hasExportUnlock) return;
    const prevent = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'a' || e.key === 'u')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('keydown', preventKeys);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('keydown', preventKeys);
    };
  }, [isPremium, hasExportUnlock]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap size={32} className="animate-spin text-slate-900" />
      </div>
    );
  }

  if (!thesis || !chapter) return null;

  const content = parsedContent;
  const canAccessFull = isPremium || hasExportUnlock;

  // Chapter is still generating
  if (chapter.status === 'generating' || chapter.status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/app/thesis/${thesis.id}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={16} />
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
              <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-slate-300 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {chapter.status === 'generating' ? 'Generating Chapter...' : 'Waiting to Generate...'}
              </h3>
              <p className="text-sm text-slate-600">
                {chapter.status === 'generating' 
                  ? 'AI is writing this chapter. This may take a minute or two.'
                  : 'This chapter is queued for generation.'}
              </p>
            </div>
            
            {content.subchapters && content.subchapters.length > 0 && (
              <div className="mt-4 text-left w-full max-w-md">
                <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Outline</p>
                <div className="space-y-1">
                  {content.subchapters.map((sub, idx) => (
                    <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="text-slate-600">{chapter.chapter_number}.{idx + 1}</span>
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
            <ArrowLeft size={16} />
            Back to Thesis
          </button>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h1>
        </div>

        <Card className="p-12 text-center bg-white">
          <Lock size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Chapter Locked</h3>
          <p className="text-slate-600 mb-6">
            Unlock to access this chapter and download your complete thesis.
          </p>
          <Button onClick={() => { trackClarityEvent('locked_chapter_page_unlock_click'); setExportPaywallOpen(true); }}>Unlock & Download</Button>
        </Card>

        <ExportPaywall
          isOpen={exportPaywallOpen}
          onClose={() => {
            setExportPaywallOpen(false);
            if (!paywallClosedOnce) {
              setPaywallClosedOnce(true);
              setTimeout(() => setReferralDownsellOpen(true), 300);
            }
          }}
          thesisTitle={thesis?.title || ''}
          thesisId={resolvedParams.id}
          expiresAt={thesis?.expires_at ? new Date(thesis.expires_at) : null}
        />
        <ReferralDownsell
          isOpen={referralDownsellOpen}
          onClose={() => setReferralDownsellOpen(false)}
        />
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
          <ArrowLeft size={16} />
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
                <span className="flex items-center gap-1 text-slate-900">
                  <SpinnerGap size={12} className="animate-spin" />
                  Saving...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="flex items-center gap-1 text-slate-600">
                  <Clock size={12} />
                  Unsaved changes
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1 text-slate-900">
                  <Check size={12} />
                  Saved
                </span>
              ) : chapter.status === 'completed' ? (
                <span className="flex items-center gap-1 text-slate-900">
                  <Check size={16} />
                  Completed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-600">
                  <PencilSimple size={12} />
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
                  <ArrowCounterClockwise size={16} className="mr-1" />
                  Revert
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <Eye size={16} className="mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  <FloppyDisk size={16} className="mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <>
                {canAccessFull && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <SpinnerGap size={16} className="mr-1 animate-spin" />
                      ) : (
                        <MagicWand size={16} className="mr-1" />
                      )}
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <PencilSimple size={16} className="mr-1" />
                      Edit
                    </Button>
                  </>
                )}
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
            <CaretLeft size={16} />
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
            <CaretRight size={16} />
          </button>
        ) : next?.status === 'locked' ? (
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Lock size={16} />
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
            <div className="flex items-center justify-between text-sm text-slate-600">
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
              <p className="text-xs text-slate-600">
                Auto-saves 2 seconds after you stop typing
              </p>
              {chapter.status === 'editing' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkComplete}
                >
                  <Check size={16} className="mr-1" />
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        ) : content.text || editedContent ? (
          <div className="relative">
            {/* Visible portion */}
            <div className={`prose max-w-none ${!canAccessFull ? 'chapter-protected' : ''}`}>
              <ReactMarkdown>{(() => {
                const fullText = (editedContent || content.text || '')
                  .split('\n')
                  .filter(line => !/^\s*(table|figure)\s+\d+[.:]\s/i.test(line.trim()))
                  .join('\n');
                if (canAccessFull) return fullText;
                // Show first ~300 words for free users
                const words = fullText.split(/\s+/);
                return words.slice(0, 300).join(' ');
              })()}</ReactMarkdown>
            </div>

            {/* Blurred remainder + paywall overlay for free users */}
            {!canAccessFull && (editedContent || content.text || '').split(/\s+/).length > 300 && (
              <div className="relative mt-0">
                <div className="prose max-w-none text-sm text-slate-600 leading-relaxed select-none blur-[6px] pointer-events-none" aria-hidden="true">
                  <ReactMarkdown>{(() => {
                    const fullText = (editedContent || content.text || '')
                      .split('\n')
                      .filter(line => !/^\s*(table|figure)\s+\d+[.:]\s/i.test(line.trim()))
                      .join('\n');
                    const words = fullText.split(/\s+/);
                    return words.slice(300, 600).join(' ');
                  })()}</ReactMarkdown>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                  <div className="text-center">
                    <Lock size={32} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-900 font-semibold mb-1">Unlock Full Chapter</p>
                    <p className="text-slate-600 text-sm mb-4 max-w-xs">
                      Get full access to read, edit, and export your entire thesis
                    </p>
                    <button
                      onClick={() => { trackClarityEvent('chapter_unlock_click'); setExportPaywallOpen(true); }}
                      className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-slate-900 rounded-xl text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      <Lock size={14} />
                      Unlock to read &amp; download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-600 py-8">
            <FileText size={48} className="mx-auto text-slate-600 mb-4" />
            <p>No content generated yet</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setIsEditing(true)}
            >
              <PencilSimple size={16} className="mr-2" />
              Start Writing
            </Button>
          </div>
        )}
      </Card>

      {/* Tables */}
      {canAccessFull && parsedContent.tables && Array.isArray(parsedContent.tables) && parsedContent.tables.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-slate-900" />
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
      {canAccessFull && parsedContent.charts && Array.isArray(parsedContent.charts) && parsedContent.charts.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChartBar size={20} className="text-slate-900" />
              <h3 className="font-semibold text-slate-900">Charts</h3>
            </div>
            <ChartThemeSelector 
              value={chartTheme} 
              onChange={setChartTheme} 
            />
          </div>
          <div className="space-y-8">
            {parsedContent.charts!.map((chart, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg">
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
            <CaretLeft size={16} className="mr-2" />
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
            <CaretRight size={16} className="ml-2" />
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

      {/* Export Paywall */}
      <ExportPaywall
        isOpen={exportPaywallOpen}
        onClose={() => {
          setExportPaywallOpen(false);
          if (!paywallClosedOnce) {
            setPaywallClosedOnce(true);
            setTimeout(() => setReferralDownsellOpen(true), 300);
          }
        }}
        thesisTitle={thesis?.title || ''}
        thesisId={resolvedParams.id}
        expiresAt={thesis?.expires_at ? new Date(thesis.expires_at) : null}
      />

      {/* Referral Downsell */}
      <ReferralDownsell
        isOpen={referralDownsellOpen}
        onClose={() => setReferralDownsellOpen(false)}
      />

      {/* Copy Protection Banner for Free Users */}
      {!canAccessFull && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <ShieldCheck size={16} className="text-slate-600" />
            <span className="text-xs text-slate-600">Copy/paste disabled</span>
            <button onClick={() => setExportPaywallOpen(true)} className="text-xs font-medium text-slate-900 underline">
              Unlock full access
            </button>
          </div>
        </div>
      )}

      {/* Copy Protection + Right-click Prevention for Free Users */}
      {!canAccessFull && (
        <style jsx global>{`
          .chapter-protected {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          .chapter-protected::selection {
            background: transparent;
          }
        `}</style>
      )}
    </div>
  );
}

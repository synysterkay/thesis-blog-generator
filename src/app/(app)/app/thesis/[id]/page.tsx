'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { PDFExporter } from '@/components/thesis/pdf-exporter';
import { PDFEditor } from '@/components/thesis/pdf-editor';
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
  Trash2,
  Bell,
  Edit
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

// Request notification permission
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Send browser notification
const sendBrowserNotification = (title: string, body: string, icon?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const notification = new Notification(title, {
    body,
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'thesis-complete',
    requireInteraction: true,
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

export default function ThesisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'latex' | null>(null);
  const [showPDFExporter, setShowPDFExporter] = useState(false);
  const [showPDFEditor, setShowPDFEditor] = useState(false);
  const previousStatusRef = useRef<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Check and request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Handle thesis completion notification
  const handleThesisCompletion = useCallback((thesisTitle: string) => {
    // Show toast notification
    toast.success('🎉 Thesis generation complete!', {
      description: `"${thesisTitle}" is ready for review and export.`,
      duration: 10000,
      action: {
        label: 'View',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      },
    });

    // Send browser notification if enabled
    sendBrowserNotification(
      '🎓 Thesis Complete!',
      `Your thesis "${thesisTitle}" has been generated successfully. Click to view.`
    );

    // Play a subtle sound if available
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if autoplay blocked
    } catch {}
  }, []);

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast.success('Notifications enabled! You\'ll be notified when your thesis is complete.');
    } else {
      toast.error('Notifications blocked. Please enable them in your browser settings.');
    }
  };

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
      // Initialize previous status for completion detection
      previousStatusRef.current = thesisData.status;

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
        async (payload) => {
          const newThesis = payload.new as Thesis;
          const oldStatus = previousStatusRef.current;
          
          console.log('📡 Thesis update received:', { oldStatus, newStatus: newThesis.status });
          
          // Check if thesis just completed
          if (oldStatus === 'generating' && newThesis.status === 'completed') {
            handleThesisCompletion(newThesis.title);
            
            // Refetch chapters to ensure all are marked as completed
            const { data: updatedChapters } = await supabase
              .from('chapters')
              .select('*')
              .eq('thesis_id', resolvedParams.id)
              .order('chapter_number', { ascending: true });
            
            if (updatedChapters) {
              setChapters(updatedChapters);
            }
          }
          
          // Update previous status
          previousStatusRef.current = newThesis.status;
          setThesis(newThesis);
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

    // Polling fallback: Check every 5 seconds if thesis is generating
    // This ensures updates are shown even if real-time subscription misses events
    const pollInterval = setInterval(async () => {
      // Get current thesis state from ref to avoid stale closure
      const { data: currentThesis } = await supabase
        .from('theses')
        .select('status')
        .eq('id', resolvedParams.id)
        .single();
      
      if (currentThesis && previousStatusRef.current === 'generating') {
        // If we thought it was generating, check if it completed
        if (currentThesis.status === 'completed') {
          console.log('🔄 Polling detected completion');
          
          // Fetch full thesis data
          const { data: fullThesis } = await supabase
            .from('theses')
            .select('*')
            .eq('id', resolvedParams.id)
            .single();
          
          if (fullThesis) {
            handleThesisCompletion(fullThesis.title);
            setThesis(fullThesis);
            previousStatusRef.current = 'completed';
          }
          
          // Fetch updated chapters
          const { data: updatedChapters } = await supabase
            .from('chapters')
            .select('*')
            .eq('thesis_id', resolvedParams.id)
            .order('chapter_number', { ascending: true });
          
          if (updatedChapters) {
            setChapters(updatedChapters);
          }
        }
      }
    }, 5000);

    return () => {
      supabase.removeChannel(thesisChannel);
      supabase.removeChannel(chaptersChannel);
      clearInterval(pollInterval);
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

      toast.success('Generation started! Please stay on this page until complete.');
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
        subchapters = parsed.subchaptersWithVisuals.map((s: { title?: string } | string) => 
          typeof s === 'string' ? s : (s?.title || 'Untitled Section')
        );
      } else if (parsed.subchapters && Array.isArray(parsed.subchapters)) {
        // Could be string[] or object[]
        subchapters = parsed.subchapters.map((s: string | { title?: string }) => 
          typeof s === 'string' ? s : (s?.title || 'Untitled Section')
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
    if (!thesis) {
      toast.error('No thesis to export');
      return;
    }

    // For PDF, use client-side generation
    if (format === 'pdf') {
      setExportModalOpen(false);
      setShowPDFExporter(true);
      return;
    }

    setExporting(format);
    
    try {
      const response = await fetch('/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId: thesis.id, format }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${thesis.title || 'thesis'}.${format === 'latex' ? 'tex' : format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file directly
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} downloaded!`);
      setExportModalOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(null);
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
  
  // Helper to safely get current outline title
  const getOutlineTitle = (subchapters: string[] | undefined, index: number): string => {
    if (!subchapters || index < 0 || index >= subchapters.length) return 'Section';
    const item = subchapters[index];
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'title' in item) return (item as { title: string }).title;
    return 'Section';
  };

  // Calculate granular progress based on outlines, not just chapters
  const calculateProgress = () => {
    const nonLockedChapters = chapters.filter(c => c.status !== 'locked');
    if (nonLockedChapters.length === 0) return 0;
    
    // If thesis is generating but no chapters started yet, show 1%
    if (thesis.status === 'generating' && nonLockedChapters.every(c => c.status === 'pending')) {
      return 1;
    }
    
    // Calculate total outlines across all chapters for more granular progress
    let totalOutlinesAcrossAll = 0;
    let completedOutlinesAcrossAll = 0;
    
    for (const chapter of nonLockedChapters) {
      // Parse chapter content to get outline info
      let chapterTotalOutlines = 1; // Default to 1 for chapters without outlines (intro/conclusion/refs)
      let chapterCompletedOutlines = 0;
      
      try {
        const content = typeof chapter.content === 'string' 
          ? JSON.parse(chapter.content) 
          : chapter.content;
        
        // Get total outlines for this chapter
        if (content?.totalOutlines && content.totalOutlines > 0) {
          chapterTotalOutlines = content.totalOutlines;
        } else if (content?.subchapters?.length > 0) {
          chapterTotalOutlines = content.subchapters.length;
        } else if (content?.subchaptersWithVisuals?.length > 0) {
          chapterTotalOutlines = content.subchaptersWithVisuals.length;
        }
        
        // Calculate completed outlines based on status
        if (chapter.status === 'completed') {
          chapterCompletedOutlines = chapterTotalOutlines;
        } else if (chapter.status === 'generating') {
          // Currently generating - use currentOutlineIndex
          const currentIdx = content?.currentOutlineIndex ?? 0;
          // Add 0.5 to show we're partway through current outline
          chapterCompletedOutlines = currentIdx + 0.5;
        }
        // pending chapters contribute 0 completed outlines
        
      } catch {
        // If parsing fails, use defaults
        if (chapter.status === 'completed') {
          chapterCompletedOutlines = 1;
        } else if (chapter.status === 'generating') {
          chapterCompletedOutlines = 0.5;
        }
      }
      
      totalOutlinesAcrossAll += chapterTotalOutlines;
      completedOutlinesAcrossAll += chapterCompletedOutlines;
    }
    
    if (totalOutlinesAcrossAll === 0) return 0;
    
    // Calculate percentage, minimum 1% if generating, max 99% until fully complete
    const rawProgress = (completedOutlinesAcrossAll / totalOutlinesAcrossAll) * 100;
    
    // Ensure we show at least 2% once generation has started
    if (thesis.status === 'generating' && rawProgress < 2) {
      return 2;
    }
    
    // Cap at 99% until thesis status is actually completed
    if (thesis.status === 'generating' && rawProgress >= 100) {
      return 99;
    }
    
    return Math.round(rawProgress);
  };
  
  const overallProgress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/app/theses')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Theses
        </button>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">{thesis.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{thesis.academic_field || 'General'}</span>
              <span>•</span>
              <span className="capitalize">{thesis.writing_style}</span>
              <span>•</span>
              <span>{thesis.language}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {thesis.status === 'draft' ? (
              <>
                <Button size="sm" onClick={startGeneration} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1.5 w-3.5 h-3.5" />
                      Generate
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteThesis} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : thesis.status === 'generating' ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  <Loader2 className="mr-1.5 w-3.5 h-3.5 animate-spin" />
                  Generating...
                </Button>
                {!notificationsEnabled && 'Notification' in window && Notification.permission !== 'denied' && (
                  <Button variant="outline" size="sm" onClick={enableNotifications} title="Get notified when complete">
                    <Bell className="mr-1.5 w-3.5 h-3.5" />
                    Notify Me
                  </Button>
                )}
                {notificationsEnabled && (
                  <Button variant="ghost" size="sm" disabled className="text-green-600">
                    <Bell className="mr-1.5 w-3.5 h-3.5" />
                    On
                  </Button>
                )}
              </div>
            ) : null}

            {(thesis.status === 'completed' || thesis.status === 'exported') && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setExportModalOpen(true)}>
                  <Download className="mr-1.5 w-3.5 h-3.5" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteThesis} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      {thesis.status !== 'draft' && (
        <Card className="p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {thesis.status === 'generating' ? 'Generating Your Thesis...' : 'Generation Progress'}
              </h3>
              <p className="text-xs text-slate-500">
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
            </div>
            <span className="text-xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
          
          {/* Current generating chapter indicator */}
          {thesis.status === 'generating' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              {(() => {
                const generatingChapter = chapters.find(c => c.status === 'generating');
                if (generatingChapter) {
                  const genContent = parseChapterContent(generatingChapter.content as string | null);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating: <strong>Chapter {generatingChapter.chapter_number}: {generatingChapter.title}</strong></span>
                      </div>
                      {genContent.currentOutlineIndex !== undefined && genContent.subchapters && (
                        <div className="ml-4 text-[10px] text-slate-500">
                          Writing section {generatingChapter.chapter_number}.{genContent.currentOutlineIndex + 1}: {
                            getOutlineTitle(genContent.subchapters, genContent.currentOutlineIndex)
                          }
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Preparing chapters...</span>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}

      {/* Chapters */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Chapters</h2>
        
        {chapters.length === 0 && thesis.status === 'generating' ? (
          // Show skeleton loading while chapters are being created
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
            <p className="text-center text-xs text-slate-500 mt-3">
              <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />
              Creating chapter structure...
            </p>
          </div>
        ) : chapters.length === 0 ? (
          <Card className="p-6 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No chapters yet</h3>
            <p className="text-xs text-slate-500 mb-3">
              Start generating to create your thesis chapters
            </p>
            {thesis.status === 'draft' && (
              <Button size="sm" onClick={startGeneration} disabled={generating}>
                <Play className="mr-1.5 w-3.5 h-3.5" />
                Start Generation
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
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
                    className={`p-3 flex items-center gap-3 ${chapter.status === 'completed' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                    onClick={() => {
                      if (chapter.status === 'completed') {
                        router.push(`/app/thesis/${thesis.id}/chapter/${chapter.id}`);
                      } else if (hasSubchapters && chapter.status !== 'locked') {
                        toggleChapterExpanded(chapter.id);
                      }
                    }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      chapter.status === 'completed' ? 'bg-green-100' :
                      chapter.status === 'generating' ? 'bg-blue-100' :
                      chapter.status === 'editing' ? 'bg-orange-100' :
                      chapter.status === 'locked' ? 'bg-slate-200' :
                      'bg-slate-100'
                    }`}>
                      {chapterStatusIcon(chapter.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                      {chapter.status === 'locked' ? (
                        <p className="text-xs text-slate-500">Upgrade to unlock</p>
                      ) : chapter.status === 'generating' ? (
                        <p className="text-xs text-blue-600">
                          {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                            <>Outline {chapterContent.currentOutlineIndex + 1} of {chapterContent.totalOutlines}...</>
                          ) : (
                            <>Generating content...</>
                          )}
                        </p>
                      ) : chapter.word_count > 0 ? (
                        <p className="text-xs text-slate-500">{chapter.word_count.toLocaleString()} words</p>
                      ) : hasSubchapters ? (
                        <p className="text-xs text-slate-500">{chapterContent.subchapters?.length} outlines</p>
                      ) : null}
                    </div>

                    {hasSubchapters && chapter.status !== 'locked' && chapter.status !== 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleChapterExpanded(chapter.id); }}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </button>
                    )}

                    {chapter.status === 'completed' && (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    
                    {chapter.status === 'locked' && (
                      <Link href="/app/upgrade" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" className="gap-1 h-7 text-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          Unlock
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Subchapters list - always show when generating, otherwise only when expanded */}
                  {((isExpanded || chapter.status === 'generating') && hasSubchapters && chapter.status !== 'locked') && (
                    <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
                      <div className="pt-2 space-y-1">
                        {chapterContent.subchapters?.map((sub, idx) => {
                          // Default to 0 if currentOutlineIndex is undefined but chapter is generating
                          const currentIdx = chapterContent.currentOutlineIndex ?? (chapter.status === 'generating' ? 0 : -1);
                          const isCurrentlyGenerating = chapter.status === 'generating' && idx === currentIdx;
                          const isCompleted = chapter.status === 'generating' && idx < currentIdx;
                          const isPending = chapter.status === 'generating' && idx > currentIdx;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-2 text-xs py-0.5 px-1.5 rounded ${
                                isCurrentlyGenerating ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                            >
                              <span className={`w-6 font-mono text-[10px] ${
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
                                {typeof sub === 'string' ? sub : (sub as { title?: string })?.title || 'Section'}
                              </span>
                              {isCurrentlyGenerating && (
                                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                              )}
                              {isCompleted && (
                                <Check className="w-3 h-3 text-green-500" />
                              )}
                              {isPending && (
                                <Clock className="w-3 h-3 text-slate-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {chapter.status === 'generating' && (
                    <div className="px-3 pb-3 border-t border-slate-100">
                      <Progress 
                        value={chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines 
                          ? ((chapterContent.currentOutlineIndex) / chapterContent.totalOutlines) * 100 
                          : 10
                        } 
                        className="h-1 mt-2" 
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                          <>Writing: <strong>{chapter.chapter_number}.{chapterContent.currentOutlineIndex + 1}</strong> {getOutlineTitle(chapterContent.subchapters, chapterContent.currentOutlineIndex)}</>
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
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                      {lockedChapters} chapters locked
                    </h3>
                    <p className="text-xs text-slate-600">
                      Upgrade to Pro to generate all chapters
                    </p>
                  </div>
                  <Link href="/app/upgrade">
                    <Button size="sm">
                      <Sparkles className="mr-1.5 w-3.5 h-3.5" />
                      Upgrade
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
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Research Topic</h3>
          <p className="text-sm text-slate-600">{thesis.topic}</p>
        </Card>
      )}

      {/* Export Modal */}
      <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold text-slate-900">Export Thesis</h2>
          <p className="text-xs text-slate-500 mt-0.5">Choose your preferred format</p>
        </ModalHeader>

        {exporting ? (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-900 mb-1">
              Generating {exporting.toUpperCase()}...
            </p>
            <p className="text-xs text-slate-500 mb-4">
              This may take up to 30 seconds
            </p>
            <button
              onClick={() => setExportModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Close and wait in background
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* PDF Download Options */}
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-1 pt-1">PDF Options</p>
            
            <button
              onClick={() => exportThesis('pdf')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <Download className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600">Download PDF</h3>
                <p className="text-xs text-slate-500">Quick download with auto-generated footnotes</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => {
                setExportModalOpen(false);
                setShowPDFEditor(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Edit className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-purple-600">Edit & Download PDF</h3>
                <p className="text-xs text-slate-500">Preview and edit content before downloading</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            </button>

            {/* Other Formats */}
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide px-1 pt-3">Other Formats</p>

            <button
              onClick={() => exportThesis('docx')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600">Word (DOCX)</h3>
                <p className="text-xs text-slate-500">Full thesis with title page, TOC, chapters</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => exportThesis('latex')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600">LaTeX</h3>
                <p className="text-xs text-slate-500">Professional typesetting with full structure</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          </div>
        )}
      </Modal>

      {/* PDF Exporter (client-side) */}
      {showPDFExporter && thesis && (
        <PDFExporter
          thesis={{
            title: thesis.title,
            academic_field: thesis.academic_field || undefined,
            topic: thesis.topic || undefined,
            chapters: chapters.map(ch => ({
              chapter_number: ch.chapter_number,
              title: ch.title,
              content: ch.content,
            })),
          }}
          onComplete={() => {
            setShowPDFExporter(false);
            toast.success('PDF downloaded!');
          }}
          onError={(error) => {
            setShowPDFExporter(false);
            toast.error(`PDF generation failed: ${error}`);
          }}
        />
      )}

      {/* PDF Editor (edit before download) */}
      {showPDFEditor && thesis && (
        <PDFEditor
          thesis={{
            title: thesis.title,
            academic_field: thesis.academic_field || undefined,
            topic: thesis.topic || undefined,
            chapters: chapters.map(ch => ({
              chapter_number: ch.chapter_number,
              title: ch.title,
              content: ch.content,
            })),
          }}
          onClose={() => setShowPDFEditor(false)}
          onDownload={() => {
            setShowPDFEditor(false);
            toast.success('PDF downloaded!');
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { PDFExporter } from '@/components/thesis/pdf-exporter';
import { PDFEditor } from '@/components/thesis/pdf-editor';
import { ThesisHTMLPreview } from '@/components/thesis/thesis-html-preview';
import { ExportPaywall } from '@/components/export-paywall';
import { ReferralDownsell } from '@/components/referral-downsell';
import { ThesisExpiryTimer } from '@/components/thesis-expiry-timer';
import { trackClarityEvent } from '@/lib/clarity';
import { 
  ArrowLeft,
  Play,
  DownloadSimple,
  FileText,
  Check,
  SpinnerGap,
  Clock,
  CaretRight,
  CaretDown,
  BookOpen,
  Lock,
  Sparkle,
  Trash,
  Bell,
  PencilSimple,
  ShieldCheck,
  Eye,
  X
} from '@phosphor-icons/react';
import { Thesis, Chapter } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

// Extended Thesis type with new fields
interface ThesisWithExpiry extends Thesis {
  expires_at?: string | null;
  copy_protected?: boolean;
}

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

// Social proof messages that rotate during generation
const SOCIAL_PROOF_MESSAGES = [
  '12,847 theses generated and counting',
  'Students save an average of 47 hours',
  'Used by researchers at 200+ universities',
  'Average thesis grade: A-',
  '98% of users recommend Thesis Generator',
  'Most popular field: Computer Science',
  'Average thesis: 12,000 words in 8 minutes',
];

function SocialProofTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % SOCIAL_PROOF_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-600">
      <Sparkle size={12} className="text-slate-600 flex-shrink-0" />
      <span
        className="transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {SOCIAL_PROOF_MESSAGES[index]}
      </span>
    </div>
  );
}

// SVG animated progress ring for the generation screen
function ProgressRing({ progress, size = 120, stroke = 6 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#progressGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 tabular-nums">
          {Number.isInteger(progress) ? progress : progress.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function ThesisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const [thesis, setThesis] = useState<ThesisWithExpiry | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPaywallOpen, setExportPaywallOpen] = useState(false);
  const [referralDownsellOpen, setReferralDownsellOpen] = useState(false);
  const [paywallClosedOnce, setPaywallClosedOnce] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'latex' | null>(null);
  const [showPDFExporter, setShowPDFExporter] = useState(false);
  const [showPDFEditor, setShowPDFEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasExportUnlock, setHasExportUnlock] = useState(false);;
  const [displayProgress, setDisplayProgress] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = sessionStorage.getItem(`progress-${resolvedParams.id}`);
    return saved ? parseFloat(saved) : 0;
  });
  const previousStatusRef = useRef<string | null>(null);
  const realProgressRef = useRef(0);
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

  // Check for export unlock from URL params (after one-time purchase)
  useEffect(() => {
    if (searchParams.get('export') === 'unlocked') {
      // Refresh export unlock status from database to confirm payment was processed
      const confirmExportUnlock = async () => {
        if (!user) return;
        
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: exportUnlock } = await supabase
          .from('export_unlocks')
          .select('id')
          .eq('user_id', user.id)
          .eq('thesis_id', resolvedParams.id)
          .maybeSingle();
        
        if (exportUnlock) {
          setHasExportUnlock(true);
          toast.success('🎉 Export unlocked! You can now download your thesis.');
        } else {
          // Retry once more after another delay
          await new Promise(resolve => setTimeout(resolve, 3000));
          const { data: retryUnlock } = await supabase
            .from('export_unlocks')
            .select('id')
            .eq('user_id', user.id)
            .eq('thesis_id', resolvedParams.id)
            .maybeSingle();
          
          if (retryUnlock) {
            setHasExportUnlock(true);
            toast.success('🎉 Export unlocked! You can now download your thesis.');
          } else {
            toast.info('Processing your payment... Please refresh in a moment if export is still locked.');
          }
        }
      };
      confirmExportUnlock();
    }
  }, [searchParams, user, resolvedParams.id, supabase]);

  useEffect(() => {
    const fetchThesis = async () => {
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

      // If thesis looks stuck in generating, poke the resume endpoint to restart the chain.
      // The backend cron handles this too, but this gives instant recovery when the user views the page.
      if (thesisData.status === 'generating' && thesisData.updated_at) {
        const updatedAt = new Date(thesisData.updated_at).getTime();
        const now = Date.now();
        const STUCK_THRESHOLD_MS = 6 * 60 * 1000; // 6 minutes (> one chapter cycle)
        if (now - updatedAt > STUCK_THRESHOLD_MS) {
          console.log('⚠️ Generation may be stalled — poking resume endpoint');
          fetch('/api/generate/resume').catch(() => {});
          toast.info('Generation is resuming — please wait, your thesis is being built chapter by chapter.');
        }
      }

      // Fetch chapters
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('thesis_id', resolvedParams.id)
        .order('chapter_number', { ascending: true });

      setChapters(chaptersData || []);
      setLoading(false);

      // Auto-start generation if arriving from thesis creation
      if (searchParams.get('autostart') === 'true' && thesisData.status === 'draft') {
        // Small delay to let UI render first
        setTimeout(async () => {
          try {
            // Optimistically update UI
            setThesis({ ...thesisData, status: 'generating' });
            previousStatusRef.current = 'generating';
            if (chaptersData && chaptersData.length > 0) {
              setChapters(chaptersData.map((ch: Chapter, idx: number) => ({
                ...ch,
                status: idx === 0 ? 'generating' : (ch.status === 'locked' ? 'locked' : 'pending')
              })));
            }

            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ thesisId: thesisData.id }),
            });
            if (!response.ok) {
              const data = await response.json();
              setThesis({ ...thesisData, status: 'draft' });
              previousStatusRef.current = 'draft';
              toast.error(data.error || 'Generation failed');
            }
          } catch {
            setThesis({ ...thesisData, status: 'draft' });
            previousStatusRef.current = 'draft';
            toast.error('Failed to start generation');
          }
        }, 300);
      }
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
      if (previousStatusRef.current !== 'generating') return;

      // Refresh chapters every 5s during generation for live progress
      const { data: updatedChapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('thesis_id', resolvedParams.id)
        .order('chapter_number', { ascending: true });

      if (updatedChapters) {
        setChapters(updatedChapters);

        // Auto-expand the chapter currently generating
        const gen = updatedChapters.find(c => c.status === 'generating');
        if (gen) setExpandedChapters(prev => new Set([...prev, gen.id]));
      }

      // Check if thesis completed
      const { data: currentThesis } = await supabase
        .from('theses')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (currentThesis?.status === 'completed') {
        console.log('🔄 Polling detected completion');
        handleThesisCompletion(currentThesis.title);
        setThesis(currentThesis);
        previousStatusRef.current = 'completed';
      }
    }, 5000);

    // Full data refresh every 3 minutes to ensure UI stays in sync
    const fullRefreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing thesis data (3 min interval)');
      
      // Refetch thesis
      const { data: refreshedThesis } = await supabase
        .from('theses')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
      
      if (refreshedThesis) {
        const oldStatus = previousStatusRef.current;
        
        // Check if status changed to completed
        if (oldStatus === 'generating' && refreshedThesis.status === 'completed') {
          handleThesisCompletion(refreshedThesis.title);
        }
        
        previousStatusRef.current = refreshedThesis.status;
        setThesis(refreshedThesis);
      }
      
      // Refetch chapters
      const { data: refreshedChapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('thesis_id', resolvedParams.id)
        .order('chapter_number', { ascending: true });
      
      if (refreshedChapters) {
        setChapters(refreshedChapters);
      }
    }, 180000); // 3 minutes = 180000ms

    return () => {
      supabase.removeChannel(thesisChannel);
      supabase.removeChannel(chaptersChannel);
      clearInterval(pollInterval);
      clearInterval(fullRefreshInterval);
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

      trackClarityEvent('generation_started');
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

    // Check export permission for all formats
    if (!isPremium && !hasExportUnlock) {
      setExportModalOpen(false);
      setExportPaywallOpen(true);
      return;
    }

    // For PDF, use client-side generation
    if (format === 'pdf') {
      trackClarityEvent('export_pdf');
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
        // Handle export locked error - show paywall
        if (errorData.code === 'EXPORT_LOCKED') {
          setExportModalOpen(false);
          setExportPaywallOpen(true);
          return;
        }
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
        return <Check size={16} className="text-slate-900" />;
      case 'generating':
        return <SpinnerGap size={16} className="text-slate-900 animate-spin" />;
      case 'editing':
        return <FileText size={16} className="text-slate-600" />;
      case 'locked':
        return <Lock size={16} className="text-slate-600" />;
      default:
        return <Clock size={16} className="text-slate-600" />;
    }
  };

  // Calculate granular progress based on outlines, not just chapters
  // Must be before early returns so the useEffect below (a hook) is always called
  const calculateProgress = () => {
    if (!thesis) return 0;
    const nonLockedChapters = chapters.filter(c => c.status !== 'locked');
    if (nonLockedChapters.length === 0) return 0;
    
    // If thesis is generating but no chapters started yet, show a smooth initial ramp
    if (thesis.status === 'generating' && nonLockedChapters.every(c => c.status === 'pending')) {
      return 3;
    }
    
    // Calculate total outlines across all chapters for more granular progress
    let totalOutlinesAcrossAll = 0;
    let completedOutlinesAcrossAll = 0;
    
    for (const chapter of nonLockedChapters) {
      // Parse chapter content to get outline info
      let chapterTotalOutlines = 1;
      let chapterCompletedOutlines = 0;
      
      try {
        const content = typeof chapter.content === 'string' 
          ? JSON.parse(chapter.content) 
          : chapter.content;
        
        if (content?.totalOutlines && content.totalOutlines > 0) {
          chapterTotalOutlines = content.totalOutlines;
        } else if (content?.subchapters?.length > 0) {
          chapterTotalOutlines = content.subchapters.length;
        } else if (content?.subchaptersWithVisuals?.length > 0) {
          chapterTotalOutlines = content.subchaptersWithVisuals.length;
        }
        
        if (chapter.status === 'completed') {
          chapterCompletedOutlines = chapterTotalOutlines;
        } else if (chapter.status === 'generating') {
          const currentIdx = content?.currentOutlineIndex ?? 0;
          chapterCompletedOutlines = currentIdx + 0.5;
        }
        
      } catch {
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
    
    const rawProgress = (completedOutlinesAcrossAll / totalOutlinesAcrossAll) * 100;
    
    if (thesis.status === 'generating' && rawProgress < 5) {
      return 5;
    }
    
    if (thesis.status === 'generating' && rawProgress >= 100) {
      return 99;
    }
    
    return Math.round(rawProgress);
  };
  
  const overallProgress = calculateProgress();
  realProgressRef.current = overallProgress;

  // Smooth progress ticker — MUST be called before early returns (Rules of Hooks)
  useEffect(() => {
    // Don't overwrite sessionStorage-restored value while still loading
    if (!thesis) return;

    if (thesis.status !== 'generating') {
      setDisplayProgress(overallProgress);
      if (thesis.status === 'completed') {
        sessionStorage.removeItem(`progress-${resolvedParams.id}`);
      }
      return;
    }

    setDisplayProgress(prev => Math.max(prev, overallProgress));

    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const real = realProgressRef.current;
        const ceiling = Math.min(real + 4, 99);
        if (prev >= ceiling) return prev;
        const increment = 0.1 + Math.random() * 0.2;
        const next = Math.min(prev + increment, ceiling);
        sessionStorage.setItem(`progress-${resolvedParams.id}`, next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [thesis?.status, overallProgress, resolvedParams.id]);

  const shownProgress = thesis?.status === 'generating'
    ? Math.round(displayProgress * 10) / 10
    : overallProgress;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap size={32} className="animate-spin text-slate-900" />
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/app/theses')}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-3"
        >
          <ArrowLeft size={14} />
          Back to Theses
        </button>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 mb-1">{thesis.title}</h1>
            <div className="flex items-center gap-3 text-xs text-slate-600">
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
                      <SpinnerGap className="mr-1.5 animate-spin" size={14} />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1.5" size={14} />
                      Generate
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteThesis} disabled={deleting} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                  <Trash size={14} />
                </Button>
              </>
            ) : thesis.status === 'generating' ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  <SpinnerGap className="mr-1.5 animate-spin" size={14} />
                  Generating...
                </Button>
                {!notificationsEnabled && 'Notification' in window && Notification.permission !== 'denied' && (
                  <Button variant="outline" size="sm" onClick={enableNotifications} title="Get notified when complete">
                    <Bell className="mr-1.5" size={14} />
                    Notify Me
                  </Button>
                )}
                {notificationsEnabled && (
                  <Button variant="ghost" size="sm" disabled className="text-slate-900">
                    <Bell className="mr-1.5" size={14} />
                    On
                  </Button>
                )}
              </div>
            ) : (thesis.status === 'completed' || thesis.status === 'exported') ? (
              <div className="flex gap-2">
                {(isPremium || hasExportUnlock) && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowPreview(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                  >
                    <Eye className="mr-1.5" size={14} />
                    Preview Full Thesis
                  </Button>
                )}
              </div>
            ) : null}

          </div>
        </div>
      </div>

      {/* Expiry Timer for Free Users */}
      {!isPremium && thesis.expires_at && (
        <div className="mb-5">
          <ThesisExpiryTimer 
            expiresAt={thesis.expires_at}
          />
        </div>
      )}

      {/* Prominent Export Banner when thesis is complete - placed at top */}
      {(thesis.status === 'completed' || thesis.status === 'exported') && (
        <>
          {/* Premium users or users with export unlock - show normal export */}
          {(isPremium || hasExportUnlock) ? (
            <Card className="p-5 mb-5 bg-slate-100 border-slate-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Check size={24} className="text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">🎉 Your Thesis is Ready!</h3>
                    <p className="text-sm text-slate-600">Download your complete thesis in PDF or DOCX format</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    size="lg"
                    onClick={() => setExportModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg animate-[bounce_1s_ease-in-out_1]"
                  >
                    <DownloadSimple className="mr-2" size={20} />
                    Export Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={deleteThesis} 
                    disabled={deleting} 
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Delete thesis"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* Free users - show export banner (same positive tone as premium) */
            <Card className="p-5 mb-5 bg-slate-100 border-slate-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Check size={24} className="text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">🎉 Your Thesis is Ready!</h3>
                    <p className="text-sm text-slate-600">{chapters.filter(c => c.status === 'completed').length} chapters • {chapters.reduce((s, c) => s + (c.word_count || 0), 0).toLocaleString()} words • Ready to download</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    size="lg"
                    onClick={() => setExportPaywallOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                  >
                    <DownloadSimple className="mr-2" size={20} />
                    Download Thesis
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={deleteThesis} 
                    disabled={deleting} 
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Delete thesis"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
              {/* Trust indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} />
                  One-time: $4
                </span>
                <span>•</span>
                <span>Or Pro from $9/mo</span>
              </div>

              {/* Blurred Content Preview */}
              {(() => {
                const firstCompleted = chapters.find(c => c.status === 'completed');
                if (!firstCompleted) return null;
                const preview = parseChapterContent(firstCompleted.content as string | null);
                if (!preview.text) return null;
                return (
                  <div className="mt-4 relative rounded-xl overflow-hidden">
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed whitespace-pre-wrap select-none blur-[6px]">
                      {preview.text.slice(0, 800)}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                  </div>
                );
              })()}
            </Card>
          )}
        </>
      )}

      {/* Progress */}
      {thesis.status !== 'draft' && (
        <Card className={`mb-5 overflow-hidden ${thesis.status === 'generating' ? 'p-0' : 'p-4'}`}>
          {thesis.status === 'generating' ? (
            /* ── Immersive Generation Experience ── */
            <div className="min-h-[340px]">
              {/* Top section — ring + title */}
              <div className="flex flex-col items-center pt-8 pb-5 px-4 bg-gradient-to-b from-white/[0.03] to-transparent">
                <ProgressRing progress={shownProgress} />
                <h3 className="text-base font-semibold text-slate-900 mt-5">
                  Generating Your Thesis
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {completedChapters === 0
                    ? 'Starting generation — usually takes 5–10 minutes'
                    : `${completedChapters} of ${totalChapters - lockedChapters} chapters completed`}
                </p>
              </div>

              {/* Live word counter */}
              {chapters.some(c => c.word_count > 0) && (
                <div className="flex justify-center gap-6 pb-4 px-4">
                  <div className="text-center">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {chapters.reduce((s, c) => s + (c.word_count || 0), 0).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">words written</p>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {completedChapters}/{totalChapters - lockedChapters}
                    </span>
                    <p className="text-[10px] text-slate-600 mt-0.5">chapters done</p>
                  </div>
                </div>
              )}

              {/* Chapter timeline */}
              <div className="px-4 pb-4">
                <div className="space-y-1">
                  {chapters.filter(c => c.status !== 'locked').map((ch) => {
                    const isCompleted = ch.status === 'completed';
                    const isGenerating = ch.status === 'generating';
                    const chContent = (isGenerating || isCompleted) ? parseChapterContent(ch.content as string | null) : null;
                    const hasSections = chContent?.subchapters && chContent.subchapters.length > 0;
                    
                    return (
                      <div key={ch.id} className={`rounded-lg transition-colors ${
                        isGenerating ? 'bg-white' : ''
                      }`}>
                        {/* Chapter header */}
                        <div className="flex items-center gap-2.5 px-3 py-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-slate-100' : isGenerating ? 'bg-slate-100' : 'bg-white'
                          }`}>
                            {isCompleted ? (
                              <Check size={10} className="text-slate-900" />
                            ) : isGenerating ? (
                              <SpinnerGap size={10} className="text-slate-900 animate-spin" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${
                              isCompleted ? 'text-slate-600' : isGenerating ? 'text-slate-900 font-medium' : 'text-slate-600'
                            }`}>
                              Ch. {ch.chapter_number}: {ch.title}
                            </p>
                          </div>
                          {isCompleted && ch.word_count > 0 && (
                            <span className="text-[10px] text-slate-600 tabular-nums flex-shrink-0">
                              {ch.word_count.toLocaleString()}w
                            </span>
                          )}
                        </div>

                        {/* Section-level progress for generating chapter */}
                        {isGenerating && hasSections && (
                          <div className="px-3 pb-2 ml-7 space-y-0.5">
                            {chContent!.subchapters!.map((sub, idx) => {
                              const currentIdx = chContent!.currentOutlineIndex ?? 0;
                              const sectionDone = idx < currentIdx;
                              const sectionActive = idx === currentIdx;
                              return (
                                <div key={idx} className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded text-[10px] ${
                                  sectionActive ? 'bg-slate-100' : ''
                                }`}>
                                  {sectionDone ? (
                                    <Check size={9} className="text-emerald-400 flex-shrink-0" />
                                  ) : sectionActive ? (
                                    <SpinnerGap size={9} className="text-slate-900 animate-spin flex-shrink-0" />
                                  ) : (
                                    <Clock size={9} className="text-slate-600 flex-shrink-0" />
                                  )}
                                  <span className={`truncate ${
                                    sectionDone ? 'text-slate-600' :
                                    sectionActive ? 'text-slate-900 font-medium' :
                                    'text-slate-600'
                                  }`}>
                                    {ch.chapter_number}.{idx + 1} {typeof sub === 'string' ? sub : (sub as { title?: string })?.title || 'Section'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Section titles for completed chapter */}
                        {isCompleted && hasSections && (
                          <div className="px-3 pb-2 ml-7 space-y-0.5">
                            {chContent!.subchapters!.map((sub, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 py-0.5 px-1.5 text-[10px]">
                                <Check size={9} className="text-emerald-400 flex-shrink-0" />
                                <span className="truncate text-slate-600">
                                  {ch.chapter_number}.{idx + 1} {typeof sub === 'string' ? sub : (sub as { title?: string })?.title || 'Section'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer — social proof + stay notification */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2">
                <SocialProofTicker />
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80">
                  <Bell size={10} />
                  <span>Please stay on this page while your thesis is being generated. You&apos;ll be notified by email when complete.</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Completed / static progress bar ── */
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {overallProgress === 100 ? 'Completed' : 'Generation Progress'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {completedChapters} of {totalChapters} chapters • {chapters.reduce((s, c) => s + (c.word_count || 0), 0).toLocaleString()} words
                  </p>
                </div>
                {overallProgress === 100 
                  ? <Check size={24} className="text-emerald-400" />
                  : <span className="text-xl font-bold text-slate-900">{overallProgress}%</span>
                }
              </div>
              <Progress value={overallProgress} className="h-1.5" />
            </>
          )}
        </Card>
      )}

      {/* Thesis Complete Banner */}
      {thesis.status === 'completed' && completedChapters > 0 && completedChapters >= (totalChapters - lockedChapters) && (
        <Card className="mb-5 p-5 bg-gradient-to-r from-slate-50 to-white border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Check size={20} className="text-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Your thesis is ready!</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {completedChapters} chapters • {chapters.reduce((sum, c) => sum + (c.word_count || 0), 0).toLocaleString()} words generated
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isPremium || hasExportUnlock) ? (
                <Button size="sm" onClick={() => setExportModalOpen(true)}>
                  <DownloadSimple className="mr-1.5" size={14} />
                  Export Thesis
                </Button>
              ) : (
                <Button size="sm" onClick={() => setExportPaywallOpen(true)}>
                  <DownloadSimple className="mr-1.5" size={14} />
                  Download
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Chapters — hide during generation since progress card already shows them */}
      {thesis.status !== 'generating' && <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Chapters</h2>
        
        {chapters.length === 0 ? (
          <Card className="p-6 text-center">
            <BookOpen size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No chapters yet</h3>
            <p className="text-xs text-slate-600 mb-3">
              Start generating to create your thesis chapters
            </p>
            {thesis.status === 'draft' && (
              <Button size="sm" onClick={startGeneration} disabled={generating}>
                <Play className="mr-1.5" size={14} />
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
                  className={`overflow-hidden ${chapter.status === 'locked' ? 'opacity-75 bg-white' : ''}`}
                >
                  <div 
                    className={`p-3 flex items-center gap-3 ${
                      chapter.status === 'completed' || chapter.status === 'editing' ? 'cursor-pointer hover:bg-slate-50' :
                      chapter.status === 'locked' ? 'cursor-pointer hover:bg-slate-50' :
                      chapter.status === 'generating' || chapter.status === 'pending' ? 'cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (chapter.status === 'completed' || chapter.status === 'editing') {
                        router.push(`/app/thesis/${thesis.id}/chapter/${chapter.id}`);
                      } else if (chapter.status === 'generating' || chapter.status === 'pending') {
                        toast.info('This chapter is still generating. Please wait until it\'s complete.');
                      } else if (chapter.status === 'locked') {
                        trackClarityEvent('locked_chapter_card_click');
                        setExportPaywallOpen(true);
                      } else if (hasSubchapters && chapter.status !== 'locked') {
                        toggleChapterExpanded(chapter.id);
                      }
                    }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      chapter.status === 'completed' ? 'bg-slate-100' :
                      chapter.status === 'generating' ? 'bg-slate-100' :
                      chapter.status === 'editing' ? 'bg-orange-500/20' :
                      chapter.status === 'locked' ? 'bg-slate-100' :
                      'bg-slate-100'
                    }`}>
                      {chapterStatusIcon(chapter.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </h3>
                      {chapter.status === 'locked' ? (
                        <p className="text-xs text-slate-600">Unlock to access this chapter</p>
                      ) : chapter.status === 'generating' ? (
                        <p className="text-xs text-slate-900">
                          {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                            <>Outline {chapterContent.currentOutlineIndex + 1} of {chapterContent.totalOutlines}...</>
                          ) : (
                            <>Generating content...</>
                          )}
                        </p>
                      ) : chapter.word_count > 0 ? (
                        <>
                          <p className="text-xs text-slate-600">{chapter.word_count.toLocaleString()} words</p>
                          {chapterContent.text && (
                            <p className="text-xs text-slate-600 truncate mt-0.5 max-w-md">
                              {chapterContent.text.split(/\s+/).slice(0, 15).join(' ')}…
                            </p>
                          )}
                        </>
                      ) : hasSubchapters ? (
                        <p className="text-xs text-slate-600">{chapterContent.subchapters?.length} outlines</p>
                      ) : null}
                    </div>

                    {hasSubchapters && chapter.status !== 'locked' && chapter.status !== 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleChapterExpanded(chapter.id); }}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        {isExpanded ? <CaretDown size={16} className="text-slate-600" /> : <CaretRight size={16} className="text-slate-600" />}
                      </button>
                    )}

                    {chapter.status === 'completed' && (
                      <CaretRight size={16} className="text-slate-600" />
                    )}
                    
                    {chapter.status === 'locked' && (
                      <Button size="sm" className="gap-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); trackClarityEvent('locked_chapter_unlock_click'); setExportPaywallOpen(true); }}>
                        <Sparkle size={10} />
                        Unlock
                      </Button>
                    )}
                  </div>

                  {/* Subchapters list - always show when generating, otherwise only when expanded */}
                  {((isExpanded || chapter.status === 'generating') && hasSubchapters && chapter.status !== 'locked') && (
                    <div className="px-3 pb-3 border-t border-slate-200 bg-white">
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
                                isCurrentlyGenerating ? 'bg-slate-100 border border-slate-300' : ''
                              }`}
                            >
                              <span className={`w-6 font-mono text-[10px] ${
                                isCurrentlyGenerating ? 'text-slate-900 font-medium' :
                                isCompleted ? 'text-slate-900' :
                                'text-slate-600'
                              }`}>
                                {chapter.chapter_number}.{idx + 1}
                              </span>
                              <span className={`flex-1 ${
                                isCurrentlyGenerating ? 'text-slate-900 font-medium' :
                                isCompleted ? 'text-slate-600' :
                                isPending ? 'text-slate-600' :
                                'text-slate-600'
                              }`}>
                                {typeof sub === 'string' ? sub : (sub as { title?: string })?.title || 'Section'}
                              </span>
                              {isCurrentlyGenerating && (
                                <SpinnerGap size={12} className="text-slate-900 animate-spin" />
                              )}
                              {isCompleted && (
                                <Check size={12} className="text-slate-900" />
                              )}
                              {isPending && (
                                <Clock size={12} className="text-slate-600" />
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
                      <p className="text-[10px] text-slate-600 mt-1">
                        {chapterContent.currentOutlineIndex !== undefined && chapterContent.totalOutlines ? (
                          <>Writing: <strong>{chapter.chapter_number}.{chapterContent.currentOutlineIndex + 1}</strong> {getOutlineTitle(chapterContent.subchapters, chapterContent.currentOutlineIndex)}</>
                        ) : (
                          <>Starting generation...</>
                        )}
                      </p>

                      {/* Live Text Preview */}
                      {chapterContent.text && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                            <Eye size={10} />
                            Live Preview
                          </p>
                          <div className="relative max-h-40 overflow-hidden rounded-lg bg-white p-3">
                            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap animate-fade-in">
                              {chapterContent.text.slice(-600)}
                              <span className="inline-block w-0.5 h-3.5 bg-slate-900 ml-0.5 animate-pulse" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            
            {/* Show upgrade banner if there are locked chapters */}
            {lockedChapters > 0 && (
              <Card className="p-4 bg-white border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                      {lockedChapters} chapters locked
                    </h3>
                    <p className="text-xs text-slate-600">
                      Unlock all chapters and download your complete thesis
                    </p>
                  </div>
                  <Button size="sm" onClick={() => { trackClarityEvent('locked_banner_unlock_click'); setExportPaywallOpen(true); }}>
                    <Sparkle className="mr-1.5" size={14} />
                    Unlock
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>}

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
          <p className="text-xs text-slate-600 mt-0.5">Choose your preferred format</p>
        </ModalHeader>

        {exporting ? (
          <div className="flex flex-col items-center py-6">
            <SpinnerGap size={40} className="text-slate-900 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-900 mb-1">
              Generating {exporting.toUpperCase()}...
            </p>
            <p className="text-xs text-slate-600 mb-4">
              This may take up to 30 seconds
            </p>
            <button
              onClick={() => setExportModalOpen(false)}
              className="text-xs text-slate-600 hover:text-slate-600 underline"
            >
              Close and wait in background
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* PDF Download Options */}
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide px-1 pt-1">PDF Options</p>
            
            <button
              onClick={() => exportThesis('pdf')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <DownloadSimple size={16} className="text-slate-900" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-900">Download PDF</h3>
                <p className="text-xs text-slate-600">Quick download with auto-generated footnotes</p>
              </div>
              <CaretRight size={16} className="text-slate-600 group-hover:text-slate-900" />
            </button>

            <button
              onClick={() => {
                setExportModalOpen(false);
                setShowPDFEditor(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <PencilSimple size={16} className="text-slate-900" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-900">Edit & Download PDF</h3>
                <p className="text-xs text-slate-600">Preview and edit content before downloading</p>
              </div>
              <CaretRight size={16} className="text-slate-600 group-hover:text-slate-900" />
            </button>

            {/* Other Formats */}
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide px-1 pt-3">Other Formats</p>

            <button
              onClick={() => exportThesis('docx')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText size={16} className="text-slate-900" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-900">Word (DOCX)</h3>
                <p className="text-xs text-slate-600">Full thesis with title page, TOC, chapters</p>
              </div>
              <CaretRight size={16} className="text-slate-600 group-hover:text-slate-900" />
            </button>

            <button
              onClick={() => exportThesis('latex')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText size={16} className="text-slate-900" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-900">LaTeX</h3>
                <p className="text-xs text-slate-600">Professional typesetting with full structure</p>
              </div>
              <CaretRight size={16} className="text-slate-600 group-hover:text-slate-900" />
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

      {/* Full Thesis Preview Modal */}
      {showPreview && thesis && (
        <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            {/* Close button */}
            <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
              <h2 className="text-slate-900 font-semibold">Full Thesis Preview</h2>
              <div className="flex gap-3">
                {(isPremium || hasExportUnlock) ? (
                  <Button 
                    onClick={() => {
                      setShowPreview(false);
                      setExportModalOpen(true);
                    }}
                    className="bg-slate-100 hover:bg-slate-200"
                  >
                    <DownloadSimple className="mr-2" size={16} />
                    Export
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setShowPreview(false);
                      setExportPaywallOpen(true);
                    }}
                    className="bg-slate-100 hover:bg-slate-200"
                  >
                    <Lock className="mr-2" size={16} />
                    Unlock Export
                  </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="mr-2" size={16} />
                  Close
                </Button>
              </div>
            </div>
            
            {/* Preview content - protect copy for free users */}
            <div className={!isPremium && thesis.copy_protected ? 'thesis-content' : ''}>
              <ThesisHTMLPreview
                thesis={{
                  title: thesis.title,
                  academic_field: thesis.academic_field || undefined,
                  topic: thesis.topic || undefined,
                  chapters: chapters.filter(ch => ch.status === 'completed').map(ch => ({
                    chapter_number: ch.chapter_number,
                    title: ch.title,
                    content: ch.content,
                  })),
                }}
                showWatermark={!isPremium && !hasExportUnlock}
              />
            </div>
            
            {/* Bottom action bar */}
            <div className="max-w-4xl mx-auto mt-6 p-4 bg-white rounded-lg shadow-lg flex justify-between items-center">
              <p className="text-sm text-slate-600">
                {isPremium || hasExportUnlock 
                  ? '✓ Export enabled - Download your thesis in PDF, DOCX, or LaTeX format'
                  : '🔒 Export locked - Unlock to download your thesis'}
              </p>
              {(isPremium || hasExportUnlock) ? (
                <Button 
                  onClick={() => {
                    setShowPreview(false);
                    setExportModalOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200"
                >
                  <DownloadSimple className="mr-2" size={16} />
                  Export Now
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    setShowPreview(false);
                    setExportPaywallOpen(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200"
                >
                  <Sparkle className="mr-2" size={16} />
                  Unlock Export ($4)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Paywall for Free Users */}
      <ExportPaywall
        isOpen={exportPaywallOpen}
        onClose={() => {
          setExportPaywallOpen(false);
          // Show referral downsell on first close only
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

      {/* Copy Protection CSS for Free Users */}
      {!isPremium && thesis?.copy_protected && (
        <style jsx global>{`
          .thesis-content {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          .thesis-content::selection {
            background: transparent;
          }
        `}</style>
      )}
    </div>
  );
}

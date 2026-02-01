'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Clock,
  RefreshCw,
  XCircle,
  StopCircle,
  Edit
} from 'lucide-react';
import { Export } from '@/types';
import { toast } from 'sonner';

export default function ExportsPage() {
  const { user } = useAuth();
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const fetchExports = async () => {
    try {
      const res = await fetch('/api/export/background');
      if (res.ok) {
        const data = await res.json();
        setExports(data.exports || []);
      }
    } catch (err) {
      console.error('Failed to fetch exports:', err);
      toast.error('Failed to load exports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();

    // Subscribe to export changes for real-time updates
    const channel = supabase
      .channel('exports-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exports',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const exportRecord = payload.new as Export;
            if (exportRecord.status === 'completed') {
              toast.success(`Export ready: ${exportRecord.thesis_title}`, {
                description: `Your ${exportRecord.format.toUpperCase()} is ready to download`,
              });
            } else if (exportRecord.status === 'failed') {
              toast.error(`Export failed: ${exportRecord.thesis_title}`);
            }
          }
          fetchExports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

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
      
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (exportId: string, isCancel = false) => {
    if (!isCancel && !confirm('Are you sure you want to delete this export?')) return;
    
    setDeleting(exportId);
    try {
      const response = await fetch(`/api/export/download/${exportId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      toast.success(isCancel ? 'Export cancelled' : 'Export deleted');
      fetchExports();
    } catch (err) {
      toast.error(isCancel ? 'Failed to cancel export' : 'Failed to delete export');
    } finally {
      setDeleting(null);
    }
  };

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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getFormatIcon = (format: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-600',
      docx: 'bg-blue-100 text-blue-600',
      latex: 'bg-green-100 text-green-600',
      markdown: 'bg-purple-100 text-purple-600',
    };
    return colors[format] || 'bg-slate-100 text-slate-600';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const pendingExports = exports.filter(e => e.status === 'pending' || e.status === 'processing');
  const completedExports = exports.filter(e => e.status === 'completed');
  const failedExports = exports.filter(e => e.status === 'failed');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Export History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your recent downloads • Files are downloaded directly to your device
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchExports(); }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : exports.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No exports yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            When you export a thesis as PDF, DOCX, or LaTeX, it will appear here for download.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Processing exports */}
          {pendingExports.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Processing ({pendingExports.length})
              </h2>
              <div className="space-y-2">
                {pendingExports.map((exp) => (
                  <motion.div
                    key={exp.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFormatIcon(exp.format)}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        {exp.thesis_title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(exp.status)}`}>
                          {exp.status === 'pending' ? 'Queued' : 'Generating...'}
                        </span>
                        <span className="text-xs text-slate-500">{exp.format.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(exp.id, true)}
                        disabled={deleting === exp.id}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Cancel export"
                      >
                        {deleting === exp.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <StopCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Completed exports */}
          {completedExports.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready to Download ({completedExports.length})
              </h2>
              <div className="space-y-2">
                {completedExports.map((exp) => (
                  <motion.div
                    key={exp.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFormatIcon(exp.format)}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        {exp.thesis_title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{exp.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatFileSize(exp.file_size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(exp.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/app/thesis/${exp.thesis_id}?edit=pdf`, '_blank')}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(exp.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(exp.id)}
                        disabled={deleting === exp.id}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        {deleting === exp.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Failed exports */}
          {failedExports.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Failed ({failedExports.length})
              </h2>
              <div className="space-y-2">
                {failedExports.map((exp) => (
                  <motion.div
                    key={exp.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 truncate">
                        {exp.thesis_title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-600">
                          {exp.error_message || 'Export failed'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(exp.id)}
                      disabled={deleting === exp.id}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-100"
                    >
                      {deleting === exp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

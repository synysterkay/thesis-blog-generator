'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReferenceDocument {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

interface ReferenceUploadProps {
  thesisId?: string;
  isPremium: boolean;
  onDocumentsChange?: (documents: ReferenceDocument[]) => void;
}

export function ReferenceUpload({ thesisId, isPremium, onDocumentsChange }: ReferenceUploadProps) {
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  const maxFiles = isPremium ? 10 : 2;
  const maxSize = isPremium ? 20 * 1024 * 1024 : 10 * 1024 * 1024; // 20MB pro, 10MB free
  const acceptedTypes: Record<string, string[]> = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  };

  // Poll for document status updates
  useEffect(() => {
    const pendingDocs = documents.filter(d => d.status === 'pending' || d.status === 'processing');
    if (pendingDocs.length === 0) return;

    const interval = setInterval(async () => {
      for (const doc of pendingDocs) {
        try {
          const res = await fetch(`/api/parse/document?id=${doc.id}`);
          if (res.ok) {
            const { document: updatedDoc } = await res.json();
            setDocuments(prev => prev.map(d => 
              d.id === doc.id 
                ? { ...d, status: updatedDoc.status, errorMessage: updatedDoc.error_message }
                : d
            ));
          }
        } catch (error) {
          console.error('Status poll error:', error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [documents]);

  // Notify parent of document changes
  useEffect(() => {
    onDocumentsChange?.(documents);
  }, [documents, onDocumentsChange]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (documents.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const remainingSlots = maxFiles - documents.length;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    setUploading(true);

    for (const file of filesToUpload) {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max size: ${isPremium ? '20MB' : '5MB'}`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (thesisId) {
          formData.append('thesisId', thesisId);
        }

        const response = await fetch('/api/upload/reference', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || 'Upload failed');
          continue;
        }

        setDocuments(prev => [...prev, data.document]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
  }, [documents.length, maxFiles, maxSize, isPremium, thesisId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: maxFiles - documents.length,
    disabled: uploading || documents.length >= maxFiles,
  });

  const removeDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/upload/reference?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        toast.success('Document removed');
      } else {
        toast.error('Failed to remove document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Reference Materials (Optional)</p>
          <p className="text-blue-600 mt-1">
            Upload documents for the AI to reference during thesis generation. 
            The AI will cite and incorporate relevant information from these sources.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
          ${uploading || documents.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : documents.length >= maxFiles ? (
          <p className="text-slate-500">Maximum files reached</p>
        ) : (
          <>
            <p className="text-slate-600 font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {isPremium ? 'PDF, DOCX, TXT' : 'TXT only'} • Max {isPremium ? '20MB' : '5MB'} each
            </p>
          </>
        )}
      </div>

      {/* File limit notice for free users */}
      {!isPremium && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <Lock className="w-4 h-4" />
          <span>Free: 2 files max, 10MB each. <strong>Upgrade to Pro</strong> for up to 10 files and 20MB each.</span>
        </div>
      )}

      {/* Uploaded files list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Uploaded Files ({documents.length}/{maxFiles})
          </p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border"
            >
              <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {doc.filename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(doc.fileSize)} • {doc.fileType.toUpperCase()}
                  {doc.status === 'processing' && ' • Processing...'}
                  {doc.status === 'failed' && ` • ${doc.errorMessage || 'Failed'}`}
                </p>
              </div>
              {getStatusIcon(doc.status)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(doc.id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

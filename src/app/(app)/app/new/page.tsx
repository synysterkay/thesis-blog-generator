'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Modal } from '@/components/ui/modal';
import { ReferenceUpload } from '@/components/thesis/reference-upload';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkle, 
  FileText,
  BookOpen,
  CaretRight,
  Check,
  Lock,
  SpinnerGap,
  PencilSimple,
  MagicWand,
  Table,
  ChartBar,
  Plus,
  UploadSimple
} from '@phosphor-icons/react';
import { ACADEMIC_FIELDS, WRITING_STYLES, TARGET_LENGTHS, SUPPORTED_LANGUAGES } from '@/types';
import { canUserGenerate } from '@/lib/subscription-client';
import { toast } from 'sonner';
import Link from 'next/link';

// Types for outline visual elements
interface OutlineVisuals {
  hasTable?: boolean;
  hasChart?: boolean;
}

// Type for reference documents
interface ReferenceDocument {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

type OutlineVisualsMap = Record<string, Record<number, OutlineVisuals>>; // chapterNum -> subIndex -> visuals

const steps = [
  { id: 1, title: 'Topic', description: 'What is your thesis about?' },
  { id: 2, title: 'Details', description: 'Academic field and style' },
  { id: 3, title: 'References', description: 'Upload source materials' },
  { id: 4, title: 'Chapters', description: 'Structure your thesis' },
  { id: 5, title: 'Outlines', description: 'Subchapters for each chapter' },
  { id: 6, title: 'Review', description: 'Ready to generate' },
];

export default function NewThesisPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [chaptersGenerated, setChaptersGenerated] = useState(false);
  const [generatingOutlines, setGeneratingOutlines] = useState(false);
  const [outlinesGenerated, setOutlinesGenerated] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [editingChapterValue, setEditingChapterValue] = useState('');
  const [editingSubchapter, setEditingSubchapter] = useState<{ chapterIndex: number; subIndex: number } | null>(null);
  const [editingSubchapterValue, setEditingSubchapterValue] = useState('');
  const [showVisualHint, setShowVisualHint] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [targetLength, setTargetLength] = useState('');
  const [language, setLanguage] = useState('English');
  const [chapters, setChapters] = useState<string[]>([]);
  const [outlines, setOutlines] = useState<Record<string, string[]>>({});
  const [outlineVisuals, setOutlineVisuals] = useState<OutlineVisualsMap>({});
  const [enableTables, setEnableTables] = useState(true);
  const [enableCharts, setEnableCharts] = useState(true);
  const [newChapter, setNewChapter] = useState('');
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>([]);

  // Show coach mark on outline step — shows every time until user dismisses
  useEffect(() => {
    if (currentStep === 5 && Object.keys(outlines).length > 0 && !generatingOutlines) {
      setShowVisualHint(true);
    } else {
      setShowVisualHint(false);
    }
  }, [currentStep, outlines, generatingOutlines]);

  const router = useRouter();
  const { user, subscription } = useAuth();
  const supabase = createClient();

  const addChapter = () => {
    if (newChapter.trim()) {
      setChapters([...chapters, newChapter.trim()]);
      setNewChapter('');
    }
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const startEditingChapter = (index: number) => {
    setEditingChapterIndex(index);
    setEditingChapterValue(chapters[index]);
  };

  const saveChapterEdit = () => {
    if (editingChapterIndex !== null && editingChapterValue.trim()) {
      const newChapters = [...chapters];
      newChapters[editingChapterIndex] = editingChapterValue.trim();
      setChapters(newChapters);
    }
    setEditingChapterIndex(null);
    setEditingChapterValue('');
  };

  const cancelChapterEdit = () => {
    setEditingChapterIndex(null);
    setEditingChapterValue('');
  };

  // Subchapter editing functions
  const startEditingSubchapter = (chapterIndex: number, subIndex: number) => {
    const chapterNum = (chapterIndex + 1).toString();
    setEditingSubchapter({ chapterIndex, subIndex });
    setEditingSubchapterValue(outlines[chapterNum]?.[subIndex] || '');
  };

  const saveSubchapterEdit = () => {
    if (editingSubchapter && editingSubchapterValue.trim()) {
      const chapterNum = (editingSubchapter.chapterIndex + 1).toString();
      const newOutlines = { ...outlines };
      if (newOutlines[chapterNum]) {
        newOutlines[chapterNum] = [...newOutlines[chapterNum]];
        newOutlines[chapterNum][editingSubchapter.subIndex] = editingSubchapterValue.trim();
        setOutlines(newOutlines);
      }
    }
    setEditingSubchapter(null);
    setEditingSubchapterValue('');
  };

  const cancelSubchapterEdit = () => {
    setEditingSubchapter(null);
    setEditingSubchapterValue('');
  };

  const addSubchapter = (chapterIndex: number) => {
    const chapterNum = (chapterIndex + 1).toString();
    const newOutlines = { ...outlines };
    if (!newOutlines[chapterNum]) {
      newOutlines[chapterNum] = [];
    }
    newOutlines[chapterNum] = [...newOutlines[chapterNum], 'New Section'];
    setOutlines(newOutlines);
    // Start editing the new subchapter
    startEditingSubchapter(chapterIndex, newOutlines[chapterNum].length - 1);
  };

  const removeSubchapter = (chapterIndex: number, subIndex: number) => {
    const chapterNum = (chapterIndex + 1).toString();
    const newOutlines = { ...outlines };
    if (newOutlines[chapterNum]) {
      newOutlines[chapterNum] = newOutlines[chapterNum].filter((_, i) => i !== subIndex);
      setOutlines(newOutlines);
    }
    // Also remove any visuals for this subchapter
    const newVisuals = { ...outlineVisuals };
    if (newVisuals[chapterNum]) {
      delete newVisuals[chapterNum][subIndex];
      // Reindex remaining subchapters
      const reindexed: Record<number, OutlineVisuals> = {};
      Object.keys(newVisuals[chapterNum]).forEach((key) => {
        const idx = parseInt(key);
        if (idx > subIndex) {
          reindexed[idx - 1] = newVisuals[chapterNum][idx];
        } else {
          reindexed[idx] = newVisuals[chapterNum][idx];
        }
      });
      newVisuals[chapterNum] = reindexed;
      setOutlineVisuals(newVisuals);
    }
  };

  // Count total selected tables and charts across all outlines
  const countSelectedVisuals = () => {
    let tables = 0;
    let charts = 0;
    Object.values(outlineVisuals).forEach(chapterVisuals => {
      Object.values(chapterVisuals).forEach(visual => {
        if (visual.hasTable) tables++;
        if (visual.hasChart) charts++;
      });
    });
    return { tables, charts };
  };

  const toggleOutlineVisual = (chapterIndex: number, subIndex: number, type: 'table' | 'chart') => {
    const chapterNum = (chapterIndex + 1).toString();
    const isPremium = subscription?.isActive;
    const { tables: currentTables, charts: currentCharts } = countSelectedVisuals();
    
    // Check if this visual is currently selected
    const isCurrentlySelected = type === 'table' 
      ? outlineVisuals[chapterNum]?.[subIndex]?.hasTable 
      : outlineVisuals[chapterNum]?.[subIndex]?.hasChart;
    
    // For free users, limit to 1 table and 1 chart (can always deselect)
    if (!isPremium && !isCurrentlySelected) {
      if (type === 'table' && currentTables >= 1) {
        toast.error('Free users can add 1 table. Upgrade to Pro for unlimited tables.');
        return;
      }
      if (type === 'chart' && currentCharts >= 1) {
        toast.error('Free users can add 1 chart. Upgrade to Pro for unlimited charts.');
        return;
      }
    }
    
    setOutlineVisuals(prev => {
      const newVisuals = { ...prev };
      if (!newVisuals[chapterNum]) {
        newVisuals[chapterNum] = {};
      }
      if (!newVisuals[chapterNum][subIndex]) {
        newVisuals[chapterNum][subIndex] = {};
      }
      if (type === 'table') {
        newVisuals[chapterNum][subIndex] = {
          ...newVisuals[chapterNum][subIndex],
          hasTable: !newVisuals[chapterNum][subIndex].hasTable
        };
      } else {
        newVisuals[chapterNum][subIndex] = {
          ...newVisuals[chapterNum][subIndex],
          hasChart: !newVisuals[chapterNum][subIndex].hasChart
        };
      }
      return newVisuals;
    });
  };

  const generateOutlinesWithAI = async (showToast = true) => {
    if (!title.trim() || !field || chapters.length === 0) {
      if (showToast) {
        toast.error('Please complete previous steps first');
      }
      return;
    }

    setGeneratingOutlines(true);
    try {
      const response = await fetch('/api/generate-outlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          field,
          chapters,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outlines');
      }

      const data = await response.json();
      if (data.outlines && typeof data.outlines === 'object') {
        setOutlines(data.outlines);
        setOutlinesGenerated(true);
        if (showToast) {
          toast.success('Subchapter outlines generated!');
        }
      }
    } catch (error: any) {
      // Fallback to default outlines on error
      const defaultOutlines: Record<string, string[]> = {};
      chapters.forEach((chapter, index) => {
        defaultOutlines[(index + 1).toString()] = ['Overview', 'Main Content', 'Analysis', 'Summary'];
      });
      setOutlines(defaultOutlines);
      setOutlinesGenerated(true);
      if (showToast) {
        toast.error('Using default outlines. You can customize them below.');
      }
    } finally {
      setGeneratingOutlines(false);
    }
  };

  const generateChaptersWithAI = async (showToast = true) => {
    if (!title.trim() || !field) {
      if (showToast) {
        toast.error('Please enter a thesis title and select a field first');
      }
      return;
    }

    setGeneratingChapters(true);
    try {
      const response = await fetch('/api/generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          field,
          targetLength,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate chapters');
      }

      const data = await response.json();
      if (data.chapters && Array.isArray(data.chapters)) {
        setChapters(data.chapters);
        setChaptersGenerated(true);
        if (showToast) {
          toast.success('Chapters generated based on your thesis topic!');
        }
      }
    } catch (error: any) {
      // Fallback to default chapters on error
      setChapters([
        'Introduction',
        'Literature Review',
        'Methodology',
        'Results',
        'Discussion',
        'Conclusion',
        'References',
      ]);
      setChaptersGenerated(true);
      if (showToast) {
        toast.error('Using default chapters. You can customize them below.');
      }
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      
      // Auto-generate chapters when entering Step 4 (Chapters)
      if (nextStep === 4 && !chaptersGenerated && chapters.length === 0) {
        setCurrentStep(nextStep);
        // Generate chapters automatically
        generateChaptersWithAI(false);
      } else if (nextStep === 5 && !outlinesGenerated && Object.keys(outlines).length === 0) {
        setCurrentStep(nextStep);
        // Generate outlines automatically
        generateOutlinesWithAI(false);
      } else {
        setCurrentStep(nextStep);
      }
    } else {
      // Check subscription
      if (!user) return;
      
      const canGenerate = await canUserGenerate(user.id, supabase);
      
      if (!canGenerate) {
        setShowPaywall(true);
        return;
      }

      // Create thesis
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Prepare outlines with visual element settings
      const outlinesWithVisuals: Record<string, Array<{ title: string; hasTable?: boolean; hasChart?: boolean }>> = {};
      Object.keys(outlines).forEach(chapterNum => {
        outlinesWithVisuals[chapterNum] = outlines[chapterNum].map((title, idx) => ({
          title,
          hasTable: outlineVisuals[chapterNum]?.[idx]?.hasTable || false,
          hasChart: outlineVisuals[chapterNum]?.[idx]?.hasChart || false,
        }));
      });

      // Create thesis record
      const { data: thesis, error } = await supabase
        .from('theses')
        .insert({
          user_id: user.id,
          title,
          academic_field: field,
          degree_level: 'master', // Default to master's level
          language,
          status: 'draft',
          word_count: 0,
          page_count: 0,
          content: {},
          metadata: {
            description,
            writing_style: writingStyle,
            target_length: targetLength,
            chapter_titles: chapters,
            outlines: outlinesWithVisuals,
            enableTables,
            enableCharts,
            referenceDocumentIds: referenceDocuments.filter(d => d.status === 'completed').map(d => d.id),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Create chapter records in the chapters table
      const chapterRecords = chapters.map((chapterTitle, index) => {
        const chapterNum = (index + 1).toString();
        return {
          thesis_id: thesis.id,
          title: chapterTitle,
          chapter_number: index + 1,
          status: 'pending',
          word_count: 0,
          content: JSON.stringify({
            subchapters: outlinesWithVisuals[chapterNum] || [],
          }),
        };
      });

      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(chapterRecords);

      if (chaptersError) {
        console.error('Error creating chapters:', chaptersError);
      }

      router.push(`/app/thesis/${thesis.id}?autostart=true`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create thesis');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return title.trim().length >= 10 && description.trim().length >= 20;
      case 2:
        return field && writingStyle && targetLength;
      case 3:
        // References step is optional - always allow proceeding
        return true;
      case 4:
        return chapters.length >= 3 && !generatingChapters;
      case 5:
        return Object.keys(outlines).length > 0 && !generatingOutlines;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-3"
        >
          <ArrowLeft size={14} />
          {currentStep > 1 ? 'Previous' : 'Back'}
        </button>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create New Thesis</h1>
        <p className="text-sm text-slate-600">Let&apos;s build your academic masterpiece</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep >= step.id 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentStep > step.id ? <Check size={14} /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-10 sm:w-16 h-0.5 mx-1.5 ${
                  currentStep > step.id ? 'bg-slate-900' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="text-center" style={{ width: '60px' }}>
              <p className={`text-[10px] font-medium ${
                currentStep >= step.id ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-5 mb-5">
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                What&apos;s your thesis about?
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Give your thesis a clear, descriptive title
              </p>
              <Input
                label="Thesis Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Impact of AI on Modern Healthcare Systems"
              />
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-3">
                Describe what you want to explore in your thesis
              </p>
              <Textarea
                label="Description / Research Question"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your research question, objectives, and what you aim to discover..."
                rows={4}
              />
            </div>

            <Select
              label="Language"
              value={language}
              onChange={(value) => setLanguage(value)}
              placeholder="Select language"
              options={SUPPORTED_LANGUAGES.map((lang) => ({ value: lang.value, label: lang.label }))}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                Academic Details
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Tell us about your academic field and preferences
              </p>
              
              <div className="space-y-3">
                <Select
                  label="Academic Field"
                  value={field}
                  onChange={(value) => setField(value)}
                  placeholder="Select your field"
                  options={ACADEMIC_FIELDS.map((f) => ({ value: f, label: f }))}
                />

                <Select
                  label="Writing Style"
                  value={writingStyle}
                  onChange={(value) => setWritingStyle(value)}
                  placeholder="Select writing style"
                  options={WRITING_STYLES.map((style) => ({ value: style.value, label: style.label }))}
                />

                <Select
                  label="Target Length"
                  value={targetLength}
                  onChange={(value) => setTargetLength(value)}
                  placeholder="Select target length"
                  options={TARGET_LENGTHS.map((length) => ({ value: length.value, label: length.label }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reference Materials */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                Reference Materials
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Upload documents that the AI will use as sources for your thesis (optional)
              </p>
              
              <ReferenceUpload 
                isPremium={subscription?.isActive || false}
                onDocumentsChange={setReferenceDocuments}
              />
            </div>
          </div>
        )}

        {/* Step 4: Chapters */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-base font-semibold text-slate-900">
                  Thesis Structure
                </h2>
                {chapters.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => generateChaptersWithAI(true)}
                    disabled={generatingChapters || !title.trim() || !field}
                    className="flex items-center gap-1.5 h-7 text-xs"
                  >
                    {generatingChapters ? (
                      <SpinnerGap size={12} className="animate-spin" />
                    ) : (
                      <MagicWand size={12} />
                    )}
                    {generatingChapters ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {generatingChapters 
                  ? 'AI is generating chapters based on your thesis topic...'
                  : 'Chapters generated by AI. Click to edit or drag to reorder.'}
              </p>

              {/* Loading state while generating */}
              {generatingChapters && chapters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-slate-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkle size={24} className="text-slate-900 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-900">AI is generating chapters...</p>
                    <p className="text-xs text-slate-600 max-w-xs">{title}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chapters list */}
              {chapters.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 bg-white rounded-lg group"
                    >
                      <span className="w-5 h-5 bg-slate-100 text-slate-900 rounded text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      {editingChapterIndex === index ? (
                        <div className="flex-1 flex items-center gap-1.5">
                          <Input
                            value={editingChapterValue}
                            onChange={(e) => setEditingChapterValue(e.target.value)}
                            className="flex-1 h-7 text-sm"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') saveChapterEdit();
                              if (e.key === 'Escape') cancelChapterEdit();
                            }}
                          />
                          <Button size="sm" onClick={saveChapterEdit} className="h-7 px-2">
                            <Check size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelChapterEdit} className="h-7 px-2">
                            ×
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="flex-1 text-sm text-slate-900 cursor-pointer hover:text-slate-900 transition-colors"
                            onClick={() => startEditingChapter(index)}
                          >
                            {chapter}
                          </span>
                          <button
                            onClick={() => startEditingChapter(index)}
                            className="text-slate-600 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <PencilSimple size={12} />
                          </button>
                          <button
                            onClick={() => removeChapter(index)}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add chapter input - only show when chapters exist */}
              {chapters.length > 0 && (
                <div className="flex gap-2">
                  <Input
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    placeholder="Add a new chapter..."
                    className="text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addChapter()}
                  />
                  <Button onClick={addChapter} variant="secondary" size="sm">
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Outlines */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-base font-semibold text-slate-900">
                  Chapter Outlines
                </h2>
                {Object.keys(outlines).length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => generateOutlinesWithAI(true)}
                    disabled={generatingOutlines}
                    className="flex items-center gap-1.5 h-7 text-xs"
                  >
                    {generatingOutlines ? (
                      <SpinnerGap size={12} className="animate-spin" />
                    ) : (
                      <MagicWand size={12} />
                    )}
                    {generatingOutlines ? 'Regenerating...' : 'Regenerate All'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {generatingOutlines 
                  ? 'AI is generating subchapter outlines...'
                  : 'Subchapters for each chapter. Click to edit.'}
              </p>

              {/* Pro feature notice for tables/charts */}
              {!subscription?.isActive && (
                <div className="mb-3 p-2.5 bg-white border border-slate-200 rounded-lg">
                </div>
              )}

              {/* Loading state while generating */}
              {generatingOutlines && Object.keys(outlines).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-slate-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText size={24} className="text-slate-900 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-900">AI is generating outlines...</p>
                    <p className="text-xs text-slate-600">{chapters.length} chapters to process</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coach mark tooltip for table/chart buttons */}
              {showVisualHint && Object.keys(outlines).length > 0 && (
                <div className="relative mb-3 animate-fade-in">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-900">
                      <strong>Tip:</strong> Click <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] mx-0.5"><Table size={9} />+ Table</span> or <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] mx-0.5"><ChartBar size={9} />+ Chart</span> under any section to add visuals to your thesis
                    </p>
                    <button
                      onClick={() => setShowVisualHint(false)}
                      className="text-slate-600 hover:text-slate-900 ml-auto flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Outlines list */}
              {Object.keys(outlines).length > 0 && (
                <div className="space-y-3">
                  {chapters.map((chapter, chapterIndex) => {
                    const chapterNum = (chapterIndex + 1).toString();
                    const chapterOutlines = outlines[chapterNum] || [];
                    
                    return (
                      <div 
                        key={chapterIndex} 
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="p-2.5 flex items-center gap-2 bg-white">
                          <span className="w-5 h-5 bg-slate-100 text-slate-900 rounded text-xs font-medium flex items-center justify-center">
                            {chapterIndex + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium text-slate-900">{chapter}</span>
                        </div>
                        
                        <div className="p-2.5 space-y-1.5">
                            {chapterOutlines.map((subchapter, subIndex) => {
                              const visuals = outlineVisuals[chapterNum]?.[subIndex];
                              const hasTable = visuals?.hasTable;
                              const hasChart = visuals?.hasChart;
                              
                              return (
                                <div
                                  key={subIndex}
                                  className="flex items-start gap-2 pl-3 group py-0.5"
                                >
                                  <span className="text-xs text-slate-600 w-6 pt-0.5">
                                    {chapterIndex + 1}.{subIndex + 1}
                                  </span>
                                  {editingSubchapter?.chapterIndex === chapterIndex && editingSubchapter?.subIndex === subIndex ? (
                                    <div className="flex-1 flex items-center gap-1.5">
                                      <Input
                                        value={editingSubchapterValue}
                                        onChange={(e) => setEditingSubchapterValue(e.target.value)}
                                        className="flex-1 h-7 text-xs"
                                        autoFocus
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') saveSubchapterEdit();
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') cancelSubchapterEdit();
                                        }}
                                      />
                                      <Button size="sm" onClick={saveSubchapterEdit} className="h-7 px-2">
                                        <Check size={12} />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={cancelSubchapterEdit} className="h-7 px-2">
                                        ×
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span 
                                          className="flex-1 text-xs text-slate-600 cursor-pointer hover:text-slate-900 transition-colors"
                                          onClick={() => startEditingSubchapter(chapterIndex, subIndex)}
                                        >
                                          {subchapter}
                                        </span>
                                        <button
                                          onClick={() => startEditingSubchapter(chapterIndex, subIndex)}
                                          className="text-slate-600 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <PencilSimple size={10} />
                                        </button>
                                        <button
                                          onClick={() => removeSubchapter(chapterIndex, subIndex)}
                                          className="text-slate-600 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      {/* Table/Chart toggle buttons */}
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <button
                                          onClick={() => toggleOutlineVisual(chapterIndex, subIndex, 'table')}
                                          className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                                            hasTable
                                              ? 'bg-slate-200 text-slate-900 border border-slate-300'
                                              : `bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 ${showVisualHint && chapterIndex === 0 && subIndex === 0 ? 'animate-pulse ring-1 ring-slate-300' : ''}`
                                          }`}
                                          title={hasTable ? 'Remove table' : 'Add table'}
                                        >
                                          <Table size={10} />
                                          {hasTable ? 'Table' : '+ Table'}
                                        </button>
                                        <button
                                          onClick={() => toggleOutlineVisual(chapterIndex, subIndex, 'chart')}
                                          className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                                            hasChart
                                              ? 'bg-slate-200 text-slate-900 border border-slate-300'
                                              : `bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 ${showVisualHint && chapterIndex === 0 && subIndex === 0 ? 'animate-pulse ring-1 ring-slate-300' : ''}`
                                          }`}
                                          title={hasChart ? 'Remove chart' : 'Add chart'}
                                        >
                                          <ChartBar size={10} />
                                          {hasChart ? 'Chart' : '+ Chart'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              onClick={() => addSubchapter(chapterIndex)}
                              className="text-xs text-slate-600 hover:text-slate-900 pl-3 flex items-center gap-0.5 mt-1"
                            >
                              <span className="text-sm leading-none">+</span> Add subchapter
                            </button>
                          </div>
                        
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                Review Your Thesis
              </h2>
              <p className="text-xs text-slate-600 mb-4">
                Make sure everything looks good before generating
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Title</p>
                  <p className="text-sm font-medium text-slate-900">{title}</p>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Description</p>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>

                {/* Reference Documents summary */}
                {referenceDocuments.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Reference Materials</p>
                    <p className="text-sm text-slate-900">
                      {referenceDocuments.length} document{referenceDocuments.length !== 1 ? 's' : ''} uploaded
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      AI will use these as sources during generation
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Field</p>
                    <p className="text-xs font-medium text-slate-900">{field}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Style</p>
                    <p className="text-xs font-medium text-slate-900">{writingStyle}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-0.5">Length</p>
                    <p className="text-xs font-medium text-slate-900">{targetLength}</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Chapters & Outlines ({chapters.length} chapters)</p>
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => {
                      const chapterNum = (index + 1).toString();
                      const chapterOutlines = outlines[chapterNum] || [];
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-slate-900">
                              {index + 1}. {chapter}
                            </span>
                          </div>
                          {chapterOutlines.length > 0 && (
                            <div className="pl-4 space-y-0.5">
                              {chapterOutlines.map((sub, i) => {
                                const visuals = outlineVisuals[chapterNum]?.[i];
                                const hasTable = visuals?.hasTable;
                                const hasChart = visuals?.hasChart;
                                
                                return (
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                    <span>{index + 1}.{i + 1} {sub}</span>
                                    {hasTable && (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-200 text-slate-900 rounded text-[8px]">
                                        <Table size={8} />
                                        Table
                                      </span>
                                    )}
                                    {hasChart && (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-200 text-slate-900 rounded text-[8px]">
                                        <ChartBar size={8} />
                                        Chart
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="text-sm"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back
        </Button>

        <Button
          size="sm"
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="text-sm"
        >
          {loading ? (
            'Creating...'
          ) : currentStep === 6 ? (
            <>
              <Sparkle size={14} className="mr-1.5" />
              Generate Thesis
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={14} className="ml-1.5" />
            </>
          )}
        </Button>
      </div>

      {/* Paywall Modal */}
      <Modal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      >
        <div className="text-center py-3">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock size={24} className="text-slate-900" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Upgrade to Continue
          </h3>
          <p className="text-sm text-slate-600 mb-1">
            A Pro subscription is required to generate your thesis.
          </p>
          <p className="text-sm text-slate-600 mb-4">
            Subscribe to Pro to start generating your academic masterpiece.
          </p>
          <Link href="/app/upgrade">
            <Button size="sm" className="w-full mb-2">
              View Plans
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setShowPaywall(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </Modal>
    </div>
  );
}

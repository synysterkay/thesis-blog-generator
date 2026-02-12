'use client';

import { useState } from 'react';
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
  Sparkles, 
  FileText,
  BookOpen,
  ChevronRight,
  Check,
  Lock,
  Loader2,
  Pencil,
  Wand2,
  Table,
  BarChart3,
  Plus,
  Upload
} from 'lucide-react';
import { ACADEMIC_FIELDS, WRITING_STYLES, TARGET_LENGTHS } from '@/types';
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
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [writingStyle, setWritingStyle] = useState('');
  const [targetLength, setTargetLength] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [outlines, setOutlines] = useState<Record<string, string[]>>({});
  const [outlineVisuals, setOutlineVisuals] = useState<OutlineVisualsMap>({});
  const [enableTables, setEnableTables] = useState(true);
  const [enableCharts, setEnableCharts] = useState(true);
  const [newChapter, setNewChapter] = useState('');
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>([]);

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
          language: 'english',
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

      toast.success('Click Generate! To Start The generation...');
      router.push(`/app/thesis/${thesis.id}`);
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
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {currentStep > 1 ? 'Previous' : 'Back'}
        </button>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create New Thesis</h1>
        <p className="text-sm text-slate-500">Let&apos;s build your academic masterpiece</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {currentStep > step.id ? <Check className="w-3.5 h-3.5" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-10 sm:w-16 h-0.5 mx-1.5 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="text-center" style={{ width: '60px' }}>
              <p className={`text-[10px] font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-slate-400'
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
              <p className="text-xs text-slate-500 mb-3">
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
              <p className="text-xs text-slate-500 mb-3">
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
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                Academic Details
              </h2>
              <p className="text-xs text-slate-500 mb-3">
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
              <p className="text-xs text-slate-500 mb-3">
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
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    {generatingChapters ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {generatingChapters 
                  ? 'AI is generating chapters based on your thesis topic...'
                  : 'Chapters generated by AI. Click to edit or drag to reorder.'}
              </p>

              {/* Loading state while generating */}
              {generatingChapters && chapters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-900">AI is generating chapters...</p>
                    <p className="text-xs text-slate-500 max-w-xs">{title}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg group"
                    >
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded text-xs font-medium flex items-center justify-center">
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
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelChapterEdit} className="h-7 px-2">
                            ×
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="flex-1 text-sm text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => startEditingChapter(index)}
                          >
                            {chapter}
                          </span>
                          <button
                            onClick={() => startEditingChapter(index)}
                            className="text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeChapter(index)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
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
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    {generatingOutlines ? 'Regenerating...' : 'Regenerate All'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {generatingOutlines 
                  ? 'AI is generating subchapter outlines...'
                  : 'Subchapters for each chapter. Click to edit.'}
              </p>

              {/* Pro feature notice for tables/charts */}
              {!subscription?.isActive && (
                <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                </div>
              )}

              {/* Loading state while generating */}
              {generatingOutlines && Object.keys(outlines).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-purple-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-900">AI is generating outlines...</p>
                    <p className="text-xs text-slate-500">{chapters.length} chapters to process</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
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
                        <div className="p-2.5 flex items-center gap-2 bg-slate-50">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded text-xs font-medium flex items-center justify-center">
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
                                  <span className="text-xs text-slate-400 w-6 pt-0.5">
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
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={cancelSubchapterEdit} className="h-7 px-2">
                                        ×
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span 
                                          className="flex-1 text-xs text-slate-700 cursor-pointer hover:text-blue-600 transition-colors"
                                          onClick={() => startEditingSubchapter(chapterIndex, subIndex)}
                                        >
                                          {subchapter}
                                        </span>
                                        <button
                                          onClick={() => startEditingSubchapter(chapterIndex, subIndex)}
                                          className="text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          onClick={() => removeSubchapter(chapterIndex, subIndex)}
                                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                              : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                                          }`}
                                          title={hasTable ? 'Remove table' : 'Add table'}
                                        >
                                          <Table className="w-2.5 h-2.5" />
                                          {hasTable ? 'Table' : '+ Table'}
                                        </button>
                                        <button
                                          onClick={() => toggleOutlineVisual(chapterIndex, subIndex, 'chart')}
                                          className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                                            hasChart
                                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                              : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                                          }`}
                                          title={hasChart ? 'Remove chart' : 'Add chart'}
                                        >
                                          <BarChart3 className="w-2.5 h-2.5" />
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
                              className="text-xs text-blue-600 hover:text-blue-700 pl-3 flex items-center gap-0.5 mt-1"
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
              <p className="text-xs text-slate-500 mb-4">
                Make sure everything looks good before generating
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Title</p>
                  <p className="text-sm font-medium text-slate-900">{title}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Description</p>
                  <p className="text-sm text-slate-700">{description}</p>
                </div>

                {/* Reference Documents summary */}
                {referenceDocuments.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-0.5">Reference Materials</p>
                    <p className="text-sm text-blue-800">
                      {referenceDocuments.length} document{referenceDocuments.length !== 1 ? 's' : ''} uploaded
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      AI will use these as sources during generation
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Field</p>
                    <p className="text-xs font-medium text-slate-900">{field}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Style</p>
                    <p className="text-xs font-medium text-slate-900">{writingStyle}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Length</p>
                    <p className="text-xs font-medium text-slate-900">{targetLength}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Chapters & Outlines ({chapters.length} chapters)</p>
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
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span>{index + 1}.{i + 1} {sub}</span>
                                    {hasTable && (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px]">
                                        <Table className="w-2 h-2" />
                                        Table
                                      </span>
                                    )}
                                    {hasChart && (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[8px]">
                                        <BarChart3 className="w-2 h-2" />
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
                  
                  {/* Free tier notice */}
                  {!subscription?.isActive && chapters.length > 3 && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[10px] text-amber-700">
                        <strong>Free Plan:</strong> Only the first 3 chapters will be generated. 
                        {' '}<Link href="/app/upgrade" className="underline font-medium">Upgrade to Pro</Link> to generate all {chapters.length} chapters.
                      </p>
                    </div>
                  )}
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
          <ArrowLeft className="mr-1.5 w-3.5 h-3.5" />
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
              <Sparkles className="mr-1.5 w-3.5 h-3.5" />
              Generate Thesis
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
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
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            Upgrade to Continue
          </h3>
          <p className="text-sm text-slate-600 mb-1">
            You&apos;ve used your free thesis this month.
          </p>
          <p className="text-sm text-slate-600 mb-4">
            Upgrade to Pro for unlimited thesis generations.
          </p>
          <Link href="/app/upgrade">
            <Button size="sm" className="w-full mb-2">
              View Plans
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
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

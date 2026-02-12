import { createClient } from '@/lib/supabase/server';
import { canUserGenerate, incrementUsage, getSubscriptionStatus } from '@/lib/subscription';
import { 
  suggestChapters, 
  generateSectionContent,
  generateIntroduction,
  generateConclusion,
  generateReferences,
  generateTableData,
  generateChartData,
  isNonDataChapter
} from '@/lib/deepseek';
import { NextResponse } from 'next/server';
import { Chapter, Thesis } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { after } from 'next/server';

export const maxDuration = 300; // 5 minutes for Vercel Pro

// Max chapters for all users (to prevent abuse)
const MAX_CHAPTERS = 10;

// Interface for outline visual settings
interface OutlineVisual {
  title: string;
  hasTable?: boolean;
  hasChart?: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId } = await request.json();

    if (!thesisId) {
      return NextResponse.json({ error: 'Missing thesis ID' }, { status: 400 });
    }

    // Fetch thesis
    const { data: thesis, error: fetchError } = await supabase
      .from('theses')
      .select('*')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    // Check if user can generate
    const generateResult = await canUserGenerate(user.id);
    if (!generateResult.canGenerate) {
      return NextResponse.json({ 
        error: generateResult.reason || 'Upgrade required',
        upgradeRequired: generateResult.upgradeRequired 
      }, { status: 403 });
    }

    // Get subscription status to determine chapter limit
    const subscriptionStatus = await getSubscriptionStatus(user.id);
    const isPremium = subscriptionStatus.isActive && subscriptionStatus.isPremium;

    // Update thesis status to generating
    await supabase
      .from('theses')
      .update({ status: 'generating' })
      .eq('id', thesisId);

    // In development, after() may not work reliably with Turbopack
    // So we use a different approach for dev vs production
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // In dev, start generation without awaiting (fire and forget)
      // This works because the dev server stays alive
      console.log('🎬 Starting generation in dev mode (fire-and-forget)...');
      generateThesis(thesis as Thesis, user.id, supabase, isPremium)
        .then(() => console.log('🏁 Generation completed successfully'))
        .catch((genError) => {
          console.error('Generation error:', genError);
          supabase
            .from('theses')
            .update({ status: 'failed' })
            .eq('id', thesisId);
        });
    } else {
      // In production, use after() to keep the function alive on Vercel
      after(async () => {
        console.log('🎬 after() callback starting...');
        try {
          await generateThesis(thesis as Thesis, user.id, supabase, isPremium);
          console.log('🏁 after() callback completed successfully');
        } catch (genError) {
          console.error('Generation error:', genError);
          await supabase
            .from('theses')
            .update({ status: 'failed' })
            .eq('id', thesisId);
        }
      });
    }

    return NextResponse.json({ 
      message: 'Generation started', 
      thesisId,
      isPremium,
      chapterLimit: MAX_CHAPTERS 
    });
  } catch (error: unknown) {
    console.error('Generate error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Get word count targets based on target length
function getWordCountTargets(targetLength: string | null) {
  switch (targetLength) {
    case 'short': // ~50 pages = ~12,500 words
      return { sectionWords: '600-900', introWords: '800-1200', chapterTarget: 2500 };
    case 'long': // ~150 pages = ~37,500 words
      return { sectionWords: '1200-1800', introWords: '1500-2500', chapterTarget: 5000 };
    case 'medium': // ~90 pages = ~22,500 words
    default:
      return { sectionWords: '800-1200', introWords: '1000-1500', chapterTarget: 3500 };
  }
}

async function generateThesis(thesis: Thesis, userId: string, supabase: SupabaseClient, isPremium: boolean) {
  console.log('🚀 Starting thesis generation for:', thesis.id, 'isPremium:', isPremium);
  
  try {
    // Get word count targets based on target length
    const wordTargets = getWordCountTargets(thesis.target_length);
    
    // Check if chapters already exist (created from /app/new page)
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('thesis_id', thesis.id)
      .order('chapter_number', { ascending: true });

    let chapters: Chapter[] = existingChapters || [];

    // Parse metadata with visual settings
    const metadata = thesis.metadata as { 
      chapter_titles?: string[]; 
      outlines?: Record<string, string[]>;
      outlinesWithVisuals?: Record<string, OutlineVisual[]>;
      enableTables?: boolean;
      enableCharts?: boolean;
      referenceDocumentIds?: string[];
    } | null;

    // Fetch reference documents if any were uploaded
    let referenceContent = '';
    if (metadata?.referenceDocumentIds?.length) {
      console.log('📚 Fetching', metadata.referenceDocumentIds.length, 'reference documents...');
      const { data: referenceDocs } = await supabase
        .from('reference_documents')
        .select('filename, chunks, extracted_text')
        .in('id', metadata.referenceDocumentIds)
        .eq('status', 'completed');
      
      if (referenceDocs?.length) {
        // Build reference content from chunks (more efficient for LLM context)
        const referenceChunks: string[] = [];
        for (const doc of referenceDocs) {
          if (doc.chunks && Array.isArray(doc.chunks)) {
            // Use first 3 chunks per document to stay within context limits
            const docChunks = doc.chunks.slice(0, 3).map((chunk: string) => 
              `[From: ${doc.filename}]\n${chunk}`
            );
            referenceChunks.push(...docChunks);
          } else if (doc.extracted_text) {
            // Fallback to truncated full text
            const truncated = doc.extracted_text.substring(0, 3000);
            referenceChunks.push(`[From: ${doc.filename}]\n${truncated}`);
          }
        }
        referenceContent = referenceChunks.join('\n\n---\n\n');
        console.log('📖 Reference content loaded:', referenceContent.length, 'chars from', referenceDocs.length, 'documents');
      }
    }

    // If no chapters exist, create them
    if (chapters.length === 0) {
      // First, generate chapter suggestions if outline doesn't exist
      let chapterTitles: string[] = [];
      
      if (metadata?.chapter_titles?.length) {
        chapterTitles = metadata.chapter_titles;
      } else if (thesis.outline?.chapters?.length) {
        chapterTitles = thesis.outline.chapters.map((c: { title: string }) => c.title);
      } else {
        // Generate chapter suggestions based on thesis topic
        const topicText = thesis.topic || (thesis.metadata as { description?: string })?.description || thesis.title;
        const suggestions = await suggestChapters(
          `${thesis.title}: ${topicText}`,
          thesis.academic_field || 'General',
          thesis.language || 'English'
        );
        chapterTitles = suggestions.slice(0, 7); // Limit to 7 chapters
        
        if (chapterTitles.length === 0) {
          chapterTitles = [
            'Introduction',
            'Literature Review', 
            'Methodology',
            'Results',
            'Discussion',
            'Conclusion',
            'References'
          ];
        }
        
        // Ensure References is always at the end
        chapterTitles = chapterTitles.filter(c => !c.toLowerCase().includes('reference') && !c.toLowerCase().includes('bibliography'));
        chapterTitles.push('References');
      }

      // All users can generate up to MAX_CHAPTERS
      const chaptersToGenerate = chapterTitles.slice(0, MAX_CHAPTERS);
      const lockedChapters: string[] = []; // No locked chapters in new model

      // Get outlines from metadata - the outlines field contains visual settings (hasTable, hasChart)
      // Note: In new/page.tsx, outlinesWithVisuals is saved under 'outlines' key
      const outlinesWithVisuals = metadata?.outlines || metadata?.outlinesWithVisuals || {};
      const simpleOutlines = metadata?.outlines || {};

      // Create chapter records for chapters to generate
      const chapterRecords: Partial<Chapter>[] = chaptersToGenerate.map((title, index) => {
        const chapterNum = (index + 1).toString();
        const visualOutlines = outlinesWithVisuals[chapterNum];
        const plainOutlines = simpleOutlines[chapterNum];
        
        // Store outline data with visual settings
        const contentData = visualOutlines 
          ? { subchaptersWithVisuals: visualOutlines }
          : plainOutlines 
          ? { subchapters: plainOutlines }
          : null;
          
        return {
          thesis_id: thesis.id,
          title,
          chapter_number: index + 1,
          status: 'pending' as const,
          word_count: 0,
          content: contentData ? JSON.stringify(contentData) : null,
        };
      });

      // Create locked chapter records for free users (status = 'locked')
      const lockedChapterRecords: Partial<Chapter>[] = lockedChapters.map((title, index) => {
        const chapterNum = (chaptersToGenerate.length + index + 1).toString();
        const visualOutlines = outlinesWithVisuals[chapterNum];
        const plainOutlines = simpleOutlines[chapterNum];
        
        const contentData = visualOutlines 
          ? { subchaptersWithVisuals: visualOutlines }
          : plainOutlines 
          ? { subchapters: plainOutlines }
          : null;
          
        return {
          thesis_id: thesis.id,
          title,
          chapter_number: chaptersToGenerate.length + index + 1,
          status: 'locked' as const,
          word_count: 0,
          content: contentData ? JSON.stringify(contentData) : null,
        };
      });

      // Insert all chapters (both to generate and locked)
      const allChapterRecords = [...chapterRecords, ...lockedChapterRecords];
      const { data: insertedChapters, error: insertError } = await supabase
        .from('chapters')
        .insert(allChapterRecords)
        .select();

      if (insertError || !insertedChapters) {
        console.error('Failed to create chapters:', insertError);
        throw new Error('Failed to create chapters');
      }
      
      chapters = insertedChapters;
    }

    // Update thesis with chapter count
    await supabase
      .from('theses')
      .update({ 
        total_chapters: chapters.length,
      })
      .eq('id', thesis.id);

    // Track all generated content for deduplication
    const generatedContentTracker: string[] = [];
    
    // Only generate content for non-locked chapters
    const chaptersToProcess = chapters.filter(c => c.status !== 'locked');
    console.log('📝 Processing', chaptersToProcess.length, 'chapters (excluding locked)');
    
    // Process outline by outline across all chapters
    for (let i = 0; i < chaptersToProcess.length; i++) {
      const chapter = chaptersToProcess[i];
      console.log('⏳ Starting chapter', i + 1, '/', chaptersToProcess.length, ':', chapter.title);
      
      // Parse subchapters from chapter content if available
      let subchaptersWithVisuals: OutlineVisual[] = [];
      let subchapters: string[] = [];
      
      try {
        if (chapter.content) {
          const contentData = typeof chapter.content === 'string' 
            ? JSON.parse(chapter.content) 
            : chapter.content;
          
          // Check for visual outlines first (explicitly named subchaptersWithVisuals)
          if (contentData?.subchaptersWithVisuals && Array.isArray(contentData.subchaptersWithVisuals)) {
            subchaptersWithVisuals = contentData.subchaptersWithVisuals.filter((s: OutlineVisual | null) => s && s.title);
            subchapters = subchaptersWithVisuals.map(s => s.title).filter(Boolean);
          } else if (contentData?.subchapters && Array.isArray(contentData.subchapters)) {
            // Handle both string[] and object[] formats
            // Check if subchapters contains objects with visual settings
            const firstItem = contentData.subchapters[0];
            if (firstItem && typeof firstItem === 'object' && 'title' in firstItem) {
              // It's an array of objects with visual settings - preserve them!
              subchaptersWithVisuals = contentData.subchapters.filter((s: OutlineVisual | null) => s && s.title);
              subchapters = subchaptersWithVisuals.map((s: OutlineVisual) => s.title).filter(Boolean);
              console.log('📊 Found visual settings in subchapters:', subchaptersWithVisuals.map(s => ({ title: s.title, hasTable: s.hasTable, hasChart: s.hasChart })));
            } else {
              // It's an array of strings
              subchapters = contentData.subchapters
                .map((s: string | null) => {
                  if (!s) return null;
                  if (typeof s === 'string') return s;
                  return null;
                })
                .filter(Boolean) as string[];
              // Convert to visual format without any visuals
              subchaptersWithVisuals = subchapters.map(title => ({ title }));
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing chapter content:', parseError);
        subchapters = [];
        subchaptersWithVisuals = [];
      }
      
      console.log('📋 Chapter', chapter.title, 'has', subchapters.length, 'outlines:', subchapters.slice(0, 3).join(', '), subchapters.length > 3 ? '...' : '');
      
      // Update chapter status to generating with initial outline index
      await supabase
        .from('chapters')
        .update({ 
          status: 'generating',
          content: JSON.stringify({
            subchapters: subchapters,
            subchaptersWithVisuals: subchaptersWithVisuals,
            text: '',
            currentOutlineIndex: 0,
            totalOutlines: subchapters.length,
          }),
        })
        .eq('id', chapter.id);

      try {
        let content = '';
        const topicText = thesis.topic || (thesis.metadata as { description?: string })?.description || thesis.title;

        if (chapter.title.toLowerCase().includes('introduction')) {
          content = await generateIntroduction(
            `${thesis.title}: ${topicText}`,
            chapters.map(c => c.title),
            thesis.writing_style,
            thesis.language || 'English',
            wordTargets.introWords,
            referenceContent // Pass user's uploaded reference sources
          );
          generatedContentTracker.push(content);
        } else if (chapter.title.toLowerCase().includes('conclusion')) {
          // Get completed chapters for context
          const { data: completedChapters } = await supabase
            .from('chapters')
            .select('title')
            .eq('thesis_id', thesis.id)
            .eq('status', 'completed');
          
          const chapterNames = completedChapters?.map(c => c.title) || chapters.map(c => c.title);
          
          content = await generateConclusion(
            `${thesis.title}: ${topicText}`,
            chapterNames,
            thesis.writing_style,
            thesis.language || 'English',
            wordTargets.introWords
          );
          generatedContentTracker.push(content);
        } else if (chapter.title.toLowerCase().includes('reference')) {
          // Generate real academic references
          console.log('📚 Generating references...');
          const allChapterTitles = chapters.map(c => c.title);
          content = await generateReferences(
            `${thesis.title}: ${topicText}`,
            allChapterTitles,
            thesis.academic_field || 'General',
            thesis.language || 'English',
            'APA' // Default citation style
          );
          console.log('✅ References generated:', content.length, 'chars');
          generatedContentTracker.push(content);
        } else {
          // Use subchapters as sections if available, otherwise use defaults
          const sections = subchapters.length > 0 
            ? subchapters 
            : ['Overview', 'Key Concepts', 'Analysis', 'Discussion', 'Summary'];
          
          console.log('📝 Generating', sections.length, 'sections for chapter:', chapter.title);
          
          const sectionContents: string[] = [];
          const sectionTables: Record<string, unknown>[] = [];
          const sectionCharts: Record<string, unknown>[] = [];

          // OUTLINE-BY-OUTLINE GENERATION with context tracking
          for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
            const section = sections[sectionIdx];
            console.log('  📄 Section', sectionIdx + 1, '/', sections.length, ':', section);
            const sectionVisuals = subchaptersWithVisuals[sectionIdx];
            
            // Update chapter to show current outline being generated
            await supabase
              .from('chapters')
              .update({
                content: JSON.stringify({
                  subchapters: subchapters,
                  subchaptersWithVisuals: subchaptersWithVisuals,
                  text: sectionContents.join('\n\n'),
                  currentOutlineIndex: sectionIdx,
                  totalOutlines: sections.length,
                }),
              })
              .eq('id', chapter.id);
            
            // Build context from previous content to avoid repetition
            const previousContext = generatedContentTracker.slice(-3).join('\n\n---\n\n');
            
            const sectionContent = await generateSectionContent(
              section,
              chapter.title,
              thesis.title,
              thesis.academic_field || 'General',
              thesis.writing_style,
              previousContext, // Pass previous content for deduplication
              thesis.language || 'English',
              wordTargets.sectionWords,
              referenceContent // Pass user's uploaded reference sources
            );
            
            console.log('  ✅ Section generated:', section, '-', sectionContent.split(/\s+/).length, 'words');
            console.log('  📊 Visual settings for section:', section, '- hasTable:', sectionVisuals?.hasTable, 'hasChart:', sectionVisuals?.hasChart, 'isPremium:', isPremium);
            
            sectionContents.push(`## ${section}\n\n${sectionContent}`);
            generatedContentTracker.push(sectionContent);

            // Track total tables and charts generated for free user limits
            const totalTablesGenerated = sectionTables.length;
            const totalChartsGenerated = sectionCharts.length;
            
            // Free users get 1 table, premium get unlimited
            const canGenerateTable = isPremium || totalTablesGenerated < 1;
            // Free users get 1 chart, premium get unlimited
            const canGenerateChart = isPremium || totalChartsGenerated < 1;

            // Generate table if requested for this outline
            if (canGenerateTable && sectionVisuals?.hasTable && !isNonDataChapter(chapter.title)) {
              console.log('  📋 Generating table for section:', section, '(isPremium:', isPremium, 'totalTables:', totalTablesGenerated, ')');
              const tableData = await generateTableData(
                `${thesis.title}: ${topicText}`,
                `${chapter.title} - ${section}`,
                thesis.academic_field || 'General',
                sectionContent.slice(0, 500)
              );
              if (tableData) {
                console.log('  ✅ Table generated:', tableData.caption);
                sectionTables.push({ section, ...tableData });
              }
            }

            // Generate chart if requested for this outline
            if (canGenerateChart && sectionVisuals?.hasChart && !isNonDataChapter(chapter.title)) {
              console.log('  📈 Generating chart for section:', section, '(isPremium:', isPremium, 'totalCharts:', totalChartsGenerated, ')');
              // Pick chart type based on content analysis or random selection for variety
              const chartTypes: Array<'bar' | 'line' | 'pie' | 'area'> = ['bar', 'line', 'pie', 'area'];
              const contentLower = sectionContent.toLowerCase();
              
              let chartType: 'bar' | 'line' | 'pie' | 'area';
              if (contentLower.includes('trend') || contentLower.includes('over time') || contentLower.includes('growth') || contentLower.includes('year')) {
                chartType = 'line';
              } else if (contentLower.includes('distribution') || contentLower.includes('proportion') || contentLower.includes('percentage') || contentLower.includes('share')) {
                chartType = 'pie';
              } else if (contentLower.includes('cumulative') || contentLower.includes('total') || contentLower.includes('progression')) {
                chartType = 'area';
              } else if (contentLower.includes('comparison') || contentLower.includes('compare') || contentLower.includes('versus') || contentLower.includes('ranking')) {
                chartType = 'bar';
              } else {
                // Random selection for variety when no specific keyword is found
                chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
              }
              
              const chartData = await generateChartData(
                `${thesis.title}: ${topicText}`,
                `${chapter.title} - ${section}`,
                thesis.academic_field || 'General',
                chartType
              );
              if (chartData) {
                console.log('  ✅ Chart generated:', chartData.caption, 'type:', chartType);
                sectionCharts.push({ section, ...chartData });
              }
            }
          }

          content = sectionContents.join('\n\n');

          const wordCount = content.split(/\s+/).length;
          console.log('💾 Saving chapter:', chapter.title, '- Tables:', sectionTables.length, 'Charts:', sectionCharts.length);
          console.log('💾 Saving regular chapter:', chapter.title, 'with', wordCount, 'words');

          // Store tables and charts in the content JSON since table doesn't have separate columns
          const finalContentWithVisuals = JSON.stringify({
            subchapters: subchapters,
            subchaptersWithVisuals: subchaptersWithVisuals,
            text: content,
            tables: sectionTables.length > 0 ? sectionTables : undefined,
            charts: sectionCharts.length > 0 ? sectionCharts : undefined,
          });

          const regularChapterResult = await supabase
            .from('chapters')
            .update({
              status: 'completed',
              content: finalContentWithVisuals,
              word_count: wordCount,
            })
            .eq('id', chapter.id);
          
          console.log('💾 Regular chapter save result:', regularChapterResult.error ? regularChapterResult.error : 'success');
          
          continue; // Skip the rest for regular chapters
        }

        // For intro/conclusion/references (non-outline chapters)
        const wordCount = content.split(/\s+/).length;
        console.log('💾 Saving chapter:', chapter.title, 'with', wordCount, 'words');
        const finalContent = JSON.stringify({
          subchapters: subchapters,
          text: content,
        });

        const updateResult = await supabase
          .from('chapters')
          .update({
            status: 'completed',
            content: finalContent,
            word_count: wordCount,
          })
          .eq('id', chapter.id);
        
        console.log('💾 Update result for', chapter.title, ':', updateResult.error ? updateResult.error : 'success');

      } catch (chapterError) {
        console.error(`❌ Error generating chapter ${chapter.title}:`, chapterError);
        // Continue with next chapter on error
        await supabase
          .from('chapters')
          .update({ status: 'pending' }) // Reset to pending so user can retry
          .eq('id', chapter.id);
      }
    }

    // Calculate total words
    const { data: allChapters } = await supabase
      .from('chapters')
      .select('word_count, status')
      .eq('thesis_id', thesis.id);

    const totalWords = allChapters?.reduce((sum, c) => sum + (c.word_count || 0), 0) || 0;
    const completedCount = allChapters?.filter(c => c.status === 'completed').length || 0;
    const lockedCount = allChapters?.filter(c => c.status === 'locked').length || 0;
    // For free users, only check non-locked chapters are completed
    const hasAllCompleted = completedCount === (allChapters?.length || 0) - lockedCount;
    
    console.log('📊 Generation complete - Total words:', totalWords, 'Completed:', completedCount, 'Locked:', lockedCount, 'All done:', hasAllCompleted);

    // Update thesis as completed
    const thesisUpdateResult = await supabase
      .from('theses')
      .update({
        status: hasAllCompleted ? 'completed' : 'draft',
      })
      .eq('id', thesis.id);
    
    console.log('📝 Thesis status update to', hasAllCompleted ? 'completed' : 'draft', ':', thesisUpdateResult.error ? thesisUpdateResult.error : 'success');

    // Increment usage for billing
    if (hasAllCompleted) {
      await incrementUsage(userId, 'thesis');
    }

  } catch (error) {
    console.error('Generation failed:', error);
    await supabase
      .from('theses')
      .update({ status: 'draft' })
      .eq('id', thesis.id);
  }
}

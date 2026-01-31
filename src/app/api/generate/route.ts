import { createClient } from '@/lib/supabase/server';
import { canUserGenerate, incrementUsage, getSubscriptionStatus } from '@/lib/subscription';
import { 
  suggestChapters, 
  generateSectionContent,
  generateIntroduction,
  generateConclusion,
  generateTableData,
  generateChartData,
  isNonDataChapter
} from '@/lib/deepseek';
import { NextResponse } from 'next/server';
import { Chapter, Thesis } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60; // 60 seconds for Vercel Pro

// Free users get 3 chapters, premium gets unlimited
const FREE_USER_CHAPTER_LIMIT = 3;

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

    // Start generation in background (non-blocking)
    generateThesis(thesis as Thesis, user.id, supabase, isPremium).catch(console.error);

    return NextResponse.json({ 
      message: 'Generation started', 
      thesisId,
      isPremium,
      chapterLimit: isPremium ? null : FREE_USER_CHAPTER_LIMIT 
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
    } | null;

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

      // For free users, limit to first 3 chapters only
      const chaptersToGenerate = isPremium ? chapterTitles : chapterTitles.slice(0, FREE_USER_CHAPTER_LIMIT);
      const lockedChapters = isPremium ? [] : chapterTitles.slice(FREE_USER_CHAPTER_LIMIT);

      // Get outlines from metadata - prefer outlinesWithVisuals for visual settings
      const outlinesWithVisuals = metadata?.outlinesWithVisuals || {};
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
    
    // Process outline by outline across all chapters
    for (let i = 0; i < chaptersToProcess.length; i++) {
      const chapter = chaptersToProcess[i];
      
      // Parse subchapters from chapter content if available
      let subchaptersWithVisuals: OutlineVisual[] = [];
      let subchapters: string[] = [];
      
      try {
        if (chapter.content) {
          const contentData = typeof chapter.content === 'string' 
            ? JSON.parse(chapter.content) 
            : chapter.content;
          
          // Check for visual outlines first
          if (contentData?.subchaptersWithVisuals) {
            subchaptersWithVisuals = contentData.subchaptersWithVisuals;
            subchapters = subchaptersWithVisuals.map(s => s.title);
          } else if (contentData?.subchapters) {
            subchapters = contentData.subchapters;
            // Convert to visual format without any visuals
            subchaptersWithVisuals = subchapters.map(title => ({ title }));
          }
        }
      } catch {
        subchapters = [];
        subchaptersWithVisuals = [];
      }
      
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
            wordTargets.introWords
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
          // Generate references section
          content = `## References\n\nThis section contains all academic sources, citations, and bibliography entries used throughout the thesis. References are formatted according to the appropriate academic citation style.\n\n*Note: References will be automatically populated based on the citations used in the thesis content.*`;
        } else {
          // Use subchapters as sections if available, otherwise use defaults
          const sections = subchapters.length > 0 
            ? subchapters 
            : ['Overview', 'Key Concepts', 'Analysis', 'Discussion', 'Summary'];
          
          const sectionContents: string[] = [];
          const sectionTables: Record<string, unknown>[] = [];
          const sectionCharts: Record<string, unknown>[] = [];

          // OUTLINE-BY-OUTLINE GENERATION with context tracking
          for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
            const section = sections[sectionIdx];
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
              wordTargets.sectionWords
            );
            
            sectionContents.push(`## ${section}\n\n${sectionContent}`);
            generatedContentTracker.push(sectionContent);

            // Generate table if requested for this outline (premium only)
            if (isPremium && sectionVisuals?.hasTable && !isNonDataChapter(chapter.title)) {
              const tableData = await generateTableData(
                `${thesis.title}: ${topicText}`,
                `${chapter.title} - ${section}`,
                thesis.academic_field || 'General',
                sectionContent.slice(0, 500)
              );
              if (tableData) {
                sectionTables.push({ section, ...tableData });
              }
            }

            // Generate chart if requested for this outline (premium only)
            if (isPremium && sectionVisuals?.hasChart && !isNonDataChapter(chapter.title)) {
              // Pick chart type based on content analysis
              const chartTypes: Array<'bar' | 'line' | 'pie' | 'area'> = ['bar', 'line', 'pie', 'area'];
              const contentLower = sectionContent.toLowerCase();
              
              let chartType: 'bar' | 'line' | 'pie' | 'area' = 'bar';
              if (contentLower.includes('trend') || contentLower.includes('over time') || contentLower.includes('growth') || contentLower.includes('year')) {
                chartType = 'line';
              } else if (contentLower.includes('distribution') || contentLower.includes('proportion') || contentLower.includes('percentage') || contentLower.includes('share')) {
                chartType = 'pie';
              } else if (contentLower.includes('cumulative') || contentLower.includes('total') || contentLower.includes('progression')) {
                chartType = 'area';
              } else {
                // Rotate through chart types for variety
                chartType = chartTypes[sectionCharts.length % chartTypes.length];
              }
              
              const chartData = await generateChartData(
                `${thesis.title}: ${topicText}`,
                `${chapter.title} - ${section}`,
                thesis.academic_field || 'General',
                chartType
              );
              if (chartData) {
                sectionCharts.push({ section, ...chartData });
              }
            }
          }

          content = sectionContents.join('\n\n');

          // Store tables and charts generated per section
          const finalContent = JSON.stringify({
            subchapters: subchapters,
            subchaptersWithVisuals: subchaptersWithVisuals,
            text: content,
          });

          const wordCount = content.split(/\s+/).length;

          await supabase
            .from('chapters')
            .update({
              status: 'completed',
              content: finalContent,
              word_count: wordCount,
              tables: sectionTables.length > 0 ? sectionTables : null,
              charts: sectionCharts.length > 0 ? sectionCharts : null,
            })
            .eq('id', chapter.id);
          
          continue; // Skip the rest for regular chapters
        }

        // For intro/conclusion/references (non-outline chapters)
        const wordCount = content.split(/\s+/).length;
        const finalContent = JSON.stringify({
          subchapters: subchapters,
          text: content,
        });

        await supabase
          .from('chapters')
          .update({
            status: 'completed',
            content: finalContent,
            word_count: wordCount,
          })
          .eq('id', chapter.id);

      } catch (chapterError) {
        console.error(`Error generating chapter ${chapter.title}:`, chapterError);
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
    const hasAllCompleted = completedCount === allChapters?.length;

    // Update thesis as completed
    await supabase
      .from('theses')
      .update({
        status: hasAllCompleted ? 'completed' : 'draft',
        total_words: totalWords,
        total_pages: Math.ceil(totalWords / 250), // Approx 250 words per page
      })
      .eq('id', thesis.id);

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

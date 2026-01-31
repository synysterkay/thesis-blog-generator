import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSectionContent, generateTableData, generateChartData } from '@/lib/deepseek';
import { Thesis } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId, chapterId } = await request.json();

    if (!thesisId || !chapterId) {
      return NextResponse.json(
        { error: 'Missing thesisId or chapterId' },
        { status: 400 }
      );
    }

    // Fetch thesis details
    const { data: thesis, error: thesisError } = await supabase
      .from('theses')
      .select('*')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (thesisError || !thesis) {
      return NextResponse.json(
        { error: 'Thesis not found' },
        { status: 404 }
      );
    }

    // Fetch the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('thesis_id', thesisId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if chapter is locked (premium)
    if (chapter.status === 'locked') {
      return NextResponse.json(
        { error: 'This chapter is locked. Upgrade to Pro to access.' },
        { status: 403 }
      );
    }

    // Set chapter status to generating
    await supabase
      .from('chapters')
      .update({ status: 'generating' })
      .eq('id', chapterId);

    // Parse existing content to get subchapters
    let subchapters: string[] = [];
    let subchaptersWithVisuals: Array<{ title: string; hasTable?: boolean; hasChart?: boolean }> = [];
    
    try {
      const existingContent = typeof chapter.content === 'string' 
        ? JSON.parse(chapter.content) 
        : chapter.content;
      
      if (existingContent?.subchaptersWithVisuals) {
        subchaptersWithVisuals = existingContent.subchaptersWithVisuals;
        subchapters = subchaptersWithVisuals.map(s => s.title);
      } else if (existingContent?.subchapters) {
        subchapters = existingContent.subchapters.map((s: string | { title: string }) => 
          typeof s === 'string' ? s : s.title
        );
      }
    } catch {
      // If content parsing fails, use empty subchapters
    }

    // Get academic field and other metadata
    const thesisData = thesis as Thesis;
    const metadata = thesisData.metadata || {};
    const academicField = thesisData.academic_field || 'Academic';
    const writingStyle = thesisData.writing_style || 'academic';
    const targetLength = metadata.targetLength || 'medium';

    // Determine word count targets based on length
    const wordTargets = {
      short: { min: 600, max: 900 },
      medium: { min: 800, max: 1200 },
      long: { min: 1200, max: 1800 },
    };
    const wordTarget = wordTargets[targetLength as keyof typeof wordTargets] || wordTargets.medium;

    // Get previous chapters for context (avoid repetition)
    const { data: previousChapters } = await supabase
      .from('chapters')
      .select('title, content')
      .eq('thesis_id', thesisId)
      .lt('chapter_number', chapter.chapter_number)
      .order('chapter_number', { ascending: true });

    // Extract summaries from previous chapters for context
    const previousContext = previousChapters?.map(ch => {
      try {
        const content = typeof ch.content === 'string' ? JSON.parse(ch.content) : ch.content;
        const text = content?.text || '';
        // Get first 500 chars as summary
        return `${ch.title}: ${text.substring(0, 500)}...`;
      } catch {
        return '';
      }
    }).filter(Boolean).join('\n\n');

    // Generate content for each subchapter
    const subchapterContents: string[] = [];
    const tables: Array<{ caption: string; columns: string[]; rows: string[][]; source?: string }> = [];
    const charts: Array<{ type: string; caption: string; labels: string[]; data: number[]; source?: string }> = [];

    for (let i = 0; i < subchapters.length; i++) {
      const subchapterTitle = subchapters[i];
      const visualInfo = subchaptersWithVisuals[i];
      
      // Build context from previous subchapters in this chapter
      const previousSubchapterContext = subchapterContents.length > 0
        ? `Previous sections in this chapter:\n${subchapterContents.slice(-2).join('\n\n')}`
        : '';

      const fullPreviousContext = [previousContext, previousSubchapterContext]
        .filter(Boolean)
        .join('\n\n---\n\n');

      const content = await generateSectionContent(
        subchapterTitle,
        chapter.title,
        thesis.title,
        academicField,
        writingStyle,
        fullPreviousContext,
        thesisData.language || 'English',
        `${wordTarget.min}-${wordTarget.max}`
      );

      subchapterContents.push(`## ${chapter.chapter_number}.${i + 1} ${subchapterTitle}\n\n${content}`);

      // Generate table if requested
      if (visualInfo?.hasTable) {
        try {
          const table = await generateTableData(
            subchapterTitle,
            chapter.title,
            academicField,
            content.substring(0, 500)
          );
          tables.push(table);
        } catch (error) {
          console.error(`Failed to generate table for ${subchapterTitle}:`, error);
        }
      }

      // Generate chart if requested - pick chart type based on content
      if (visualInfo?.hasChart) {
        try {
          // Pick chart type based on content analysis
          const chartTypes: Array<'bar' | 'line' | 'pie' | 'area'> = ['bar', 'line', 'pie', 'area'];
          const contentLower = content.toLowerCase();
          
          let chartType: 'bar' | 'line' | 'pie' | 'area' = 'bar';
          if (contentLower.includes('trend') || contentLower.includes('over time') || contentLower.includes('growth') || contentLower.includes('year')) {
            chartType = 'line';
          } else if (contentLower.includes('distribution') || contentLower.includes('proportion') || contentLower.includes('percentage') || contentLower.includes('share')) {
            chartType = 'pie';
          } else if (contentLower.includes('cumulative') || contentLower.includes('total') || contentLower.includes('progression')) {
            chartType = 'area';
          } else {
            // Rotate through chart types for variety
            chartType = chartTypes[charts.length % chartTypes.length];
          }
          
          const chart = await generateChartData(
            subchapterTitle,
            chapter.title,
            academicField,
            chartType
          );
          charts.push(chart);
        } catch (error) {
          console.error(`Failed to generate chart for ${subchapterTitle}:`, error);
        }
      }
    }

    // Combine all content
    const fullText = `# Chapter ${chapter.chapter_number}: ${chapter.title}\n\n${subchapterContents.join('\n\n')}`;
    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;

    // Update chapter with new content
    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        content: JSON.stringify({
          subchapters,
          subchaptersWithVisuals,
          text: fullText,
        }),
        tables: tables.length > 0 ? tables : null,
        charts: charts.length > 0 ? charts : null,
        word_count: wordCount,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId);

    if (updateError) {
      throw updateError;
    }

    // Update thesis word count
    const { data: allChapters } = await supabase
      .from('chapters')
      .select('word_count')
      .eq('thesis_id', thesisId)
      .not('status', 'eq', 'locked');

    const totalWords = allChapters?.reduce((sum, ch) => sum + (ch.word_count || 0), 0) || 0;

    await supabase
      .from('theses')
      .update({ 
        word_count: totalWords,
        updated_at: new Date().toISOString(),
      })
      .eq('id', thesisId);

    return NextResponse.json({ 
      success: true,
      wordCount,
      message: 'Chapter regenerated successfully' 
    });

  } catch (error) {
    console.error('Chapter regeneration error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate chapter' },
      { status: 500 }
    );
  }
}

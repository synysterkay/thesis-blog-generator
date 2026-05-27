import { createClient } from '@/lib/supabase/server';
import { canUserGenerate, getSubscriptionStatus } from '@/lib/subscription';
import { suggestChapters } from '@/lib/deepseek';
import { generateAllPendingChapters } from '@/lib/chapter-generator';
import { NextResponse, after } from 'next/server';
import { Chapter, Thesis } from '@/types';

export const maxDuration = 300; // after() gets remaining duration for generation

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

    // Update thesis status to generating + store isPremium in metadata for chapter endpoint
    const existingMetadata = (thesis.metadata || {}) as Record<string, unknown>;
    await supabase
      .from('theses')
      .update({
        status: 'generating',
        metadata: { ...existingMetadata, isPremium },
      })
      .eq('id', thesisId);

    // --- Create chapters if they don't exist yet ---
    await createChaptersIfNeeded(thesis as Thesis, supabase);

    // --- Generate all chapters directly via after() — NO HTTP hop ---
    // after() runs after the response is sent but within the same Lambda.
    // On Vercel Pro, after() gets the remaining function duration (up to 300s).
    after(async () => {
      try {
        console.log(`🚀 Starting generation for thesis ${thesisId} via after()`);
        await generateAllPendingChapters(thesisId);
        
        // After successful generation, check if this user was referred
        // and qualify the referral (gives referrer 1 credit)
        try {
          const baseUrl = process.env.RENDER_EXTERNAL_URL
            || process.env.NEXT_PUBLIC_APP_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || process.env.NEXT_PUBLIC_SITE_URL
            || 'http://localhost:3000';
          await fetch(`${baseUrl}/api/referral/qualify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
        } catch {
          // Non-critical, don't fail the generation
        }
      } catch (err) {
        console.error(`❌ after() generation failed for ${thesisId}:`, err);
      }
    });

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

// ---------------------------------------------------------------------------
// Create chapter records if they don't exist yet
// ---------------------------------------------------------------------------
async function createChaptersIfNeeded(thesis: Thesis, supabase: Awaited<ReturnType<typeof createClient>>) {
  // Check if chapters already exist
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id')
    .eq('thesis_id', thesis.id)
    .limit(1);

  if (existingChapters && existingChapters.length > 0) {
    // Reset any chapters stuck in 'generating' from a previous failed run
    await supabase
      .from('chapters')
      .update({ status: 'pending' })
      .eq('thesis_id', thesis.id)
      .eq('status', 'generating');
    return; // Chapters already exist
  }

  // Parse metadata
  const metadata = thesis.metadata as {
    chapter_titles?: string[];
    outlines?: Record<string, string[]>;
    outlinesWithVisuals?: Record<string, OutlineVisual[]>;
  } | null;

  // Determine chapter titles
  let chapterTitles: string[] = [];
  if (metadata?.chapter_titles?.length) {
    chapterTitles = metadata.chapter_titles;
  } else if (thesis.outline?.chapters?.length) {
    chapterTitles = thesis.outline.chapters.map((c: { title: string }) => c.title);
  } else {
    const topicText = thesis.topic || (thesis.metadata as { description?: string })?.description || thesis.title;
    const suggestions = await suggestChapters(
      `${thesis.title}: ${topicText}`,
      thesis.academic_field || 'General',
      thesis.language || 'English',
    );
    chapterTitles = suggestions.slice(0, 7);
    if (chapterTitles.length === 0) {
      chapterTitles = ['Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'];
    }
    chapterTitles = chapterTitles.filter(c => !c.toLowerCase().includes('reference') && !c.toLowerCase().includes('bibliography'));
    chapterTitles.push('References');
  }

  const chaptersToGenerate = chapterTitles.slice(0, MAX_CHAPTERS);
  const outlinesWithVisuals = metadata?.outlines || metadata?.outlinesWithVisuals || {};
  const simpleOutlines = metadata?.outlines || {};

  const chapterRecords: Partial<Chapter>[] = chaptersToGenerate.map((title, index) => {
    const chapterNum = (index + 1).toString();
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
      chapter_number: index + 1,
      status: 'pending' as const,
      word_count: 0,
      content: contentData ? JSON.stringify(contentData) : null,
    };
  });

  const { error: insertError } = await supabase
    .from('chapters')
    .insert(chapterRecords)
    .select();

  if (insertError) {
    console.error('Failed to create chapters:', insertError);
    throw new Error('Failed to create chapters');
  }

  // Update thesis with chapter count
  await supabase
    .from('theses')
    .update({ total_chapters: chapterRecords.length })
    .eq('id', thesis.id);

  console.log(`📝 Created ${chapterRecords.length} chapters for thesis ${thesis.id}`);
}

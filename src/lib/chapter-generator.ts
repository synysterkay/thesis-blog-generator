/**
 * Core chapter generation logic — shared between:
 *   • /api/generate        (kickoff, via after())
 *   • /api/generate/chapter (cron recovery endpoint)
 *
 * Generates ALL pending chapters of a thesis in a single invocation.
 * Each chapter gets live DB updates per section for real-time progress.
 */

import { createClient } from '@supabase/supabase-js';
import {
  generateSectionContent,
  generateIntroduction,
  generateConclusion,
  generateReferences,
  generateTableData,
  generateChartData,
  isNonDataChapter,
} from '@/lib/deepseek';
import { incrementUsage } from '@/lib/subscription';
import { getWordCountTargets } from '@/lib/generate-utils';
import { sendEmail } from '@/lib/email/mailer';
import { enrollInSequence } from '@/lib/email/lifecycle-enroll';
import { Thesis, Chapter } from '@/types';

interface OutlineVisual {
  title: string;
  hasTable?: boolean;
  hasChart?: boolean;
}

// ---------------------------------------------------------------------------
// Public entry point — generates ALL pending chapters, then finalises
// ---------------------------------------------------------------------------
export async function generateAllPendingChapters(thesisId: string): Promise<{ generated: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Load thesis
  const { data: thesis, error: thesisErr } = await supabase
    .from('theses')
    .select('*')
    .eq('id', thesisId)
    .single();

  if (thesisErr || !thesis) {
    console.error(`❌ Thesis ${thesisId} not found`);
    return { generated: 0 };
  }
  if (thesis.status !== 'generating') {
    console.log(`⏭️ Thesis ${thesisId} is not generating (status: ${thesis.status})`);
    return { generated: 0 };
  }

  // Load chapters
  const { data: allChapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('thesis_id', thesisId)
    .order('chapter_number', { ascending: true });

  if (!allChapters || allChapters.length === 0) {
    console.error(`❌ No chapters found for thesis ${thesisId}`);
    return { generated: 0 };
  }

  // Check if another invocation is already generating
  const alreadyGenerating = allChapters.find(c => c.status === 'generating');
  if (alreadyGenerating) {
    console.log(`⏭️ Thesis ${thesisId} — chapter already generating, skipping`);
    return { generated: 0 };
  }

  // Loop through ALL pending chapters sequentially
  let generated = 0;
  const chaptersState = [...allChapters] as Chapter[];

  for (const chapter of chaptersState) {
    if (chapter.status !== 'pending') continue;

    // Atomically claim
    const { data: claimed } = await supabase
      .from('chapters')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', chapter.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (!claimed) continue;

    try {
      await generateSingleChapter(supabase, thesis as Thesis, claimed as Chapter, chaptersState);
      // Update local state so next chapter has fresh context
      const idx = chaptersState.findIndex(c => c.id === claimed.id);
      if (idx >= 0) {
        const { data: fresh } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', claimed.id)
          .single();
        if (fresh) chaptersState[idx] = fresh as Chapter;
      }
      generated++;
    } catch (err) {
      console.error(`❌ Chapter ${claimed.title} failed:`, err);
      await supabase
        .from('chapters')
        .update({ status: 'pending' })
        .eq('id', claimed.id);
    }
  }

  // Finalise
  await finaliseThesis(supabase, thesis as Thesis, chaptersState);
  return { generated };
}

// ---------------------------------------------------------------------------
// Generate a single chapter
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateSingleChapter(
  supabase: any,
  thesis: Thesis,
  chapter: Chapter,
  allChapters: Chapter[],
) {
  console.log(`⏳ Generating chapter: ${chapter.title} (thesis ${thesis.id})`);

  const wordTargets = getWordCountTargets(thesis.target_length);
  const topicText = thesis.topic || (thesis.metadata as { description?: string })?.description || thesis.title;
  const isPremium = !!(thesis.metadata as Record<string, unknown> | null)?.isPremium;

  // --- Load reference documents ---
  let referenceContent = '';
  const metadata = thesis.metadata as { referenceDocumentIds?: string[] } | null;
  if (metadata?.referenceDocumentIds?.length) {
    const { data: referenceDocs } = await supabase
      .from('reference_documents')
      .select('filename, chunks, extracted_text')
      .in('id', metadata.referenceDocumentIds)
      .eq('status', 'completed');

    if (referenceDocs?.length) {
      const chunks: string[] = [];
      for (const doc of referenceDocs) {
        if (doc.chunks && Array.isArray(doc.chunks)) {
          chunks.push(
            ...doc.chunks.slice(0, 3).map((c: string) => `[From: ${doc.filename}]\n${c}`),
          );
        } else if (doc.extracted_text) {
          chunks.push(`[From: ${doc.filename}]\n${doc.extracted_text.substring(0, 3000)}`);
        }
      }
      referenceContent = chunks.join('\n\n---\n\n');
    }
  }

  // --- Cross-chapter deduplication context ---
  const completedChapters = allChapters.filter(c => c.status === 'completed');
  let previousChapterContext = '';
  if (completedChapters.length > 0) {
    const recentCompleted = completedChapters.slice(-2);
    const contextPieces: string[] = [];
    for (const ch of recentCompleted) {
      try {
        const parsed = typeof ch.content === 'string' ? JSON.parse(ch.content) : ch.content;
        const text = (parsed?.text || '').slice(0, 1500);
        if (text) contextPieces.push(`${ch.title}: ${text}`);
      } catch { /* skip */ }
    }
    previousChapterContext = contextPieces.join('\n\n---\n\n');
  }

  // --- Parse subchapters / visual settings ---
  let subchaptersWithVisuals: OutlineVisual[] = [];
  let subchapters: string[] = [];
  try {
    if (chapter.content) {
      const contentData = typeof chapter.content === 'string'
        ? JSON.parse(chapter.content) : chapter.content;

      if (contentData?.subchaptersWithVisuals && Array.isArray(contentData.subchaptersWithVisuals)) {
        subchaptersWithVisuals = contentData.subchaptersWithVisuals.filter((s: OutlineVisual | null) => s?.title);
        subchapters = subchaptersWithVisuals.map(s => s.title).filter(Boolean);
      } else if (contentData?.subchapters && Array.isArray(contentData.subchapters)) {
        const first = contentData.subchapters[0];
        if (first && typeof first === 'object' && 'title' in first) {
          subchaptersWithVisuals = contentData.subchapters.filter((s: OutlineVisual | null) => s?.title);
          subchapters = subchaptersWithVisuals.map((s: OutlineVisual) => s.title).filter(Boolean);
        } else {
          subchapters = contentData.subchapters.filter((s: string | null) => typeof s === 'string' && s) as string[];
          subchaptersWithVisuals = subchapters.map(title => ({ title }));
        }
      }
    }
  } catch { /* keep empty arrays */ }

  // --- Update chapter to "generating" with outline metadata ---
  await supabase
    .from('chapters')
    .update({
      content: JSON.stringify({
        subchapters,
        subchaptersWithVisuals,
        text: '',
        currentOutlineIndex: 0,
        totalOutlines: subchapters.length,
      }),
    })
    .eq('id', chapter.id);

  // --- Generate content based on chapter type ---
  let content = '';

  if (chapter.title.toLowerCase().includes('introduction')) {
    content = await generateIntroduction(
      `${thesis.title}: ${topicText}`,
      allChapters.map(c => c.title),
      thesis.writing_style,
      thesis.language || 'English',
      wordTargets.introWords,
      referenceContent,
    );
  } else if (chapter.title.toLowerCase().includes('conclusion')) {
    const completedNames = completedChapters.length > 0
      ? completedChapters.map(c => c.title)
      : allChapters.map(c => c.title);
    content = await generateConclusion(
      `${thesis.title}: ${topicText}`,
      completedNames,
      thesis.writing_style,
      thesis.language || 'English',
      wordTargets.introWords,
    );
  } else if (chapter.title.toLowerCase().includes('reference')) {
    content = await generateReferences(
      `${thesis.title}: ${topicText}`,
      allChapters.map(c => c.title),
      thesis.academic_field || 'General',
      thesis.language || 'English',
      'APA',
    );
  } else {
    // --- Regular chapter: sequential section generation ---
    const sections = subchapters.length > 0
      ? subchapters
      : ['Overview', 'Key Concepts', 'Analysis', 'Discussion', 'Summary'];

    if (subchapters.length === 0) {
      subchapters = sections;
      subchaptersWithVisuals = sections.map(title => ({ title }));
    }

    console.log(`📝 Generating ${sections.length} sections sequentially for: ${chapter.title}`);

    const isDataChapter = !isNonDataChapter(chapter.title);
    let tablesRemaining = isPremium ? Infinity : 1;
    let chartsRemaining = isPremium ? Infinity : 1;
    const sectionPermissions = sections.map((_s, idx) => {
      const vis = subchaptersWithVisuals[idx];
      const allowTable = isDataChapter && !!vis?.hasTable && tablesRemaining > 0;
      const allowChart = isDataChapter && !!vis?.hasChart && chartsRemaining > 0;
      if (allowTable) tablesRemaining--;
      if (allowChart) chartsRemaining--;
      return { allowTable, allowChart };
    });

    const sectionResults: { sectionIdx: number; section: string; sectionContent: string; tableData: unknown; chartData: unknown }[] = [];
    const sectionTables: Record<string, unknown>[] = [];
    const sectionCharts: Record<string, unknown>[] = [];

    for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
      const section = sections[sectionIdx];

      // Live update: show which section is being written
      await supabase
        .from('chapters')
        .update({
          content: JSON.stringify({
            subchapters, subchaptersWithVisuals,
            text: sectionResults.map(r => `## ${r.section}\n\n${r.sectionContent}`).join('\n\n'),
            currentOutlineIndex: sectionIdx,
            totalOutlines: sections.length,
          }),
        })
        .eq('id', chapter.id);

      const sectionContent = await generateSectionContent(
        section, chapter.title, thesis.title,
        thesis.academic_field || 'General', thesis.writing_style,
        previousChapterContext, thesis.language || 'English',
        wordTargets.sectionWords, referenceContent,
      );
      console.log(`  ✅ ${section} — ${sectionContent.split(/\s+/).length} words`);

      let tableData = null;
      if (sectionPermissions[sectionIdx].allowTable) {
        tableData = await generateTableData(
          `${thesis.title}: ${topicText}`,
          `${chapter.title} - ${section}`,
          thesis.academic_field || 'General',
          sectionContent.slice(0, 500),
        );
      }

      let chartData = null;
      if (sectionPermissions[sectionIdx].allowChart) {
        const chartTypes: Array<'bar' | 'line' | 'pie' | 'area'> = ['bar', 'line', 'pie', 'area'];
        const cl = sectionContent.toLowerCase();
        let chartType: 'bar' | 'line' | 'pie' | 'area';
        if (cl.includes('trend') || cl.includes('over time') || cl.includes('growth') || cl.includes('year')) chartType = 'line';
        else if (cl.includes('distribution') || cl.includes('proportion') || cl.includes('percentage')) chartType = 'pie';
        else if (cl.includes('cumulative') || cl.includes('total') || cl.includes('progression')) chartType = 'area';
        else if (cl.includes('comparison') || cl.includes('compare') || cl.includes('versus')) chartType = 'bar';
        else chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];

        chartData = await generateChartData(
          `${thesis.title}: ${topicText}`,
          `${chapter.title} - ${section}`,
          thesis.academic_field || 'General',
          chartType,
        );
      }

      sectionResults.push({ sectionIdx, section, sectionContent, tableData, chartData });
      if (tableData) sectionTables.push({ section, ...tableData });
      if (chartData) sectionCharts.push({ section, ...chartData });

      // Live update: section done
      const partialText = sectionResults.map(r => `## ${r.section}\n\n${r.sectionContent}`).join('\n\n');
      await supabase
        .from('chapters')
        .update({
          content: JSON.stringify({
            subchapters, subchaptersWithVisuals,
            text: partialText,
            currentOutlineIndex: sectionIdx + 1,
            totalOutlines: sections.length,
          }),
        })
        .eq('id', chapter.id);
    }

    const sectionTexts = sectionResults.map(r => `## ${r.section}\n\n${r.sectionContent}`);
    content = sectionTexts.join('\n\n');

    const wordCount = content.split(/\s+/).length;
    await supabase
      .from('chapters')
      .update({
        status: 'completed',
        word_count: wordCount,
        content: JSON.stringify({
          subchapters, subchaptersWithVisuals,
          text: content,
          tables: sectionTables.length > 0 ? sectionTables : undefined,
          charts: sectionCharts.length > 0 ? sectionCharts : undefined,
        }),
      })
      .eq('id', chapter.id);

    console.log(`✅ Chapter completed: ${chapter.title} — ${wordCount} words`);
    return;
  }

  // Save non-regular chapters (intro / conclusion / references)
  const wordCount = content.split(/\s+/).length;
  await supabase
    .from('chapters')
    .update({
      status: 'completed',
      word_count: wordCount,
      content: JSON.stringify({ subchapters, text: content }),
    })
    .eq('id', chapter.id);

  console.log(`✅ Chapter completed: ${chapter.title} — ${wordCount} words`);
}

// ---------------------------------------------------------------------------
// Finalise thesis
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function finaliseThesis(
  supabase: any,
  thesis: Thesis,
  chapters: Chapter[],
) {
  const { data: freshChapters } = await supabase
    .from('chapters')
    .select('word_count, status, user_id')
    .eq('thesis_id', thesis.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = freshChapters || chapters;
  const completedCount = all.filter((c: { status: string }) => c.status === 'completed').length;
  const lockedCount = all.filter((c: { status: string }) => c.status === 'locked').length;
  const pendingCount = all.filter((c: { status: string }) => c.status === 'pending').length;
  const totalWords = all.reduce((sum: number, c: { word_count?: number }) => sum + (c.word_count || 0), 0);
  const expectedCompleted = all.length - lockedCount;
  const allDone = completedCount >= expectedCompleted && pendingCount === 0;

  console.log(`📊 Finalise — completed:${completedCount} locked:${lockedCount} pending:${pendingCount} words:${totalWords} allDone:${allDone}`);

  await supabase
    .from('theses')
    .update({ status: allDone ? 'completed' : 'generating' })
    .eq('id', thesis.id);

  if (allDone) {
    const { data: thesisRow } = await supabase
      .from('theses')
      .select('user_id')
      .eq('id', thesis.id)
      .single();
    if (thesisRow?.user_id) {
      await incrementUsage(thesisRow.user_id, 'thesis');

      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(thesisRow.user_id);
        if (user?.email) {
          const thesisUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thesisgenerator.io'}/app/thesis/${thesis.id}`;
          await sendEmail({
            to: user.email,
            subject: `Your thesis "${thesis.title}" is ready! 🎓`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
                <h1 style="font-size: 22px; color: #0f172a; margin-bottom: 8px;">Your thesis is ready!</h1>
                <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  <strong>"${thesis.title}"</strong> has been generated successfully — ${totalWords.toLocaleString()} words across ${completedCount} chapters.
                </p>
                <a href="${thesisUrl}" style="display: inline-block; padding: 12px 28px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                  View &amp; Export Your Thesis →
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                  You can export to PDF, DOCX, or LaTeX right from your dashboard.
                </p>
              </div>
            `,
          });
          console.log(`📧 Completion email sent to ${user.email}`);
        }
      } catch (emailErr) {
        console.error('Failed to send completion email:', emailErr);
      }

      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', thesisRow.user_id)
          .eq('status', 'active')
          .maybeSingle();

        const isPremium = !!sub;
        const { data: { user: u } } = await supabase.auth.admin.getUserById(thesisRow.user_id);
        const uEmail = u?.email;
        const uName = u?.user_metadata?.full_name || u?.user_metadata?.name;

        if (uEmail) {
          await enrollInSequence(supabase, thesisRow.user_id, uEmail, 'post_generation', uName);
          if (!isPremium) {
            await enrollInSequence(supabase, thesisRow.user_id, uEmail, 'conversion', uName);
          }
        }
      } catch (enrollErr) {
        console.error('Failed to enroll in lifecycle sequences:', enrollErr);
      }
    }
    console.log(`🏁 Thesis ${thesis.id} generation complete!`);
  }
}

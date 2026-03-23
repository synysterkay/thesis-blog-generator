/**
 * GET /api/generate/resume
 *
 * Cron job (every 1 minute) that detects thesis generation chains that have
 * stalled and re-triggers them.  A chain is considered stalled when:
 *
 *   1. thesis.status = 'generating'
 *   2. No chapter is currently in 'generating' state (meaning the chain died)
 *   3. At least one chapter is still 'pending'
 *
 * Safety: only processes theses updated in the last 30 min.  Older ones are
 * auto-marked 'failed'.  Max 3 resumes per invocation to avoid stampede.
 */

import { createClient } from '@supabase/supabase-js';
import { triggerChapterGeneration } from '@/lib/generate-utils';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

const MAX_RESUMES_PER_RUN = 3;
const STALE_THESIS_MS = 30 * 60 * 1000;   // 30 min — mark as failed
const STUCK_CHAPTER_MS = 5 * 60 * 1000;   // 5 min  — reset to pending

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Find all theses currently in 'generating' status
  const { data: generatingTheses, error } = await supabase
    .from('theses')
    .select('id, updated_at')
    .eq('status', 'generating');

  if (error || !generatingTheses?.length) {
    return NextResponse.json({ checked: 0 });
  }

  let resumed = 0;
  let failed = 0;
  const staleThreshold = new Date(Date.now() - STALE_THESIS_MS).toISOString();

  for (const thesis of generatingTheses) {
    // Auto-fail theses stuck for >30 minutes with no recent chapter activity
    if (thesis.updated_at < staleThreshold) {
      // Check if any chapter has recent activity
      const { data: recentChapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('thesis_id', thesis.id)
        .gt('updated_at', staleThreshold)
        .limit(1);

      if (!recentChapters?.length) {
        console.log(`💀 Thesis ${thesis.id} stale for >30 min — marking failed`);
        await supabase.from('theses').update({ status: 'failed' }).eq('id', thesis.id);
        failed++;
        continue;
      }
    }

    // Check if any chapter is actively being generated
    const { data: activeChapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('thesis_id', thesis.id)
      .eq('status', 'generating');

    if (activeChapters && activeChapters.length > 0) {
      // A chapter is being generated — check if it's been stuck for >5 min
      const { data: stuckChapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('thesis_id', thesis.id)
        .eq('status', 'generating')
        .lt('updated_at', new Date(Date.now() - STUCK_CHAPTER_MS).toISOString());

      if (stuckChapters && stuckChapters.length > 0) {
        // Reset stuck chapters to pending
        console.log(`🔧 Resetting ${stuckChapters.length} stuck chapter(s) for thesis ${thesis.id}`);
        await supabase
          .from('chapters')
          .update({ status: 'pending' })
          .eq('thesis_id', thesis.id)
          .eq('status', 'generating');
      } else {
        // Still actively generating — skip
        continue;
      }
    }

    // Check if there are still pending chapters to process
    const { data: pendingChapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('thesis_id', thesis.id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingChapters && pendingChapters.length > 0) {
      if (resumed >= MAX_RESUMES_PER_RUN) {
        console.log(`⏸️ Skipping thesis ${thesis.id} — already resumed ${MAX_RESUMES_PER_RUN} this run`);
        continue;
      }
      console.log(`🔄 Resuming thesis ${thesis.id} — pending chapters found`);
      await triggerChapterGeneration(thesis.id);
      resumed++;
    } else {
      // No pending, no generating — all done (or failed). Finalise.
      const { data: allChapters } = await supabase
        .from('chapters')
        .select('status, word_count')
        .eq('thesis_id', thesis.id);

      const completedCount = allChapters?.filter(c => c.status === 'completed').length || 0;
      const lockedCount = allChapters?.filter(c => c.status === 'locked').length || 0;
      const expected = (allChapters?.length || 0) - lockedCount;

      if (completedCount >= expected) {
        console.log(`🏁 Thesis ${thesis.id} is fully done — marking completed`);
        await supabase
          .from('theses')
          .update({ status: 'completed' })
          .eq('id', thesis.id);
      } else {
        // Some chapters may have failed permanently — mark completed with what we have
        console.log(`⚠️ Thesis ${thesis.id} has ${completedCount}/${expected} chapters — marking completed (best effort)`);
        await supabase
          .from('theses')
          .update({ status: 'completed' })
          .eq('id', thesis.id);
      }
    }
  }

  console.log(`✅ Resume cron: checked ${generatingTheses.length} theses, resumed ${resumed}, failed ${failed}`);
  return NextResponse.json({ checked: generatingTheses.length, resumed, failed });
}

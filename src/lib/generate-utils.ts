/**
 * Shared utilities for the chapter-by-chapter thesis generation pipeline.
 *
 * Architecture:
 *  1. POST /api/generate          — auth, create chapters, trigger first chapter
 *  2. POST /api/generate/chapter  — generate ONE chapter, trigger next, finalise when done
 *  3. GET  /api/generate/resume   — cron (every 5 min) restarts stalled chains
 */

// ---------------------------------------------------------------------------
// Word-count targets
// ---------------------------------------------------------------------------
export function getWordCountTargets(targetLength: string | null) {
  switch (targetLength) {
    case 'short':
      return { sectionWords: '600-900', introWords: '800-1200', chapterTarget: 2500 };
    case 'long':
      return { sectionWords: '1200-1800', introWords: '1500-2500', chapterTarget: 5000 };
    case 'medium':
    default:
      return { sectionWords: '800-1200', introWords: '1000-1500', chapterTarget: 3500 };
  }
}

// ---------------------------------------------------------------------------
// Internal API helper
// ---------------------------------------------------------------------------
function getAppUrl(): string {
  // On Vercel, VERCEL_URL is always set (e.g. thesis-xxx.vercel.app)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  return 'https://www.thesisgenerator.io';
}

/**
 * Fire-and-forget trigger to generate the next pending chapter.
 * Uses `SUPABASE_SERVICE_ROLE_KEY` as an internal auth token so the chapter
 * endpoint can run without a user session.
 */
export async function triggerChapterGeneration(thesisId: string): Promise<void> {
  const url = `${getAppUrl()}/api/generate/chapter`;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  try {
    const controller = new AbortController();
    // 15s timeout — just need the request to land and get a 200 back.
    // The receiving Lambda runs independently once the request arrives.
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': secret,
      },
      body: JSON.stringify({ thesisId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    console.log(`📡 Triggered chapter generation for ${thesisId}: ${res.status}`);
  } catch (err) {
    // AbortError means the request was sent but we didn't wait for full response
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`📡 Triggered chapter generation for ${thesisId} (fire-and-forget)`);
    } else {
      console.error(`❌ Failed to trigger chapter generation for ${thesisId}:`, err);
    }
  }
}

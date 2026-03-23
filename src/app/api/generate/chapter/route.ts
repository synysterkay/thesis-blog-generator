/**
 * POST /api/generate/chapter
 *
 * Generates ALL pending chapters of a thesis in a single invocation.
 * Called by the 1-minute cron (/api/generate/resume) for recovery.
 * The primary flow uses after() in /api/generate — no HTTP hop.
 *
 * Auth: x-api-secret header must equal SUPABASE_SERVICE_ROLE_KEY.
 */

import { generateAllPendingChapters } from '@/lib/chapter-generator';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = request.headers.get('x-api-secret')?.trim();
  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { thesisId } = await request.json();
  if (!thesisId) {
    return NextResponse.json({ error: 'Missing thesisId' }, { status: 400 });
  }

  const result = await generateAllPendingChapters(thesisId);
  return NextResponse.json(result);
}


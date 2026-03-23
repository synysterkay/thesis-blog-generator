/**
 * GET /api/email/lifecycle
 *
 * Daily cron that processes all active lifecycle email sequences.
 * For each enrollment row, checks if enough time has passed since the last
 * email (or enrollment), then sends the next step and advances the counter.
 */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/mailer';

import {
  ONBOARDING_SEQUENCE,
  ONBOARDING_DELAYS_HOURS,
  ONBOARDING_TOTAL_STEPS,
} from '@/lib/email/lifecycle-onboarding';
import {
  POST_GEN_SEQUENCE,
  POST_GEN_DELAYS_HOURS,
  POST_GEN_TOTAL_STEPS,
} from '@/lib/email/lifecycle-post-generation';
import {
  CONVERSION_SEQUENCE,
  CONVERSION_DELAYS_HOURS,
  CONVERSION_TOTAL_STEPS,
} from '@/lib/email/lifecycle-conversion';
import {
  RETENTION_SEQUENCE,
  RETENTION_DELAYS_HOURS,
  RETENTION_TOTAL_STEPS,
} from '@/lib/email/lifecycle-retention';

import type { EmailParams, EmailResult } from '@/lib/email/lifecycle-layout';

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// --------------------------------------------------------------------------
// Sequence configuration map
// --------------------------------------------------------------------------
type SeqConfig = {
  templates: Record<number, (p: EmailParams) => EmailResult>;
  delays: Record<number, number>;
  totalSteps: number;
};

const SEQUENCES: Record<string, SeqConfig> = {
  onboarding: {
    templates: ONBOARDING_SEQUENCE,
    delays: ONBOARDING_DELAYS_HOURS,
    totalSteps: ONBOARDING_TOTAL_STEPS,
  },
  post_generation: {
    templates: POST_GEN_SEQUENCE,
    delays: POST_GEN_DELAYS_HOURS,
    totalSteps: POST_GEN_TOTAL_STEPS,
  },
  conversion: {
    templates: CONVERSION_SEQUENCE,
    delays: CONVERSION_DELAYS_HOURS,
    totalSteps: CONVERSION_TOTAL_STEPS,
  },
  retention: {
    templates: RETENTION_SEQUENCE,
    delays: RETENTION_DELAYS_HOURS,
    totalSteps: RETENTION_TOTAL_STEPS,
  },
};

// --------------------------------------------------------------------------
// Cron auth
// --------------------------------------------------------------------------
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return authHeader === `Bearer ${cronSecret}`;
  return true; // Vercel cron auto-authenticates
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --------------------------------------------------------------------------
// GET handler — runs daily via Vercel cron
// --------------------------------------------------------------------------
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all active enrollments
    const { data: enrollments, error } = await supabase
      .from('email_lifecycle')
      .select('*')
      .eq('active', true)
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Error fetching lifecycle enrollments:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: 'No active enrollments', sent: 0 });
    }

    console.log(`📧 Processing ${enrollments.length} lifecycle enrollments`);

    let sent = 0;
    let skipped = 0;
    let completed = 0;
    let failed = 0;

    for (const row of enrollments) {
      const config = SEQUENCES[row.sequence];
      if (!config) {
        console.error(`Unknown sequence: ${row.sequence}`);
        continue;
      }

      const currentStep = row.step;

      // If already past total steps, deactivate
      if (currentStep > config.totalSteps) {
        await supabase
          .from('email_lifecycle')
          .update({ active: false })
          .eq('id', row.id);
        completed++;
        continue;
      }

      // Check timing — how many hours since enrolled or last sent
      const referenceTime = row.last_sent_at || row.enrolled_at;
      const elapsed = hoursSince(referenceTime);
      const requiredDelay = config.delays[currentStep] ?? 24;

      // For step 1 with 0 delay, only send if last_sent_at is null (never sent)
      if (currentStep === 1 && requiredDelay === 0) {
        if (row.last_sent_at !== null) {
          skipped++;
          continue;
        }
      } else {
        // For subsequent steps, check elapsed time since enrollment
        const hoursSinceEnroll = hoursSince(row.enrolled_at);
        if (hoursSinceEnroll < requiredDelay) {
          skipped++;
          continue;
        }
      }

      // Get the template function
      const templateFn = config.templates[currentStep];
      if (!templateFn) {
        console.error(`No template for ${row.sequence} step ${currentStep}`);
        continue;
      }

      const template = templateFn({ name: row.name, email: row.email });

      try {
        const success = await sendEmail({
          to: row.email,
          subject: template.subject,
          html: template.html,
          name: row.name || undefined,
        });

        if (success) {
          const nextStep = currentStep + 1;
          const isComplete = nextStep > config.totalSteps;

          await supabase
            .from('email_lifecycle')
            .update({
              step: nextStep,
              last_sent_at: new Date().toISOString(),
              active: !isComplete,
            })
            .eq('id', row.id);

          sent++;
          if (isComplete) completed++;
          console.log(`✅ Sent ${row.sequence} step ${currentStep} to ${row.email}`);
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`Error sending ${row.sequence} step ${currentStep} to ${row.email}:`, err);
        failed++;
      }

      // Rate limit: 600ms between sends to stay under Resend limits
      await sleep(600);
    }

    const summary = { sent, skipped, completed, failed, total: enrollments.length };
    console.log('📧 Lifecycle cron summary:', summary);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Lifecycle cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

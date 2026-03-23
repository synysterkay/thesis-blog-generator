import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/mailer';
import { DRIP_SEQUENCE, DripDay, TOTAL_DRIP_DAYS } from '@/lib/email/drip-templates';

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is set, verify it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  
  // On Vercel, cron jobs automatically include the correct auth
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch leads who need the next email
    // sequence_day tracks the LAST day sent (0 = just subscribed, 1 = day 1 sent, etc.)
    // We want leads where sequence_day < TOTAL_DRIP_DAYS, subscribed, active, not converted
    const { data: leads, error } = await (supabase as any)
      .from('email_leads')
      .select('*')
      .eq('subscribed', true)
      .eq('sequence_active', true)
      .eq('converted', false)
      .lt('sequence_day', TOTAL_DRIP_DAYS)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching drip leads:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to process', sent: 0 });
    }

    console.log(`Processing ${leads.length} drip leads`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process sequentially with delays to stay within Gmail rate limits
    for (const lead of leads) {
      const nextDay = (lead.sequence_day + 1) as DripDay;

      // Skip if already sent today (safety check)
      if (lead.last_email_sent_at) {
        const lastSent = new Date(lead.last_email_sent_at);
        const now = new Date();
        const hoursSinceLastEmail = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEmail < 20) {
          console.log(`Skipping ${lead.email} — last email sent ${hoursSinceLastEmail.toFixed(1)}h ago`);
          continue;
        }
      }

      // Get the template for the next day
      const templateFn = DRIP_SEQUENCE[nextDay];
      if (!templateFn) {
        console.error(`No template for day ${nextDay}`);
        continue;
      }

      const template = templateFn({ name: lead.name, email: lead.email });

      try {
        const success = await sendEmail({
          to: lead.email,
          subject: template.subject,
          html: template.html,
          name: lead.name,
        });

        if (success) {
          // Update lead: increment sequence_day, set last_email_sent_at
          const updateData: Record<string, any> = {
            sequence_day: nextDay,
            last_email_sent_at: new Date().toISOString(),
          };

          // If this was the last email, deactivate the sequence
          if (nextDay >= TOTAL_DRIP_DAYS) {
            updateData.sequence_active = false;
          }

          await (supabase as any)
            .from('email_leads')
            .update(updateData)
            .eq('id', lead.id);

          sent++;
          console.log(`Sent day ${nextDay} to ${lead.email}`);
        } else {
          failed++;
          errors.push(`Failed to send to ${lead.email}`);
        }
      } catch (err) {
        failed++;
        errors.push(`Error sending to ${lead.email}: ${err}`);
        console.error(`Error sending drip to ${lead.email}:`, err);
      }

      // Wait 2 seconds between sends to respect Gmail rate limits
      if (sent + failed < leads.length) {
        await sleep(2000);
      }
    }

    console.log(`Drip complete: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      message: 'Drip processing complete',
      total: leads.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Drip cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/mailer';
import { DRIP_SEQUENCE, DripDay } from '@/lib/email/drip-templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, name, user_id } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert the lead — if they already exist, reactivate if unsubscribed
    const { data: lead, error } = await (supabase as any)
      .from('email_leads')
      .upsert(
        {
          email: normalizedEmail,
          name: name || null,
          user_id: user_id || null,
          subscribed: true,
          sequence_active: true,
          sequence_day: 1,
          last_email_sent_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting email lead:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    // Send Day 1 welcome email immediately
    const template = DRIP_SEQUENCE[1 as DripDay]({ name, email: normalizedEmail });
    const sent = await sendEmail({
      to: normalizedEmail,
      subject: template.subject,
      html: template.html,
      name,
    });

    if (!sent) {
      console.error('Failed to send welcome email to', normalizedEmail);
    }

    return NextResponse.json({ success: true, lead_id: lead?.id });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

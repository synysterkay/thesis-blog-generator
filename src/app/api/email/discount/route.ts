import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/mailer';
import { lifecycleLayout, APP_URL } from '@/lib/email/lifecycle-layout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Save lead to email_leads
    await (supabase as any)
      .from('email_leads')
      .upsert(
        {
          email: normalizedEmail,
          subscribed: true,
          sequence_active: true,
          sequence_day: 0,
          last_email_sent_at: new Date().toISOString(),
        },
        { onConflict: 'email' },
      );

    // Send discount email
    const html = lifecycleLayout(
      `
      <h1>Your exclusive 10% discount is here</h1>
      <p>Thank you for your interest in Thesis Generator. As promised, here is your exclusive discount code:</p>

      <div class="callout" style="text-align:center;">
        <p style="font-size:28px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">THESIS10</p>
        <p style="font-size:13px;color:#64748b;margin:8px 0 0;">Use this code at checkout for 10% off your first month</p>
      </div>

      <p>With Thesis Generator Premium, you get:</p>
      <ul class="feature-list">
        <li>Unlimited thesis generation</li>
        <li>Export to PDF, DOCX, and LaTeX — no watermarks</li>
        <li>All citation styles (APA, Harvard, MLA, Chicago)</li>
        <li>Priority generation speed</li>
        <li>30-day money-back guarantee</li>
      </ul>

      <a href="${APP_URL}/#pricing" class="btn">Claim Your 10% Discount</a>

      <p style="font-size:13px;color:#94a3b8;">Enter code <strong style="color:#64748b;">THESIS10</strong> at checkout. This offer expires in 48 hours — don&rsquo;t miss out.</p>
    `,
      normalizedEmail,
    );

    const sent = await sendEmail({
      to: normalizedEmail,
      subject: 'Your 10% discount for Thesis Generator',
      html,
    });

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discount email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

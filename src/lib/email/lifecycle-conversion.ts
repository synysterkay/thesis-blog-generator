/**
 * Free-to-Paid conversion sequence — 6 emails for users who generated a thesis but haven't upgraded.
 * Trigger: Thesis generation completed + user is still on free plan.
 * Goal: Convert free users to paid subscribers.
 * Stops automatically when user converts (converted flag or subscription created).
 *
 * Schedule:
 *   Step 1 — Day 3: The cost of waiting
 *   Step 2 — Day 7: Feature deep-dive
 *   Step 3 — Day 10: Objection handling
 *   Step 4 — Day 14: Comparison / ROI
 *   Step 5 — Day 21: Scarcity / urgency
 *   Step 6 — Day 28: Final offer
 */

import { lifecycleLayout, greeting, APP_URL, type EmailParams, type EmailResult } from './lifecycle-layout';

const DISCOUNT_CODE = 'THESIS10';

export const CONVERSION_SEQUENCE: Record<number, (p: EmailParams) => EmailResult> = {
  1: conversion1,
  2: conversion2,
  3: conversion3,
  4: conversion4,
  5: conversion5,
  6: conversion6,
};

export const CONVERSION_DELAYS_HOURS: Record<number, number> = {
  1: 72,   // Day 3
  2: 168,  // Day 7
  3: 240,  // Day 10
  4: 336,  // Day 14
  5: 504,  // Day 21
  6: 672,  // Day 28
};

export const CONVERSION_TOTAL_STEPS = 6;

// Step 1 — The cost of waiting
function conversion1({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Every day without your thesis costs you',
    html: lifecycleLayout(`
      <h1>Time is the one thing you cannot get back</h1>
      <p>${greeting(name, 'Hi')}, most students underestimate how long a thesis takes — until they are two weeks from the deadline with half the chapters unfinished.</p>
      <p>Here is what a thesis typically costs in time:</p>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Literature review</td>
          <td style="padding:10px 8px;text-align:right;color:#0f172a;font-weight:600;">4-8 weeks</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Methodology & framework</td>
          <td style="padding:10px 8px;text-align:right;color:#0f172a;font-weight:600;">2-4 weeks</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Writing & formatting</td>
          <td style="padding:10px 8px;text-align:right;color:#0f172a;font-weight:600;">6-12 weeks</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#334155;font-weight:700;">Total</td>
          <td style="padding:10px 8px;text-align:right;color:#0f172a;font-weight:700;">3-6 months</td>
        </tr>
      </table>

      <p>With Thesis Generator Premium, you get unlimited generations, full exports, and all citation styles — everything you need to submit in days instead of months.</p>

      <div class="callout" style="text-align:center;">
        <p style="font-size:13px;color:#64748b;margin:0 0 6px;font-weight:600;">USE CODE FOR 10% OFF:</p>
        <p style="font-size:24px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">See Plans</a>
    `, email),
  };
}

// Step 2 — Feature deep-dive
function conversion2({ name, email }: EmailParams): EmailResult {
  return {
    subject: '5 Premium features that save hours',
    html: lifecycleLayout(`
      <h1>What Premium actually gives you</h1>
      <p>${greeting(name, 'Hi')}, here are the five features paid users rely on most:</p>

      <h2>1. Unlimited thesis generations</h2>
      <p>Generate as many theses as you need. Test different topics, compare approaches, iterate until you are satisfied. Free users get one generation.</p>

      <h2>2. DOCX export</h2>
      <p>Download your thesis as a Word document and edit it directly. Add your personal data, adjust arguments, and submit — all in one familiar tool.</p>

      <h2>3. LaTeX export</h2>
      <p>For STEM fields, export directly to LaTeX and open in Overleaf. Equations, tables, and figures are properly formatted.</p>

      <h2>4. All citation styles</h2>
      <p>Switch between APA, Harvard, MLA, Chicago, and more. Different chapters, different requirements — no manual reformatting.</p>

      <h2>5. Priority generation</h2>
      <p>Your thesis is generated faster during peak hours. When everyone else is waiting, you are already reviewing chapters.</p>

      <a href="${APP_URL}/#pricing" class="btn">Upgrade to Premium</a>
    `, email),
  };
}

// Step 3 — Objection handling
function conversion3({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Honest answers to your questions',
    html: lifecycleLayout(`
      <h1>Questions we hear every day</h1>
      <p>${greeting(name, 'Hi')}, before upgrading, most students want to know the same things. Here are honest answers:</p>

      <div class="callout">
        <p><strong>"Is the output good enough for my advisor?"</strong><br>
        The generated thesis provides academic-grade structure, citations, and analysis. It is designed to be a strong first draft that you customize with your own insights and data.</p>
      </div>

      <div class="callout">
        <p><strong>"What if I need to change topics later?"</strong><br>
        Premium gives you unlimited generations. Change your topic, adjust your methodology, or start fresh — no extra cost.</p>
      </div>

      <div class="callout">
        <p><strong>"Is it worth the investment?"</strong><br>
        A typical student spends 400+ hours on their thesis. Even at minimum wage, that is thousands of dollars worth of time. Premium plans start at a fraction of that.</p>
      </div>

      <div class="callout">
        <p><strong>"Can I cancel anytime?"</strong><br>
        Both plans can be cancelled at any time. No lock-in, no hidden fees.</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">View Plans</a>
    `, email),
  };
}

// Step 4 — ROI / comparison
function conversion4({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'The real cost of writing a thesis manually',
    html: lifecycleLayout(`
      <h1>Let us do the math</h1>
      <p>${greeting(name, 'Hi')}, here is what thesis writing looks like with and without Thesis Generator:</p>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="border-bottom:2px solid #0f172a;">
          <td style="padding:10px 8px;font-weight:700;color:#0f172a;"></td>
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:#64748b;">Manual</td>
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:#0f172a;">With Premium</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Time to first draft</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">3-6 months</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">15 minutes</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Structure quality</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">Variable</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Consistent</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Citation formatting</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">Manual</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Automatic</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Tables and figures</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">Hours per table</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Auto-generated</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#334155;">Iterations</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">Start over</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Unlimited</td>
        </tr>
      </table>

      <p>Most thesis editing and consulting services charge $500-$2,000. Thesis Generator Premium gives you complete, structured drafts for a fraction of that — and you can generate as many as you need.</p>

      <div class="callout" style="text-align:center;">
        <p style="font-size:13px;color:#64748b;margin:0 0 6px;font-weight:600;">10% OFF WITH CODE:</p>
        <p style="font-size:24px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">Start Premium</a>
    `, email),
  };
}

// Step 5 — Scarcity / urgency
function conversion5({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your deadline is closer than you think',
    html: lifecycleLayout(`
      <h1>How many days until your submission?</h1>
      <p>${greeting(name, 'Hi')}, most students who come to Thesis Generator are already behind schedule. Here is what we know:</p>

      <div class="highlight">
        <p>73% of our users sign up within the last 30 days before their deadline.</p>
      </div>

      <p>If your submission date is approaching, here is the fastest path forward:</p>

      <table role="presentation" style="width:100%;border:0;border-spacing:0;margin:16px 0;">
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Upgrade to Premium</strong> — takes 30 seconds</p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Generate or regenerate your thesis</strong> — 15 minutes</p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Export to Word, edit, and submit</strong> — same day</p>
          </td>
        </tr>
      </table>

      <p>Do not wait until the last night. Upgrade now and give yourself the time to review, edit, and submit with confidence.</p>

      <div class="highlight">
        <p>Use code <strong>${DISCOUNT_CODE}</strong> at checkout for 10% off any plan.</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">Upgrade Now</a>
    `, email),
  };
}

// Step 6 — Final offer
function conversion6({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Final note about your thesis',
    html: lifecycleLayout(`
      <h1>${greeting(name, 'Hey')}, one last thought</h1>
      <p>This is the last email I will send about upgrading. I want to be direct about what is at stake:</p>

      <p>You already have a generated thesis in your dashboard. It has the structure, the citations, the methodology, the analysis. All the hard work is done.</p>

      <p>The only thing between you and a submission-ready document is the export. Premium unlocks:</p>

      <ul class="feature-list">
        <li>Clean PDF, DOCX, and LaTeX download</li>
        <li>No watermarks or restrictions</li>
        <li>Unlimited future generations</li>
        <li>All citation styles</li>
      </ul>

      <div class="callout">
        <p><strong>Pro Unlimited ($19/mo)</strong> gives you unlimited downloads with priority processing — no caps, no restrictions. Generate and export as many theses as you need.</p>
      </div>

      <div class="callout" style="text-align:center;">
        <p style="font-size:13px;color:#64748b;margin:0 0 6px;font-weight:600;">YOUR 10% OFF CODE:</p>
        <p style="font-size:24px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
        <p style="font-size:13px;color:#64748b;margin:6px 0 0;">Works on all plans</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">See Plans</a>

      <p>Whatever you decide, I hope Thesis Generator has been helpful. If you ever have questions, just reply to this email.</p>
      <p style="font-size:13px;color:#94a3b8;">This is the last email in this series.</p>
    `, email),
  };
}

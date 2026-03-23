/**
 * Post-generation nurture sequence — 5 emails for free users after thesis completion.
 * Trigger: Thesis status changes to 'completed' (free user).
 * Goal: Get them to upgrade to export/unlock their full thesis.
 *
 * Schedule:
 *   Step 1 — +0h (immediate): Your thesis is ready
 *   Step 2 — +1 day: Make it even better
 *   Step 3 — +3 days: Details advisors notice
 *   Step 4 — +5 days: Free vs Premium comparison
 *   Step 5 — +7 days: Final unlock reminder
 */

import { lifecycleLayout, greeting, APP_URL, type EmailParams, type EmailResult } from './lifecycle-layout';

const DISCOUNT_CODE = 'THESIS10';

export const POST_GEN_SEQUENCE: Record<number, (p: EmailParams) => EmailResult> = {
  1: postGen1,
  2: postGen2,
  3: postGen3,
  4: postGen4,
  5: postGen5,
};

export const POST_GEN_DELAYS_HOURS: Record<number, number> = {
  1: 0,    // immediate (already sent by finaliseThesis)
  2: 24,   // +1 day
  3: 72,   // +3 days
  4: 120,  // +5 days
  5: 168,  // +7 days
};

export const POST_GEN_TOTAL_STEPS = 5;

// Step 1 — Thesis ready (sent immediately by finaliseThesis — this is the fallback template)
function postGen1({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your thesis is ready to review',
    html: lifecycleLayout(`
      <h1>${greeting(name)}, your thesis has been generated</h1>
      <p>Your thesis is ready and waiting in your dashboard. You can review every chapter, section, table, and citation right now.</p>
      <a href="${APP_URL}" class="btn">View Your Thesis</a>
      <p>Here is what was generated:</p>
      <ul class="feature-list">
        <li>Full chapter structure (Introduction through Conclusion)</li>
        <li>Literature review with citations</li>
        <li>Methodology section with research design</li>
        <li>Results with tables and data analysis</li>
        <li>Discussion and recommendations</li>
      </ul>
      <p>Take some time to read through it. Tomorrow we will share a few tips on making it even stronger.</p>
    `, email),
  };
}

// Step 2 — Make it better
function postGen2({ name, email }: EmailParams): EmailResult {
  return {
    subject: '3 ways to improve your generated thesis',
    html: lifecycleLayout(`
      <h1>Make your thesis stand out</h1>
      <p>${greeting(name, 'Hi')}, you have a solid first draft. Here is how to take it from good to great:</p>

      <h2>1. Add your own data</h2>
      <p>The generated tables and charts use realistic placeholder data. Replace them with your actual research data — surveys, experiments, or case studies — and you have something uniquely yours.</p>

      <h2>2. Strengthen key arguments</h2>
      <p>Read through the Discussion chapter and add your personal analysis. Your advisor wants to see your critical thinking, and the generated structure gives you the perfect scaffold.</p>

      <h2>3. Expand the literature review</h2>
      <p>Thesis Generator includes relevant citations, but adding 5-10 sources from your own reading demonstrates deeper engagement with the field.</p>

      <div class="tip">
        <p><strong>Pro tip:</strong> Premium users can export to DOCX and edit directly in Word — making these changes is much faster than working from a PDF.</p>
      </div>

      <a href="${APP_URL}" class="btn">Review Your Thesis</a>
    `, email),
  };
}

// Step 3 — Details advisors notice
function postGen3({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'What your advisor will look for first',
    html: lifecycleLayout(`
      <h1>What advisors check before anything else</h1>
      <p>${greeting(name, 'Hi')}, after working with thousands of students, we have noticed advisors consistently focus on the same things:</p>

      <div class="callout">
        <p><strong>Consistent citation formatting</strong><br>
        Mixing citation styles is the fastest way to get a rewrite request. Premium export ensures every reference is perfectly formatted in your chosen style.</p>
      </div>

      <div class="callout">
        <p><strong>Professional document layout</strong><br>
        Margins, fonts, heading hierarchy, table numbering — these details signal quality before anyone reads a word.</p>
      </div>

      <div class="callout">
        <p><strong>Table of contents with page numbers</strong><br>
        Advisors use the TOC to navigate directly to sections they care about. A properly generated TOC saves them time and shows you are organized.</p>
      </div>

      <p>All of these come standard with a Premium export. Your thesis already has the content — the formatting is what makes it submission-ready.</p>
      <a href="${APP_URL}/#pricing" class="btn">See Premium Features</a>
    `, email),
  };
}

// Step 4 — Free vs Premium comparison
function postGen4({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Free vs Premium: what you are missing',
    html: lifecycleLayout(`
      <h1>What changes when you upgrade</h1>
      <p>${greeting(name, 'Hi')}, here is a clear breakdown of what you get with a Premium plan:</p>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="border-bottom:2px solid #0f172a;">
          <td style="padding:10px 8px;font-weight:700;color:#0f172a;">Feature</td>
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:#0f172a;">Free</td>
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:#0f172a;">Premium</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Thesis generations</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">1</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Unlimited</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">PDF export</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">Watermarked</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Clean</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">DOCX & LaTeX export</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">No</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Yes</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 8px;color:#334155;">Multiple citation styles</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">APA only</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">All styles</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#334155;">Priority generation</td>
          <td style="padding:10px 8px;text-align:center;color:#64748b;">No</td>
          <td style="padding:10px 8px;text-align:center;color:#0f172a;font-weight:600;">Yes</td>
        </tr>
      </table>

      <p>One thesis can take 3-6 months to write manually. Premium gives you unlimited generations to iterate, experiment with topics, and produce the strongest possible version.</p>

      <div class="callout" style="text-align:center;">
        <p style="font-size:13px;color:#64748b;margin:0 0 6px;font-weight:600;">10% OFF WITH CODE:</p>
        <p style="font-size:24px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">Upgrade Now</a>
    `, email),
  };
}

// Step 5 — Final unlock reminder
function postGen5({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Last reminder: unlock your full thesis',
    html: lifecycleLayout(`
      <h1>${greeting(name, 'Hey')}, your thesis is ready — let it work for you</h1>
      <p>A week ago you generated a thesis with Thesis Generator. It is sitting in your dashboard with all chapters, citations, tables, and analysis complete.</p>
      <p>Right now you can read it online, but you cannot export the full document. Here is what unlocking gives you:</p>
      <ul class="feature-list">
        <li>Download as PDF, DOCX, or LaTeX</li>
        <li>Clean formatting with no watermarks</li>
        <li>Properly numbered tables and figures</li>
        <li>Complete table of contents with page numbers</li>
        <li>Edit freely in Word or Overleaf</li>
      </ul>

      <div class="highlight">
        <p>Students who export and edit their generated thesis submit an average of <strong>4x faster</strong> than those who start from scratch.</p>
      </div>

      <div class="callout" style="text-align:center;">
        <p style="font-size:13px;color:#64748b;margin:0 0 6px;font-weight:600;">USE CODE FOR 10% OFF:</p>
        <p style="font-size:24px;font-weight:800;color:#0f172a;margin:0;letter-spacing:3px;">${DISCOUNT_CODE}</p>
      </div>

      <a href="${APP_URL}/#pricing" class="btn">Unlock Your Thesis</a>
      <p style="font-size:13px;color:#94a3b8;">This is the last email in this series. Reply any time if you have questions.</p>
    `, email),
  };
}

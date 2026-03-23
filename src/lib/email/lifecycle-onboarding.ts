/**
 * Onboarding sequence — 5 emails for new free users who haven't generated a thesis yet.
 * Trigger: Account creation (signup).
 * Goal: Get them to generate their first thesis.
 *
 * Schedule:
 *   Step 1 — Day 0 (immediate): Welcome
 *   Step 2 — Day 1: How it works
 *   Step 3 — Day 2: Choosing a great topic
 *   Step 4 — Day 4: Social proof
 *   Step 5 — Day 7: Your free thesis is waiting
 */

import { lifecycleLayout, greeting, APP_URL, type EmailParams, type EmailResult } from './lifecycle-layout';

const DISCOUNT_CODE = 'THESIS10';

export const ONBOARDING_SEQUENCE: Record<number, (p: EmailParams) => EmailResult> = {
  1: onboarding1,
  2: onboarding2,
  3: onboarding3,
  4: onboarding4,
  5: onboarding5,
};

export const ONBOARDING_DELAYS_HOURS: Record<number, number> = {
  1: 0,    // immediate
  2: 24,   // +1 day
  3: 48,   // +2 days
  4: 96,   // +4 days
  5: 168,  // +7 days
};

export const ONBOARDING_TOTAL_STEPS = 5;

// Step 1 — Welcome (sent immediately on signup)
function onboarding1({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Welcome to Thesis Generator',
    html: lifecycleLayout(`
      <h1>${greeting(name)}, welcome aboard</h1>
      <p>You now have access to the fastest way to produce a complete, structured thesis. No templates, no outlines — a real, full-length thesis generated from your topic.</p>
      <p>Here is what Thesis Generator builds for you:</p>
      <ul class="feature-list">
        <li>90+ pages with proper academic structure</li>
        <li>Introduction, Literature Review, Methodology, Results, Discussion, Conclusion</li>
        <li>Auto-generated tables, charts, and figures</li>
        <li>Citations in APA, Harvard, MLA, or Chicago format</li>
        <li>Export to PDF, DOCX, or LaTeX</li>
      </ul>
      <p>Every new account includes <strong>one free thesis generation</strong>. No credit card needed.</p>
      <a href="${APP_URL}" class="btn">Generate Your First Thesis</a>
      <p style="font-size:13px;color:#94a3b8;">It takes about 5 minutes to set up and 15 minutes to generate.</p>
    `, email),
  };
}

// Step 2 — How it works
function onboarding2({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'How Thesis Generator works (3 steps)',
    html: lifecycleLayout(`
      <h1>${greeting(name, 'Hey')}, here is the quickest path to a finished thesis</h1>
      <p>The entire process takes three steps:</p>

      <table role="presentation" style="width:100%;border:0;border-spacing:0;margin:16px 0;">
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Enter your topic and requirements</strong><br>
            <span style="color:#64748b;font-size:14px;">Subject area, degree level, citation style, and any specific instructions.</span></p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Click generate</strong><br>
            <span style="color:#64748b;font-size:14px;">Thesis Generator builds every chapter in parallel. You can watch the text appear live.</span></p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Review, edit, and export</strong><br>
            <span style="color:#64748b;font-size:14px;">Download as PDF, Word, or LaTeX — ready for your advisor.</span></p>
          </td>
        </tr>
      </table>

      <p>The whole process usually takes about 15 minutes. Most students spend 3-6 months doing this manually.</p>
      <a href="${APP_URL}" class="btn">Start Now</a>
    `, email),
  };
}

// Step 3 — Topic tips
function onboarding3({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'How to choose the right thesis topic',
    html: lifecycleLayout(`
      <h1>Choosing a topic that works</h1>
      <p>${greeting(name, 'Hi')}, the topic you pick makes a real difference in the quality of your thesis. Here are a few tips from students who got the best results:</p>

      <div class="callout">
        <p><strong>Be specific, not broad.</strong><br>
        "The impact of remote learning on university student engagement in STEM programs" works better than "Remote learning in education."</p>
      </div>

      <div class="callout">
        <p><strong>Include your context.</strong><br>
        Specify your degree level, field of study, and any methodological preferences. The more detail you give, the more accurate the output.</p>
      </div>

      <div class="callout">
        <p><strong>Add special instructions.</strong><br>
        Want a focus on qualitative methods? Need a specific theoretical framework? Add it to the instructions field and Thesis Generator will incorporate it.</p>
      </div>

      <div class="tip">
        <p><strong>Quick tip:</strong> You can generate multiple theses on different topics to compare approaches before committing to one direction.</p>
      </div>

      <a href="${APP_URL}" class="btn">Try Your Topic</a>
    `, email),
  };
}

// Step 4 — Social proof
function onboarding4({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'What students are saying',
    html: lifecycleLayout(`
      <h1>Real results from real students</h1>
      <p>${greeting(name, 'Hi')}, thousands of students have already used Thesis Generator. Here is what a few of them said:</p>

      <div class="testimonial">
        <p>"I was two weeks from my deadline with almost nothing written. Thesis Generator gave me a complete first draft overnight. My advisor said the structure was excellent."</p>
        <span class="author">Sarah K., Master's in Education</span>
      </div>

      <div class="testimonial">
        <p>"The auto-generated tables and methodology section alone saved me weeks. I just customized the data and it was ready."</p>
        <span class="author">James L., PhD candidate, Computer Science</span>
      </div>

      <div class="testimonial">
        <p>"I used the free generation to test it on my topic. The quality convinced me to upgrade immediately."</p>
        <span class="author">Ana M., MBA student</span>
      </div>

      <div class="stat">
        <div class="stat-number">10,000+</div>
        <div class="stat-label">theses generated by students worldwide</div>
      </div>

      <a href="${APP_URL}" class="btn">Generate Your Thesis</a>
    `, email),
  };
}

// Step 5 — Free thesis reminder
function onboarding5({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your free thesis is still waiting',
    html: lifecycleLayout(`
      <h1>${greeting(name, 'Hey')}, you still have a free thesis generation</h1>
      <p>Just a quick note — your account includes a free thesis generation and you have not used it yet.</p>
      <p>No credit card. No commitment. Enter your topic, click generate, and see the result in about 15 minutes.</p>

      <div class="callout">
        <p><strong>What you will get:</strong> A complete, structured thesis with all chapters, citations, tables, and figures — ready to review and customize.</p>
      </div>

      <p>If it is not useful, no harm done. But most students are surprised by how much time it saves.</p>

      <div class="tip">
        <p>When you are ready to upgrade, use code <strong>${DISCOUNT_CODE}</strong> for 10% off any plan.</p>
      </div>

      <a href="${APP_URL}" class="btn">Use Your Free Generation</a>
      <p style="font-size:13px;color:#94a3b8;">This is the last email in this series. If you have questions, just reply — we read every message.</p>
    `, email),
  };
}

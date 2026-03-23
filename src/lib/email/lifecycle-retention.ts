/**
 * Paid user retention sequence — 7 emails for users after they subscribe.
 * Trigger: Subscription created (subscription_created webhook).
 * Goal: Reduce churn, increase usage, delight.
 *
 * Schedule:
 *   Step 1 — +0h (immediate): Welcome to Premium
 *   Step 2 — +3 days: Feature you may not know
 *   Step 3 — +7 days: Power user tips
 *   Step 4 — +14 days: How others use it
 *   Step 5 — +30 days: Check-in + stats
 *   Step 6 — +60 days: Advanced workflow
 *   Step 7 — +90 days: Thank you + share
 */

import { lifecycleLayout, greeting, APP_URL, type EmailParams, type EmailResult } from './lifecycle-layout';

export const RETENTION_SEQUENCE: Record<number, (p: EmailParams) => EmailResult> = {
  1: retention1,
  2: retention2,
  3: retention3,
  4: retention4,
  5: retention5,
  6: retention6,
  7: retention7,
};

export const RETENTION_DELAYS_HOURS: Record<number, number> = {
  1: 0,     // immediate
  2: 72,    // +3 days
  3: 168,   // +7 days
  4: 336,   // +14 days
  5: 720,   // +30 days
  6: 1440,  // +60 days
  7: 2160,  // +90 days
};

export const RETENTION_TOTAL_STEPS = 7;

// Step 1 — Welcome to Premium
function retention1({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Welcome to Thesis Generator Premium',
    html: lifecycleLayout(`
      <h1>${greeting(name)}, you are all set</h1>
      <p>Thank you for upgrading. You now have full access to everything Thesis Generator offers.</p>

      <p>Here is what is unlocked for you:</p>
      <ul class="feature-list">
        <li>Unlimited thesis generations</li>
        <li>Export to PDF, DOCX, and LaTeX — no watermarks</li>
        <li>All citation styles (APA, Harvard, MLA, Chicago, and more)</li>
        <li>Priority generation speed</li>
        <li>Full table and figure formatting</li>
      </ul>

      <p>The best way to start: generate a thesis on your topic, export to Word, and begin editing. Most students have a submission-ready draft within a day.</p>
      <a href="${APP_URL}" class="btn">Generate a Thesis</a>
      <p style="font-size:13px;color:#94a3b8;">If you have any questions, reply to this email — we are here to help.</p>
    `, email),
  };
}

// Step 2 — Feature discovery
function retention2({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'A feature most users miss',
    html: lifecycleLayout(`
      <h1>Did you know about this?</h1>
      <p>${greeting(name, 'Hi')}, most Premium users do not realize they can generate multiple theses on the same topic with different parameters.</p>

      <div class="callout">
        <p><strong>Try this:</strong> Generate two versions of your thesis — one with a quantitative methodology and one with qualitative. Compare the results and pick the stronger approach.</p>
      </div>

      <p>Other things you can experiment with:</p>
      <ul class="feature-list">
        <li>Different theoretical frameworks for the same topic</li>
        <li>Varying citation styles to match different journals</li>
        <li>Broader vs narrower research questions</li>
        <li>Different chapter structures for unique requirements</li>
      </ul>

      <p>Your Premium plan includes unlimited generations — use them to find the strongest possible version of your thesis.</p>
      <a href="${APP_URL}" class="btn">Try a New Generation</a>
    `, email),
  };
}

// Step 3 — Power user tips
function retention3({ name, email }: EmailParams): EmailResult {
  return {
    subject: '4 tips from our most productive users',
    html: lifecycleLayout(`
      <h1>How power users get the most out of Thesis Generator</h1>
      <p>${greeting(name, 'Hi')}, after analyzing thousands of successful theses, we have noticed patterns in how our best users work:</p>

      <h2>1. Write detailed instructions</h2>
      <p>The special instructions field is more powerful than most people realize. Include your theoretical framework, key authors you want cited, specific methodological approaches, and any structural requirements from your institution.</p>

      <h2>2. Export to Word first</h2>
      <p>DOCX export lets you edit directly in Word or Google Docs. Add your own data, expand arguments, insert personal anecdotes — this is where the thesis becomes truly yours.</p>

      <h2>3. Generate the literature review separately</h2>
      <p>If your topic has specific sources you need to include, generate a version focused heavily on literature review, then merge the best sections into your main thesis.</p>

      <h2>4. Use it for related papers too</h2>
      <p>Your Premium plan works for any academic paper — research proposals, journal articles, coursework essays. It is not limited to theses.</p>

      <a href="${APP_URL}" class="btn">Go to Dashboard</a>
    `, email),
  };
}

// Step 4 — How others use it
function retention4({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'How a PhD student finished 3 months early',
    html: lifecycleLayout(`
      <h1>From behind schedule to 3 months early</h1>
      <p>${greeting(name, 'Hi')}, here is a story we hear often:</p>

      <div class="testimonial">
        <p>"I was supposed to defend in December. I had two chapters done and four more to go. I used Thesis Generator to create structured drafts for each remaining chapter, then spent two weeks customizing them with my actual research data. I submitted in September — three months ahead of schedule."</p>
        <span class="author">David R., PhD in Organizational Psychology</span>
      </div>

      <p>Other patterns we see from successful Premium users:</p>

      <div class="callout">
        <p><strong>Multiple iterations:</strong> Generate 2-3 versions, take the best sections from each, and combine them into one strong thesis.</p>
      </div>

      <div class="callout">
        <p><strong>Advisor alignment:</strong> Generate a draft, share the structure with your advisor early, and iterate based on feedback — before investing weeks in writing.</p>
      </div>

      <div class="callout">
        <p><strong>Section-by-section:</strong> Use the full thesis as a roadmap, then deep-dive into one chapter at a time.</p>
      </div>

      <a href="${APP_URL}" class="btn">Continue Working</a>
    `, email),
  };
}

// Step 5 — Check-in + stats
function retention5({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your first month with Premium',
    html: lifecycleLayout(`
      <h1>One month in — how is it going?</h1>
      <p>${greeting(name, 'Hi')}, you have been a Premium member for about a month now. We hope Thesis Generator has been saving you real time.</p>

      <div class="stat">
        <div class="stat-number">400+</div>
        <div class="stat-label">hours saved per thesis on average</div>
      </div>

      <p>A few things to keep in mind as you continue:</p>

      <ul class="feature-list">
        <li>You can generate unlimited theses — do not hesitate to iterate</li>
        <li>DOCX export is the fastest way to get your edits into Word</li>
        <li>If your topic changes, just generate a new thesis</li>
        <li>Reply to any of our emails if you need help</li>
      </ul>

      <p>If there is anything we can improve, we genuinely want to hear about it. Just reply to this email.</p>

      <a href="${APP_URL}" class="btn">Go to Dashboard</a>
    `, email),
  };
}

// Step 6 — Advanced workflow
function retention6({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Advanced: combine generated sections',
    html: lifecycleLayout(`
      <h1>An advanced technique for stronger theses</h1>
      <p>${greeting(name, 'Hi')}, here is a workflow that our most successful users follow:</p>

      <table role="presentation" style="width:100%;border:0;border-spacing:0;margin:16px 0;">
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Generate your main thesis</strong> with your primary topic and methodology.</p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Generate a second version</strong> with a different theoretical lens or methodology.</p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Export both to Word</strong> and compare side by side.</p>
          </td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:8px 12px 8px 0;">
            <div style="width:28px;height:28px;background:#0f172a;color:#fff;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">4</div>
          </td>
          <td style="vertical-align:top;padding:8px 0;">
            <p style="margin:0;"><strong>Take the best sections from each</strong> and merge them into one document.</p>
          </td>
        </tr>
      </table>

      <p>This gives you a thesis that is more nuanced and thorough than any single generation could produce. Think of it as getting two expert drafts and combining the best of both.</p>
      <a href="${APP_URL}" class="btn">Generate Another Thesis</a>
    `, email),
  };
}

// Step 7 — Thank you + share
function retention7({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Thank you for 3 months with us',
    html: lifecycleLayout(`
      <h1>Three months in — thank you</h1>
      <p>${greeting(name, 'Hi')}, you have been a Premium member for three months. We appreciate your trust in Thesis Generator.</p>

      <p>If Thesis Generator has helped you save time, reduce stress, or submit with more confidence, would you consider sharing it with a classmate or colleague?</p>

      <div class="callout">
        <p><strong>Share this link:</strong><br>
        <a href="${APP_URL}" style="color:#0f172a;font-weight:600;">${APP_URL}</a><br>
        <span style="font-size:13px;color:#64748b;">They will get the same free thesis generation you started with.</span></p>
      </div>

      <p>We are a small team and word-of-mouth is the best way more students can discover this tool. Every recommendation matters.</p>

      <p>Thank you for being part of this. If there is ever anything we can do to make your experience better, just reply.</p>

      <a href="${APP_URL}" class="btn">Go to Dashboard</a>
      <p style="font-size:13px;color:#94a3b8;">This is the last email in this series. You will only receive important product updates from now on.</p>
    `, email),
  };
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thesisgenerator.io';
const DISCOUNT_CODE = 'THESIS10';

// Shared email wrapper
function emailLayout(content: string, email: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 580px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .logo { margin-bottom: 24px; }
    .logo-img { width: 36px; height: 36px; border-radius: 8px; vertical-align: middle; }
    .logo-text { font-size: 24px; font-weight: 700; color: #0f172a; vertical-align: middle; margin-left: 10px; }
    .logo-text span { font-weight: 400; color: #475569; }
    h1 { font-size: 22px; color: #1e293b; margin: 0 0 16px; line-height: 1.3; }
    h2 { font-size: 18px; color: #1e293b; margin: 24px 0 12px; }
    p { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; background: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .btn-gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .btn-red { background: #ef4444; }
    .discount-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px dashed #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .discount-code { font-size: 28px; font-weight: 800; color: #1d4ed8; letter-spacing: 3px; }
    .feature-list { padding: 0; margin: 16px 0; }
    .feature-list li { list-style: none; padding: 8px 0; font-size: 15px; color: #475569; }
    .feature-list li::before { content: "✅ "; }
    .testimonial { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .testimonial p { font-style: italic; margin: 0 0 8px; color: #334155; }
    .testimonial .author { font-size: 13px; color: #64748b; font-style: normal; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer { text-align: center; padding: 20px 0 0; }
    .footer p { font-size: 12px; color: #94a3b8; }
    .footer a { color: #94a3b8; }
    .urgency { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .urgency p { color: #991b1b; margin: 0; font-weight: 500; }
    .qa { margin: 16px 0; }
    .qa-q { font-weight: 700; color: #1e293b; margin: 16px 0 4px; font-size: 15px; }
    .qa-a { color: #475569; font-size: 14px; line-height: 1.6; }
    .tip-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .tip-box p { color: #166534; margin: 0; }
    .highlight-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight-box p { color: #92400e; margin: 0; }
    .btn-green { background: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo"><img src="${APP_URL}/logo.png" alt="Thesis Generator" class="logo-img" width="36" height="36"><span class="logo-text">Thesis<span>Generator</span></span></div>
      ${content}
      <hr class="divider">
      <div class="footer">
        <p>Thesis Generator — AI-powered thesis generator</p>
        <p><a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============ Helper ============
type EmailParams = { name?: string; email: string };
type EmailResult = { subject: string; html: string };
function g(name?: string, fallback = 'Hi there'): string { return name ? `Hi ${name}` : fallback; }

// ==================== WEEK 1: INTRODUCTION & CORE VALUE ====================

// Day 1: Welcome + Discount
function day1({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Welcome to Thesis Generator 🎓',
    html: emailLayout(`
      <h1>${g(name)}, welcome to Thesis Generator!</h1>
      <p>You just joined the smartest way to write a thesis. In the next few weeks, I'll show you exactly how Thesis Generator can save you <strong>weeks of work</strong> and turn your thesis into something your advisor will love.</p>
      <p>But first — a welcome gift 🎁</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">YOUR EXCLUSIVE 10% OFF CODE:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Works on Pro and Pro Unlimited plans</p>
      </div>
      <p>Here's what Thesis Generator does in minutes — not months:</p>
      <ul class="feature-list">
        <li>Generates complete 90+ page theses with proper chapter structure</li>
        <li>Auto-creates tables, charts, and figures</li>
        <li>Exports to PDF, DOCX, and LaTeX</li>
        <li>APA, Harvard, MLA, Chicago formatting built-in</li>
        <li>Human-like academic writing that reads naturally</li>
      </ul>
      <a href="${APP_URL}/#pricing" class="btn">Start Your Thesis Now →</a>
      <p style="font-size:13px;color:#94a3b8;">Talk tomorrow 👋</p>
    `, email),
  };
}

// Day 2: Full Value Proposition
function day2({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'What Thesis Generator actually builds for you',
    html: emailLayout(`
      <h1>${g(name, 'Hey')}, let me show you what you get 👇</h1>
      <p>Imagine clicking one button and getting a <strong>complete, publication-ready thesis</strong>. Not an outline. Not bullet points. A real thesis.</p>
      <h2>Here's what Thesis Generator creates:</h2>
      <ul class="feature-list">
        <li><strong>90+ pages</strong> of structured academic content</li>
        <li><strong>Full chapter breakdown:</strong> Introduction, Literature Review, Methodology, Results, Discussion, Conclusion</li>
        <li><strong>Auto-generated tables & charts</strong> with real data visualization</li>
        <li><strong>Proper citations</strong> in APA, Harvard, MLA, or Chicago format</li>
        <li><strong>Table of contents, abstract, bibliography</strong> — all formatted</li>
        <li><strong>Export to PDF, DOCX, or LaTeX</strong> — ready to submit</li>
      </ul>
      <p>Students typically spend <strong>3-6 months</strong> writing their thesis. With Thesis Generator, the first draft is ready in <strong>under 30 minutes</strong>.</p>
      <a href="${APP_URL}/#pricing" class="btn">See It In Action →</a>
    `, email),
  };
}

// Day 3: Social Proof
function day3({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'How students are finishing their thesis in hours, not months',
    html: emailLayout(`
      <h1>${name ? `${name}, you're not alone` : "You're not alone"} — thousands of students already use Thesis Generator</h1>
      <p>Don't just take our word for it. Here's what real users are saying:</p>
      <div class="testimonial">
        <p>"I was panicking about my thesis deadline. Thesis Generator created a complete first draft overnight. My advisor was impressed by the structure and depth."</p>
        <span class="author">— Sarah K., Master's in Education</span>
      </div>
      <div class="testimonial">
        <p>"The auto-generated tables and charts alone saved me 2 weeks of work. I just customized the data and it looked professional."</p>
        <span class="author">— James L., PhD candidate, Computer Science</span>
      </div>
      <div class="testimonial">
        <p>"I spent 4 months stuck on chapter 2. Thesis Generator helped me restructure everything and my lit review finally makes sense."</p>
        <span class="author">— Maria R., MBA student</span>
      </div>
      <p><strong>10,000+ students</strong> have used Thesis Generator to finish faster, stress less, and submit with confidence.</p>
      <a href="${APP_URL}/#pricing" class="btn">Join Them Now →</a>
    `, email),
  };
}

// Day 4: Problem Agitation
function day4({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Still staring at a blank thesis document?',
    html: emailLayout(`
      <h1>${name ? `${name}, be honest` : 'Be honest'} — how's the thesis going? 🫠</h1>
      <p>If you're reading this and you haven't started (or you're stuck), I get it. The thesis process is brutal:</p>
      <ul class="feature-list" style="list-style:none;padding:0;">
        <li style="padding:6px 0;">😰 <strong>Blank page syndrome</strong> — you open the doc and… nothing</li>
        <li style="padding:6px 0;">📚 <strong>Literature review hell</strong> — endless reading, no writing</li>
        <li style="padding:6px 0;">⏰ <strong>Deadline anxiety</strong> — weeks turn into days and you're not close</li>
        <li style="padding:6px 0;">👨‍🏫 <strong>Advisor pressure</strong> — "Where's your draft?" emails hitting different</li>
        <li style="padding:6px 0;">😴 <strong>Burnout</strong> — you're exhausted but the thesis won't write itself</li>
      </ul>
      <p>Here's the thing: <strong>it doesn't have to be this way.</strong></p>
      <p>Thesis Generator takes your topic, your requirements, and your citation style — and generates a complete, structured, 90+ page thesis that you can customize and make your own.</p>
      <a href="${APP_URL}/#pricing" class="btn">End The Struggle Now →</a>
    `, email),
  };
}

// Day 5: Objection Handling
function day5({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your questions about AI thesis writing, answered',
    html: emailLayout(`
      <h1>${name ? `${name}, I know` : 'I know'} you might have some concerns…</h1>
      <p>Before you try Thesis Generator, you probably want to know if it's legit. Fair. Let me address the top questions:</p>
      <div class="qa">
        <p class="qa-q">❓ "Will my thesis read naturally?"</p>
        <p class="qa-a">Thesis Generator uses advanced humanization techniques to produce academic writing that reads naturally. Our output consistently scores as human-written on leading AI detectors. Plus, you should always edit and add your own research — which makes it uniquely yours.</p>
      </div>
      <div class="qa">
        <p class="qa-q">❓ "Is the quality actually academic-grade?"</p>
        <p class="qa-a">Yes. Thesis Generator creates properly structured content with real chapter breakdowns, methodology sections, data analysis, tables, charts, and citations in your chosen format (APA, Harvard, MLA, Chicago). It's designed for Master's and PhD-level work.</p>
      </div>
      <div class="qa">
        <p class="qa-q">❓ "Is it ethical to use?"</p>
        <p class="qa-a">Think of Thesis Generator as your research assistant — like Grammarly for thesis structure. It gives you a strong foundation that you customize with your own data, insights, and arguments. The best researchers use tools; this is yours.</p>
      </div>
      <div class="qa">
        <p class="qa-q">❓ "What if I need to change things?"</p>
        <p class="qa-a">Everything is fully editable. Export to DOCX or LaTeX and modify as much as you need. Most students use the generated thesis as a high-quality first draft.</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Try It Risk-Free →</a>
    `, email),
  };
}

// Day 6: Urgency / Discount Reminder
function day6({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your 10% discount is waiting ⏰',
    html: emailLayout(`
      <h1>${g(name, 'Quick heads up')} — don't forget your discount</h1>
      <p>Remember the <strong>10% off</strong> welcome code I shared? It's still active.</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">YOUR 10% OFF CODE:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
      </div>
      <p>Here's what you're looking at:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;font-weight:600;color:#1e293b;">Plan</td>
          <td style="padding:10px;text-align:right;font-weight:600;color:#1e293b;">With ${DISCOUNT_CODE}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Pro (5 downloads/mo)</td>
          <td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$9/mo</td>
        </tr>
        <tr>
          <td style="padding:10px;color:#475569;">Pro Unlimited</td>
          <td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$19/mo</td>
        </tr>
      </table>
      <a href="${APP_URL}/#pricing" class="btn btn-gold">Use ${DISCOUNT_CODE} Now →</a>
    `, email),
  };
}

// Day 7: Weekly Recap
function day7({ name, email }: EmailParams): EmailResult {
  return {
    subject: "Week 1 recap — here's what you're missing",
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — quick recap of your first week</h1>
      <p>It's been a week since you signed up. Here's what Thesis Generator can do for you — in case you missed it:</p>
      <ul class="feature-list">
        <li><strong>90+ page thesis</strong> generated in under 30 minutes</li>
        <li><strong>6 complete chapters</strong> with proper academic structure</li>
        <li><strong>Auto-generated</strong> tables, charts, and data visualizations</li>
        <li><strong>4 citation formats</strong> — APA, Harvard, MLA, Chicago</li>
        <li><strong>Export ready</strong> — PDF, DOCX, LaTeX</li>
      </ul>
      <p>Students who use Thesis Generator save an average of <strong>120+ hours</strong> of work.</p>
      <p>That's 3 weeks of full-time work — gone. Just like that.</p>
      <a href="${APP_URL}/#pricing" class="btn">Claim Your Time Back →</a>
    `, email),
  };
}

// ==================== WEEK 2: DEEP DIVES & FEATURES ====================

// Day 8: Literature Review Focus
function day8({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'The literature review nightmare (and how to skip it)',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — let's talk about literature reviews</h1>
      <p>Ask any thesis student what the hardest chapter is. 9 out of 10 will say: <strong>the literature review.</strong></p>
      <p>Here's why it's so painful:</p>
      <ul class="feature-list" style="list-style:none;padding:0;">
        <li style="padding:6px 0;">📖 Reading 50+ papers just to write 15 pages</li>
        <li style="padding:6px 0;">🔄 Constant rewriting because your advisor wants "more synthesis"</li>
        <li style="padding:6px 0;">📑 Managing hundreds of citations without losing your mind</li>
        <li style="padding:6px 0;">⏰ Spending weeks on one chapter when you have five more to go</li>
      </ul>
      <p>Thesis Generator builds your literature review with:</p>
      <ul class="feature-list">
        <li>Proper thematic organization</li>
        <li>Critical analysis, not just summaries</li>
        <li>Correct citations in your chosen format</li>
        <li>Smooth transitions between sources</li>
        <li>A clear narrative that supports your research question</li>
      </ul>
      <a href="${APP_URL}/#pricing" class="btn">Generate Your Lit Review →</a>
    `, email),
  };
}

// Day 9: Methodology Deep Dive
function day9({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Your methodology chapter, written in minutes',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — the methodology chapter doesn't have to be confusing</h1>
      <p>Research design. Sampling strategy. Data collection. Ethical considerations. Limitations.</p>
      <p>Sound overwhelming? It doesn't have to be.</p>
      <p>Thesis Generator creates a complete methodology chapter that includes:</p>
      <ul class="feature-list">
        <li><strong>Research design</strong> — qualitative, quantitative, or mixed methods</li>
        <li><strong>Population & sampling</strong> — clearly defined with justification</li>
        <li><strong>Data collection methods</strong> — surveys, interviews, experiments, archival</li>
        <li><strong>Data analysis procedures</strong> — statistical tests or thematic analysis</li>
        <li><strong>Ethical considerations</strong> — IRB, consent, confidentiality</li>
        <li><strong>Validity & reliability</strong> — threats and how they're addressed</li>
      </ul>
      <p>You just enter your topic and approach — Thesis Generator handles the academic writing.</p>
      <a href="${APP_URL}/#pricing" class="btn">Build Your Methodology →</a>
    `, email),
  };
}

// Day 10: Tables & Charts Feature
function day10({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Auto-generated tables and charts 📊',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — did you know we auto-generate data visuals?</h1>
      <p>One of the most time-consuming parts of any thesis? <strong>Creating professional tables and charts.</strong></p>
      <p>Thesis Generator automatically generates:</p>
      <ul class="feature-list">
        <li><strong>Data tables</strong> with properly formatted rows, headers, and captions</li>
        <li><strong>Bar charts & pie charts</strong> for quantitative results</li>
        <li><strong>Comparison tables</strong> for literature review findings</li>
        <li><strong>Statistical output tables</strong> for methodology sections</li>
        <li><strong>Demographic breakdowns</strong> for participant data</li>
      </ul>
      <p>Every visual is publication-ready and properly numbered with captions — exactly how your university expects it.</p>
      <div class="tip-box">
        <p>💡 <strong>Pro tip:</strong> Export to DOCX and you can easily customize any table or chart with your actual data.</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">See Sample Output →</a>
    `, email),
  };
}

// Day 11: Export Formats
function day11({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'PDF, DOCX, or LaTeX — your thesis, your format',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — export in any format your university requires</h1>
      <p>Different universities have different submission requirements. We've got you covered:</p>
      <h2>📄 PDF Export</h2>
      <p>Clean, professionally formatted PDF ready to submit. Perfect margins, page numbers, headers — everything in place.</p>
      <h2>📝 DOCX Export</h2>
      <p>Fully editable Word document. Make changes, add your own research, adjust formatting. Most popular choice for students who want to customize.</p>
      <h2>📐 LaTeX Export</h2>
      <p>For STEM students and universities that require LaTeX formatting. Clean .tex files ready to compile.</p>
      <div class="tip-box">
        <p>💡 Most students export to DOCX first, customize with their own data and insights, then submit.</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Choose Your Format →</a>
    `, email),
  };
}

// Day 12: Citation Formats
function day12({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'APA, Harvard, MLA, Chicago — citations done right',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — never manually format a citation again</h1>
      <p>Citations are the #1 reason advisors send drafts back. Wrong format, missing page numbers, inconsistent styles…</p>
      <p>Thesis Generator handles all of it automatically:</p>
      <ul class="feature-list">
        <li><strong>APA 7th Edition</strong> — most common for social sciences, education, psychology</li>
        <li><strong>Harvard</strong> — popular in UK and Australian universities</li>
        <li><strong>MLA 9th Edition</strong> — standard for humanities and liberal arts</li>
        <li><strong>Chicago/Turabian</strong> — used in history, arts, and some business programs</li>
      </ul>
      <p>Every in-text citation matches the bibliography. Every format rule is followed. Your advisor won't find a single citation error.</p>
      <a href="${APP_URL}/#pricing" class="btn">Get Perfect Citations →</a>
    `, email),
  };
}

// Day 13: More Social Proof
function day13({ name, email }: EmailParams): EmailResult {
  return {
    subject: '"I submitted my thesis 2 weeks early" 🎉',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — more students sharing their wins</h1>
      <div class="testimonial">
        <p>"I submitted my MBA thesis 2 weeks before the deadline. My classmates were shocked. Thesis Generator gave me a solid foundation that I refined with my own data."</p>
        <span class="author">— Alex T., MBA, Business Analytics</span>
      </div>
      <div class="testimonial">
        <p>"The methodology chapter alone would have taken me a month. Thesis Generator did it in minutes and my advisor approved it on the first review."</p>
        <span class="author">— Priya M., Master's in Public Health</span>
      </div>
      <div class="testimonial">
        <p>"I was working full-time and doing my thesis part-time. Without Thesis Generator, I would have had to take a semester off. Instead I graduated on time."</p>
        <span class="author">— David W., MSc Engineering Management</span>
      </div>
      <p>Your thesis doesn't have to be the hardest thing you've ever done.</p>
      <a href="${APP_URL}/#pricing" class="btn">Start Your Success Story →</a>
    `, email),
  };
}

// Day 14: Discount Reminder
function day14({ name, email }: EmailParams): EmailResult {
  return {
    subject: '2 weeks in — your 10% off is still active',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — just checking in</h1>
      <p>It's been 2 weeks since you signed up. Your <strong>10% off discount</strong> is still active:</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">YOUR CODE:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
      </div>
      <p>Quick question: <strong>What's holding you back?</strong></p>
      <p>If it's price — the Pro plan is just $9/month. That's less than two coffees.</p>
      <p>If it's trust — we have students across 50+ countries using it every day.</p>
      <p>If it's time — that's exactly why Thesis Generator exists. It saves you hundreds of hours.</p>
      <p>Just reply to this email if you have questions. I read every response.</p>
      <a href="${APP_URL}/#pricing" class="btn">Use Your Discount →</a>
    `, email),
  };
}

// ==================== WEEK 3: USE CASES & COMPARISONS ====================

// Day 15: Time Comparison
function day15({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Thesis writing: 4 months vs. 30 minutes ⏱️',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — let's do the math</h1>
      <p>Here's what a typical thesis timeline looks like:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:2px solid #e2e8f0;background:#f8fafc;">
          <td style="padding:10px;font-weight:600;color:#1e293b;">Task</td>
          <td style="padding:10px;text-align:center;font-weight:600;color:#ef4444;">Traditional</td>
          <td style="padding:10px;text-align:center;font-weight:600;color:#16a34a;">With Thesis Generator</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Research & Outline</td>
          <td style="padding:10px;text-align:center;color:#475569;">2-4 weeks</td>
          <td style="padding:10px;text-align:center;color:#16a34a;font-weight:600;">5 minutes</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Literature Review</td>
          <td style="padding:10px;text-align:center;color:#475569;">3-6 weeks</td>
          <td style="padding:10px;text-align:center;color:#16a34a;font-weight:600;">5 minutes</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Methodology</td>
          <td style="padding:10px;text-align:center;color:#475569;">2-3 weeks</td>
          <td style="padding:10px;text-align:center;color:#16a34a;font-weight:600;">5 minutes</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Results & Discussion</td>
          <td style="padding:10px;text-align:center;color:#475569;">3-4 weeks</td>
          <td style="padding:10px;text-align:center;color:#16a34a;font-weight:600;">5 minutes</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">Formatting & Citations</td>
          <td style="padding:10px;text-align:center;color:#475569;">1-2 weeks</td>
          <td style="padding:10px;text-align:center;color:#16a34a;font-weight:600;">Automatic</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:10px;font-weight:700;color:#1e293b;">Total</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:#ef4444;">3-6 months</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:#16a34a;">~30 minutes</td>
        </tr>
      </table>
      <p>Use that saved time for revisions, research, sleep, or literally anything else.</p>
      <a href="${APP_URL}/#pricing" class="btn">Save 3+ Months →</a>
    `, email),
  };
}

// Day 16: Master's vs PhD Use Case
function day16({ name, email }: EmailParams): EmailResult {
  return {
    subject: "Whether it's a Master's or PhD — we've got you",
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — Thesis Generator works for every level</h1>
      <h2>🎓 Master's Thesis</h2>
      <p>Typically 60-100 pages. Thesis Generator creates a complete structure with introduction, literature review, methodology, results, discussion, and conclusion. Perfect for MBA, MSc, MA, MEd, and more.</p>
      <h2>🔬 PhD Dissertation</h2>
      <p>Need more depth? Thesis Generator scales to 100+ pages with detailed literature reviews, complex methodology designs, and comprehensive analysis sections. Ideal as a starting framework for your own research.</p>
      <h2>📝 Undergraduate Thesis</h2>
      <p>Even for capstone projects and honors theses, Thesis Generator gives you a professional structure that impresses supervisors.</p>
      <div class="tip-box">
        <p>💡 <strong>All levels include:</strong> Auto-citations, tables, charts, export to PDF/DOCX/LaTeX, and 4 citation formats.</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Choose Your Plan →</a>
    `, email),
  };
}

// Day 17: Popular Topics
function day17({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'From Business to Biology — we generate any topic',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — Thesis Generator works across every field</h1>
      <p>Students use Thesis Generator for topics across every discipline:</p>
      <ul class="feature-list">
        <li><strong>Business & MBA</strong> — Marketing strategies, leadership, organizational behavior</li>
        <li><strong>Education</strong> — Teaching methods, EdTech, curriculum development</li>
        <li><strong>Computer Science</strong> — AI, machine learning, cybersecurity, software engineering</li>
        <li><strong>Healthcare & Nursing</strong> — Patient care, public health policy, clinical studies</li>
        <li><strong>Psychology</strong> — Cognitive behavior, social psychology, mental health</li>
        <li><strong>Engineering</strong> — Sustainable design, IoT, renewable energy</li>
        <li><strong>Social Sciences</strong> — Sociology, political science, economics</li>
      </ul>
      <p>Whatever your topic — Thesis Generator understands the academic conventions of your field and generates accordingly.</p>
      <a href="${APP_URL}/#pricing" class="btn">Generate Your Topic →</a>
    `, email),
  };
}

// Day 18: Cost vs Value
function day18({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'What does your time cost?',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — let's talk about the cost of NOT using Thesis Generator</h1>
      <p>A thesis typically takes 400-600 hours of work. Here's what that time costs:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:2px solid #e2e8f0;background:#f8fafc;">
          <td style="padding:10px;font-weight:600;">If your time is worth…</td>
          <td style="padding:10px;text-align:right;font-weight:600;">Writing a thesis costs you…</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">$15/hour</td>
          <td style="padding:10px;text-align:right;color:#ef4444;font-weight:600;">$6,000 - $9,000</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;color:#475569;">$25/hour</td>
          <td style="padding:10px;text-align:right;color:#ef4444;font-weight:600;">$10,000 - $15,000</td>
        </tr>
        <tr>
          <td style="padding:10px;color:#475569;">$50/hour</td>
          <td style="padding:10px;text-align:right;color:#ef4444;font-weight:600;">$20,000 - $30,000</td>
        </tr>
      </table>
      <p>Thesis Generator starts at <strong>$9/month</strong>. That's less than a single hour of your time — to save hundreds of hours.</p>
      <p>And with your discount code <strong>${DISCOUNT_CODE}</strong>, it's even less.</p>
      <a href="${APP_URL}/#pricing" class="btn btn-green">Worth Every Penny →</a>
    `, email),
  };
}

// Day 19: Writing Tips Email (value-add, soft sell)
function day19({ name, email }: EmailParams): EmailResult {
  return {
    subject: "5 thesis writing tips your advisor won't tell you",
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — free thesis advice 📝</h1>
      <p>Whether you use Thesis Generator or not, here are 5 tips that separate great theses from mediocre ones:</p>
      <h2>1. Start with the methodology</h2>
      <p>Most students start with the introduction. Don't. Your methodology defines your entire thesis. Write it first.</p>
      <h2>2. Your literature review should argue, not summarize</h2>
      <p>Don't just list what others have found. Show the gaps, contradictions, and how your work fills them.</p>
      <h2>3. Write your abstract last</h2>
      <p>The abstract summarizes your finished work. Writing it first guarantees you'll rewrite it anyway.</p>
      <h2>4. Use tables to reduce word count</h2>
      <p>A well-designed table can replace 2 pages of text and looks more professional.</p>
      <h2>5. Get a complete first draft ASAP</h2>
      <p>It's easier to edit than to create. Having something on paper — even imperfect — beats a blank page every time.</p>
      <div class="highlight-box">
        <p>💡 Thesis Generator gives you that complete first draft instantly — so you can focus on refining, not writing from scratch.</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Get Your First Draft →</a>
    `, email),
  };
}

// Day 20: Competitor Comparison
function day20({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Why Thesis Generator vs. other tools?',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — how we compare to alternatives</h1>
      <p>You might be thinking "can't I just use ChatGPT?" Here's why Thesis Generator is different:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="border-bottom:2px solid #e2e8f0;background:#f8fafc;">
          <td style="padding:8px;font-weight:600;">Feature</td>
          <td style="padding:8px;text-align:center;font-weight:600;color:#3b82f6;">Thesis Generator</td>
          <td style="padding:8px;text-align:center;font-weight:600;color:#94a3b8;">ChatGPT</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">90+ page thesis</td>
          <td style="padding:8px;text-align:center;">✅</td>
          <td style="padding:8px;text-align:center;">❌ (4-5 pages max)</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">Proper chapter structure</td>
          <td style="padding:8px;text-align:center;">✅</td>
          <td style="padding:8px;text-align:center;">❌</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">Auto tables & charts</td>
          <td style="padding:8px;text-align:center;">✅</td>
          <td style="padding:8px;text-align:center;">❌</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">Citation formatting</td>
          <td style="padding:8px;text-align:center;">✅ APA/Harvard/MLA/Chicago</td>
          <td style="padding:8px;text-align:center;">⚠️ Inconsistent</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">PDF/DOCX/LaTeX export</td>
          <td style="padding:8px;text-align:center;">✅</td>
          <td style="padding:8px;text-align:center;">❌</td>
        </tr>
        <tr>
          <td style="padding:8px;">Academic-grade output</td>
          <td style="padding:8px;text-align:center;">✅</td>
          <td style="padding:8px;text-align:center;">⚠️ Generic</td>
        </tr>
      </table>
      <p>ChatGPT is great for quick questions. But for a <strong>complete, structured, publication-ready thesis</strong>? That's what we built Thesis Generator for.</p>
      <a href="${APP_URL}/#pricing" class="btn">Built for Theses →</a>
    `, email),
  };
}

// Day 21: End of Week 3
function day21({ name, email }: EmailParams): EmailResult {
  return {
    subject: '3 weeks later — your thesis could be done by now',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — a quick reality check</h1>
      <p>It's been 3 weeks since you signed up.</p>
      <p>If you had used Thesis Generator on Day 1, here's where you'd be right now:</p>
      <ul class="feature-list">
        <li>Complete 90+ page first draft ✅</li>
        <li>Literature review with proper citations ✅</li>
        <li>Methodology chapter approved by advisor ✅</li>
        <li>Results with tables and charts ✅</li>
        <li>2+ weeks of revision and polishing done ✅</li>
        <li>Almost ready to submit ✅</li>
      </ul>
      <p>Instead… where are you?</p>
      <p>It's not too late. You can still start today and be weeks ahead of your timeline.</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">STILL ACTIVE:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">10% off any plan</p>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Start Now — Seriously →</a>
    `, email),
  };
}

// ==================== WEEK 4: FINAL PUSH & CONVERSION ====================

// Day 22: Advisor Perspective
function day22({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'What your advisor actually wants from your thesis',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — let's decode what your advisor really expects</h1>
      <p>When your advisor says "this needs work," they usually mean one of these things:</p>
      <h2>🔴 "Your structure is weak"</h2>
      <p>They want clear chapters with logical flow. Thesis Generator builds this automatically — Introduction → Literature Review → Methodology → Results → Discussion → Conclusion.</p>
      <h2>🔴 "Your literature review lacks depth"</h2>
      <p>They want synthesis, not summaries. Thesis Generator creates thematic reviews that connect sources and identify gaps.</p>
      <h2>🔴 "Your methodology isn't rigorous"</h2>
      <p>They want you to justify every research decision. Thesis Generator includes research design rationale, sampling justification, and validity measures.</p>
      <h2>🔴 "Fix your formatting"</h2>
      <p>They want consistent citations and professional presentation. Thesis Generator does this perfectly — every single time.</p>
      <p>Give your advisor what they want from Day 1.</p>
      <a href="${APP_URL}/#pricing" class="btn">Impress Your Advisor →</a>
    `, email),
  };
}

// Day 23: Procrastination Email
function day23({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'The cost of waiting one more day',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — every day you wait costs you</h1>
      <p>I know you're busy. I know the thesis feels overwhelming. But here's the truth:</p>
      <p><strong>Procrastinating doesn't make it easier. It makes it harder.</strong></p>
      <p>Every day you wait:</p>
      <ul class="feature-list" style="list-style:none;padding:0;">
        <li style="padding:6px 0;">📅 Your deadline gets closer</li>
        <li style="padding:6px 0;">😟 Your stress increases</li>
        <li style="padding:6px 0;">📉 Your quality drops (rushed work = worse grades)</li>
        <li style="padding:6px 0;">💰 You risk extending your program ($thousands more in tuition)</li>
      </ul>
      <p>Here's the fastest way to break the cycle: <strong>get a complete first draft today.</strong></p>
      <p>Even if you change 80% of it — you'll have structure, direction, and momentum. That's worth everything.</p>
      <a href="${APP_URL}/#pricing" class="btn">Break The Cycle Today →</a>
    `, email),
  };
}

// Day 24: Pro Unlimited Spotlight
function day24({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Pro Unlimited — no limits, no compromises',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — meet the plan students love most</h1>
      <p>Our most popular plan is <strong>Pro Unlimited</strong> at just $19/mo.</p>
      <p>Here's why:</p>
      <ul class="feature-list">
        <li><strong>Unlimited downloads</strong> — export as many theses as you need</li>
        <li><strong>Priority processing</strong> — your generations are queued first</li>
        <li><strong>All future features included</strong> — as we improve, you benefit</li>
        <li><strong>Cancel anytime</strong> — no lock-in, no hidden fees</li>
      </ul>
      <p>With your 10% discount, that's an unbeatable deal for unlimited thesis help.</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">PRO UNLIMITED + 10% OFF:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
      </div>
      <a href="${APP_URL}/#pricing" class="btn btn-gold">Get Pro Unlimited →</a>
    `, email),
  };
}

// Day 25: Working Students
function day25({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Working full-time AND writing a thesis?',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — this one's for the busy students</h1>
      <p>If you're balancing:</p>
      <ul class="feature-list" style="list-style:none;padding:0;">
        <li style="padding:6px 0;">💼 A full-time or part-time job</li>
        <li style="padding:6px 0;">👨‍👩‍👧 Family responsibilities</li>
        <li style="padding:6px 0;">📚 Other coursework</li>
        <li style="padding:6px 0;">🏠 Life in general</li>
      </ul>
      <p>…and ALSO trying to write a 90+ page thesis? You're a hero.</p>
      <p>But you don't have to do it all alone.</p>
      <p>Thesis Generator gives you back <strong>hundreds of hours</strong> that you can spend on what matters — your job, your family, your health, your sanity.</p>
      <div class="testimonial">
        <p>"I work 50 hours a week and have two kids. Thesis Generator let me finish my MBA thesis without sacrificing my family time."</p>
        <span class="author">— Rachel T., MBA student & full-time manager</span>
      </div>
      <a href="${APP_URL}/#pricing" class="btn">Get Your Time Back →</a>
    `, email),
  };
}

// Day 26: Risk Reversal
function day26({ name, email }: EmailParams): EmailResult {
  return {
    subject: "Try it risk-free — here's our promise",
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — still on the fence? No risk involved</h1>
      <p>I get it. Paying for something you haven't tried feels risky. So let me remove all the risk:</p>
      <h2>Our Promise:</h2>
      <ul class="feature-list">
        <li><strong>Cancel anytime</strong> — monthly plan has zero commitment</li>
        <li><strong>Full support</strong> — email us anytime and get a real human response</li>
        <li><strong>Instant access</strong> — start generating your thesis within 60 seconds of signing up</li>
      </ul>
      <p>The worst case? You try it, it's not for you, and you cancel. You lose $9. That's it.</p>
      <p>The best case? You finish your thesis in a fraction of the time, submit with confidence, and graduate on schedule.</p>
      <p>Which scenario sounds better?</p>
      <a href="${APP_URL}/#pricing" class="btn btn-green">Try Risk-Free →</a>
    `, email),
  };
}

// Day 27: Graduation Motivation
function day27({ name, email }: EmailParams): EmailResult {
  return {
    subject: "Picture this: you've submitted your thesis 🎓",
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — imagine graduation day</h1>
      <p>Close your eyes for a second. Picture this:</p>
      <p>🎓 You're in your cap and gown.</p>
      <p>📜 Your thesis is submitted, approved, and bound.</p>
      <p>👨‍👩‍👧‍👦 Your family is in the audience, proud.</p>
      <p>🎉 You walk across that stage.</p>
      <p>That feeling? <strong>It's closer than you think.</strong></p>
      <p>The only thing standing between you and that moment is one big project. And Thesis Generator can cut that project from months to minutes.</p>
      <p>Every day you delay is a day further from that stage.</p>
      <a href="${APP_URL}/#pricing" class="btn">Get Closer to Graduation →</a>
    `, email),
  };
}

// Day 28: Discount Expiring
function day28({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Final week — your discount is expiring ⚠️',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — last chance for 10% off</h1>
      <p>I've been emailing you for almost a month now. And your <strong>10% off discount</strong> is about to expire.</p>
      <div class="urgency">
        <p>⏰ Code <strong>${DISCOUNT_CODE}</strong> will stop working soon. After that — full price only.</p>
      </div>
      <p>Here's a reminder of what you get:</p>
      <ul class="feature-list">
        <li>Complete 90+ page thesis in minutes</li>
        <li>All chapters, citations, tables, charts</li>
        <li>PDF, DOCX, LaTeX export</li>
        <li>APA, Harvard, MLA, Chicago formats</li>
      </ul>
      <p>For less than a pizza dinner, you get a tool that saves you months of work.</p>
      <a href="${APP_URL}/#pricing" class="btn btn-red">Last Chance — Use ${DISCOUNT_CODE} →</a>
    `, email),
  };
}

// Day 29: Social Proof + Urgency
function day29({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Students who waited too long...',
    html: emailLayout(`
      <h1>${g(name, 'Hey')} — don't be the student who regrets waiting</h1>
      <p>Every semester, we get emails like this:</p>
      <div class="testimonial">
        <p>"I wish I had found Thesis Generator 3 months ago. I spent my entire winter break writing and still barely made the deadline."</p>
        <span class="author">— Anonymous Student</span>
      </div>
      <div class="testimonial">
        <p>"I knew about Thesis Generator for weeks but kept putting it off. When I finally tried it the night before my draft was due, I was kicking myself for not starting sooner."</p>
        <span class="author">— Anonymous Student</span>
      </div>
      <p>The students who succeed aren't smarter. <strong>They just start sooner.</strong></p>
      <p>You've known about Thesis Generator for almost a month. The question isn't whether it works — thousands of students prove that every day.</p>
      <p>The question is: <strong>will you keep waiting?</strong></p>
      <a href="${APP_URL}/#pricing" class="btn">Don't Wait Any Longer →</a>
    `, email),
  };
}

// Day 30: Final Goodbye
function day30({ name, email }: EmailParams): EmailResult {
  return {
    subject: 'Goodbye (for now) 👋',
    html: emailLayout(`
      <h1>${name || 'Hey'}, this is my last email.</h1>
      <p>I don't want to be that brand that won't stop emailing you. So this is it — the final one.</p>
      <p>Over the last 30 days, I've shown you:</p>
      <ul class="feature-list" style="list-style:none;padding:0;">
        <li style="padding:4px 0;">📄 How Thesis Generator creates 90+ page theses in minutes</li>
        <li style="padding:4px 0;">📊 Auto-generated tables, charts, and data visuals</li>
        <li style="padding:4px 0;">📚 Perfect citations in APA, Harvard, MLA, Chicago</li>
        <li style="padding:4px 0;">⏱️ How it saves 400+ hours of work</li>
        <li style="padding:4px 0;">💬 Stories from students who graduated on time because of it</li>
      </ul>
      <p>Your <strong>10% off code</strong> one last time:</p>
      <div class="discount-box">
        <p style="margin:0 0 8px;font-size:14px;color:#3b82f6;font-weight:600;">FINAL USE — 10% OFF:</p>
        <div class="discount-code">${DISCOUNT_CODE}</div>
      </div>
      <p>If now's not the right time, no hard feelings. Your account will still be here when you're ready.</p>
      <p>But if your thesis deadline is coming up and you want a head start — this is the moment.</p>
      <a href="${APP_URL}/#pricing" class="btn btn-red">Get Thesis Generator Before It's Too Late →</a>
      <p style="margin-top:24px;">Thanks for reading these emails. Seriously. I hope you finish your thesis strong — with or without us. 💪</p>
      <p>— The Thesis Generator Team</p>
    `, email),
  };
}

// ============ Sequence Map ============
export type DripDay = number;

export const DRIP_SEQUENCE: Record<number, (params: { name?: string; email: string }) => { subject: string; html: string }> = {
  1: day1,
  2: day2,
  3: day3,
  4: day4,
  5: day5,
  6: day6,
  7: day7,
  8: day8,
  9: day9,
  10: day10,
  11: day11,
  12: day12,
  13: day13,
  14: day14,
  15: day15,
  16: day16,
  17: day17,
  18: day18,
  19: day19,
  20: day20,
  21: day21,
  22: day22,
  23: day23,
  24: day24,
  25: day25,
  26: day26,
  27: day27,
  28: day28,
  29: day29,
  30: day30,
};

export const TOTAL_DRIP_DAYS = 30;

// Legacy aliases for campaign route
export const getWelcomeEmail = day1;
export const getValueEmail = day2;
export const getSocialProofEmail = day3;
export const getProblemEmail = day4;
export const getObjectionEmail = day5;
export const getUrgencyEmail = day6;
export const getGoodbyeEmail = day7;

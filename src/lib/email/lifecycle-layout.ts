/**
 * Professional email layout for lifecycle emails.
 * White background, black text, clean typography — opposite of the dark web app.
 */

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thesisgenerator.io';

export function lifecycleLayout(content: string, email: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px 36px; }
    .logo { margin-bottom: 28px; }
    .logo-img { width: 36px; height: 36px; border-radius: 8px; vertical-align: middle; }
    .logo-text { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; vertical-align: middle; margin-left: 10px; }
    .logo-light { font-weight: 400; }
    h1 { font-size: 20px; color: #0f172a; margin: 0 0 16px; line-height: 1.4; font-weight: 700; }
    h2 { font-size: 17px; color: #0f172a; margin: 24px 0 10px; font-weight: 600; }
    p { font-size: 15px; color: #334155; line-height: 1.7; margin: 0 0 16px; }
    a { color: #0f172a; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0 24px; letter-spacing: 0.2px; }
    .btn:hover { background: #1e293b; }
    .btn-outline { display: inline-block; background: transparent; color: #0f172a !important; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0 24px; border: 2px solid #e2e8f0; }
    .feature-list { padding: 0; margin: 16px 0; }
    .feature-list li { list-style: none; padding: 7px 0; font-size: 15px; color: #334155; line-height: 1.5; }
    .feature-list li::before { content: "\\2713\\0020"; color: #0f172a; font-weight: 700; }
    .testimonial { background: #f8fafc; border-left: 3px solid #0f172a; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .testimonial p { font-style: italic; margin: 0 0 6px; color: #334155; font-size: 14px; }
    .testimonial .author { font-size: 13px; color: #64748b; font-style: normal; font-weight: 600; }
    .callout { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .callout p { margin: 0; font-size: 14px; color: #334155; }
    .stat { text-align: center; padding: 20px 0; }
    .stat-number { font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #f1f5f9; margin: 28px 0; }
    .footer { text-align: center; padding: 20px 0 0; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 4px 0; }
    .footer a { color: #94a3b8; text-decoration: underline; }
    .step { display: flex; gap: 12px; margin: 12px 0; }
    .step-num { flex-shrink: 0; width: 28px; height: 28px; background: #0f172a; color: #fff; border-radius: 50%; font-size: 13px; font-weight: 700; text-align: center; line-height: 28px; }
    .step-text { font-size: 15px; color: #334155; line-height: 1.5; padding-top: 3px; }
    .tip { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .tip p { color: #166534; margin: 0; font-size: 14px; }
    .highlight { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight p { color: #854d0e; margin: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo"><img src="${APP_URL}/logo.png" alt="Thesis Generator" class="logo-img" width="36" height="36"><span class="logo-text">Thesis<span class="logo-light">Generator</span></span></div>
      ${content}
      <hr class="divider">
      <div class="footer">
        <p>Thesis Generator</p>
        <p><a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export type EmailParams = { name?: string; email: string };
export type EmailResult = { subject: string; html: string };

export function greeting(name?: string, fallback = 'Hi there'): string {
  return name ? `Hi ${name}` : fallback;
}

export { APP_URL };

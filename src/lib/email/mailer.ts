export const FROM_EMAIL = 'hello@thesisgenerator.io';
export const FROM_NAME = 'Thesis Generator';
export const REPLY_TO = 'hello@thesisgenerator.io';

export async function sendEmail({
  to,
  subject,
  html,
  name,
}: {
  to: string;
  subject: string;
  html: string;
  name?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error(`Resend error sending to ${to}:`, err);
      return false;
    }

    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}



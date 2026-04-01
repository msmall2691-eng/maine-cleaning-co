import nodemailer from 'nodemailer';
import type { QuoteLead } from '@shared/schema';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || 'office@mainecleaningco.com';
const NOTIFY_ADDRESS = process.env.NOTIFY_EMAIL || 'office@mainecleaningco.com';

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[email] SMTP not configured — skipping email send. Set SMTP_USER and SMTP_PASS env vars.');
    return;
  }

  await transporter.sendMail({
    from: `"The Maine Cleaning Co." <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

function buildLeadEmailHtml(lead: QuoteLead): string {
  const serviceLabel = lead.serviceType === "standard" ? "Standard Clean" : "Deep Clean";
  const freqLabel: Record<string, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f6;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e6;">
    <div style="background:#3a4f5c;padding:28px 32px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:600;">New Quote Request</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0;">The Maine Cleaning Co.</p>
    </div>
    <div style="padding:28px 32px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Estimate Range</div>
        <div style="font-size:28px;font-weight:700;color:#166534;">$` + "${lead.estimateMin} – $${lead.estimateMax}" + `</div>
      </div>
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Service</td><td style="padding:8px 0;font-weight:600;">` + "${serviceLabel}</td></tr>" + `
      </table>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadNotification(lead: QuoteLead): Promise<void> {
  try {
    const html = buildLeadEmailHtml(lead);
    const subject = ` + "`New Quote QT-${lead.id}: ${lead.serviceType === \"standard\" ? \"Standard\" : \"Deep\"} · $${lead.estimateMin}–$${lead.estimateMax}`" + `;
    await sendEmail(NOTIFY_ADDRESS, subject, html, lead.email || undefined);
  } catch (error) {
    console.error('[email] Failed:', error);
  }
}

export async function sendCustomerConfirmation(lead: QuoteLead, tempPassword?: string): Promise<void> {
  if (!lead.email) return;
  try {
    const html = 'Thank you for your request!';
    await sendEmail(lead.email, 'Your cleaning estimate', html);
  } catch (error) {
    console.error('[email] Failed:', error);
  }
}

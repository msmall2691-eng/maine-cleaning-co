import nodemailer from 'nodemailer';
import type { QuoteLead } from '@shared/schema';

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        <div style="font-size:28px;font-weight:700;color:#166534;">$${lead.estimateMin} – $${lead.estimateMax}</div>
      </div>

      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Service</td><td style="padding:8px 0;font-weight:600;">${serviceLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Frequency</td><td style="padding:8px 0;font-weight:600;">${freqLabel[lead.frequency] || lead.frequency}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Square Footage</td><td style="padding:8px 0;font-weight:600;">${lead.sqft.toLocaleString()} sq ft</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Bathrooms</td><td style="padding:8px 0;font-weight:600;">${lead.bathrooms}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Pet Hair</td><td style="padding:8px 0;font-weight:600;text-transform:capitalize;">${lead.petHair}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Condition</td><td style="padding:8px 0;font-weight:600;text-transform:capitalize;">${lead.condition}</td></tr>
        ${lead.zip ? `<tr><td style="padding:8px 0;color:#6b7280;">ZIP Code</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(lead.zip)}</td></tr>` : ''}
        ${lead.address ? `<tr><td style="padding:8px 0;color:#6b7280;">Address</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(lead.address)}</td></tr>` : ''}
      </table>

      ${(lead.name || lead.email || lead.phone) ? `
      <div style="border-top:1px solid #e8e8e6;margin-top:16px;padding-top:16px;">
        <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Contact Info</div>
        <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
          ${lead.name ? `<tr><td style="padding:6px 0;color:#6b7280;width:140px;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(lead.name)}</td></tr>` : ''}
          ${lead.email ? `<tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(lead.email)}</td></tr>` : ''}
          ${lead.phone ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(lead.phone)}</td></tr>` : ''}
        </table>
      </div>` : ''}

      ${lead.notes ? `
      <div style="border-top:1px solid #e8e8e6;margin-top:16px;padding-top:16px;">
        <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Notes</div>
        <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;">${escapeHtml(lead.notes)}</p>
      </div>` : ''}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e8e8e6;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">Lead QT-${lead.id} · Submitted ${new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildCustomerConfirmationHtml(lead: QuoteLead, tempPassword?: string): string {
  const serviceLabel = lead.serviceType === "standard" ? "Standard Clean" : "Deep Clean";
  const freqLabel: Record<string, string> = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time" };
  const firstName = escapeHtml(lead.name?.split(' ')[0]) || 'there';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f6;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e6;">
    <div style="background:#3a4f5c;padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:600;">We Got Your Request!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0;">The Maine Cleaning Co.</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">Hi ${firstName}, thank you for requesting a cleaning estimate! We're excited to help you with your home. Here's a summary of your request:</p>

      <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#1d4ed8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Your Estimate Range</div>
        <div style="font-size:28px;font-weight:700;color:#1e40af;">$${lead.estimateMin} – $${lead.estimateMax}</div>
        <p style="font-size:12px;color:#6b7280;margin:6px 0 0;font-style:italic;">Non-binding estimate. Final price confirmed after review.</p>
      </div>

      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:7px 0;color:#6b7280;width:130px;">Service</td><td style="padding:7px 0;font-weight:600;">${serviceLabel}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;">Frequency</td><td style="padding:7px 0;font-weight:600;">${freqLabel[lead.frequency] || lead.frequency}</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;">Square Footage</td><td style="padding:7px 0;font-weight:600;">${lead.sqft.toLocaleString()} sq ft</td></tr>
        <tr><td style="padding:7px 0;color:#6b7280;">Bathrooms</td><td style="padding:7px 0;font-weight:600;">${lead.bathrooms}</td></tr>
        ${lead.address ? `<tr><td style="padding:7px 0;color:#6b7280;">Address</td><td style="padding:7px 0;font-weight:600;">${escapeHtml(lead.address)}</td></tr>` : ''}
      </table>

      <div style="background:#f8f8f6;border-radius:10px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:15px;color:#374151;margin:0 0 14px;font-weight:700;">What Happens Next</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 12px 8px 0;vertical-align:top;width:28px;">
              <div style="width:24px;height:24px;border-radius:50%;background:#3a4f5c;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</div>
            </td>
            <td style="padding:8px 0;">
              <div style="font-size:14px;font-weight:600;color:#374151;">We'll review your request</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">Typically within 1 business day</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px 8px 0;vertical-align:top;">
              <div style="width:24px;height:24px;border-radius:50%;background:#3a4f5c;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</div>
            </td>
            <td style="padding:8px 0;">
              <div style="font-size:14px;font-weight:600;color:#374151;">We'll reach out to confirm details</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">Via phone, text, or email</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px 8px 0;vertical-align:top;">
              <div style="width:24px;height:24px;border-radius:50%;background:#3a4f5c;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</div>
            </td>
            <td style="padding:8px 0;">
              <div style="font-size:14px;font-weight:600;color:#374151;">You'll get a final quote & schedule</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px;">Usually within 3–7 business days</div>
            </td>
          </tr>
        </table>
      </div>

      ${tempPassword ? `
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your Client Portal</div>
        <p style="font-size:14px;color:#374151;margin:0 0 10px;line-height:1.5;">We've created a personal portal for you to track your quote, complete onboarding, and manage your cleaning service.</p>
        <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;width:100px;">Email</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(lead.email)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Password</td><td style="padding:4px 0;font-weight:600;font-family:monospace;letter-spacing:1px;">${escapeHtml(tempPassword)}</td></tr>
        </table>
        <p style="font-size:12px;color:#92400e;margin:10px 0 0;font-style:italic;">We recommend changing your password after your first login.</p>
      </div>` : ''}

      <div style="text-align:center;margin-bottom:20px;">
        <p style="font-size:14px;color:#374151;margin:0 0 8px;">Have questions? We're here to help.</p>
        <p style="font-size:14px;margin:0;">
          <a href="tel:207-572-0502" style="color:#3a4f5c;font-weight:600;text-decoration:none;">207-572-0502</a>
          <span style="color:#d1d5db;margin:0 8px;">|</span>
          <a href="mailto:office@mainecleaningco.com" style="color:#3a4f5c;font-weight:600;text-decoration:none;">office@mainecleaningco.com</a>
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e8e8e6;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">Quote QT-${lead.id} · The Maine Cleaning Co. · Southern Maine</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadNotification(lead: QuoteLead): Promise<void> {
  try {
    const html = buildLeadEmailHtml(lead);
    const subject = `New Quote QT-${lead.id}: ${lead.serviceType === "standard" ? "Standard" : "Deep"} · $${lead.estimateMin}–$${lead.estimateMax}`;
    await sendEmail(NOTIFY_ADDRESS, subject, html, lead.email || undefined);
    console.log(`[email] Lead notification sent for QT-${lead.id}`);
  } catch (error) {
    console.error(`[email] Failed to send lead notification for QT-${lead.id}:`, error);
  }
}

export async function sendPasswordResetEmail(email: string, name: string | null, resetLink: string): Promise<void> {
  try {
    const firstName = escapeHtml(name?.split(' ')[0]) || '';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f6;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e6;">
    <div style="background:#3a4f5c;padding:28px 32px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:600;">Password Reset</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0;">The Maine Cleaning Co.</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.6;">Hi${firstName ? ' ' + firstName : ''},</p>
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${resetLink}" style="display:inline-block;background:#3a4f5c;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">Reset My Password</a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 8px;line-height:1.5;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div style="background:#f8f8f6;padding:16px 32px;text-align:center;border-top:1px solid #e8e8e6;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">The Maine Cleaning Co. · Southern Maine</p>
    </div>
  </div>
</body>
</html>`;
    await sendEmail(email, 'Reset your password — The Maine Cleaning Co.', html);
    console.log(`[email] Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`[email] Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}

export async function sendIntakeNotification(
  submissionId: number,
  normalized: Record<string, any>,
  raw: Record<string, any>
): Promise<void> {
  const to = NOTIFY_ADDRESS;
  const replyTo = normalized.email || undefined;
  const serviceLabel = normalized.serviceType === "standard" ? "Standard Clean"
    : normalized.serviceType === "deep" ? "Deep Clean"
    : normalized.serviceType ? normalized.serviceType.replace(/-/g, " ") : "Not specified";
  const freqMap: Record<string, string> = {
    weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", "one-time": "One-Time",
  };

  const row = (label: string, value: string | null | undefined) =>
    value ? `<tr><td style="padding:7px 0;color:#6b7280;width:140px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:7px 0;font-weight:600;color:#374151;">${escapeHtml(value)}</td></tr>` : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f8f6;">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e8e8e6;">
  <div style="background:#1e3a5f;padding:28px 32px;">
    <h1 style="color:#fff;font-size:20px;margin:0;font-weight:600;">New Website Intake Request</h1>
    <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:6px 0 0;">Submission #INT-${submissionId} · The Maine Cleaning Co.</p>
  </div>
  <div style="padding:28px 32px;">
    ${normalized.estimateMin != null ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:12px;color:#1d4ed8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Estimate Range</div>
      <div style="font-size:28px;font-weight:700;color:#1e40af;">$${normalized.estimateMin} – $${normalized.estimateMax}</div>
    </div>` : ""}

    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:10px;">Contact</div>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row("Name", normalized.name)}
        ${row("Email", normalized.email)}
        ${row("Phone", normalized.phone)}
        ${row("Address", normalized.address)}
        ${row("ZIP", normalized.zip)}
      </table>
    </div>

    <div style="margin-bottom:20px;border-top:1px solid #e8e8e6;padding-top:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:10px;">Service Details</div>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        ${row("Service", serviceLabel)}
        ${row("Frequency", normalized.frequency ? (freqMap[normalized.frequency] || normalized.frequency) : null)}
        ${row("Sq Footage", normalized.sqft ? `${Number(normalized.sqft).toLocaleString()} sq ft` : null)}
        ${row("Bathrooms", normalized.bathrooms ? String(normalized.bathrooms) : null)}
        ${row("Pet Hair", normalized.petHair ? (normalized.petHair.charAt(0).toUpperCase() + normalized.petHair.slice(1)) : null)}
        ${row("Condition", normalized.condition ? (normalized.condition.charAt(0).toUpperCase() + normalized.condition.slice(1)) : null)}
      </table>
    </div>

    ${normalized.notes ? `
    <div style="border-top:1px solid #e8e8e6;padding-top:20px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:8px;">Notes</div>
      <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">${escapeHtml(normalized.notes)}</p>
    </div>` : ""}
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e8e8e6;padding:16px 32px;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">Submission #INT-${submissionId} · Captured ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET · Maine Cleaning Co.</p>
  </div>
</div>
</body></html>`;

  const safeName = typeof normalized.name === "string" ? normalized.name.replace(/[^\w\s.\-']/g, "").slice(0, 100) : "";
  const subject = `New Intake #INT-${submissionId}${safeName ? ` — ${safeName}` : ""}${normalized.estimateMin != null ? ` · $${normalized.estimateMin}–$${normalized.estimateMax}` : ""}`;
  await sendEmail(to, subject, html, replyTo);
}

export async function sendCustomerConfirmation(lead: QuoteLead, tempPassword?: string): Promise<void> {
  if (!lead.email) return;
  try {
    const html = buildCustomerConfirmationHtml(lead, tempPassword);
    const firstName = lead.name?.split(' ')[0] || '';
    const subject = `${firstName ? firstName + ', y' : 'Y'}our cleaning estimate is ready — $${lead.estimateMin}–$${lead.estimateMax}`;
    await sendEmail(lead.email, subject, html);
    console.log(`[email] Customer confirmation sent to ${lead.email} for QT-${lead.id}`);
  } catch (error) {
    console.error(`[email] Failed to send customer confirmation for QT-${lead.id}:`, error);
  }
}

/**
 * Twilio SMS Integration
 *
 * Handles SMS sending, webhook processing, and SMS-based approval
 * Requires environment variables:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_PHONE_NUMBER (from number)
 */

import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

/**
 * Get or initialize Twilio client
 */
function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("[twilio] Twilio credentials not configured");
    return null;
  }

  if (!client) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

/**
 * Send SMS to a phone number
 * @param to E.164 formatted phone number (+1234567890)
 * @param message SMS message body
 * @returns Message SID if successful, null otherwise
 */
export async function sendSMS(to: string, message: string): Promise<string | null> {
  const twilio = getTwilioClient();
  if (!twilio || !TWILIO_PHONE_NUMBER) {
    console.error("[twilio] SMS not configured - missing credentials or phone number");
    return null;
  }

  try {
    console.log("[twilio] Sending SMS to", to);
    const result = await twilio.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("[twilio] SMS sent successfully", { messageSid: result.sid, to });
    return result.sid;
  } catch (err) {
    console.error("[twilio] Failed to send SMS", { error: String(err), to });
    return null;
  }
}

/**
 * Send approval quote SMS
 * @param phone E.164 formatted phone number
 * @param name Customer name
 * @param estimateRange Price range
 * @param approvalLink Unique approval link
 */
export async function sendApprovalQuoteSMS(
  phone: string,
  name: string,
  estimateRange: string,
  approvalLink: string
): Promise<string | null> {
  const message = `Hi ${name}! 👋 Your cleaning quote is ${estimateRange}. Click to approve: ${approvalLink} (expires 24h). Reply YES to approve or call us with questions! 🎉`;

  return sendSMS(phone, message);
}

/**
 * Send booking confirmation SMS
 * @param phone E.164 formatted phone number
 * @param name Customer name
 * @param appointmentDate Date/time of appointment
 * @param address Service address
 */
export async function sendBookingConfirmationSMS(
  phone: string,
  name: string,
  appointmentDate: string,
  address: string
): Promise<string | null> {
  const message = `Hi ${name}! ✅ Your cleaning is booked! 📅 ${appointmentDate} at ${address}. We'll text you the day before with more details. See you soon! 🧹`;

  return sendSMS(phone, message);
}

/**
 * Send appointment reminder SMS
 * @param phone E.164 formatted phone number
 * @param name Customer name
 * @param appointmentTime Time of appointment
 */
export async function sendReminderSMS(
  phone: string,
  name: string,
  appointmentTime: string
): Promise<string | null> {
  const message = `Hi ${name}! ⏰ Reminder: Your cleaning is coming up at ${appointmentTime}. Our team is on the way! 🚗💨`;

  return sendSMS(phone, message);
}

/**
 * Send invoice/receipt SMS
 * @param phone E.164 formatted phone number
 * @param name Customer name
 * @param amount Amount charged
 * @param invoiceLink Link to invoice
 */
export async function sendInvoiceSMS(
  phone: string,
  name: string,
  amount: string,
  invoiceLink: string
): Promise<string | null> {
  const message = `Hi ${name}! 📨 Your invoice for $${amount} is ready. Download it here: ${invoiceLink}. Thank you for choosing Maine Cleaning Co! 🙏`;

  return sendSMS(phone, message);
}

/**
 * Send generic SMS message
 * Used for customer support, follow-ups, etc
 */
export async function sendCustomSMS(phone: string, message: string): Promise<string | null> {
  return sendSMS(phone, message);
}

/**
 * Parse inbound SMS from Twilio webhook
 * Twilio sends: From, To, Body, MessageSid
 */
export interface InboundSMSMessage {
  from: string; // E.164 format phone number
  to: string;
  body: string;
  messageSid: string;
  accountSid: string;
}

/**
 * Parse Twilio webhook request body
 */
export function parseTwilioWebhook(body: Record<string, string | string[]>): InboundSMSMessage | null {
  const from = Array.isArray(body.From) ? body.From[0] : body.From;
  const to = Array.isArray(body.To) ? body.To[0] : body.To;
  const message = Array.isArray(body.Body) ? body.Body[0] : body.Body;
  const messageSid = Array.isArray(body.MessageSid) ? body.MessageSid[0] : body.MessageSid;
  const accountSid = Array.isArray(body.AccountSid) ? body.AccountSid[0] : body.AccountSid;

  if (!from || !to || !message || !messageSid) {
    return null;
  }

  return {
    from,
    to,
    body: message,
    messageSid,
    accountSid,
  };
}

/**
 * Check if SMS message is an approval response
 * Accepts: "yes", "approve", "ok", "confirm", "1", etc
 */
export function isApprovalResponse(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return /^(yes|yeah|yep|approve|confirmed|confirm|ok|okay|1|true)$/.test(normalized);
}

/**
 * Check if SMS message is a rejection
 * Accepts: "no", "reject", "0", etc
 */
export function isRejectionResponse(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return /^(no|nope|reject|rejected|0|false)$/.test(normalized);
}

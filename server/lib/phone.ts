/**
 * Phone number normalization utilities
 * Converts various formats to E.164 format (+1234567890)
 * Required for Twilio, SMS integrations, and international support
 */

/**
 * Normalize phone to E.164 format
 * Handles:
 * - US numbers: 5551234567, 555-123-4567, (555) 123-4567, +1 555-123-4567
 * - International: +44 20 7946 0958, +33 1 42 68 53 00
 *
 * @param phone Raw phone input
 * @returns E.164 formatted phone (+1234567890) or null if invalid
 */
export function normalizePhoneToE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit and non-plus characters
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned) return null;

  // If starts with +, validate and return as-is
  if (cleaned.startsWith("+")) {
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }
    return null;
  }

  // US number - extract last 10 digits and add +1
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }
  if (digitsOnly.length > 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return null;
}

/**
 * Format E.164 phone for display
 * +12025551234 → (202) 555-1234
 */
export function formatPhoneForDisplay(e164: string): string {
  if (!e164.startsWith("+1") || e164.length !== 12) {
    return e164; // Return as-is if not standard US format
  }

  const digits = e164.slice(2); // Remove +1
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Check if phone is valid US format (after normalization)
 */
export function isValidUSPhone(e164: string): boolean {
  return /^\+1\d{10}$/.test(e164);
}

/**
 * Extract country code from E.164 formatted phone
 * +12025551234 → 1
 * +442079460958 → 44
 */
export function extractCountryCode(e164: string): string | null {
  const match = e164.match(/^\+(\d{1,3})/);
  return match ? match[1] : null;
}

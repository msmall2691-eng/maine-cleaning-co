/**
 * Approval token generation and validation
 * Used for SMS/email approval links
 *
 * Tokens are random 32-byte hex strings stored in DB with expiration
 */

import crypto from "crypto";

interface ApprovalTokenPayload {
  submissionId: number;
  email?: string | null;
  phone?: string | null;
  type: "sms" | "email" | "link";
}

/**
 * Generate a cryptographically secure approval token
 * Token is a 32-byte random hex string
 * Expiration is managed via database timestamp
 *
 * @param submissionId The intake submission ID
 * @param expiresInHours How long the token is valid (default 24)
 * @returns { token, expiresAt }
 */
export function generateApprovalToken(
  submissionId: number,
  email?: string | null,
  phone?: string | null,
  expiresInHours = 24
): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  return { token, expiresAt };
}

/**
 * Generate a short random code for SMS approval
 * Format: 6-digit code like "ABC123"
 */
export function generateSMSApprovalCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase().substring(0, 6);
}

/**
 * Build approval link for email/SMS
 * @param token The approval token (hex string)
 * @param baseUrl The website base URL
 * @returns Full approval URL
 */
export function buildApprovalLink(token: string, baseUrl: string = "https://maine-clean.co"): string {
  return `${baseUrl}/approve?token=${encodeURIComponent(token)}`;
}

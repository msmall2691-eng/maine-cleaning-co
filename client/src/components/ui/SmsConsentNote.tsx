import { companyInfo } from "@/lib/company-info";

/**
 * SmsConsentNote — the fine-print SMS consent disclosure shown under every form
 * submit that captures a phone number and feeds the text pipeline.
 *
 * Why this exists: A2P 10DLC campaign approval (the fix for Twilio error 30034)
 * requires a visible, verifiable statement that the customer agreed to receive
 * texts — including message types, that rates may apply, opt-out (STOP) and
 * help (HELP) instructions, and a link to the policy. Rendered once here so the
 * two submit points in the estimator (quote request + booking) can't drift.
 *
 * The Privacy Policy link opens in a new tab so a customer mid-booking doesn't
 * lose their place.
 */
export function SmsConsentNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-muted-foreground text-center ${className}`}>
      By submitting, you agree that {companyInfo.name} may text you about your
      request — booking confirmation, scheduling, and reminders. Msg &amp; data
      rates may apply; reply STOP to opt out, HELP for help. See our{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        Privacy&nbsp;Policy
      </a>.
    </p>
  );
}

import { Clock, Phone, MessageSquare } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { RESPONSE_URGENT, SELECTIVITY_NOTE } from "@/lib/response-time";

/**
 * The note someone sees right after they've sent us something.
 *
 * This is where expectations get set, so it commits to the one thing we can
 * do for everyone — hearing from us inside 48 hours — and is upfront that the
 * schedule sometimes won't stretch. Saying so is the kinder version: being
 * turned down politely is easy to take, being left to guess is not, and
 * "never left wondering" names that so the honesty reads as a courtesy.
 */
export function ResponseNote() {
  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5"
      data-testid="note-response-time"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
        You'll hear from us within 48 hours
      </p>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        {SELECTIVITY_NOTE} Either way we'll come back to you within two days — your quote if
        we can fit you in, or a friendly note if we can't, so you're never left wondering.{" "}
        {RESPONSE_URGENT}
      </p>
      <div className="flex flex-wrap gap-4 mt-3 text-[13px]">
        <a
          href={companyInfo.contact.phoneHref}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          data-testid="link-response-note-call"
        >
          <Phone className="w-3.5 h-3.5" /> {companyInfo.contact.phoneDisplay}
        </a>
        <a
          href={companyInfo.contact.smsHref}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          data-testid="link-response-note-text"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Text us
        </a>
      </div>
    </div>
  );
}

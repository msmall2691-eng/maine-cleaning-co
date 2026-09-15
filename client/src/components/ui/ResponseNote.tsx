import { Clock, Phone, MessageSquare } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { RESPONSE_URGENT } from "@/lib/response-time";

/**
 * The note someone sees right after they've sent us something.
 *
 * This is the moment expectations get set, so it says plainly who they're
 * waiting on — a small local team, not a queue — and gives anyone who can't
 * wait a channel that genuinely is faster. It replaces a bare "within one
 * business day", which promised more than we can hold to in a busy season.
 */
export function ResponseNote() {
  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5"
      data-testid="note-response-time"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
        <Clock className="w-4 h-4 text-primary flex-shrink-0" />
        A real person reads this
      </p>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        We're a small local team working across Southern Maine seven days a week, and we
        answer every message ourselves. Most people hear back within a day or two — a
        little longer when we're deep in the busy season. {RESPONSE_URGENT}
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

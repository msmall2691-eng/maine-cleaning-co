import { Link } from "wouter";
import { ArrowRight, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { COMMUNITIES_SERVED } from "@/lib/company-stats";

/**
 * The close: one last ask, on the waterline.
 *
 * Deliberately NOT another full-viewport section. Five of those in a row is
 * a rhythm; six is a trudge, and the thing a visitor who has read this far
 * wants is the button, not more scenery.
 */
export function TideLine() {
  return (
    <section
      className="relative clip-x bg-background py-24"
      aria-labelledby="shore-close-heading"
    >
      <div className="mx-auto w-full max-w-4xl px-5 text-center sm:px-8">
        <h2 id="shore-close-heading" className="type-h2 text-foreground">
          Let&apos;s get your place on the schedule.
        </h2>
        <p className="type-lead mx-auto mt-5 max-w-lg">
          Tell us the square footage and how often you&apos;d like us, and you&apos;ll
          have a price in front of you in about a minute.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/book"
            className="shore-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            data-testid="link-close-estimate"
          >
            Get my estimate
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href={companyInfo.contact.phoneHref}
            className="shore-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-primary px-8 text-sm font-semibold text-primary"
            data-testid="link-close-call"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {companyInfo.contact.phoneDisplay}
          </a>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Serving {COMMUNITIES_SERVED} communities across York &amp; Cumberland County.{" "}
          <Link
            href="/service-areas"
            className="shore-focus underline underline-offset-4"
            data-testid="link-close-areas"
          >
            See the full list
          </Link>
          .
        </p>
      </div>

      {/* The tide line itself — a horizon rule that fades out at both ends. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-seafoam/40 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}

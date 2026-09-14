import { Link } from "wouter";
import { ArrowRight, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/company-info";

/**
 * Compact "get your price" card that replaces the inline estimator.
 *
 * The InstantEstimate widget used to be mounted on five pages at once. It is
 * the heaviest component in the app and it asked the same questions on each
 * one, so a visitor browsing services met the same multi-step form three
 * times over. Worse, the pages it sat on are reading pages — a full booking
 * form buried halfway down a services page competes with the content around
 * it rather than following from it.
 *
 * The calculator now lives in exactly two places: the home page (browse) and
 * /book (intent). Everywhere else links here. `service` preselects the right
 * category on arrival so nothing is re-asked.
 */
export function EstimateCTA({
  service,
  heading = "Get your price",
  sub = "Tell us about your space and see a range in about a minute — then pick a date if you're ready.",
}: {
  service?: "residential" | "deep-clean" | "str" | "commercial";
  heading?: string;
  sub?: string;
}) {
  const href = service ? `/book?service=${service}` : "/book";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 text-center">
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-2.5">{heading}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto mb-6">{sub}</p>

      <Link href={href}>
        <Button
          size="lg"
          className="w-full sm:w-auto h-13 px-9 rounded-full font-semibold gap-2"
          data-testid="button-estimate-cta"
        >
          Get My Estimate <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>

      <div className="flex justify-center gap-5 mt-5 text-sm text-muted-foreground">
        <a
          href={companyInfo.contact.phoneHref}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          data-testid="link-estimate-cta-call"
        >
          <Phone className="w-4 h-4" /> Call
        </a>
        <a
          href={companyInfo.contact.smsHref}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          data-testid="link-estimate-cta-text"
        >
          <MessageSquare className="w-4 h-4" /> Text
        </a>
      </div>
    </div>
  );
}

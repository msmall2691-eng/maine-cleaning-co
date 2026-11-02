import { Link } from "wouter";
import { ArrowRight, Play, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";
import { brand } from "@/lib/brand";

/**
 * The business site's 404.
 *
 * It needs its own, because the one it was using is the cleaning company's —
 * it offers the visitor "Service Areas" and "Book a Cleaning", which on this
 * site are not pages at all. A 404 whose own escape routes 404 is worse than
 * the original dead end.
 *
 * The cleaning 404 still serves the demo, where those links are real.
 *
 * It also catches the most likely way someone arrives here: an old
 * maineclean.co URL that server/legacyRedirects.ts does not know about. So
 * the demo gets a prominent offer rather than a footnote.
 */
export default function StudioNotFound() {
  return (
    <div className="w-full clip-x">
      <Section measure="prose" className="pt-32 sm:pt-40" reveal={false}>
        <p className="type-eyebrow mb-4">404</p>
        <h1 className="type-display-sm text-foreground mb-6">
          That page isn't <span className="heading-accent">here.</span>
        </h1>
        <p className="type-lead mb-10">
          It may never have existed, or you may have followed a link to{" "}
          {brand.operator.priorBusiness}'s old site — those pages moved into the demo when the
          cleaning business wound down.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto h-12 px-7 rounded-full font-semibold gap-2" data-testid="button-404-home">
              Back to {brand.name} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href={brand.demoPath} rel="nofollow" data-testid="link-404-demo">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-7 rounded-full font-semibold gap-2 border-border"
            >
              <Play className="w-4 h-4" /> Open the demo
            </Button>
          </a>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "/systems", label: "What gets built", detail: "The six parts" },
            { href: "/proof", label: "Proof", detail: "The case study" },
            { href: "/process", label: "How it works", detail: "Scope and price" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="card-soft p-4 hover:-translate-y-0.5 transition-transform"
              data-testid={`link-404-${l.href.slice(1)}`}
            >
              <div className="text-[13px] font-semibold text-foreground">{l.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{l.detail}</div>
            </Link>
          ))}
        </div>

        <a
          href={brand.contact.emailHref}
          className="inline-flex items-center gap-2.5 mt-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="w-4 h-4 text-primary" /> Think something's broken? Tell me.
        </a>
      </Section>
    </div>
  );
}

import { Link } from "wouter";
import { Mail, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioLockup } from "./StudioLogo";
import { brand, capabilities } from "@/lib/brand";

/**
 * The business site's footer.
 *
 * Same surface as <ClosingCTA> — `.band-deep` — so a page ends in one dark
 * region rather than a coloured slab sitting on top of a footer that fades
 * into the page and anchors nothing. See the band-deep note in index.css.
 */
export default function StudioFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="band-deep relative isolate overflow-hidden pt-20 pb-8">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="relative overflow-hidden rounded-3xl border border-foreground/15 bg-card/40 px-6 py-7 sm:px-8 mb-16 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <div className="relative sm:flex-1 min-w-0">
            <p className="type-h3 text-foreground">Still running the business off a notebook and a phone?</p>
            <p className="text-sm text-muted-foreground mt-1.5">
              An hour on a call, free, and a straight answer on whether this is worth building for you.
            </p>
          </div>
          <Link href="/contact" className="relative flex-shrink-0" data-testid="link-footer-cta">
            <Button size="sm" className="rounded-full h-11 px-6 text-sm font-semibold gap-1.5">
              Book a call <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div className="sm:col-span-2 lg:col-span-1">
            <StudioLockup size="lg" className="mb-5" />
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">{brand.promise}</p>
            <a
              href={brand.contact.emailHref}
              className="inline-flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors"
              data-testid="link-footer-email"
            >
              <Mail className="w-4 h-4 text-primary flex-shrink-0" /> {brand.contact.email}
            </a>
          </div>

          <div>
            <h4 className="type-eyebrow mb-5">What gets built</h4>
            <ul className="space-y-3 text-sm">
              {capabilities.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/systems#${c.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="type-eyebrow mb-5">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/systems" className="text-muted-foreground hover:text-foreground transition-colors">What gets built</Link></li>
              <li><Link href="/proof" className="text-muted-foreground hover:text-foreground transition-colors">Proof</Link></li>
              <li><Link href="/process" className="text-muted-foreground hover:text-foreground transition-colors">How it works</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="type-eyebrow mb-5">See it running</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The full system built for {brand.operator.priorBusiness}, still online as a demo.
            </p>
            <a href={brand.demoPath} data-testid="link-footer-demo" rel="nofollow">
              <Button variant="outline" className="rounded-full h-10 px-5 text-sm font-semibold gap-2 border-foreground/25 text-foreground hover:bg-foreground/10">
                <Play className="w-3.5 h-3.5" /> Open the demo
              </Button>
            </a>
          </div>
        </div>

        {/* lg:pr-14 matches the cleaning footer: it keeps the right-hand group
            clear of anything fixed in the bottom-right corner. */}
        <div className="border-t border-foreground/15 pt-6 lg:pr-14 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            &copy; {year} {brand.name}. Built by {brand.operator.name}.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

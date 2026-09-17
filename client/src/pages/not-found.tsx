import { Link } from "wouter";
import { Home, ArrowLeft, MapPin, Calendar, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Section } from "@/components/layout/Section";
import { LighthouseMark } from "@/components/brand/Logo";
import { companyInfo } from "@/lib/company-info";

/**
 * 404.
 *
 * Was a 448px column of text vertically centred in an otherwise empty
 * viewport — the most literal empty space on the site, and the one page
 * where a visitor most needs somewhere to go next. It now sits in the
 * normal page rhythm (header above, footer below), leads with the
 * lighthouse mark, and hands over the four routes people actually want.
 */
export default function NotFound() {
  useSEO({ title: "Page Not Found", description: "The page you're looking for doesn't exist or has been moved." });

  return (
    <Section
      measure="prose"
      rhythm="none"
      reveal={false}
      className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(3.25rem,6vw,5.5rem)] overflow-hidden"
    >
      <div className="text-center">
        <LighthouseMark className="w-24 h-24 sm:w-32 sm:h-32 mx-auto text-foreground/85" />

        <p className="mt-7 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
          404
        </p>

        <h1 className="mt-3 text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground section-heading-accent">
          Page not found
        </h1>

        <p className="mt-8 text-[15px] sm:text-base text-muted-foreground leading-relaxed max-w-[34rem] mx-auto">
          Sorry, we couldn't find that page. It may have been moved or no longer exists.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto rounded-full gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <Link href="/services" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full gap-2">
              <ArrowLeft className="w-4 h-4" /> View Services
            </Button>
          </Link>
        </div>
      </div>

      {/* The rest of the way out. Same shape as the home page's quick-action
          strip, so a dead end still looks like part of the site. */}
      <div className="mt-12 sm:mt-14 card-glass px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
          <Link
            href="/service-areas"
            className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">Service Areas</div>
              <div className="text-[11px] text-muted-foreground truncate">{companyInfo.serviceArea.region}</div>
            </div>
          </Link>

          <Link
            href="/book"
            className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">Book a Cleaning</div>
              <div className="text-[11px] text-muted-foreground truncate">Instant estimate</div>
            </div>
          </Link>

          <a
            href={companyInfo.contact.phoneHref}
            className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
              <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">Call us</div>
              <div className="text-[11px] text-muted-foreground truncate">{companyInfo.contact.phoneDisplay}</div>
            </div>
          </a>
        </div>
      </div>
    </Section>
  );
}

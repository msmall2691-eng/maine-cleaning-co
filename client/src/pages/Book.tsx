import { useMemo } from "react";
import { useLocation } from "wouter";
import { Calendar, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { InstantEstimate } from "@/components/ui/InstantEstimate";
import { companyInfo } from "@/lib/company-info";
import { RESPONSE_WINDOW } from "@/lib/response-time";
import { Section } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";
import { AmbientPhoto } from "@/components/ui/AmbientPhoto";

/**
 * /book — dedicated booking landing page.
 *
 * The InstantEstimate on the home page is great for browsers who want a
 * price without committing. This page is for customers who've already
 * decided to book: header reframes to "Book Your Cleaning" and the
 * estimator itself renders with `bookingIntent` so the step-3 panel
 * leads with "Book Your Cleaning" instead of the softer
 * "Book This Cleaning" phrasing.
 *
 * Reuses <InstantEstimate/> intentionally — a single pricing engine and
 * one payload shape flowing to /api/booking/submit means we don't grow
 * a second maintenance surface.
 *
 * Layout note: this was the only page that opted out of the container
 * system entirely (`max-w-4xl mx-auto px-4` hand-rolled, no `container`),
 * and the only page in the funnel with no photograph on it at all — the
 * place where the decision closes was the place with the least reassurance.
 * It's on <Section> now, with two of our own shots beside the header and a
 * third running quietly behind the estimator.
 */
type BookServiceParam = "residential" | "deep-clean" | "str" | "commercial";
const validServices: BookServiceParam[] = ["residential", "deep-clean", "str", "commercial"];

// Same value and same fallback as before — `center` is optional on the
// company-info shape, so it's read through an optional type rather than off
// the literal (which is what was making tsc unhappy about this file).
const serviceAreaCenter =
  (companyInfo.serviceArea as { center?: string }).center || "Southern Maine";

const reassurance = [
  {
    icon: CheckCircle2,
    tint: "bg-brand-pine/15",
    iconColor: "text-brand-pine",
    title: "Instant estimate",
    detail: "Live pricing as you fill it in",
  },
  {
    icon: Calendar,
    tint: "bg-brand-navy/15",
    iconColor: "text-brand-navy",
    title: "Pick your date",
    detail: "2+ days out, anywhere in Southern Maine",
  },
  {
    icon: Clock,
    tint: "bg-brand-harbor/15",
    iconColor: "text-brand-harbor",
    title: "Confirm in 1 day",
    detail: "We'll call or text to lock it in",
  },
];

export default function Book() {
  const [location] = useLocation();

  useSEO({
    title: "Book a Cleaning · The Maine Cleaning Co.",
    description: "Pick your date, tell us the essentials, get a confirmed booking. Residential, deep-clean, and vacation-rental cleanings across Southern Maine.",
  });

  // Support /book?service=deep-clean so links from the /services/:slug pages
  // (or a Book Now button on a service card) can preselect the category.
  const defaultCategory = useMemo<BookServiceParam | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const svc = params.get("service");
    return svc && validServices.includes(svc as BookServiceParam) ? (svc as BookServiceParam) : undefined;
  }, [location]);

  return (
    <>
      {/* Hero */}
      <Section
        measure="wide"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(2rem,3.5vw,3rem)] overflow-hidden"
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] gap-10 lg:gap-14 items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Book in Minutes
            </p>
            <h1 className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground heading-rule-left">
              Book Your Cleaning
            </h1>
            <p className="mt-8 text-[15px] sm:text-base text-muted-foreground leading-relaxed max-w-[34rem]">
              Get an instant estimate, tell us a few essentials, and pick a date — we confirm every
              booking by call or text {RESPONSE_WINDOW}. Serving{" "}
              {serviceAreaCenter} and the surrounding communities
              all across York and Cumberland County.
            </p>
          </div>

          {/* Two of our own jobs, so the page where the purchase decision
              closes shows the work rather than only describing it. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <figure className="photo-frame aspect-[3/4]">
              <img
                src={photos.kitchenIsland.src}
                srcSet={srcSetFor(photos.kitchenIsland)}
                sizes={SIZES.half}
                alt={photos.kitchenIsland.alt}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <figure className="photo-frame aspect-[3/4]">
              <img
                src={photos.toolkit.src}
                srcSet={srcSetFor(photos.toolkit)}
                sizes={SIZES.tile}
                alt={photos.toolkit.alt}
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {reassurance.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card px-3.5 py-3">
              <div className={`w-8 h-8 rounded-lg ${item.tint} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Estimator + Booking. `prose` is the site's single-column form measure,
          so the wizard reads at the same width as every other column of input
          on the site; the photo behind it is texture, not content. */}
      <Section measure="prose" rhythm="tight" className="isolate overflow-hidden pb-[clamp(3.25rem,6vw,5.5rem)]">
        <AmbientPhoto photo={photos.vacuumFleet} />
        <LogoWatermark position="right" />

        <InstantEstimate defaultCategory={defaultCategory} bookingIntent />
      </Section>
    </>
  );
}

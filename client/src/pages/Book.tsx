import { useMemo } from "react";
import { useLocation } from "wouter";
import { Calendar, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { InstantEstimate } from "@/components/ui/InstantEstimate";
import { companyInfo } from "@/lib/company-info";

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
 */
type BookServiceParam = "residential" | "deep-clean" | "str" | "commercial";
const validServices: BookServiceParam[] = ["residential", "deep-clean", "str", "commercial"];

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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-10 sm:pb-14">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Book in Minutes
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Book Your Cleaning
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
            Get an instant estimate, tell us a few essentials, and pick a date — we confirm within
            one business day. Serving {companyInfo.serviceArea?.center || "Southern Maine"} and the
            surrounding communities within 60 miles.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card px-3.5 py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Instant estimate</p>
                <p className="text-xs text-muted-foreground mt-0.5">Live pricing as you fill it in</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card px-3.5 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Pick your date</p>
                <p className="text-xs text-muted-foreground mt-0.5">2+ days out, within 60 miles</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card px-3.5 py-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Confirm in 1 day</p>
                <p className="text-xs text-muted-foreground mt-0.5">We'll call or text to lock it in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estimator + Booking */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <InstantEstimate defaultCategory={defaultCategory} bookingIntent />
      </section>
    </div>
  );
}

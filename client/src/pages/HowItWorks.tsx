import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import {
  ArrowRight, Zap, CheckCircle2, ClipboardList, CalendarCheck,
  Sparkles, MessageSquare,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { COMMUNITIES_SERVED } from "@/lib/company-stats";
import { Section, SectionHeading } from "@/components/layout/Section";
import { ClosingCTA } from "@/components/layout/ClosingCTA";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";
import { AmbientPhoto } from "@/components/ui/AmbientPhoto";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const steps = [
  {
    step: "1", icon: ClipboardList, title: "Request Estimate",
    desc: "Use our instant estimate calculator or reach out directly — whichever is easier.",
    detail: "No commitment needed. You'll hear from us within 48 hours either way — give us a call or a text if it's time-sensitive.",
  },
  {
    step: "2", icon: CalendarCheck, title: "Confirm Details",
    desc: "We review your space, finalize the scope, and match you with the right team.",
    detail: "We'll confirm your square footage, property type, and any special requirements.",
  },
  {
    step: "3", icon: CheckCircle2, title: "Schedule",
    desc: "Pick a day and time that works for you — we offer flexible scheduling 7 days a week.",
    detail: "Recurring clients get a consistent schedule. One-time cleans can often be booked same-week.",
  },
  {
    step: "4", icon: Sparkles, title: "We Clean",
    desc: "Our team arrives on time, every time — with all supplies and eco-friendly products included.",
    detail: "You don't need to provide anything. We bring Melaleuca EcoSense® products every visit.",
  },
  {
    step: "5", icon: MessageSquare, title: "Follow-Up",
    desc: "After every clean, we check in to make sure you're completely satisfied.",
    detail: "Any concerns? We'll make it right — guaranteed.",
  },
];

const faqs = [
  { q: "Are your cleaners background-checked and insured?", a: "Yes to both. Every cleaner is vetted and trained, and we're fully bonded and insured with comprehensive liability coverage." },
  { q: "How is pricing determined?", a: "Square footage, number of bathrooms, service type, frequency, and the condition of the home. Our instant estimate tool gives you a range in about a minute — no commitment, and no phone call required to see a number." },
  { q: "Do I need to be home during the cleaning?", a: "No. Many clients leave a spare key or an entry code. We always make sure your home is secure when we leave." },
  { q: "What's the difference between a standard and a deep clean?", a: "A deep clean covers baseboards, interior windows, detailed grout scrubbing and behind furniture — the things routine maintenance cleans don't include. You can book either as a one-time clean with no commitment." },
  { q: "How soon will I hear from you?", a: "Within 48 hours, always. We're a small local team and we only take on what we can do properly, so in our busiest stretches the schedule does fill up. Either way you'll hear from us within two days — your quote if we can fit you in, or a friendly note if we can't, so you're never left wondering and can keep looking if you need to. If it's time-sensitive, give us a call or a text and you'll reach us quicker." },
  { q: "What if I'm not satisfied with a clean?", a: "We come back and fix it. No questions asked — that's the satisfaction guarantee." },
  { q: "What areas do you serve?", a: `York County and Cumberland County in Southern Maine — ${COMMUNITIES_SERVED} communities in all, including Portland, South Portland, Scarborough, Cape Elizabeth, Falmouth, Yarmouth, Old Orchard Beach and Kennebunkport.` },
];

export default function HowItWorks() {
  useSEO({ title: "How It Works", description: "Get a cleaning estimate in under 2 minutes. See our simple 5-step process from instant quote to sparkling clean — serving Southern Maine homes, rentals, and businesses." });

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": { "@type": "Answer", "text": faq.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Page Hero ──
          Copy left, one photo right from lg; centred copy over a single wide
          photo below that. The text-only version of this hero was an almost
          entirely empty screenful on a laptop. */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-[78rem] mx-auto grid lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] gap-10 lg:gap-14 xl:gap-20 items-center">
            <div className="text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80 mb-4"
              >
                Simple & Transparent
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold leading-[1.04] tracking-[-0.04em] text-foreground mb-5"
              >
                What Happens <span className="hero-gradient-text">Next</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
              >
                From your first message to a spotless space — five simple steps that take the guesswork out of professional cleaning.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center lg:justify-start"
              >
                <Link href="/#get-estimate">
                  <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-hiw-hero-estimate">
                    Get My Estimate <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* The kit that turns up at step 4 — our own, not stock. */}
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="photo-frame aspect-[4/3] lg:aspect-[4/5] max-w-md mx-auto lg:max-w-none w-full"
            >
              <img
                src={photos.toolkit.src}
                srcSet={srcSetFor(photos.toolkit)}
                sizes={SIZES.half}
                alt={photos.toolkit.alt}
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ── 5 Steps ── */}
      <Section measure="default">
        <LogoWatermark position="left" />
        <div className="space-y-6 sm:space-y-8">
          {steps.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="card-glass p-6 sm:p-8 flex gap-5 sm:gap-8 items-start"
                data-testid={`step-${i + 1}`}
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary shadow-[0_0_0_4px_hsl(var(--background))]">
                    {item.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px h-6 sm:h-10 bg-border/50" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-bold text-foreground text-base">{item.title}</h3>
                  </div>
                  <p className="text-[15px] text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed italic">{item.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── STR Callout (condensed) ──
          One of our own turnover photos runs behind this band at ~10%, so the
          short-term-rental pitch sits on something rather than floating in
          white space. Decoration only: aria-hidden, lazy, and the band carries
          `isolate` because .photo-ambient is z-index:-1. */}
      <Section rhythm="tight" className="isolate">
        <AmbientPhoto photo={photos.beforeAfter} />
        <div className="card-glass p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-base mb-2">Airbnb & VRBO host?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">We offer same-day turnovers, iCal sync, and full property management for short-term rental hosts across Southern Maine.</p>
          </div>
          <Link href="/short-term-rentals">
            <Button className="rounded-full px-6 h-10 font-semibold gap-2 flex-shrink-0" data-testid="button-hiw-str">
              Learn More <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section measure="prose" tone="sink">
        <SectionHeading title="Frequently Asked Questions" />
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="card-soft overflow-hidden border-0" data-testid={`faq-${i}`}>
              <AccordionTrigger className="p-5 sm:p-6 font-semibold text-foreground text-sm sm:text-[15px] min-h-[52px] hover:no-underline [&[data-state=open]>svg]:rotate-180">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* ── Final CTA ── */}
      <ClosingCTA
        title="Simple as that."
        lead="It takes less than 2 minutes to get your instant estimate — try it now."
        ctaTestId="button-hiw-cta-estimate"
        photo={photos.restroomTrailer}
      />
    </div>
  );
}

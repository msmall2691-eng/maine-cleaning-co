import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { DEMO_PAGE_SEO, faqPageJsonLd } from "@/lib/seo";
import {
  ArrowRight, Zap, CheckCircle2, ClipboardList, CalendarCheck,
  Sparkles, MessageSquare,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { howItWorksFaqs as faqs } from "@/lib/faq-data";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
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

export default function HowItWorks() {
  useSEO({ ...DEMO_PAGE_SEO["/how-it-works"], jsonLd: faqPageJsonLd(faqs) });

  return (
    <div className="w-full clip-x">
      {/* ── Page Hero ──
          Copy left, one photo right from lg; centred copy over a single wide
          photo below that. The text-only version of this hero was an almost
          entirely empty screenful on a laptop. */}
      <PageHero
        eyebrow="Simple & Transparent"
        title={<>What Happens <span className="heading-accent">Next</span></>}
        lead="From your first message to a spotless space — five simple steps that take the guesswork out of professional cleaning."
        photo={photos.toolkit}
        actions={
          <Link href="/#get-estimate">
            <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-hiw-hero-estimate">
              Get My Estimate <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

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
                className="card-glass relative p-6 sm:p-8 flex gap-5 sm:gap-8 items-start"
                data-testid={`step-${i + 1}`}
              >
                {/* The rail. This used to be a `w-px h-6` div INSIDE the card,
                    directly under the number — so it ran for 24px, stopped at
                    the card's own padding, and then a 32px gap of nothing sat
                    between it and the next card. It read as five broken stubs
                    rather than one timeline.

                    `top-full` on the card itself spans exactly the gap below
                    it (space-y-6 / sm:space-y-8), and `left-12 sm:left-14` is
                    the centre of the number above it: padding (24/32px) plus
                    half the 48px circle. */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-12 sm:left-14 top-full h-6 sm:h-8 w-px bg-border"
                  />
                )}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary shadow-[0_0_0_4px_hsl(var(--background))]">
                    {item.step}
                  </div>
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

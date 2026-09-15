import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import {
  ArrowRight, Phone, Zap, CheckCircle2, ClipboardList, CalendarCheck,
  Sparkles, MessageSquare,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/company-info";
import { COMMUNITIES_SERVED } from "@/lib/company-stats";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const steps = [
  {
    step: "1", icon: ClipboardList, title: "Request Estimate",
    desc: "Use our instant estimate calculator or reach out directly — whichever is easier.",
    detail: "No commitment needed. We read every message ourselves and reply as fast as we can — call or text if it's time-sensitive.",
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
  { q: "How fast will you get back to me?", a: "We're a small local team and we answer every message ourselves rather than routing it to a call centre — usually within a day or two, sometimes a little longer in our busiest stretch of the season. We do read and reply to everyone. If it's time-sensitive, call or text and you'll reach us quicker." },
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
      {/* ── Page Hero ── */}
      <section className="relative pt-32 sm:pt-40 pb-12 sm:pb-14 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-2xl">
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
            className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8"
          >
            From your first message to a spotless space — five simple steps that take the guesswork out of professional cleaning.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/#get-estimate">
              <Button size="lg" className="rounded-full px-9 h-13 font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-hiw-hero-estimate">
                Get My Estimate <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 5 Steps ── */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
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
                      <h3 className="font-bold text-foreground text-base sm:text-lg">{item.title}</h3>
                    </div>
                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                    <p className="text-sm text-muted-foreground/70 leading-relaxed italic">{item.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STR Callout (condensed) ── */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="card-glass p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-base mb-1">Airbnb & VRBO host?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We offer same-day turnovers, iCal sync, and full property management for short-term rental hosts across Southern Maine.</p>
            </div>
            <Link href="/short-term-rentals">
              <Button className="rounded-full px-6 h-10 font-semibold gap-2 flex-shrink-0" data-testid="button-hiw-str">
                Learn More <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 sm:py-16 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-xl lg:max-w-2xl">
          <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-10 sm:mb-14 text-center section-heading-accent">
            Frequently Asked Questions
          </h2>
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
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-12 sm:py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg">
          <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold mb-5 tracking-[-0.01em]">
            Simple as that.
          </h2>
          <p className="text-base opacity-85 mb-10 leading-relaxed">
            It takes less than 2 minutes to get your instant estimate — try it now.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/#get-estimate">
              <Button size="lg" className="w-full sm:w-auto h-14 px-9 rounded-full bg-background text-foreground hover:bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-semibold text-base" data-testid="button-hiw-cta-estimate">
                Get My Estimate
              </Button>
            </Link>
            <a href={companyInfo.contact.phoneHref}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-9 rounded-full border-white/20 hover:bg-white/10 text-white font-semibold text-base">
                <Phone className="w-4 h-4 mr-2" /> Call {companyInfo.contact.phoneDisplay}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

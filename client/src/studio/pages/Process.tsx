import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand, processFaqs, processSteps } from "@/lib/brand";

/**
 * How an engagement runs, and what it costs.
 *
 * ⚠️  NO PRICES ARE STATED ON THIS PAGE, deliberately — I don't know yours,
 *     and inventing a number here would be worse than leaving it out. The
 *     shape of the commercial offer is described instead.
 *
 *     To put real figures on it: add them to `engagement` in lib/brand.ts and
 *     render them in the "What it costs" block below. Until then the page
 *     reads as "fixed price, quoted after the call", which is true and is a
 *     perfectly normal thing for this kind of work.
 */

export default function Process() {
  useSEO(STATIC_PAGE_SEO["/process"]);

  return (
    <div className="w-full clip-x">
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Fixed scope, fixed price, <span className="heading-accent">no surprises.</span>
          </>
        }
        lead="You know what is being built, what it costs and when it lands — in writing, before any work starts. That is the whole arrangement."
        actions={
          <Link href="/contact">
            <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-process-contact">
              Start with a call <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />

      {/* ── The four steps ── */}
      <Section measure="default">
        <SectionHeading
          eyebrow="The engagement"
          title="Four steps"
          lead="Deliberately four. A process page with nine stages describes a process nobody believes."
        />
        <div className="space-y-6 sm:space-y-8">
          {processSteps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="card-glass relative p-6 sm:p-8 flex gap-5 sm:gap-8 items-start"
              data-testid={`process-step-${i + 1}`}
            >
              {i < processSteps.length - 1 && (
                <span aria-hidden="true" className="absolute left-12 sm:left-14 top-full h-6 sm:h-8 w-px bg-border" />
              )}
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 shadow-[0_0_0_4px_hsl(var(--background))]">
                {s.step}
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="type-h3 text-foreground mb-2">{s.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{s.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── What it costs ──
          No figures until there are real ones — see the note at the top of
          this file. What the offer *is* can still be stated precisely. */}
      <Section measure="default" tone="deep">
        <SectionHeading
          eyebrow="What it costs"
          title="A fixed build price, then a monthly for support"
          lead="Quoted after the first call, once I know what your business actually needs. Two numbers, both agreed before anything starts."
        />
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="card-soft p-6 sm:p-8">
            <h3 className="type-h3 text-foreground mb-2">The build</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              One fixed price for the whole system, agreed up front. Not hourly, so a hard week is
              my problem and not your invoice.
            </p>
            <ul className="space-y-3.5">
              {[
                "Everything on the systems page, fitted to your business",
                "Your branding, rates, services and service area",
                "Deployed, indexed and handed over",
                "Documentation for running it without me",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-muted-foreground leading-relaxed">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-soft p-6 sm:p-8">
            <h3 className="type-h3 text-foreground mb-2">Afterwards</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A monthly arrangement for keeping it running, or nothing at all if you'd rather take
              it in-house. Your choice, not a condition of the build.
            </p>
            <ul className="space-y-3.5">
              {[
                "Hosting, backups and updates",
                "Bug fixes — never billed as new work",
                "Small changes: new services, rate updates, new towns",
                "Cancel whenever; the system stays yours",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-muted-foreground leading-relaxed">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section measure="prose" tone="tint">
        <SectionHeading title="Questions people actually ask" />
        <Accordion type="single" collapsible className="space-y-3">
          {processFaqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="card-soft overflow-hidden border-0" data-testid={`faq-${i}`}>
              <AccordionTrigger className="p-5 sm:p-6 font-semibold text-foreground text-sm sm:text-[15px] min-h-[52px] hover:no-underline text-left [&[data-state=open]>svg]:rotate-180">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="text-center text-sm text-muted-foreground mt-10">
          Something not covered?{" "}
          <a href={brand.contact.emailHref} className="text-primary font-medium hover:underline">
            Email me
          </a>{" "}
          — I answer them myself.
        </p>
      </Section>
    </div>
  );
}

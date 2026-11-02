import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Play, Check, Phone, FileText, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand, capabilities, idealClients, processSteps } from "@/lib/brand";
import { CLEANS_SINCE_2018, COMMUNITIES_SERVED, RECURRING_CLIENT_RATE } from "@/lib/company-stats";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

/**
 * The symptoms, in the customer's own words rather than in software terms.
 *
 * A local operator does not wake up wanting "lead intake automation". They
 * wake up having lost a job because they didn't call back for two days. The
 * grid below names the second thing, and the capabilities section names what
 * fixes it — in that order, deliberately.
 */
const symptoms = [
  {
    icon: Phone,
    title: "Every price needs a phone call",
    detail:
      "A form that says 'we'll be in touch' asks the customer to wait two days to find out if they can afford you. Most of them don't wait.",
  },
  {
    icon: FileText,
    title: "The business lives in your head",
    detail:
      "Quotes in a notebook, schedule in your phone, customer history in a text thread. It works until you want a day off, or a second crew.",
  },
  {
    icon: Clock,
    title: "Admin eats the evening",
    detail:
      "Confirmations, reschedules, invoices, 'when are you coming' — hours a week of work that no customer is paying you for.",
  },
  {
    icon: Search,
    title: "Nobody can find you",
    detail:
      "A site built on a template ranks for your business name and nothing else. The towns you actually serve are the searches you're losing.",
  },
];

export default function StudioHome() {
  useSEO(STATIC_PAGE_SEO["/"]);

  return (
    <div className="w-full clip-x">
      <PageHero
        eyebrow={`${brand.operator.yearsRun} years running one · now building them`}
        // A two-sentence headline at the full display size ran to four lines
        // and pushed both buttons below the first screen. One step down fits
        // it in two or three and keeps the CTAs visible.
        titleSize="display-sm"
        title={
          <>
            I ran the business. Then I built the{" "}
            <span className="heading-accent">software that ran&nbsp;it.</span>
          </>
        }
        lead={
          <>
            For {brand.operator.yearsRun} years I ran {brand.operator.priorBusiness} — quoting, scheduling,
            invoicing, chasing. Then I built the system that did it for me. Now I build that
            system for other local service businesses.
          </>
        }
        media={
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* The product, not a photograph of the old business.
                This is a real capture of the quoting engine inside the demo —
                a kitchen photo here made the first impression "cleaning
                company" on a page selling software. Cropped to its top and
                anchored to the top edge so it reads as a screen you could
                scroll, rather than a squashed thumbnail. */}
            <figure className="photo-frame aspect-[4/3] lg:aspect-auto lg:h-[clamp(25rem,34vw,31rem)] max-w-md mx-auto lg:max-w-none w-full bg-card">
              <img
                src="/images/product-quoting.webp"
                width={1280}
                height={1520}
                alt="The quoting engine: a customer picks property type, size, bathrooms and frequency, and a price range of $180–$190 updates live."
                className="!object-top"
                fetchPriority="high"
                decoding="async"
              />
            </figure>
            {/* The proof chip overlaps the frame rather than sitting in its
                own row — the overlap is what makes the block read as composed
                rather than as a picture with a caption under it. */}
            <div className="absolute -bottom-5 left-4 lg:-left-6 kpi-card px-4 py-3">
              <div className="text-[13px] font-semibold text-foreground">
                {CLEANS_SINCE_2018} jobs run through it
              </div>
              <div className="text-[11px] text-muted-foreground">
                {COMMUNITIES_SERVED} towns · since {brand.operator.foundedYear}
              </div>
            </div>
          </motion.div>
        }
        actions={
          <>
            <Link href="/contact">
              <Button
                size="lg"
                className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                data-testid="button-hero-contact"
              >
                Book a call <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={brand.demoPath} data-testid="link-hero-demo" rel="nofollow">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base font-semibold border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
              >
                <Play className="w-4 h-4 mr-2" /> See a live system
              </Button>
            </a>
          </>
        }
      />

      {/* ── The problem ── */}
      <Section id="problem" measure="wide" tone="tint">
        <SectionHeading
          eyebrow="Why this exists"
          title="You don't have a website problem"
          lead="You have an operations problem that happens to show up on your website. These are the four that cost the most, and they are the four this fixes."
        />
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {symptoms.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="card-glass p-6 sm:p-7 flex gap-5"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-navy/12 text-brand-navy flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="type-h3 text-foreground mb-2">{s.title}</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{s.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── What gets built ── */}
      <Section id="systems" measure="wide">
        <SectionHeading
          eyebrow="What gets built"
          title="One system, six moving parts"
          lead="Not a website with a contact form bolted on. The whole path from a stranger searching your town to a repeat customer with an account."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="card-glass p-6 sm:p-7 flex flex-col h-full"
            >
              <h3 className="type-h3 text-foreground mb-2.5">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{c.summary}</p>
              <Link
                href={`/systems#${c.id}`}
                className="inline-flex items-center text-sm font-semibold text-primary mt-5 hover:translate-x-1 transition-transform duration-300"
                data-testid={`link-capability-${c.id}`}
              >
                What that means <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/systems">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2" data-testid="button-all-systems">
              See all of it in detail <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── Proof ──
          The page's one inverted band. It goes here because this is the
          moment the claim needs evidence: everything above is assertion,
          and the thing below is a URL you can click. */}
      <Section id="proof" measure="wide" tone="deep">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-12 lg:gap-16 items-center">
          <div>
            <p className="type-eyebrow mb-4">The proof</p>
            <h2 className="type-h2 text-foreground mb-6">
              It ran a real business for {brand.operator.yearsRun} years
            </h2>
            <p className="type-lead mb-8">
              This isn't a portfolio piece or a demo built for a pitch. It is the system that
              quoted, booked and invoiced {CLEANS_SINCE_2018} cleans across {COMMUNITIES_SERVED} towns
              in Southern Maine — and it is still online, in full, for you to click through.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-9">
              {[
                { v: CLEANS_SINCE_2018, l: "Jobs quoted & booked" },
                { v: COMMUNITIES_SERVED, l: "Towns with their own page" },
                { v: RECURRING_CLIENT_RATE, l: "Clients on recurring work" },
              ].map((s) => (
                <div key={s.l} className="kpi-card p-4 sm:p-5">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{s.v}</div>
                  <div className="text-[11px] font-medium text-muted-foreground leading-tight mt-1.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={brand.demoPath} data-testid="link-proof-demo" rel="nofollow">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 rounded-full font-semibold text-base gap-2">
                  <Play className="w-4 h-4" /> Open the live demo
                </Button>
              </a>
              <Link href="/proof">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-13 px-8 rounded-full font-semibold text-base border-2 border-foreground/25 text-foreground hover:bg-foreground/10"
                  data-testid="button-proof-readmore"
                >
                  Read the whole story
                </Button>
              </Link>
            </div>
          </div>

          <figure className="photo-frame aspect-[4/3] w-full">
            <img
              src={photos.vacuumFleet.src}
              srcSet={srcSetFor(photos.vacuumFleet)}
              sizes={SIZES.half}
              alt={`The ${brand.operator.priorBusiness} equipment fleet`}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </Section>

      {/* ── Who it's for ── */}
      <Section measure="default" tone="tint">
        <SectionHeading
          eyebrow="Who this fits"
          title="Built for the trades that quote, schedule and come back"
          lead="If your work is priced per job, booked in advance, and done again next month, the shape of this is already right. Everything else is your numbers."
        />
        <div className="flex flex-wrap justify-center gap-2.5">
          {idealClients.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground bg-card border border-border rounded-full px-4 py-2"
            >
              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {c}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-[36rem] mx-auto leading-relaxed">
          Not on the list? If you quote jobs and book them in, it probably still fits — ask.
        </p>
      </Section>

      {/* ── Process ── */}
      <Section measure="default">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, fixed price"
          lead="No hourly billing, no discovery phase that quietly becomes the project."
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
            >
              {/* The rail spans the gap below the card — see the note on the
                  same pattern in HowItWorks: a connector that stops inside
                  its own card is five stubs, not a timeline. */}
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
        <div className="text-center mt-12">
          <Link href="/process">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2" data-testid="button-process-detail">
              What it costs and how long it takes <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}

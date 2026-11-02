import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Play, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand } from "@/lib/brand";
import {
  CLEANS_SINCE_2018,
  CLEANS_SINCE_2018_PLAIN,
  COMMUNITIES_SERVED,
  RECURRING_CLIENT_RATE,
} from "@/lib/company-stats";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

/**
 * The case study, and the honest version of it.
 *
 * The cleaning company has wound down. Saying so plainly is not a weakness
 * to be managed around — a software vendor who has never run the kind of
 * business they sell to is the common case, and the uncommon thing here is
 * seven years of doing the job. Hiding the ending would also make the live
 * demo confusing the moment a visitor noticed it takes no bookings.
 */
const beforeAfter = [
  {
    before: "Every quote took a call, a drive and two days",
    after: "A price range on screen in under a minute, any hour of the day",
  },
  {
    before: "Enquiries arrived in three inboxes and a text thread",
    after: "One queue, stored before it's emailed, retried if delivery fails",
  },
  {
    before: "Scheduling was phone tag and a whiteboard",
    after: "Customers pick a slot and reschedule themselves from a link",
  },
  {
    before: "Repeat clients called to ask when we were coming",
    after: "They sign in and look",
  },
  {
    before: "The site ranked for the company name and nothing else",
    after: `Its own page for each of ${COMMUNITIES_SERVED} towns, pre-rendered for crawlers`,
  },
];

const reviews = [
  {
    text: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Air BnB turnovers and have been lucky to have such a professional overseeing the cleaning services.",
    author: "Jessica M.",
  },
  {
    text: "I love working with Maine Cleaning! The level of communication is phenomenal and the knowledge of the cleaners is incredible!",
    author: "Erin P.",
  },
  {
    text: "The Maine Cleaning Co. does such an amazing job for our facility. They are so flexible and willing to go the extra mile, we couldn't be happier.",
    author: "Krystal F.",
  },
];

export default function Proof() {
  useSEO(STATIC_PAGE_SEO["/proof"]);

  return (
    <div className="w-full clip-x">
      <PageHero
        eyebrow="Case study"
        title={
          <>
            {brand.operator.priorBusiness}, and the{" "}
            <span className="heading-accent">system behind it.</span>
          </>
        }
        lead={`Founded ${brand.operator.foundedYear}. ${CLEANS_SINCE_2018_PLAIN} cleans across ${COMMUNITIES_SERVED} Southern Maine towns. Every one of them quoted, booked and invoiced through software I built while running the company.`}
        photo={photos.kitchenIsland}
        actions={
          <a href={brand.demoPath} data-testid="link-proof-hero-demo" rel="nofollow">
            <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              <Play className="w-4 h-4" /> Open the live demo
            </Button>
          </a>
        }
      />

      {/* ── The numbers ── */}
      <Section measure="wide" rhythm="tight" tone="deep">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { v: `${brand.operator.yearsRun} yrs`, l: "Running the business" },
            { v: CLEANS_SINCE_2018, l: "Jobs through the system" },
            { v: COMMUNITIES_SERVED, l: "Towns served" },
            { v: RECURRING_CLIENT_RATE, l: "Clients on recurring work" },
          ].map((s) => (
            <div key={s.l} className="kpi-card p-4 sm:p-5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{s.v}</div>
              <div className="text-[11px] font-medium text-muted-foreground leading-tight mt-1.5">{s.l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── The honest bit ── */}
      <Section measure="prose">
        <SectionHeading
          align="left"
          eyebrow="Where it stands"
          title="The cleaning company has wound down"
          lead="Worth saying plainly, up front, rather than leaving you to work it out."
        />
        <div className="space-y-5 text-[15px] sm:text-base text-muted-foreground leading-relaxed">
          <p>
            {brand.operator.priorBusiness} is no longer taking bookings. The demo is kept online
            because it is the most honest thing I can show you: a complete system that ran a real
            business for {brand.operator.yearsRun} years, not a prototype assembled for a pitch.
          </p>
          <p>
            Its booking and enquiry forms are switched off, so nobody can accidentally request a
            clean that will never happen. Everything else works exactly as it did — the quoting
            engine prices a real job, the portal signs in, the town pages are the ones that were
            indexed.
          </p>
          <p className="text-foreground font-medium">
            The reason I think that matters: I know what it costs to miss a callback on a Tuesday
            evening, because I missed them. Most people selling you software for this have never
            had to.
          </p>
        </div>
      </Section>

      {/* ── Before / after ── */}
      <Section measure="default" tone="tint">
        <SectionHeading
          eyebrow="What changed"
          title="Before the system, and after"
          lead="Not projections. The actual difference between how the business ran in 2018 and how it ran by the end."
        />
        <div className="space-y-3">
          {beforeAfter.map((row, i) => (
            <motion.div
              key={row.before}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              className="card-soft p-5 sm:p-6 grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 sm:gap-6 items-center"
            >
              <p className="text-[15px] text-muted-foreground leading-relaxed line-through decoration-muted-foreground/40">
                {row.before}
              </p>
              <ArrowRight className="hidden sm:block w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
              <p className="text-[15px] text-foreground font-medium leading-relaxed">{row.after}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── What its customers said ── */}
      <Section measure="wide">
        <SectionHeading
          eyebrow="Its customers"
          title="Reviews for the business, not the software"
          lead="The system is only interesting because the company it ran was worth reviewing. These are from its Google profile."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {reviews.map((r) => (
            <figure key={r.author} className="card-soft p-6 flex flex-col">
              <Quote className="w-5 h-5 text-primary/40 mb-4" aria-hidden="true" />
              <blockquote className="text-sm text-foreground leading-relaxed italic flex-grow">
                {r.text}
              </blockquote>
              <figcaption className="text-xs font-semibold text-muted-foreground mt-5 pt-2">
                — {r.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── Go look ── */}
      <Section measure="default" tone="deep">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-10 lg:gap-14 items-center">
          <div>
            <h2 className="type-h2 text-foreground mb-5">Go and click around it</h2>
            <p className="type-lead mb-8">
              Build a quote. Open the booking flow. Sign in to the portal. Look at a town page with
              JavaScript switched off and see that the text is really there. It is all live.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={brand.demoPath} data-testid="link-proof-footer-demo" rel="nofollow">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 rounded-full font-semibold text-base gap-2">
                  <Play className="w-4 h-4" /> Open the demo
                </Button>
              </a>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-13 px-8 rounded-full font-semibold text-base border-2 border-foreground/25 text-foreground hover:bg-foreground/10"
                  data-testid="button-proof-contact"
                >
                  Talk about yours <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <figure className="photo-frame aspect-[4/3] w-full">
            <img
              src={photos.rentalBathroom.src}
              srcSet={srcSetFor(photos.rentalBathroom)}
              sizes={SIZES.half}
              alt="A guest-ready rental bathroom turned over by The Maine Cleaning Co."
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </Section>
    </div>
  );
}

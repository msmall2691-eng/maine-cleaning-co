import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, CheckCircle2, Info } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { areaPageSeo } from "@/lib/seo";
import { getAreaPage, areaVisitClaim, areaTownRows } from "@/lib/area-pages";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { ClosingCTA } from "@/components/layout/ClosingCTA";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AmbientPhoto } from "@/components/ui/AmbientPhoto";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

/**
 * /service-areas/:slug — a landing page for one part of the service area.
 *
 * The content is entirely in lib/area-pages.ts, including the per-town visit
 * counts, which are derived from lib/service-visits.ts rather than written
 * here. That matters more than it looks: the numbers on this page are the
 * reason it can rank at all. Any cleaning company can write "we serve the
 * Sebago Lake area"; only we can say which towns and how often, and a figure
 * retyped into a page is a figure that goes stale silently.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ServiceAreaDetail() {
  const params = useParams<{ slug: string }>();
  const area = getAreaPage(params.slug || "");

  // An unknown slug must not be indexed under a canonical implying a real
  // area page exists — same rule as ServiceDetail.
  useSEO(
    area
      ? areaPageSeo(area)
      : {
          title: "Service Area",
          description: "Cleaning services across York and Cumberland County, Maine.",
          noindex: true,
        },
  );

  if (!area) {
    return (
      <Section measure="prose" rhythm="loose" className="min-h-[60vh] flex items-center" innerClassName="text-center w-full">
        <h1 className="text-3xl font-serif font-bold mb-4">Area Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the service area you're looking for.</p>
        <Link href="/service-areas">
          <Button className="rounded-full">All Service Areas</Button>
        </Link>
      </Section>
    );
  }

  const townRows = areaTownRows(area);
  const busiest = townRows.filter((t) => t.visits !== undefined);

  return (
    <div className="w-full clip-x service-pattern-camp">
      {/* ── Hero: copy left, lake photo right ── */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-[78rem] mx-auto grid lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <nav aria-label="Breadcrumb" className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-muted-foreground mb-5">
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/service-areas" className="hover:text-foreground transition-colors">Service Areas</Link>
                <span aria-hidden="true">/</span>
                <span className="text-foreground font-medium truncate">{area.name}</span>
              </nav>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.25rem] sm:text-5xl md:text-[3.25rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground mb-3"
                data-testid="text-area-title"
              >
                {area.headline}
              </motion.h1>
              <p className="text-sm font-semibold tracking-wide uppercase text-brand-pine mb-4" data-testid="text-area-tagline">
                {area.tagline}
              </p>
              <p className="text-muted-foreground text-[15px] sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                {area.lede}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/book">
                  <Button size="lg" className="rounded-full w-full sm:w-auto" data-testid="button-area-book">
                    Get an Estimate <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/services/camp-opening-closing">
                  <Button size="lg" variant="outline" className="rounded-full w-full sm:w-auto" data-testid="button-area-camp">
                    Camp Opening &amp; Closing
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <img
                src={photos.kitchenLakeWindow.src}
                srcSet={srcSetFor(photos.kitchenLakeWindow)}
                sizes={SIZES.half}
                alt={photos.kitchenLakeWindow.alt}
                className="w-full h-auto rounded-3xl shadow-lg"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── The towns, with the real numbers ──
          The whole reason this page can compete. A national franchise can
          claim the area; it cannot say how many times we have been there. */}
      <Section measure="wide" tone="tint">
        <SectionHeading
          eyebrow="Where we work"
          title={`${areaVisitClaim(area)} cleans in the ${area.name} towns`}
          lead={`Counts are from our own booking history and cover our busiest towns. ${area.towns.length} communities in this area, listed busiest first.`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
          {townRows.map((town, i) => (
            <motion.div
              key={town.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="card-glass p-4 sm:p-5"
              data-testid={`area-town-${town.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <MapPin className="w-3.5 h-3.5 mt-1 text-brand-pine flex-shrink-0" aria-hidden="true" />
                <span className="font-bold text-foreground text-sm sm:text-base leading-tight">{town.name}</span>
              </div>
              {town.visits !== undefined ? (
                <p className="text-xs sm:text-sm text-muted-foreground pl-[1.375rem]">
                  {town.visits.toLocaleString("en-US")} cleans
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground pl-[1.375rem]">On our routes</p>
              )}
            </motion.div>
          ))}
        </div>
        {busiest.length > 0 && (
          <p className="text-sm text-muted-foreground mt-6">
            {busiest[0].name} alone accounts for {busiest[0].visits?.toLocaleString("en-US")} of them.
          </p>
        )}
      </Section>

      {/* ── What's actually different about working here ── */}
      <Section measure="wide">
        <SectionHeading
          eyebrow="What's different here"
          title={`Lake work isn't coastal work`}
          lead="Four things about this area that change how we schedule and what we bring."
        />
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 mt-8">
          {area.localDetail.map((detail, i) => (
            <motion.div
              key={detail.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="card-glass p-6 sm:p-7"
            >
              <h3 className="font-bold text-foreground text-base sm:text-lg mb-2.5">{detail.title}</h3>
              <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">{detail.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Access: the practical bit an owner needs to hand us ── */}
      <Section measure="default" tone="tint">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-9">
          {/* From the vetted `ambientPhotos` set in lib/photos.ts: landscape, and
                legible once scrimmed back behind text. */}
          <AmbientPhoto photo={photos.kitchenCooktop} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-brand-pine" aria-hidden="true" />
              <h2 className="font-bold text-foreground text-lg sm:text-xl">What to tell us when you book</h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              Access is the part that goes wrong up here, and it's cheap to get right in advance. These five
              things let us route the visit properly instead of calling you from a locked gate.
            </p>
            <ul className="space-y-3">
              {area.accessNotes.map((note) => (
                <li key={note} className="flex items-start gap-2.5 text-sm sm:text-base text-foreground">
                  <CheckCircle2 className="w-4 h-4 mt-1 text-brand-pine flex-shrink-0" aria-hidden="true" />
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Related services ── */}
      <Section measure="wide">
        <SectionHeading eyebrow="Services" title={`What we do on the lake`} />
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {area.relatedServices.map((svc, i) => (
            <motion.div key={svc.href} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <Link href={svc.href} className="block h-full group">
                <div className="card-glass p-6 h-full flex flex-col">
                  <h3 className="font-bold text-foreground text-base mb-2 group-hover:text-primary transition-colors">
                    {svc.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{svc.blurb}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-4">
                    Read more <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FAQs. Same array the FAQPage JSON-LD is built from, which is
             Google's requirement and the honest thing regardless. ── */}
      <Section measure="prose" tone="tint">
        <SectionHeading eyebrow="Questions" title={`${area.name} questions we actually get`} />
        <Accordion type="single" collapsible className="mt-8">
          {area.faqs.map((faq, i) => (
            <AccordionItem key={faq.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-[15px] sm:text-base font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <ClosingCTA
        title={`Cleaning on ${area.name}?`}
        lead="Tell us your dates and where the key is. Estimates take about two minutes."
        ctaTestId="button-area-cta-estimate"
        photo={photos.kitchenLakeWindow}
      />
    </div>
  );
}

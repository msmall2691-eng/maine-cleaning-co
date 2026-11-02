import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Leaf, Calendar, Phone } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { DEMO_PAGE_SEO } from "@/lib/seo";
import { Link } from "wouter";
import { getServicesList } from "@/lib/services-data";
import { motion } from "framer-motion";
import { CleaningQuiz } from "@/components/ui/CleaningQuiz";
import { EstimateCTA } from "@/components/ui/EstimateCTA";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/company-info";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

export default function Services() {
  useSEO(DEMO_PAGE_SEO["/services"]);
  const services = getServicesList();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full clip-x">
      {/* ── Hero ──
          Same shape as the homepage: copy left, one of our own photos right,
          collapsing to centred copy over a single wide photo on a phone. The
          page used to run this same photo full-bleed behind the text at 7%
          opacity, which is invisible — it read as an empty grey band with a
          heading floating in it. */}
      <PageHero
        eyebrow="What we do"
        /* Non-breaking spaces inside the accent so `text-wrap: balance`
            can only break before it — otherwise it splits the emphasised
            phrase as "kind / of space." across two lines. */
        title={<>Cleaning for every <span className="heading-accent">kind&nbsp;of&nbsp;space.</span></>}
        lead="Tailored cleaning solutions for homes, rentals, and businesses across Southern Maine."
        photo={photos.vacuumFleet}
        actions={
          <>
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-services-hero-book">
                <Calendar className="w-4 h-4" /> Book a Cleaning
              </Button>
            </Link>
            <a href={companyInfo.contact.phoneHref}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base font-semibold border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]" data-testid="button-services-hero-call">
                <Phone className="w-4 h-4 mr-2" /> Call Us
              </Button>
            </a>
          </>
        }
      />

      {/* ── The services themselves ── */}
      <Section measure="wide" rhythm="tight">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={`/services/${service.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group cursor-pointer card-glass p-6 sm:p-7 hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full min-h-[13.5rem]"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 flex-shrink-0 ${service.color}`}>
                    <Icon className="w-5 h-5 service-icon-hover" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{service.shortDesc}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-primary mt-5 group-hover:translate-x-1 transition-transform duration-300">
                    View details <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* ── Quiz ── */}
      <Section measure="default" tone="tint">
        <SectionHeading
          title="Not Sure Where to Start?"
          lead="Take our 30-second quiz and we'll recommend the perfect cleaning service for your needs."
        />
        <CleaningQuiz />
      </Section>

      {/* ── Estimate ── */}
      <Section measure="prose">
        <div className="relative">
          <div id="estimate-section-anchor" className="absolute -top-32" />
          <EstimateCTA />
        </div>
      </Section>

      {/* ── How we clean ──
          The eco copy used to be a lone bordered box on an otherwise empty
          band. It now sits beside the bottles themselves, which is both the
          missing visual weight and the evidence for the claim next to it. */}
      <Section measure="default">
        <LogoWatermark position="left" />
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-center">
          <figure className="photo-frame aspect-[4/3] max-w-md mx-auto lg:max-w-none w-full order-last lg:order-first">
            <img
              src={photos.ecoProducts.src}
              srcSet={srcSetFor(photos.ecoProducts)}
              sizes={SIZES.half}
              alt={photos.ecoProducts.alt}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="bg-brand-pine/10 border border-brand-pine/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center flex-shrink-0 shadow-sm text-brand-pine">
              <Leaf className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-brand-pine text-base mb-2">Our Cleaning Approach</h2>
              <p className="text-sm text-brand-pine/90 leading-relaxed mb-3">
                We exclusively use Melaleuca EcoSense & Sal Suds — eco-friendly products that deliver a thorough clean without harsh chemicals.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Melaleuca EcoSense", "Sal Suds", "Safe for kids & pets", "No harsh chemicals"].map((tag) => (
                  <span key={tag} className="text-xs font-medium text-brand-pine bg-card/80 border border-brand-pine/30 rounded-full px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

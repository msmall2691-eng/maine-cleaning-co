import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Leaf } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { getServicesList } from "@/lib/services-data";
import { motion } from "framer-motion";
import { CleaningQuiz } from "@/components/ui/CleaningQuiz";
import { EstimateCTA } from "@/components/ui/EstimateCTA";
import { Section, SectionHeading } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

export default function Services() {
  useSEO({ title: "Residential, Commercial & Airbnb Cleaning Services", description: "Residential, deep cleaning, Airbnb turnovers, commercial janitorial, and move-in/move-out cleaning across Southern Maine. Eco-friendly products, transparent pricing." });
  const services = getServicesList();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Hero ──
          Same shape as the homepage: copy left, one of our own photos right,
          collapsing to centred copy over a single wide photo on a phone. The
          page used to run this same photo full-bleed behind the text at 7%
          opacity, which is invisible — it read as an empty grey band with a
          heading floating in it. */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-[78rem] mx-auto grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] mb-6 text-foreground"
              >
                Our Services
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
              >
                Tailored cleaning solutions for homes, rentals, and businesses across Southern Maine.
              </motion.p>
            </div>

            {/* Eager, not lazy — this is the LCP candidate on desktop. */}
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="photo-frame aspect-[4/3] lg:aspect-[5/4] max-w-md mx-auto lg:max-w-none w-full"
            >
              <img
                src={photos.vacuumFleet.src}
                srcSet={srcSetFor(photos.vacuumFleet)}
                sizes={SIZES.half}
                alt={photos.vacuumFleet.alt}
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>
      </section>

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

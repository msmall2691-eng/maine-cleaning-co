import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, ArrowRight, Phone, RefreshCw, Sparkles, Calendar } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { ServiceAreaMap } from "@/components/ui/ServiceAreaMap";
import { companyInfo } from "@/lib/company-info";
import { serviceRegions } from "@/lib/service-areas";
import { COMMUNITIES_SERVED, RECURRING_CLIENT_RATE } from "@/lib/company-stats";
import { Section, SectionHeading } from "@/components/layout/Section";
import { ClosingCTA } from "@/components/layout/ClosingCTA";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos } from "@/lib/photos";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const kpiStats = [
  {
    icon: RefreshCw,
    value: RECURRING_CLIENT_RATE,
    label: "Recurring Clients",
    desc: "Trust us to come back again & again",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    value: "7%",
    label: "One-Time Cleans",
    desc: "First-timers always welcome",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: MapPin,
    value: COMMUNITIES_SERVED,
    label: "Communities",
    desc: "Across York & Cumberland County",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Calendar,
    value: "7+",
    label: "Years Serving Maine",
    desc: "Est. 2018 — and growing",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export default function ServiceAreas() {
  useSEO({ title: "Service Areas — York & Cumberland County", description: `The Maine Cleaning Co. serves ${COMMUNITIES_SERVED} communities across York & Cumberland County. Portland, Kennebunkport, Old Orchard Beach, Scarborough, and more.` });
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Page Hero ──
          A page about the places we serve had no photograph on it at all.
          Copy left, one of our own vacation-rental turnovers right — the work
          those coastal towns actually book us for. */}
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
                <MapPin className="w-3.5 h-3.5" /> York & Cumberland County
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold leading-[1.04] tracking-[-0.04em] text-foreground mb-5"
              >
                Where We <span className="hero-gradient-text">Serve</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
              >
                Trusted by homeowners and hosts across York & Cumberland County — with 93% of clients returning regularly. If your town isn't listed, reach out — we may still be able to help.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap"
              >
                <Link href="/#get-estimate">
                  <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-sa-hero-estimate">
                    Get My Estimate <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href={companyInfo.contact.phoneHref}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base font-semibold border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]" data-testid="button-sa-hero-call">
                    <Phone className="w-4 h-4 mr-2" /> Call Us
                  </Button>
                </a>
              </motion.div>
            </div>

            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="photo-frame aspect-[4/3] lg:aspect-[4/5] max-w-md mx-auto lg:max-w-none w-full"
            >
              <img
                src={photos.rentalBathroom.src}
                alt={photos.rentalBathroom.alt}
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ── KPI Stats Strip ──
          Was ruled off top and bottom with a 1px border across the full
          viewport. The cards carry their own weight; the hairlines only ever
          added a seam. */}
      <Section rhythm="tight" measure="default">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="kpi-card p-4 sm:p-5 text-center"
                data-testid={`kpi-${i}`}
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <div className={`text-2xl sm:text-3xl font-bold tracking-tight mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-[13px] font-semibold text-foreground">{stat.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{stat.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── Full Interactive Map ──
          `default` measure because ServiceAreaMap caps itself at max-w-4xl
          internally — the heading used to run at max-w-md above it, which is
          what made the two read as unrelated blocks. */}
      <Section measure="default" tone="tint">
        <SectionHeading
          title={<span data-testid="text-map-title">Our Impact Across Southern Maine</span>}
          lead={<span data-testid="text-map-subtitle">Every dot is a community we serve across York and Cumberland County.</span>}
        />
        <ServiceAreaMap />
      </Section>

      {/* ── Communities by Region ──
          One of our own photos sits behind this band at ~10% so the list of
          towns isn't a flat grid of cards on blank page. Decoration only:
          aria-hidden, lazy, and the band carries `isolate` because
          .photo-ambient sits at z-index:-1. */}
      <Section measure="wide" className="isolate">
        <div className="photo-ambient">
          <img src={photos.commercialAisle.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        </div>
        <LogoWatermark position="right" />

        <SectionHeading
          title="Communities We Serve"
          lead="Serving York and Cumberland County — from the beaches of Ogunquit to the islands of Casco Bay."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceRegions.map((region, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card-glass p-5 sm:p-6"
              data-testid={`region-${i}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <h3 className="font-bold text-foreground text-base">{region.name}</h3>
              </div>
              <ul className="space-y-1.5">
                {region.communities.map((town) => (
                  <li key={town} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                    {town}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div className="inline-block card-glass px-6 py-4 rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Don't see your town?{" "}
              <a href={companyInfo.contact.phoneHref} className="text-primary font-semibold hover:underline" data-testid="link-sa-not-listed">
                Call us
              </a>{" "}
              — we may still be able to help.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* ── CTA ── */}
      <ClosingCTA
        title="Serving your neighborhood?"
        lead="Get an instant estimate for your home, rental, or business."
        ctaTestId="button-sa-cta-estimate"
        photo={photos.commercialFloor}
      />
    </div>
  );
}

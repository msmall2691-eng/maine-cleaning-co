import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, ArrowRight, Phone, RefreshCw, Sparkles, Calendar } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { ServiceAreaMap } from "@/components/ui/ServiceAreaMap";
import { companyInfo } from "@/lib/company-info";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const kpiStats = [
  {
    icon: RefreshCw,
    value: "93%",
    label: "Recurring Clients",
    desc: "Trust us to come back again & again",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    value: "7%",
    label: "One-Time Cleans",
    desc: "First-timers always welcome",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: MapPin,
    value: "49+",
    label: "Communities",
    desc: "Across York & Cumberland County",
    color: "text-orange-400",
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

const regions = [
  {
    name: "Greater Portland",
    communities: [
      "Portland", "South Portland", "Cape Elizabeth", "Scarborough", "Westbrook",
      "Gorham", "Falmouth", "Cumberland", "Yarmouth", "Gray", "New Gloucester",
    ],
  },
  {
    name: "Southern Beaches",
    communities: [
      "Old Orchard Beach", "Saco", "Biddeford", "Kennebunk", "Kennebunkport",
      "Wells", "Ogunquit", "York", "York Beach", "Cape Neddick", "Kittery",
    ],
  },
  {
    name: "Midcoast & Outlying",
    communities: [
      "Brunswick", "Freeport", "Harpswell", "Bath", "Topsham", "Lisbon",
      "Windham", "Raymond", "Naples", "Standish", "Buxton", "Hollis",
    ],
  },
  {
    name: "Islands & Peninsula",
    communities: [
      "Peaks Island", "Long Island", "Chebeague Island", "South Freeport",
      "Casco Bay Islands", "Bailey Island", "Orrs Island",
    ],
  },
];

export default function ServiceAreas() {
  useSEO({ title: "Service Areas — York & Cumberland County", description: "The Maine Cleaning Co. serves 49+ communities across York & Cumberland County. Portland, Kennebunkport, Old Orchard Beach, Scarborough, and more." });
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Page Hero ── */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-2xl">
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
            className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8"
          >
            Trusted by homeowners and hosts across York & Cumberland County — with 93% of clients returning regularly. If your town isn't listed, reach out — we may still be able to help.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-3 flex-wrap"
          >
            <Link href="/#get-estimate">
              <Button size="lg" className="rounded-full px-9 h-13 font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-sa-hero-estimate">
                Get My Estimate <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={companyInfo.contact.phoneHref}>
              <Button size="lg" variant="outline" className="rounded-full px-9 h-13 font-semibold border-border bg-card/80" data-testid="button-sa-hero-call">
                <Phone className="w-4 h-4 mr-2" /> Call Us
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── KPI Stats Strip ── */}
      <section className="py-10 sm:py-12 border-y border-border/40 bg-card/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
        </div>
      </section>

      {/* ── Full Interactive Map ── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-8 sm:mb-12">
            <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent" data-testid="text-map-title">
              Our Impact Across Southern Maine
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed" data-testid="text-map-subtitle">
              Real data from our Jobber operations — every dot is a community we serve.
            </p>
          </div>
          <ServiceAreaMap />
        </div>
      </section>

      {/* ── Communities by Region ── */}
      <section className="py-16 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center max-w-md mx-auto mb-12">
            <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
              Communities We Serve
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Serving York and Cumberland County — from the beaches of Ogunquit to the islands of Casco Bay.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region, i) => (
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
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <h3 className="font-bold text-foreground text-sm">{region.name}</h3>
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
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg">
          <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold mb-5 tracking-[-0.01em]">
            Serving your neighborhood?
          </h2>
          <p className="text-base opacity-85 mb-10 leading-relaxed">
            Get an instant estimate for your home, rental, or business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/#get-estimate">
              <Button size="lg" className="w-full sm:w-auto h-14 px-9 rounded-full bg-background text-foreground hover:bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-semibold text-base" data-testid="button-sa-cta-estimate">
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

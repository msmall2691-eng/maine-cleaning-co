import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import {
  Calendar, Leaf, CheckCircle2, MessageCircle, Shield, Users, ArrowRight,
  Phone, Star, MapPin, RefreshCw, Quote,
  TrendingUp, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Certifications } from "@/components/ui/Certifications";
import { AICleaningTip } from "@/components/ui/AICleaningTip";
import { companyInfo } from "@/lib/company-info";
import { CLEANS_SINCE_2018, CLEANS_SINCE_2018_PLAIN, RECURRING_CLIENT_RATE, COMMUNITIES_SERVED } from "@/lib/company-stats";
import { WorkGallery } from "@/components/ui/WorkGallery";
import { SocialFollow } from "@/components/ui/SocialFollow";
import { Section, SectionHeading } from "@/components/layout/Section";
import { ClosingCTA } from "@/components/layout/ClosingCTA";
import { LogoWatermark, LogoBadge } from "@/components/brand/Logo";
import { photos } from "@/lib/photos";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const achievements = [
  { icon: Calendar, value: "Est. 2018", label: "Founded in Maine", color: "text-primary", bg: "bg-primary/10" },
  { icon: TrendingUp, value: CLEANS_SINCE_2018, label: "Cleans Completed", color: "text-brand-pine", bg: "bg-brand-pine/10" },
  { icon: RefreshCw, value: RECURRING_CLIENT_RATE, label: "Recurring Clients", color: "text-brand-harbor", bg: "bg-brand-harbor/10" },
  { icon: MapPin, value: COMMUNITIES_SERVED, label: "Communities Served", color: "text-brand-stone", bg: "bg-brand-stone/10" },
  { icon: Star, value: "4.9★", label: "Google Rating", color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: Clock, value: "30+", label: "Yrs Combined Exp.", color: "text-brand-navy", bg: "bg-brand-navy/10" },
];

const testimonials = [
  { quote: "I love working with Maine Cleaning! The level of communication is phenomenal and the knowledge of the cleaners is incredible!", author: "Erin P.", date: "Sep 2022" },
  { quote: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Airbnb turnovers.", author: "Jessica M.", date: "Sep 2021" },
  { quote: "So friendly and always with a smile! They are so flexible and willing to go the extra mile — we couldn't be happier.", author: "Krystal F.", date: "Sep 2024" },
];

export default function About() {
  useSEO({ title: "About Us — Southern Maine's Trusted Cleaning Team", description: "Meet The Maine Cleaning Co. — Southern Maine's trusted cleaning team since 2018. Eco-friendly products, bonded & insured crews, and a commitment to consistent results." });
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Page Hero ──
          Was a centred column of text on an otherwise blank band — roughly
          90% empty on a laptop. Same shape as the homepage now: copy left,
          one of our own photos right, collapsing to centred copy plus a
          single wide photo below lg. */}
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
                Southern Maine Since 2018
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] font-extrabold leading-[1.04] tracking-[-0.04em] text-foreground mb-5"
              >
                About <span className="hero-gradient-text">Maine Cleaning Co.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
              >
                A team that genuinely cares — about your space, your family, and the environment.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap"
              >
                <Link href="/#get-estimate">
                  <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-about-hero-estimate">
                    Get My Estimate <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href={companyInfo.contact.phoneHref}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base font-semibold border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]" data-testid="button-about-hero-call">
                    <Phone className="w-4 h-4 mr-2" /> Call Us
                  </Button>
                </a>
              </motion.div>
            </div>

            {/* Our own kit, not a stock photo of a stock kitchen. */}
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="photo-frame aspect-[4/3] lg:aspect-[5/4] max-w-md mx-auto lg:max-w-none w-full"
            >
              <img
                src={photos.vacuumFleet.src}
                alt={photos.vacuumFleet.alt}
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ── Our Story + Stats + What Sets Us Apart ── */}
      <Section measure="wide">
        <LogoWatermark position="right" />
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* The painted badge, at the one place on the site that is actually
                about who we are. It carries the company name itself here — the
                heading beside it doesn't — so it gets a real `title` rather
                than being hidden from screen readers. */}
            <LogoBadge title="The Maine Cleaning Co. — cleaning & property management, est. 2018" className="w-52 sm:w-60 mb-7" />

            <SectionHeading
              align="left"
              title="Built on Trust. Driven by Care."
              lead={
                <>
                  The Maine Cleaning Co. was founded in 2018 with one belief: cleaning should feel effortless for clients and meaningful for the people doing it. We've grown from a small residential team into Southern Maine's most trusted cleaning service — serving homes, vacation rentals, and commercial spaces across York and Cumberland counties.
                  <span className="block mt-4">
                    Every cleaner on our team is trained, background-checked, and genuinely invested in delivering results that go beyond the surface. With 30+ years of combined experience and {CLEANS_SINCE_2018_PLAIN} completed cleans, we've earned a {RECURRING_CLIENT_RATE} client retention rate.
                  </span>
                </>
              }
            />

            {/* What sets us apart — integrated values */}
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">What sets us apart</h3>
            <div className="space-y-3 mb-7">
              {[
                { icon: Calendar, text: "Reliable scheduling — same team, same day, every time" },
                { icon: Leaf, text: "Eco-friendly Melaleuca EcoSense® products, safe for kids & pets" },
                { icon: CheckCircle2, text: "Homes, vacation rentals, and offices — one trusted team" },
                { icon: MessageCircle, text: "Transparent pricing and responsive communication" },
                { icon: Shield, text: "Fully bonded and insured with comprehensive liability coverage" },
                { icon: Users, text: "100% local Southern Maine team since 2018" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/how-it-works">
                <Button className="rounded-full px-7 h-11 font-semibold gap-2" data-testid="button-about-howitworks">
                  How It Works <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/service-areas">
                <Button variant="outline" className="rounded-full px-7 h-11 font-semibold gap-2 border-border" data-testid="button-about-areas">
                  Our Service Areas
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Achievement stat grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {achievements.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="kpi-card p-4 flex flex-col gap-2" data-testid={`achievement-${i}`}>
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className={`text-xl font-bold tracking-tight ${item.color}`}>{item.value}</div>
                  <div className="text-[11px] font-medium text-muted-foreground leading-tight">{item.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </Section>

      {/* ── Eco Products ── */}
      <Section tone="tint">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.figure
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="photo-frame aspect-[4/3]"
          >
            <img
              src="/images/ecosense-products.jpeg"
              alt="Melaleuca EcoSense cleaning products — The Maine Cleaning Co."
              loading="lazy"
              decoding="async"
              data-testid="img-ecosense-products"
            />
          </motion.figure>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-pine/10 border border-brand-pine/25 text-brand-pine text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Leaf className="w-3.5 h-3.5" /> Eco-Certified Products
            </div>
            <SectionHeading
              align="left"
              title={<>Powered by Melaleuca EcoSense<sup className="text-xs">®</sup></>}
              lead={
                <>
                  We exclusively use Melaleuca EcoSense® and Sal Suds — professional-grade, non-toxic, and biodegradable. Safe for your family, your pets, and every surface we clean. Zero harsh chemicals. Full results.
                  <span className="mt-5 flex flex-wrap gap-2">
                    {["Non-Toxic", "Biodegradable", "Kid & Pet Safe", "No Harsh Chemicals", "Professional Grade"].map((tag) => (
                      <span key={tag} className="text-[11px] font-medium border border-brand-pine/30 bg-brand-pine/10 text-brand-pine rounded-full px-2.5 py-0.5">{tag}</span>
                    ))}
                  </span>
                </>
              }
            />
            <AICleaningTip />
          </motion.div>
        </div>
      </Section>

      {/* ── Client Voices ── */}
      <Section measure="wide">
        <SectionHeading
          title="What Clients Say"
          lead="Real feedback from Southern Maine homeowners and hosts."
        />
        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card-soft p-5 sm:p-6 flex flex-col"
              data-testid={`testimonial-${i}`}
            >
              <Quote className="w-5 h-5 text-primary/40 mb-3 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed italic flex-grow mb-4">"{t.quote}"</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />)}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">— {t.author}</p>
                  <p className="text-[10px] text-muted-foreground/60">{t.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <a href="https://g.page/r/CYnY6ulFfvDtEAE/review" target="_blank" rel="noopener noreferrer" data-testid="link-google-reviews">
            <Button variant="outline" className="rounded-full h-10 px-6 text-sm font-semibold gap-2 border-border">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500 dark:text-yellow-400" /> See All Reviews on Google
            </Button>
          </a>
        </div>
      </Section>

      {/* ── Certifications ──
          The heading used to run at max-w-md over a max-w-5xl badge grid — a
          448px column of text on top of a 1024px row of logos. Both are on
          the section measure now. */}
      <Section>
        <SectionHeading
          title="Certified & Accredited"
          lead="Industry-recognized certifications that reflect our commitment to quality, safety, and professionalism."
        />
        <Certifications />
      </Section>

      {/* ── Our Work + live social ── */}
      {/* Same two components the home page uses — one grid and one embed to
          maintain, not a second copy that drifts. (The previous version of
          this section inlined its own hardcoded photo list, which is exactly
          how it drifted from lib/gallery-data.ts in the first place.) */}
      <Section measure="wide" tone="sink">
        <WorkGallery />
      </Section>

      <Section measure="wide">
        <SocialFollow />
      </Section>

      {/* ── CTA ── */}
      <ClosingCTA
        title="Experience the difference."
        lead="See why Southern Maine trusts us with their spaces — get a free estimate today."
        ctaTestId="button-about-estimate"
        photo={photos.rentalBathroom}
      />
    </div>
  );
}

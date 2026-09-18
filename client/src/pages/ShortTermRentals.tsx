import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Star,
  Home,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  MessageCircle,
  Phone,
  ChevronRight,
  BarChart3,
  Key,
  Sparkles,
  Users,
  MapPin,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/company-info";
import { EstimateCTA } from "@/components/ui/EstimateCTA";
import { Section, SectionHeading } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const turnoverFeatures = [
  { icon: Zap, title: "Same-Day Turnovers", desc: "Guests check out, new guests check in — same day. We coordinate precisely with your checkout times to deliver hotel-standard results every time." },
  { icon: RefreshCw, title: "iCal & Platform Sync", desc: "We sync directly with your Airbnb, VRBO, or Booking.com calendar so scheduling is automatic. No texts, no back-and-forth — we know when you need us." },
  { icon: Calendar, title: "Automated Scheduling", desc: "Once we're synced, cleaning appointments book themselves. You focus on hosting; we handle the logistics behind every reset." },
  { icon: Clock, title: "Consistent, On-Time Arrivals", desc: "Strict timing protocols mean your property is always guest-ready well before check-in — every booking, every time." },
  { icon: Sparkles, title: "Hotel-Quality Cleans", desc: "Fresh linens, restocked essentials, spotless surfaces. We clean to a hospitality standard that earns 5-star reviews from your guests." },
  { icon: Leaf, title: "Eco-Friendly Products", desc: "We use Melaleuca EcoSense and Sal Suds — effective, non-toxic, and safe for guests with sensitivities or allergies." },
];

const managementServices = [
  { icon: BarChart3, title: "Listing Optimization", desc: "We help craft or refine your Airbnb and VRBO listings — compelling photos guidance, keyword-rich descriptions, and pricing strategy to maximize your occupancy rate." },
  { icon: Users, title: "Guest Communication", desc: "From inquiry to checkout message, we handle guest messaging so you never miss a booking or leave a question unanswered — day or night." },
  { icon: Key, title: "Key & Access Management", desc: "Smart lock coordination, lockbox management, and access logistics handled seamlessly so guests always have a smooth entry experience." },
  { icon: TrendingUp, title: "Revenue Optimization", desc: "Dynamic pricing guidance, seasonal rate strategy, and occupancy analysis to ensure you're earning the most from your Southern Maine property." },
  { icon: Shield, title: "Property Oversight", desc: "Between guest stays, we inspect your property, flag maintenance issues, coordinate repairs with trusted local vendors, and keep everything guest-ready." },
  { icon: MessageCircle, title: "Review Management", desc: "We follow up with guests to encourage reviews and coach you on responding to feedback — boosting your rating and attracting more bookings." },
];

const whyChooseUs = [
  "Local Southern Maine team with 7+ years in vacation rental care",
  "Fully insured & bonded — protecting your property investment",
  "Consistent team who knows your property inside and out",
  "Transparent pricing with no hidden fees",
];

const strReviews = [
  { text: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Air BnB turnovers and have been lucky to have such a professional overseeing the cleaning services during a time when cleaning is the utmost importance for the safety and well-being of our guests.", author: "Jessica M.", location: "Airbnb Host", rating: 5 },
  { text: "We used them to clean our beach house between renters. They did an awesome job!! The place looked better than when we left it. Our guests were thrilled.", author: "Robert G.", location: "VRBO Host", rating: 5 },
  { text: "Highly recommend Maine Cleaning Company, and Megan and Matt, for both cleaning and property management. They have been great with both cleaning and property management, esp when it comes to finding repair people. If you are a remote owner, you can't go wrong with keeping them on contract.", author: "Meryl B.", location: "Remote Property Owner", rating: 5 },
];

const southernMaineHotspots = [
  "Old Orchard Beach", "Kennebunkport", "Saco", "Biddeford", "Cape Elizabeth",
  "Scarborough", "Portland", "South Portland", "Windham", "Naples",
  "Gorham", "Falmouth", "Yarmouth", "Brunswick", "Wells", "Ogunquit",
];

const scrollToEstimate = () => {
  const el = document.getElementById("str-estimate-section");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function ShortTermRentals() {
  useSEO({ title: "Airbnb & Short-Term Rental Cleaning", description: "Same-day Airbnb & VRBO turnover cleaning with iCal sync. Full STR property management, guest-ready standards, and Southern Maine's most reliable rental cleaning team." });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── Hero ──
          Copy left, work right — the same shape as the homepage. The page
          shipped 546 lines without a single photograph on it, which is a
          strange thing for a page selling guest-ready rooms; the bathroom
          shot is the only frame in the library of a finished, guest-ready
          space, so it leads here. */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-[78rem] mx-auto grid lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80" data-testid="text-str-label">
                  Southern Maine's STR Specialists
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-[2.25rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3.75rem] font-extrabold leading-[1.04] tracking-[-0.04em] text-foreground mb-5"
                data-testid="text-str-title"
              >
                Airbnb & Short-Term{" "}
                <span className="hero-gradient-text">Rental Experts.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="text-[15px] sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed mb-8"
                data-testid="text-str-subtitle"
              >
                Same-day turnovers, automated scheduling via iCal sync, property management, and full-service hosting support — everything Southern Maine vacation rental hosts need to earn 5-star reviews and maximize revenue.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-8"
              >
                <Button size="lg" className="h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.12)]" onClick={scrollToEstimate} data-testid="button-str-hero-estimate">
                  Get an Estimate <ArrowRight className="ml-2.5 w-4 h-4" />
                </Button>
                <a href={companyInfo.contact.phoneHref} data-testid="link-str-hero-call">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base border-border bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                    <Phone className="w-4 h-4 mr-2" /> Call Us
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2"
              >
                {[
                  { icon: Zap, label: "Same-Day Turnovers" },
                  { icon: RefreshCw, label: "iCal Sync" },
                  { icon: Shield, label: "Fully Insured" },
                  { icon: Star, label: "5-Star Standard" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                    <s.icon className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-xs sm:text-[13px] font-medium tracking-wide">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* LCP candidate on desktop — eager on purpose. */}
            <motion.figure
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="photo-frame aspect-[4/3] lg:aspect-[4/5] max-w-md mx-auto lg:max-w-none w-full"
            >
              <img
                src={photos.rentalBathroom.src}
                srcSet={srcSetFor(photos.rentalBathroom)}
                sizes={SIZES.half}
                alt={photos.rentalBathroom.alt}
                fetchPriority="high"
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>
      </section>

      {/* ── Why STR is Booming in Southern Maine ── */}
      <Section measure="default">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Southern Maine's Booming Market"
              title="The #1 STR Market in Maine — and We're Here for It"
              className="mb-7"
            />
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-5">
              From Old Orchard Beach and Kennebunkport to Portland and the Lakes Region, Southern Maine's short-term rental market is exploding. Hosts are earning top dollar — but only when their properties are consistently guest-ready.
            </p>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
              That's where we come in. The Maine Cleaning Co. specializes in serving Airbnb, VRBO, and short-term rental hosts across York and Cumberland County. We understand the demands of the hosting business — last-minute bookings, same-day flips, high guest expectations — and we're built to handle all of it.
            </p>
            <div className="flex flex-wrap gap-2">
              {southernMaineHotspots.slice(0, 8).map((town) => (
                <span key={town} className="text-xs font-medium text-primary/90 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                  {town}
                </span>
              ))}
              <span className="text-xs font-medium text-muted-foreground/70 bg-muted/50 border border-border/50 rounded-full px-3 py-1">
                + more
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "7+", label: "Years Serving STR Hosts" },
              { value: "5★", label: "Average Guest Rating" },
              { value: "Same Day", label: "Turnover Available" },
              { value: "iCal", label: "Platform Sync" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="kpi-card p-5 sm:p-6 text-center"
                data-testid={`stat-str-${i}`}
              >
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Turnover Cleaning Features ── */}
      <Section measure="wide" tone="tint" id="turnover-cleaning">
        <SectionHeading
          eyebrow="Turnover Cleaning"
          title="Guest-Ready, Every Single Time"
          lead="We handle every reset like it's the most important clean of the day — because for your guests, it is."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {turnoverFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group card-glass p-6 sm:p-7 h-full flex flex-col"
                data-testid={`feature-turnover-${i}`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-pine/10 flex items-center justify-center mb-4 flex-shrink-0 group-hover:bg-brand-pine/15 transition-colors">
                  <Icon className="w-5 h-5 text-brand-pine service-icon-hover" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── Management Services ── */}
      <Section measure="wide" id="property-management">
        <SectionHeading
          eyebrow="Full-Service Management"
          title="Beyond Cleaning — Hybrid Hosting Management"
          lead="We're not just a cleaning company. Our hybrid management services let you hand off the operational side of hosting entirely — from listings to guest communication to revenue strategy."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-12">
          {managementServices.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group card-soft p-6 sm:p-7 h-full flex flex-col"
                data-testid={`feature-mgmt-${i}`}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-pine/10 flex items-center justify-center mb-4 group-hover:bg-brand-pine/15 transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-pine service-icon-hover" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{svc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{svc.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="max-w-[38rem] mx-auto bg-primary/8 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
          <Home className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-foreground text-base mb-2">Custom Management Packages</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Every property is different. We build custom management plans that match your hosting style — whether you want full hands-off management or just the cleaning and maintenance pieces.
          </p>
          <Button className="rounded-full px-8 h-11 font-semibold" onClick={scrollToEstimate} data-testid="button-str-mgmt-cta">
            Discuss Your Property <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </Section>

      {/* ── How iCal Sync Works (condensed) ── */}
      <Section measure="default" tone="sink" id="ical-sync">
        <RefreshCw className="w-8 h-8 text-primary mx-auto mb-5" aria-hidden="true" />
        <SectionHeading
          title="We Sync With Your Calendar"
          lead="Connect your Airbnb, VRBO, or any OTA calendar once via iCal. We automatically schedule turnover cleans for every checkout — no manual coordination needed."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { step: "1", title: "Share your link", desc: "Copy your iCal URL from Airbnb or VRBO" },
            { step: "2", title: "We sync", desc: "Bookings auto-schedule cleans" },
            { step: "3", title: "We clean", desc: "Team arrives after each checkout" },
            { step: "4", title: "You're notified", desc: "Confirmation when guest-ready" },
          ].map((s, i) => (
            <div key={i} className="text-center" data-testid={`ical-step-${i}`}>
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 text-sm font-bold text-primary">
                {s.step}
              </div>
              <h3 className="font-bold text-foreground text-base mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Why Choose Us ──
          Was a centred heading over two stacked rows of small items in a
          wide band, which left most of the band empty. Now the proof sits
          beside a photograph of the work it's describing. */}
      <Section measure="default" id="why-us">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-14 items-center">
          <figure className="photo-frame aspect-[4/3] lg:aspect-square max-w-md mx-auto lg:max-w-none w-full">
            <img
              src={photos.fridgeInterior.src}
              srcSet={srcSetFor(photos.fridgeInterior)}
              sizes={SIZES.half}
              alt={photos.fridgeInterior.alt}
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Hosts Choose Us"
              title="Built for the STR Business"
              className="mb-8"
            />

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {whyChooseUs.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/50"
                  data-testid={`why-str-${i}`}
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-5 sm:gap-7">
              {[
                { icon: MapPin, label: "York & Cumberland County", sub: "We serve all of Southern Maine" },
                { icon: Users, label: "Dedicated STR Team", sub: "Specialists in short-term rental care" },
                { icon: Shield, label: "Fully Bonded & Insured", sub: "Protecting your investment" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 text-center max-w-[140px]" data-testid={`trust-str-${i}`}>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[13px] sm:text-sm font-bold text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Reviews from STR Hosts ── */}
      <Section measure="wide" tone="tint">
        <SectionHeading
          eyebrow="Host Reviews"
          title="What Hosts Are Saying"
        />

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {strReviews.map((review, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="card-soft p-5 sm:p-6"
              data-testid={`review-str-${i}`}
            >
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />)}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{review.text}"</p>
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">— {review.author}</span>
                <span className="text-[11px] text-primary/70">{review.location}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="https://g.page/r/CYnY6ulFfvDtEAE/review" target="_blank" rel="noopener noreferrer" data-testid="link-str-reviews">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />
              See all host reviews on Google
            </Button>
          </a>
        </div>
      </Section>

      {/* ── Coverage + estimate ──
          These were two separate bands, each holding one short block. They
          read as one thought — where we work, and what it costs — so they
          share a band now instead of putting a seam between them. */}
      <Section measure="default">
        <LogoWatermark position="left" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-10 lg:gap-16 items-center">
          <div>
            <SectionHeading
              align="left"
              title="We Serve All of Southern Maine"
              lead="From Old Orchard Beach to Kennebunkport, Portland to Naples — our STR cleaning and management services cover every short-term rental market in York & Cumberland County."
              className="mb-8"
            />
            <Link href="/service-areas">
              <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2" data-testid="link-str-map">
                <MapPin className="w-4 h-4 text-primary" /> View All Service Areas <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div id="str-estimate-section" className="absolute -top-32" />
            <EstimateCTA
              service="str"
              heading="Get your rental cleaning quote"
              sub="Turnovers are quoted per property — tell us about the place and we'll come back with a number, usually same day."
            />
          </div>
        </div>
      </Section>

      {/* ── Final CTA ──
          Still a full-bleed colour band, but no longer a postage stamp of
          text floating in it: the measure matches the rest of the page and
          one of our own photos runs behind the colour so the band has some
          depth. The photo is decoration, hence aria-hidden and lazy; the
          white text sits on `bg-primary`, which is the same colour in both
          themes, with the photo scrimmed back underneath it. */}
      <Section
        measure="default"
        rhythm="loose"
        className="bg-primary text-primary-foreground isolate overflow-hidden"
        innerClassName="text-center"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <img
            src={photos.vacuumFleet.src}
            srcSet={srcSetFor(photos.vacuumFleet)}
            sizes={SIZES.ambient}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-[0.18] saturate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/70 to-primary" />
        </div>

        <Home className="w-11 h-11 mx-auto mb-6 opacity-80" aria-hidden="true" />
        <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] leading-[1.1] font-serif font-bold mb-6 tracking-[-0.02em]">
          Ready to take your STR to the next level?
        </h2>
        <p className="text-base sm:text-lg opacity-85 mb-9 leading-relaxed max-w-[38rem] mx-auto">
          Whether you host one cabin or ten beachfront properties — we're your Southern Maine short-term rental partner.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            className="h-13 sm:h-14 px-9 rounded-full bg-background text-foreground hover:bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-semibold text-base sm:text-[17px]"
            onClick={scrollToEstimate}
            data-testid="button-str-final-cta"
          >
            Get My Estimate
          </Button>
          <a href={companyInfo.contact.phoneHref} data-testid="link-str-final-call">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-9 rounded-full border-white/20 hover:bg-white/10 text-white font-semibold text-base">
              <Phone className="w-4 h-4 mr-2" /> Call {companyInfo.contact.phoneDisplay}
            </Button>
          </a>
        </div>
      </Section>
    </div>
  );
}

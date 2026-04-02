import { useEffect, useRef } from "react";
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
import { InstantEstimate } from "@/components/ui/InstantEstimate";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function useSectionFade() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({ className = "", children, id, ...rest }: { className?: string; children: React.ReactNode; id?: string; [key: string]: any }) {
  const ref = useSectionFade();
  return <section ref={ref} className={`section-fade ${className}`} id={id} {...rest}>{children}</section>;
}

function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[35px] sm:h-[50px] md:h-[70px]">
        <path d="M0,50 C180,80 360,20 540,45 C720,70 900,15 1080,40 C1200,55 1350,25 1440,35 L1440,80 L0,80 Z" fill="hsl(220 20% 8%)" opacity="0.6" />
        <path d="M0,55 C240,75 480,25 720,50 C960,75 1200,20 1440,45 L1440,80 L0,80 Z" fill="hsl(220 20% 8%)" />
      </svg>
    </div>
  );
}

function WaveDividerCream({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[35px] sm:h-[50px] md:h-[70px]">
        <path d="M0,40 C180,70 360,10 540,35 C720,60 900,20 1080,50 C1260,70 1380,30 1440,40 L1440,80 L0,80 Z" fill="hsl(220 18% 10%)" opacity="0.5" />
        <path d="M0,50 C240,75 480,15 720,45 C960,70 1200,25 1440,50 L1440,80 L0,80 Z" fill="hsl(220 18% 10%)" />
      </svg>
    </div>
  );
}

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
  "iCal integration with Airbnb, VRBO, Booking.com, and more",
  "Fully insured & bonded — protecting your property investment",
  "Eco-friendly, guest-safe cleaning products, every clean",
  "Consistent team who knows your property inside and out",
  "Transparent pricing with no hidden fees",
  "Same-day turnovers available 7 days a week",
  "Trusted by hosts across York & Cumberland County",
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

      {/* ── Hero ── */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-2xl lg:max-w-3xl">
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
            className="text-[2.5rem] sm:text-[3.25rem] md:text-[4rem] lg:text-[5rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground mb-6"
            data-testid="text-str-title"
          >
            Airbnb & Short-Term{" "}
            <span className="hero-gradient-text">Rental Experts.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[15px] sm:text-lg text-muted-foreground max-w-md sm:max-w-xl mx-auto leading-relaxed mb-10"
            data-testid="text-str-subtitle"
          >
            Same-day turnovers, automated scheduling via iCal sync, property management, and full-service hosting support — everything Southern Maine vacation rental hosts need to earn 5-star reviews and maximize revenue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12"
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
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
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
      </section>

      {/* ── Wave ── */}
      <WaveDivider />

      {/* ── Why STR is Booming in Southern Maine ── */}
      <FadeSection className="py-20 sm:py-28 section-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3 block">Southern Maine's Booming Market</span>
              <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent text-left">
                The #1 STR Market in Maine — and We're Here for It
              </h2>
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
                  className="card-glass p-5 sm:p-6 text-center"
                  data-testid={`stat-str-${i}`}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── Turnover Cleaning Features ── */}
      <WaveDividerCream />
      <FadeSection className="py-20 sm:py-28 section-cream" id="turnover-cleaning">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3 block">Turnover Cleaning</span>
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">
              Guest-Ready, Every Single Time
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              We handle every reset like it's the most important clean of the day — because for your guests, it is.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
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
                  className="group card-glass p-5 sm:p-6"
                  data-testid={`feature-turnover-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary service-icon-hover" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm sm:text-[15px] mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ── Management Services ── */}
      <WaveDivider />
      <FadeSection className="py-20 sm:py-28 section-white" id="property-management">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3 block">Full-Service Management</span>
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">
              Beyond Cleaning — Hybrid Hosting Management
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              We're not just a cleaning company. Our hybrid management services let you hand off the operational side of hosting entirely — from listings to guest communication to revenue strategy.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto mb-14">
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
                  className="group card-soft p-5 sm:p-6 flex flex-col"
                  data-testid={`feature-mgmt-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary service-icon-hover" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm sm:text-[15px] mb-2">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{svc.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="max-w-2xl mx-auto bg-primary/8 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
            <Home className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-lg mb-2">Custom Management Packages</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Every property is different. We build custom management plans that match your hosting style — whether you want full hands-off management or just the cleaning and maintenance pieces.
            </p>
            <Button className="rounded-full px-8 h-11 font-semibold" onClick={scrollToEstimate} data-testid="button-str-mgmt-cta">
              Discuss Your Property <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </FadeSection>

      {/* ── How iCal Sync Works (condensed) ── */}
      <WaveDividerCream />
      <FadeSection className="py-16 sm:py-24 section-cream" id="ical-sync">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <RefreshCw className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
            We Sync With Your Calendar
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-10 max-w-lg mx-auto">
            Connect your Airbnb, VRBO, or any OTA calendar once via iCal. We automatically schedule turnover cleans for every checkout — no manual coordination needed.
          </p>
          <div className="grid sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
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
                <h4 className="font-semibold text-foreground text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── Why Choose Us ── */}
      <WaveDivider />
      <FadeSection className="py-20 sm:py-28 section-white" id="why-us">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center max-w-md mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3 block">Why Hosts Choose Us</span>
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">
              Built for the STR Business
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              We've spent years understanding what Airbnb and VRBO hosts in Southern Maine actually need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto mb-14">
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

          <div className="flex flex-wrap justify-center gap-6 text-center">
            {[
              { icon: MapPin, label: "York & Cumberland County", sub: "We serve all of Southern Maine" },
              { icon: Users, label: "Dedicated STR Team", sub: "Specialists in short-term rental care" },
              { icon: Shield, label: "Fully Bonded & Insured", sub: "Protecting your investment" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 max-w-[140px]" data-testid={`trust-str-${i}`}>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground text-center">{item.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{item.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ── Reviews from STR Hosts ── */}
      <WaveDividerCream />
      <FadeSection className="py-20 sm:py-28 section-cream">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 mb-3 block">Host Reviews</span>
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">
              What Hosts Are Saying
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
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
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
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
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                See all host reviews on Google
              </Button>
            </a>
          </div>
        </div>
      </FadeSection>

      {/* ── Coverage ── */}
      <WaveDivider />
      <FadeSection className="py-16 sm:py-20 section-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
            We Serve All of Southern Maine
          </h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
            From Old Orchard Beach to Kennebunkport, Portland to Naples — our STR cleaning and management services cover every short-term rental market in York & Cumberland County.
          </p>
          <Link href="/service-areas">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2" data-testid="link-str-map">
              <MapPin className="w-4 h-4 text-primary" /> View All Service Areas <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </FadeSection>

      {/* ── Estimate Section ── */}
      <section className="py-16 sm:py-24 relative">
        <div id="str-estimate-section" className="absolute -top-32" />
        <div className="container mx-auto px-4 sm:px-6 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-5 text-center">Get Your Rental Cleaning Quote</h2>
          <InstantEstimate defaultCategory="str" />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg">
          <Home className="w-10 h-10 mx-auto mb-5 opacity-80" />
          <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold mb-5 tracking-[-0.01em]">
            Ready to take your STR to the next level?
          </h2>
          <p className="text-base opacity-85 mb-10 leading-relaxed">
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
        </div>
      </section>
    </div>
  );
}

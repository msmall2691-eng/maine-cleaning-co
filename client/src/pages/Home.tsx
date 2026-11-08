import { useRef, useEffect, useState, useCallback } from "react";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  Leaf,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Shield,
  MapPin,
  Users,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstantEstimate } from "@/components/ui/InstantEstimate";
import { WorkGallery } from "@/components/ui/WorkGallery";
import { SparkleField } from "@/components/ui/SparkleField";
import { CoverageCheck } from "@/components/ui/CoverageCheck";
import { CoastalConditions } from "@/components/ui/CoastalConditions";
import { companyInfo } from "@/lib/company-info";
import { AVAILABILITY_NOTE } from "@/lib/response-time";
import { ResponseNote } from "@/components/ui/ResponseNote";
import { COMMUNITIES_SERVED, CLEANS_SINCE_2018 } from "@/lib/company-stats";
import { Section, SectionHeading } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";
import { AmbientPhoto } from "@/components/ui/AmbientPhoto";
import { useParallax } from "@/lib/parallax";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const homepageServices = [
  { id: "residential", title: "Residential Cleaning", desc: "Professional home cleaning tailored to your schedule — weekly, biweekly, or monthly.", color: "bg-brand-navy/15 text-brand-navy", icon: HomeIcon },
  { id: "deep-cleaning", title: "Deep Cleaning", desc: "Top-to-bottom refresh tackling baseboards, grout, behind appliances, and every forgotten corner.", color: "bg-brand-harbor/15 text-brand-harbor", icon: Sparkles },
  { id: "vacation-rentals", title: "Vacation Rental Turnovers", desc: "Hotel-quality resets between guests — same-day flips available across Southern Maine.", color: "bg-brand-pine/15 text-brand-pine", icon: Calendar },
  { id: "commercial", title: "Commercial & Janitorial", desc: "Reliable, discreet maintenance for offices, retail spaces, and professional environments.", color: "bg-brand-stone/15 text-brand-stone", icon: Shield },
];

const reviews = [
  { text: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Air BnB turnovers and have been lucky to have such a professional overseeing the cleaning services.", author: "Jessica M.", date: "Sep 2021" },
  { text: "I have been with The Maine Cleaning Co. for a year now and Megan and her team are amazing. They do a fantastic job cleaning. I have had to cancel and reschedule a few times and they have always been kind and accommodating.", author: "Eva B.", date: "Sep 2024" },
  { text: "I love working with Maine Cleaning! The level of communication is phenomenal and the knowledge of the cleaners is incredible! They clean things I didn't even know needed to be cleaned!", author: "Erin P.", date: "Sep 2022" },
  { text: "The Maine Cleaning Co. does such an amazing job for our facility. They are so flexible and willing to go the extra mile, we couldn't be happier. So friendly and always with a smile!", author: "Krystal F.", date: "Sep 2024" },
  { text: "Professional, timely and did a wonderful job. We were very pleased.", author: "Michele", date: "Mar 2025" },
  { text: "Tried a couple other cleaning companies before finding The Maine Cleaning Co. These folks do an excellent job.", author: "Trevor L.", date: "Sep 2024" },
];

const trustSignals = [
  { icon: Calendar, label: "Since 2018" },
  { icon: Shield, label: "Fully Insured" },
  { icon: Users, label: "Local Team" },
  { icon: Leaf, label: "Eco-Conscious" },
];


/**
 * The hero's photo column: one tall shot plus two stacked, all our own work.
 *
 * Eager, not lazy — this is the LCP candidate on desktop, and deferring it
 * just moves the empty space from "always" to "for the first second".
 */
function HeroCollage() {
  // Chosen from lib/photos.ts by what's in the frame, not by filename. The
  // kitchen leads now that there are real finished-room photos in the library
  // — it is the most legible "this is the work" frame we own. The bathroom
  // and the fridge interior sit beside it as proof we go inside things.
  const [lead, upper, lower] = [photos.kitchenIsland, photos.rentalBathroom, photos.fridgeInterior];

  // Each frame drifts at its own rate, which is what reads as depth rather
  // than as the whole block sliding. The lead frame is tallest so it moves
  // least; the two stacked frames move against it.
  const leadRef = useParallax<HTMLElement>(0.05);
  const upperRef = useParallax<HTMLElement>(0.1);
  const lowerRef = useParallax<HTMLElement>(0.14);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Phones get one shot — a three-up collage at 360px is mush. Eager,
          because this is the LCP element; deferring it only moves the empty
          space from "always" to "for the first second". */}
      <figure className="photo-frame lg:hidden aspect-[4/3] max-w-md mx-auto">
        <img
          src={lead.src}
          srcSet={srcSetFor(lead)}
          sizes={SIZES.full}
          alt={lead.alt}
          fetchPriority="high"
          decoding="async"
        />
      </figure>

      <div className="hidden lg:grid grid-cols-5 grid-rows-6 gap-3 h-[30rem] xl:h-[34rem]">
        <figure ref={leadRef} className="photo-frame parallax-layer col-span-3 row-span-6">
          <img src={lead.src} srcSet={srcSetFor(lead)} sizes={SIZES.half} alt={lead.alt} fetchPriority="high" decoding="async" />
        </figure>
        <figure ref={upperRef} className="photo-frame parallax-layer col-start-4 col-span-2 row-span-3">
          <img src={upper.src} srcSet={srcSetFor(upper)} sizes={SIZES.tile} alt={upper.alt} loading="lazy" decoding="async" />
        </figure>
        <figure ref={lowerRef} className="photo-frame parallax-layer col-start-4 col-span-2 row-span-3">
          <img src={lower.src} srcSet={srcSetFor(lower)} sizes={SIZES.tile} alt={lower.alt} loading="lazy" decoding="async" />
        </figure>
      </div>

      {/* Overlapping proof chip. Tucked into the collage rather than parked in
          its own row — the overlap is what makes the block read as composed
          rather than as three pictures in a box. */}
      <div className="absolute -bottom-5 left-4 lg:-left-6 kpi-card px-4 py-3 flex items-center gap-3">
        <div className="flex gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />
          ))}
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-foreground">4.9 on Google</div>
          <div className="text-[11px] text-muted-foreground">{CLEANS_SINCE_2018} cleans since 2018</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  useSEO(STATIC_PAGE_SEO["/"]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [pastThreshold, setPastThreshold] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = el.children;
      if (!children.length) return;
      const childWidth = (children[0] as HTMLElement).offsetWidth + 16;
      const idx = Math.round(el.scrollLeft / childWidth);
      setActiveReviewIndex(Math.min(idx, reviews.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll progress goes through a CSS variable + rAF throttle instead of
  // React state — updating state on every scroll pixel was re-rendering the
  // entire Home tree and killing mobile scroll fps. The progress bar reads
  // --scroll-progress via CSS transform (compositor-only, no layout). We
  // only setState when the past-8% threshold flips (rare) to drive the
  // back-to-top button visibility.
  useEffect(() => {
    let raf = 0;
    let lastPast = false;
    // scrollHeight used to be read here, inside the frame. Reading it forces
    // the browser to flush pending style and layout work before it can answer
    // — a synchronous reflow, once per frame, for the entire length of every
    // scroll. Measuring it once and again on resize costs nothing and leaves
    // the frame doing only arithmetic.
    let maxScroll = 0;
    const measure = () => {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };
    const update = () => {
      raf = 0;
      const h = maxScroll;
      const y = window.scrollY;
      const p = h > 0 ? Math.min(y / h, 1) : 0;
      document.documentElement.style.setProperty("--scroll-progress", String(p));
      const past = p > 0.08;
      if (past !== lastPast) {
        lastPast = past;
        setPastThreshold(past);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    measure();
    update();
    // The page grows as lazy images and revealed sections land, so re-measure
    // whenever the document actually changes size rather than assuming the
    // first measurement holds.
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    ro.observe(document.documentElement);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollCarousel = (dir: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * carouselRef.current.offsetWidth * 0.8, behavior: "smooth" });
  };

  const scrollToEstimate = () => {
    document.getElementById("get-estimate")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full clip-x">
      {/* Scroll progress bar — driven by CSS var (compositor-only transform) */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
        {/* Tinted by the weather (--weather-accent falls back to --primary,
            so this is brand blue whenever there's no data). Decorative only:
            the bar's job is conveyed by its width, never its hue. */}
        <div
          className="h-full origin-left"
          data-testid="scroll-progress-bar"
          style={{
            background: "hsl(var(--weather-accent) / 0.6)",
            transform: "scaleX(var(--scroll-progress, 0))",
            willChange: "transform",
            transition: "background 0.8s ease",
          }}
        />
      </div>

      {/* ── Hero ──
          Two columns from lg up. The hero used to be a centred column of text
          capped at max-w-3xl floating in the middle of an otherwise empty
          1536px band — the single biggest source of "there's nothing here" on
          a laptop. The right-hand column is now three of our own job photos,
          which is both the missing visual weight and the proof the copy is
          making a claim about. Below lg it collapses back to centred copy with
          one wide photo, which is the right shape on a phone. */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <SparkleField />

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-[78rem] mx-auto grid lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] gap-12 lg:gap-14 xl:gap-20 items-center">

            {/* ── Copy ── */}
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-4">
                <span className="type-eyebrow inline-flex items-center gap-2" data-testid="text-hero-label">
                  Southern Maine's Premier Cleaning Co.
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="type-display text-foreground mb-6"
                data-testid="text-hero-title"
              >
                The Way Cleaning <span className="heading-accent">Should&nbsp;Be.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="type-lead max-w-xl mx-auto lg:mx-0 mb-8"
                data-testid="text-hero-subtitle"
              >
                Residential, rental, and commercial cleaning across Southern Maine — eco-friendly products, consistent results, and a team that genuinely cares.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-6"
              >
                <Link href="/book">
                  <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-hero-book">
                    <Calendar className="mr-2 w-4 h-4" /> Book a Cleaning
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]" onClick={scrollToEstimate} data-testid="button-hero-estimate">
                  Get an Instant Quote <ArrowRight className="ml-2.5 w-4 h-4" />
                </Button>
              </motion.div>

              {/* Still here, still taking work. A plain availability statement —
                  deliberately not scarcity ("only N slots left"), which would be
                  both untrue and the opposite of how we actually operate. */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex justify-center lg:justify-start mb-8"
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-300"
                  data-testid="badge-availability"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  </span>
                  {AVAILABILITY_NOTE}
                </span>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                /* Two columns on a phone, a row from sm. Four items in a
                   centred flex-wrap broke 3 + 1, leaving "Eco-Conscious"
                   stranded and centred on its own line under the other three. */
                className="grid grid-cols-2 gap-x-4 gap-y-2.5 max-w-[17rem] mx-auto sm:flex sm:flex-wrap sm:max-w-none sm:mx-0 sm:justify-center lg:sm:justify-start sm:gap-x-7 sm:gap-y-2 lg:justify-start"
              >
                {trustSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                    <signal.icon className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-xs sm:text-[13px] font-medium tracking-wide">{signal.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Photos ── */}
            <HeroCollage />
          </div>
        </div>
      </section>

      {/* ── Quick Action Strip ──
          Was a full-bleed slab with a hard 1px border top and bottom. It is
          now a floating card pulled up into the hero's bottom padding, which
          ties the two together instead of ruling a line between them. */}
      <div className="relative z-20 container mx-auto px-5 sm:px-6 lg:px-8 -mt-4 sm:-mt-6">
        <div className="max-w-[52rem] mx-auto card-glass px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
            <a href={companyInfo.contact.phoneHref} data-testid="quick-action-call" className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-navy/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-navy/20 transition-colors">
                <Phone className="w-4 h-4 text-brand-navy" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-brand-navy transition-colors truncate">Call Now</div>
                <div className="text-[11px] text-muted-foreground truncate">{companyInfo.contact.phoneDisplay}</div>
              </div>
            </a>
            <a href={companyInfo.contact.smsHref} data-testid="quick-action-text" className="sm:hidden group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-harbor/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-harbor/20 transition-colors">
                <MessageSquare className="w-4 h-4 text-brand-harbor" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-brand-harbor transition-colors truncate">Text Us</div>
                <div className="text-[11px] text-muted-foreground truncate">Quick reply</div>
              </div>
            </a>
            {/* Desktop's second slot used to be "Call or Text", pointing at the
                same tel: link and printing the same number as "Call Now" two
                inches to its left — three quick actions, two of them identical.
                Texting isn't a distinct action on a desktop anyway, so the slot
                goes to email: the one channel the strip was otherwise missing. */}
            <a href={companyInfo.contact.emailHref} data-testid="quick-action-email-desktop" className="hidden sm:flex group items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-harbor/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-harbor/20 transition-colors">
                <Mail className="w-4 h-4 text-brand-harbor" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-brand-harbor transition-colors truncate">Email Us</div>
                <div className="text-[11px] text-muted-foreground truncate">{companyInfo.contact.email}</div>
              </div>
            </a>
            <Link href="/service-areas" data-testid="quick-action-areas" className="col-span-2 md:col-span-1 group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-brand-pine/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-pine/20 transition-colors">
                <MapPin className="w-4 h-4 text-brand-pine" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-brand-pine transition-colors truncate">Service Areas</div>
                <div className="text-[11px] text-muted-foreground truncate">{COMMUNITIES_SERVED} communities</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Coverage check + coastal conditions ──
          Paired on one row because they answer the same two questions a local
          visitor actually has on arrival: do you come here, and what's it
          doing outside. CoastalConditions renders nothing at all when the
          weather API is unreachable, so the grid is written to look right
          with one child or two. */}
      <Section rhythm="tight" measure="default" reveal={false}>
        {/* Flex, not grid, and deliberately so: CoastalConditions renders
            NOTHING when the weather API is unreachable, and a two-column grid
            would still hold its empty column open — leaving the coverage bar
            stranded at two-thirds width beside a hole. With flex, the bar's
            flex-1 simply takes the whole row when it's alone. */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 min-w-0">
            <CoverageCheck />
          </div>
          <CoastalConditions className="lg:w-[26rem] lg:flex-shrink-0" />
        </div>
      </Section>

      {/* ── Services Grid ──
          Four across at lg. Two columns capped at max-w-4xl left roughly a
          third of the band empty on any laptop; four fills it and reads as
          one row of offers rather than a stubby 2x2 block. */}
      <Section id="services" measure="wide" tone="tint">
        <SectionHeading
          eyebrow="What we do"
          title="Cleaning, done properly"
          lead="Tailored cleaning for homes, rentals, and businesses across Southern Maine."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
          {homepageServices.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <Link key={svc.id} href={`/services/${svc.id}`} data-testid={`card-service-${svc.id}`}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="group card-glass p-6 sm:p-7 cursor-pointer h-full flex flex-col min-h-[13.5rem]"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 flex-shrink-0 ${svc.color}`}>
                    <Icon className="w-5 h-5 service-icon-hover" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors text-base">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">{svc.desc}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-primary mt-5 group-hover:translate-x-1 transition-transform duration-300">
                    Learn more <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/services">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-shadow" data-testid="button-all-services">
              View All Services <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Section>

      {/* ── Proof ──
          "Is it any good?" — one band now, where it used to be two. The
          photographs and the reviews were separate sections, 1,202px of
          gallery above 700px of quotes, each with its own heading and its own
          vertical rhythm, both answering that same single question. Putting
          them together is most of the reason this page got shorter: the quotes
          come first because they are what someone is actually looking for, and
          the photographs sit under them as the thing the quotes are about.

          Four photos here, not twelve. The full set still lives on /about,
          which is where someone who wants to browse the work is going anyway.

          This is the page's one inverted band. Seven sections all within 4%
          lightness of each other gave the scroll no landmark, and this is the
          right place to spend the weight. One per page — see .band-deep. */}
      <Section id="proof" measure="wide" tone="deep">
        <SectionHeading
          align="left"
          eyebrow="Proof"
          title="What clients say"
          lead={
            <>
              Real feedback from our Southern Maine customers.
              <span className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-[13px] font-medium">
                <span>7+ Years</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{CLEANS_SINCE_2018} Cleans</span>
                <span className="text-muted-foreground/50">·</span>
                <span>4.9★ Google</span>
              </span>
            </>
          }
          aside={
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scrollCarousel(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all" aria-label="Previous review">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCarousel(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all" aria-label="Next review">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          }
        />

        <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 no-scrollbar scroll-fade-x">
          {reviews.map((r, i) => (
            /* flex-col + mt-auto on the footer: the cards are equal height, but
               the attribution used to sit directly under whatever length the
               quote happened to be, so it landed at a different height in every
               card across the row. */
            <div key={i} className="snap-start flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31.5%] card-soft p-5 sm:p-6 flex flex-col" data-testid={`card-review-${i}`}>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />)}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{r.text}"</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-xs font-semibold text-muted-foreground">— {r.author}</span>
                <span className="text-[11px] text-muted-foreground/60">{r.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex sm:hidden justify-center gap-1.5 mt-4" data-testid="review-dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${activeReviewIndex === i ? "bg-primary w-5" : "bg-muted-foreground/30 w-2"}`}
              onClick={() => {
                const el = carouselRef.current;
                if (!el || !el.children[i]) return;
                (el.children[i] as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
              }}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>

        {/* The work itself, under the words about the work. `limit` keeps this
            to one lead frame plus three, which is two grid rows instead of
            four — see WorkGallery for why the follow tile is what makes the
            count come out even. */}
        <div className="mt-14">
          <p className="type-eyebrow mb-5">Recent jobs</p>
          <WorkGallery compact limit={4} />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
          <a href="https://g.page/r/CYnY6ulFfvDtEAE/review" target="_blank" rel="noopener noreferrer" data-testid="link-google-reviews">
            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />
              See all reviews on Google
            </Button>
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            data-testid="link-more-work"
          >
            See more of our work <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Section>

      {/* ── Instant Estimate ──
          One of our own photos runs behind this band at ~10% so the pricing
          section isn't a flat rectangle of form controls. It's decoration, so
          it's aria-hidden and lazy. */}
      <Section id="get-estimate" measure="wide" className="isolate">
        {/* A calm, bright subject. The restroom trailer that used to run here
            was legible enough through the scrim to be distracting, directly
            behind the copy and the 48-hour note. */}
        <AmbientPhoto photo={photos.kitchenCooktop} />
        <LogoWatermark position="right" />

        {/* The estimator is ~1,400px tall and this column is ~600px, so the
            column used to run out a third of the way down and leave a tall
            hole beside the form. `items-start` + a sticky column means the
            pitch travels with you as you work through the estimate instead —
            no hole, and the reassurance is on screen at the moment you are
            deciding whether to submit. */}
        <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              align="left"
              eyebrow="Pricing"
              title="Transparent pricing"
              lead="Get an instant ballpark estimate, or reach out for a custom quote. No hidden fees, no surprises."
              className="mb-8"
            />
            <ul className="space-y-3 mb-8">
              {["No hidden fees", "Custom plans for unique spaces", "Flexible scheduling", "Satisfaction guaranteed"].map((t, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> {t}
                </li>
              ))}
            </ul>

            {/* The 48-hour promise belongs here, next to the button that
                sends it — it is what someone wants to know at the moment
                they're deciding whether to submit, and it was previously
                only shown after submitting. It also carries the call and
                text links, so the bare "Prefer to talk?" list that used to
                sit here (same two links, plus email) went with it; email
                moved below to keep all three channels. */}
            <ResponseNote />

            <a
              href={companyInfo.contact.emailHref}
              className="inline-flex items-center gap-2.5 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-est-email"
            >
              <Mail className="w-4 h-4 text-primary" /> {companyInfo.contact.email}
            </a>
          </div>
          <InstantEstimate />
        </div>
      </Section>

      {/* ── Reach a person ──
          This was a second contact form — 866px tall on a desktop, 990 on a
          phone — posting to the same /api/intake/submit the estimator directly
          above it already posts to. The same question asked twice, the second
          time with fewer fields and no estimate at the end of it.

          What is left is the one part the form was not duplicating: the
          channels. /#contact is linked from both the navbar and the footer, so
          it still has to land on an answer to "how do I reach a human". */}
      <Section id="contact" measure="prose" rhythm="tight">
        <div className="text-center">
          <h2 className="type-h3 text-foreground">Rather just talk to someone?</h2>
          <p className="text-sm text-muted-foreground mt-3 mb-7 max-w-md mx-auto leading-relaxed">
            A call or a text is the quickest way to reach us. Email works just as well when
            it isn't urgent.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a href={companyInfo.contact.phoneHref} data-testid="link-contact-call">
              <Button className="w-full sm:w-auto h-11 px-7 rounded-full text-sm font-semibold gap-2">
                <Phone className="w-4 h-4" /> {companyInfo.contact.phoneDisplay}
              </Button>
            </a>
            <a href={companyInfo.contact.smsHref} className="sm:hidden" data-testid="link-contact-text">
              <Button variant="outline" className="w-full h-11 px-7 rounded-full text-sm font-semibold gap-2 border-2 border-primary bg-card/80">
                <MessageSquare className="w-4 h-4" /> Text us
              </Button>
            </a>
            <a href={companyInfo.contact.emailHref} data-testid="link-contact-email">
              <Button variant="outline" className="w-full sm:w-auto h-11 px-7 rounded-full text-sm font-semibold gap-2 border-2 border-primary bg-card/80">
                <Mail className="w-4 h-4" /> Email us
              </Button>
            </a>
          </div>
        </div>
      </Section>

      {/* Back to Top */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: pastThreshold ? 1 : 0 }}
        className={`fixed z-40 w-10 h-10 rounded-full bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all right-4 bottom-20 lg:bottom-6 ${pastThreshold ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        data-testid="button-back-to-top"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

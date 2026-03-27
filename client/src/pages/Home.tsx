import { useRef, useEffect, useState, useCallback } from "react";
import { useSEO } from "@/hooks/use-seo";
import { motion, useInView } from "framer-motion";
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
  Award,
  TrendingUp,
  Clock,
  Instagram,
  Facebook,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Home as HomeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstantEstimate } from "@/components/ui/InstantEstimate";
import { ServiceAreaMap } from "@/components/ui/ServiceAreaMap";
import { companyInfo } from "@/lib/company-info";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const homepageServices = [
  { id: "residential", title: "Residential Cleaning", desc: "Professional home cleaning tailored to your schedule — weekly, biweekly, or monthly.", color: "bg-blue-500/15 text-blue-400", icon: HomeIcon },
  { id: "deep-cleaning", title: "Deep Cleaning", desc: "Top-to-bottom refresh tackling baseboards, grout, behind appliances, and every forgotten corner.", color: "bg-emerald-500/15 text-emerald-400", icon: Sparkles },
  { id: "vacation-rentals", title: "Vacation Rental Turnovers", desc: "Hotel-quality resets between guests — same-day flips available across Southern Maine.", color: "bg-orange-500/15 text-orange-400", icon: Calendar },
  { id: "commercial", title: "Commercial & Janitorial", desc: "Reliable, discreet maintenance for offices, retail spaces, and professional environments.", color: "bg-slate-500/15 text-slate-400", icon: Shield },
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

const businessStats = [
  { icon: Calendar, value: 7, suffix: "+", label: "Years in Business" },
  { icon: TrendingUp, value: 5000, suffix: "+", label: "Cleans Completed" },
  { icon: Clock, value: 30, suffix: "+", label: "Years Combined Exp." },
  { icon: Award, value: 4.9, suffix: "★", label: "Google Rating", isDecimal: true },
  { icon: Facebook, value: 1500, suffix: "+", label: "Facebook Followers" },
  { icon: Instagram, value: 1900, suffix: "+", label: "Instagram Followers" },
];

function getWeatherIcon(iconName: string) {
  const map: Record<string, any> = {
    "sun": Sun, "cloud-sun": Cloud, "cloud": Cloud, "cloud-fog": CloudFog,
    "cloud-drizzle": CloudDrizzle, "cloud-rain": CloudRain, "cloud-snow": CloudSnow,
    "cloud-lightning": CloudLightning,
  };
  return map[iconName] || Cloud;
}

function useSectionFade() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.classList.add("visible"); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); } },
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

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

function WaveDivider({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`} aria-hidden="true">
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

export default function Home() {
  useSEO({ title: "Airbnb Cleaning & STR Management — Southern Maine", description: "Southern Maine's premier cleaning & short-term rental management. Same-day Airbnb turnovers, residential cleaning, and commercial janitorial across York & Cumberland County." });
  const carouselRef = useRef<HTMLDivElement>(null);
  type ForecastDay = { date: string; high: number; low: number; label: string; icon: string };
  type WeatherData = {
    current: { temp: number; label: string; icon: string; humidity: number; windSpeed: number };
    forecast: ForecastDay[];
    location: string;
  };
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setWeather)
      .catch(() => {});
  }, []);

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

  const handleScroll = useCallback(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0) setScrollProgress(Math.min(window.scrollY / h, 1));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollCarousel = (dir: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * carouselRef.current.offsetWidth * 0.8, behavior: "smooth" });
  };

  const scrollToEstimate = () => {
    document.getElementById("get-estimate")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
        <div className="h-full bg-primary/60 transition-none" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-32 sm:pt-40 md:pt-44 pb-20 sm:pb-28 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <div className="marquee-track" aria-hidden="true">
          <span>Residential&nbsp;·&nbsp;Deep&nbsp;Cleaning&nbsp;·&nbsp;Vacation&nbsp;Rentals&nbsp;·&nbsp;Commercial&nbsp;·&nbsp;Eco-Friendly&nbsp;·&nbsp;Southern&nbsp;Maine&nbsp;·&nbsp;</span>
          <span>Residential&nbsp;·&nbsp;Deep&nbsp;Cleaning&nbsp;·&nbsp;Vacation&nbsp;Rentals&nbsp;·&nbsp;Commercial&nbsp;·&nbsp;Eco-Friendly&nbsp;·&nbsp;Southern&nbsp;Maine&nbsp;·&nbsp;</span>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-2xl lg:max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-4">
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-primary/80" data-testid="text-hero-label">
              Southern Maine's Premier Cleaning Co.
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[5.5rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-foreground mb-6"
            data-testid="text-hero-title"
          >
            The Way Cleaning{" "}<span className="hero-gradient-text">Should Be.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[15px] sm:text-lg text-muted-foreground max-w-md sm:max-w-lg mx-auto leading-relaxed mb-10"
            data-testid="text-hero-subtitle"
          >
            Residential, rental, and commercial cleaning across Southern Maine — eco-friendly products, consistent results, and a team that genuinely cares.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-14"
          >
            <Button size="lg" className="h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.12)]" onClick={scrollToEstimate} data-testid="button-hero-estimate">
              Get My Estimate <ArrowRight className="ml-2.5 w-4 h-4" />
            </Button>
            <Link href="/services">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base border-border bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]" data-testid="button-hero-services">
                View Services
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:gap-x-8"
          >
            {trustSignals.map((signal, i) => (
              <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                <signal.icon className="w-3.5 h-3.5 text-primary/70" />
                <span className="text-xs sm:text-[13px] font-medium tracking-wide">{signal.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center mt-5"
            data-testid="serving-indicator"
          >
            <div className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Currently serving York & Cumberland County
            </div>
          </motion.div>

          {/* 5-Day Weather Forecast */}
          {!weather && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex justify-center mt-6"
              data-testid="weather-skeleton"
            >
              <div className="bg-card/60 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.15)] border border-border/50 max-w-sm w-full sm:max-w-md">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="skeleton-shimmer w-4 h-4 rounded-full" />
                    <div className="skeleton-shimmer w-12 h-4" />
                    <div className="skeleton-shimmer w-16 h-3" />
                  </div>
                  <div className="skeleton-shimmer w-20 h-3" />
                </div>
                <div className="flex justify-between gap-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className="skeleton-shimmer w-8 h-2.5" />
                      <div className="skeleton-shimmer w-3.5 h-3.5 rounded-full" />
                      <div className="skeleton-shimmer w-6 h-3" />
                      <div className="skeleton-shimmer w-5 h-2.5" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {weather && (() => {
            const CurrentIcon = getWeatherIcon(weather.current.icon);
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex justify-center mt-6"
                data-testid="weather-widget"
              >
                <div className="bg-card/60 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.15)] border border-border/50 max-w-sm w-full sm:max-w-md">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <CurrentIcon className="w-4 h-4 text-primary/70" />
                      <span className="text-sm font-semibold text-foreground/80">{weather.current.temp}°F</span>
                      <span className="text-xs text-muted-foreground">{weather.current.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                      <MapPin className="w-3 h-3" />
                      <span>{weather.location}</span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-1">
                    {weather.forecast.map((day, i) => {
                      const DayIcon = getWeatherIcon(day.icon);
                      const d = new Date(day.date + "T12:00:00");
                      const label = i === 0 ? "Today" : dayNames[d.getDay()];
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-0" data-testid={`forecast-day-${i}`}>
                          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase">{label}</span>
                          <DayIcon className="w-3.5 h-3.5 text-primary/50" />
                          <span className="text-[11px] font-semibold text-foreground/70">{day.high}°</span>
                          <span className="text-[10px] text-muted-foreground/50">{day.low}°</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </section>

      {/* ── Quick Action Strip ── */}
      <div className="relative z-20 bg-card/90 backdrop-blur-xl border-y border-border/40 shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto">
            <a href={companyInfo.contact.phoneHref} data-testid="quick-action-call" className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Phone className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-blue-400 transition-colors truncate">Call Now</div>
                <div className="text-[11px] text-muted-foreground truncate">{companyInfo.contact.phoneDisplay}</div>
              </div>
            </a>
            <a href={companyInfo.contact.smsHref} data-testid="quick-action-text" className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-emerald-400 transition-colors truncate">Text Us</div>
                <div className="text-[11px] text-muted-foreground truncate">Quick reply</div>
              </div>
            </a>
            <button onClick={scrollToEstimate} data-testid="quick-action-estimate" className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60 text-left w-full">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">Get Estimate</div>
                <div className="text-[11px] text-muted-foreground truncate">Instant pricing</div>
              </div>
            </button>
            <Link href="/service-areas" data-testid="quick-action-areas" className="group flex items-center gap-3 p-3 sm:p-3.5 rounded-xl hover:bg-secondary/60 active:bg-secondary/80 transition-all border border-transparent hover:border-border/60">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-colors">
                <MapPin className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground group-hover:text-orange-400 transition-colors truncate">Service Areas</div>
                <div className="text-[11px] text-muted-foreground truncate">49+ communities</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Services Grid ── */}
      <WaveDivider />
      <FadeSection className="py-20 sm:py-28 section-white" id="services">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-12 sm:mb-16">
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">Our Services</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Tailored cleaning for homes, rentals, and businesses across Southern Maine.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 max-w-2xl lg:max-w-4xl mx-auto mb-10">
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
                    className="group card-glass p-6 sm:p-8 cursor-pointer h-full flex flex-col min-h-[180px]"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 ${svc.color}`}>
                      <Icon className="w-5 h-5" />
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
        </div>
      </FadeSection>

      {/* ── Stats ── */}
      <WaveDivider />
      <FadeSection className="py-20 sm:py-28 section-cream relative overflow-hidden" id="stats">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.04] blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">By the Numbers</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Real results across Southern Maine.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {businessStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="text-center group card-glass p-4 sm:p-5"
                  data-testid={`stat-${i}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-all">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {stat.isDecimal ? <span>{stat.value}{stat.suffix}</span> : <AnimatedNumber target={stat.value} suffix={stat.suffix} />}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ── Reviews ── */}
      <WaveDividerCream />
      <FadeSection className="py-20 sm:py-28 section-cream" id="reviews">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 sm:mb-14 max-w-4xl mx-auto gap-4">
            <div>
              <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">What Clients Say</h2>
              <p className="text-muted-foreground text-[15px]">Real feedback from our Southern Maine customers.</p>
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scrollCarousel(-1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all" aria-label="Previous review">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCarousel(1)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all" aria-label="Next review">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 max-w-4xl lg:mx-auto no-scrollbar">
            {reviews.map((r, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[32%] card-soft p-5 sm:p-6" data-testid={`card-review-${i}`}>
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{r.text}"</p>
                <div className="flex items-center justify-between">
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

          <div className="text-center mt-8 sm:mt-10 max-w-4xl lg:mx-auto">
            <a href="https://g.page/r/CYnY6ulFfvDtEAE/review" target="_blank" rel="noopener noreferrer" data-testid="link-google-reviews">
              <Button variant="outline" className="h-10 px-6 rounded-full border-border text-sm font-semibold gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                See all reviews on Google
              </Button>
            </a>
          </div>
        </div>
      </FadeSection>

      {/* ── Map Teaser ── */}
      <WaveDivider />
      <FadeSection className="py-16 sm:py-20 section-white" id="service-area">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 max-w-4xl mx-auto gap-4">
            <div>
              <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-3 section-heading-accent" data-testid="text-map-title">
                Serving Southern Maine
              </h2>
              <p className="text-muted-foreground text-[15px]" data-testid="text-map-subtitle">
                4,715+ visits across 49+ communities in York & Cumberland County.
              </p>
            </div>
            <Link href="/service-areas" className="flex-shrink-0">
              <Button variant="outline" className="h-10 px-5 rounded-full text-sm font-semibold gap-2 border-border" data-testid="button-view-all-areas">
                View All Areas <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <div className="max-w-4xl mx-auto">
            <ServiceAreaMap />
          </div>
        </div>
      </FadeSection>

      {/* ── Instant Estimate ── */}
      <WaveDividerCream />
      <FadeSection className="py-20 sm:py-28 section-cream" id="get-estimate">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start max-w-4xl lg:max-w-5xl mx-auto">
            <div className="max-w-sm lg:max-w-md">
              <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">Transparent Pricing</h2>
              <p className="text-muted-foreground text-[15px] mb-7 leading-relaxed">
                Get an instant ballpark estimate, or reach out for a custom quote. No hidden fees, no surprises.
              </p>
              <ul className="space-y-3 mb-9">
                {["No hidden fees", "Custom plans for unique spaces", "Flexible scheduling", "Satisfaction guaranteed"].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-semibold text-foreground text-xs uppercase tracking-[0.15em] mb-3">Prefer to talk?</p>
                <a href={companyInfo.contact.phoneHref} className="flex items-center gap-2.5 hover:text-foreground transition-colors" data-testid="link-est-call">
                  <Phone className="w-4 h-4 text-primary" /> {companyInfo.contact.phoneDisplay}
                </a>
                <a href={companyInfo.contact.smsHref} className="flex items-center gap-2.5 hover:text-foreground transition-colors" data-testid="link-est-text">
                  <MessageSquare className="w-4 h-4 text-primary" /> Text us
                </a>
                <a href={companyInfo.contact.emailHref} className="flex items-center gap-2.5 hover:text-foreground transition-colors" data-testid="link-est-email">
                  <Mail className="w-4 h-4 text-primary" /> {companyInfo.contact.email}
                </a>
              </div>
            </div>
            <InstantEstimate />
          </div>
        </div>
      </FadeSection>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg">
          <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold mb-5 tracking-[-0.01em]">The Maine choice for a clean space.</h2>
          <p className="text-base opacity-85 mb-10 leading-relaxed">
            Let us handle the cleaning so you can enjoy what matters most.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="h-13 sm:h-14 px-9 rounded-full bg-background text-foreground hover:bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-semibold text-base sm:text-[17px]"
              onClick={scrollToEstimate}
              data-testid="button-cta-estimate"
            >
              Get My Estimate
            </Button>
            <a href={companyInfo.contact.phoneHref} data-testid="link-cta-call">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-9 rounded-full border-white/20 hover:bg-white/10 text-white font-semibold text-base">
                <Phone className="w-4 h-4 mr-2" /> Call {companyInfo.contact.phoneDisplay}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Back to Top */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: scrollProgress > 0.08 ? 1 : 0 }}
        className={`fixed z-40 w-10 h-10 rounded-full bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all right-4 bottom-20 lg:bottom-6 ${scrollProgress > 0.08 ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        data-testid="button-back-to-top"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

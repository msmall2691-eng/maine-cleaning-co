import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Code2,
  Zap,
  LayoutDashboard,
  Wrench,
  Workflow,
  Mail,
  Building2,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { SparkleField } from "@/components/ui/SparkleField";

const CONTACT_EMAIL = "msmall2691@gmail.com";
const START_PROJECT_HREF = `mailto:${CONTACT_EMAIL}?subject=Start%20a%20Project%20with%20M%20Studio`;

const credibility = [
  "10 Years Building Systems",
  "1,000+ Customers",
  "7,000+ Service Visits",
  "$1M+ Managed Through Custom Operations",
];

type Build = { icon: React.ComponentType<{ className?: string }>; name: string; sub: string };
const builds: Build[] = [
  { icon: Sparkles, name: "AI Workflows", sub: "Assistants and agents that fit real jobs, not demos." },
  { icon: Code2, name: "Custom Software", sub: "Purpose-built apps that replace patchworks of tools." },
  { icon: Wrench, name: "Internal Tools", sub: "The admin views and back-office UIs your team lives in." },
  { icon: Zap, name: "Automation", sub: "The quiet plumbing between systems that saves hours." },
  { icon: LayoutDashboard, name: "Dashboards", sub: "Live views of what actually matters, not vanity metrics." },
  { icon: Workflow, name: "Operations Systems", sub: "The systems of record and process behind the business." },
];

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
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({
  className = "",
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const ref = useSectionFade();
  return (
    <section ref={ref} className={`section-fade ${className}`} id={id}>
      {children}
    </section>
  );
}

export default function MStudioHome() {
  useSEO({
    title: "Technology built the way your business works",
    description:
      "M Studio builds AI, automation, and custom software around the way your business already operates. Built by an operator, not an agency.",
    base: "M Studio",
  });

  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative pt-32 sm:pt-40 md:pt-44 pb-20 sm:pb-28 overflow-hidden">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="hero-dot-grid" aria-hidden="true" />
        <SparkleField />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
              M Studio
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[2.5rem] sm:text-[3.25rem] md:text-[4rem] lg:text-[4.75rem] font-extrabold leading-[1.03] tracking-[-0.035em] text-foreground mb-6"
          >
            Technology that works the way{" "}
            <span className="hero-gradient-text">your business does.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-[15px] sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
          >
            Built from real operations. Designed for the way people actually work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
          >
            <a href={START_PROJECT_HREF} data-testid="cta-hero-start">
              <Button
                size="lg"
                className="h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
              >
                Start a Project <ArrowRight className="ml-2.5 w-4 h-4" />
              </Button>
            </a>
            <a href="#what-i-build">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base border-border bg-card/80 backdrop-blur-sm shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
              >
                See what I build
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Credibility Strip ── */}
      <div className="relative z-20 bg-card/85 backdrop-blur-xl border-y border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11.5px] sm:text-[13px] font-medium text-muted-foreground text-center">
            {credibility.map((c, i) => (
              <div key={c} className="flex items-center gap-3">
                {i > 0 && <span className="hidden sm:block text-border">·</span>}
                <span className="tabular-nums">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why M Studio ── */}
      <FadeSection className="py-20 sm:py-28 section-white" id="why">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.24em] text-primary/85 font-semibold mb-5">
            Why M Studio
          </div>
          <h2 className="text-[1.9rem] sm:text-[2.5rem] md:text-[3rem] font-serif font-bold text-foreground tracking-[-0.02em] leading-[1.1] mb-8">
            Every business works differently.
          </h2>
          <div className="text-[16px] sm:text-lg leading-relaxed text-muted-foreground space-y-5">
            <p>Most software asks businesses to change the way they work.</p>
            <p className="text-foreground/90 font-medium">I believe software should do the opposite.</p>
            <p>
              M Studio builds AI, automation, and custom software around the way your business
              already operates — eliminating repetitive work, connecting disconnected tools, and
              simplifying the systems behind your business.
            </p>
            <p>
              Technology shouldn't create more work. It should quietly make everything work better.
            </p>
          </div>
        </div>
      </FadeSection>

      {/* ── What I Build ── */}
      <FadeSection className="py-20 sm:py-28 section-cream" id="what-i-build">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-12 sm:mb-14">
            <div className="text-[11px] uppercase tracking-[0.24em] text-primary/85 font-semibold mb-4">
              What I Build
            </div>
            <h2 className="text-[1.75rem] sm:text-[2.25rem] md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em]">
              Real tools for real work.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {builds.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="card-glass p-5 sm:p-6"
                  data-testid={`build-${b.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/12 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-[14.5px] font-bold text-foreground mb-1.5">{b.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{b.sub}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ── Built by an Operator ── */}
      <FadeSection className="py-20 sm:py-28 section-white" id="founder">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.24em] text-primary/85 font-semibold mb-5">
            Built by an Operator
          </div>
          <h2 className="text-[1.9rem] sm:text-[2.5rem] md:text-[3rem] font-serif font-bold text-foreground tracking-[-0.02em] leading-[1.1] mb-8">
            I didn't start by building software.
          </h2>
          <div className="text-[16px] sm:text-lg leading-relaxed text-muted-foreground space-y-5">
            <p className="text-foreground/90 font-medium">I started by solving problems.</p>
            <p>
              Running a business taught me that the hardest part usually isn't the work itself —
              it's the disconnected systems behind it.
            </p>
            <p>So I started building my own.</p>
            <p>
              What began as spreadsheets and automations eventually became custom software built
              around the way people actually work.
            </p>
            <p>
              Today, I combine real operating experience with AI, automation, and software
              development to help other businesses simplify operations and spend less time fighting
              their tools.
            </p>
          </div>

          {/* Cleaning company as credibility, not centerpiece */}
          <Link
            href="/cleaning"
            className="group mt-8 flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 hover:border-primary/40 hover:bg-card transition-all"
            data-testid="link-cleaning-credibility"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                It started while building internal systems for a service business that grew to more
                than <span className="font-semibold text-foreground">1,000 customers</span> and{" "}
                <span className="font-semibold text-foreground">7,000+ service visits</span>.
              </p>
              <p className="text-[12px] text-primary font-semibold mt-1.5 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                See the business <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>
      </FadeSection>

      {/* ── Philosophy ── */}
      <FadeSection className="py-24 sm:py-32 section-cream" id="philosophy">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl text-center">
          <div className="text-[11px] uppercase tracking-[0.24em] text-primary/85 font-semibold mb-5">
            Philosophy
          </div>
          <h2 className="text-[2.25rem] sm:text-[3rem] md:text-[3.75rem] font-serif font-bold text-foreground tracking-[-0.03em] leading-[1.05] mb-10">
            <span className="hero-gradient-text">Good software disappears.</span>
          </h2>
          <div className="text-[16px] sm:text-lg leading-relaxed text-muted-foreground space-y-4 max-w-xl mx-auto">
            <p>
              The best systems don't force people to learn new ways of working — they fit naturally
              into the way work already happens.
            </p>
            <p>Every project starts by understanding the business first.</p>
            <p className="text-foreground/90 font-medium">The technology comes second.</p>
          </div>
        </div>
      </FadeSection>

      {/* ── Final CTA ── */}
      <FadeSection className="py-24 sm:py-28 section-white" id="start-project">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl">
          <h2 className="text-[1.9rem] sm:text-[2.5rem] md:text-[3rem] font-serif font-bold text-foreground tracking-[-0.02em] leading-[1.1] mb-5">
            Let's build something that <span className="hero-gradient-text">actually fits.</span>
          </h2>
          <p className="text-[15px] sm:text-lg text-muted-foreground mb-9 leading-relaxed max-w-lg mx-auto">
            Whether you're replacing spreadsheets, connecting software, or starting from scratch,
            I'd love to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href={START_PROJECT_HREF} data-testid="cta-footer-start">
              <Button
                size="lg"
                className="h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
              >
                Start a Project <ArrowRight className="ml-2.5 w-4 h-4" />
              </Button>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </FadeSection>
    </div>
  );
}

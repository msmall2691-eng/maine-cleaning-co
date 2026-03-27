import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import {
  Calendar, Leaf, CheckCircle2, MessageCircle, Shield, Users, ArrowRight,
  Instagram, Phone, Star, MapPin, RefreshCw, Quote, ExternalLink,
  TrendingUp, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Certifications } from "@/components/ui/Certifications";
import { AICleaningTip } from "@/components/ui/AICleaningTip";
import { companyInfo } from "@/lib/company-info";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

const values = [
  { icon: Calendar, title: "Reliable Scheduling", desc: "Consistent, on-time service you can depend on — same team, same day, every time.", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Leaf, title: "Eco-Conscious Products", desc: "Melaleuca EcoSense® — professionally effective, safe for kids, pets, and the planet.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: CheckCircle2, title: "All Property Types", desc: "Homes, vacation rentals, offices — one trusted team for every need.", color: "text-primary", bg: "bg-primary/10" },
  { icon: MessageCircle, title: "Clear Communication", desc: "Transparent pricing, responsive support, and zero surprises on your bill.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Shield, title: "Fully Insured", desc: "Bonded and covered with comprehensive liability insurance — always.", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Users, title: "Local Maine Team", desc: "Rooted in Southern Maine since 2018 — we know our communities.", color: "text-rose-400", bg: "bg-rose-500/10" },
];

const achievements = [
  { icon: Calendar, value: "Est. 2018", label: "Founded in Maine", color: "text-primary", bg: "bg-primary/10" },
  { icon: TrendingUp, value: "5,000+", label: "Cleans Completed", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: RefreshCw, value: "93%", label: "Recurring Clients", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: MapPin, value: "49+", label: "Communities Served", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Star, value: "4.9★", label: "Google Rating", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { icon: Clock, value: "30+", label: "Yrs Combined Exp.", color: "text-violet-400", bg: "bg-violet-500/10" },
];

const testimonials = [
  { quote: "I love working with Maine Cleaning! The level of communication is phenomenal and the knowledge of the cleaners is incredible!", author: "Erin P.", date: "Sep 2022" },
  { quote: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Airbnb turnovers.", author: "Jessica M.", date: "Sep 2021" },
  { quote: "So friendly and always with a smile! They are so flexible and willing to go the extra mile — we couldn't be happier.", author: "Krystal F.", date: "Sep 2024" },
];

export default function About() {
  useSEO({ title: "About Us", description: "Meet The Maine Cleaning Co. — Southern Maine's trusted cleaning team since 2018. Eco-friendly products, bonded & insured crews, and a commitment to consistent results." });
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
            className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8"
          >
            A team that genuinely cares — about your home, your family, and the environment.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-3 flex-wrap"
          >
            <Link href="/#get-estimate">
              <Button size="lg" className="rounded-full px-8 h-12 font-semibold gap-2" data-testid="button-about-hero-estimate">
                Get My Estimate <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={companyInfo.contact.phoneHref}>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 font-semibold border-border bg-card/80" data-testid="button-about-hero-call">
                <Phone className="w-4 h-4 mr-2" /> Call Us
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Story + Achievement Stats ── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Story */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-5 section-heading-accent">
                Built on Trust. Driven by Care.
              </h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">
                The Maine Cleaning Co. was founded in 2018 with one belief: cleaning should feel effortless for clients and meaningful for the people doing it. We've grown from a small residential team into Southern Maine's most trusted cleaning service — serving homes, vacation rentals, and commercial spaces across York and Cumberland counties.
              </p>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-4">
                Every cleaner on our team is trained, background-checked, and genuinely invested in delivering results that go beyond the surface. We don't cut corners because your space deserves better.
              </p>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-7">
                With 30+ years of combined experience across our team and over 5,000 completed cleans, we've earned a 93% client retention rate — because we show up, do the work right, and make it easy to trust us with your home.
              </p>
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
        </div>
      </section>

      {/* ── Values Grid ── */}
      <section className="py-16 sm:py-24" style={{ background: "hsl(222 20% 13%)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-12">
            <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
              Why Maine Cleaning Co.
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">What our clients count on, every single visit.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {values.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="card-glass p-5 sm:p-6 flex flex-col"
                  data-testid={`card-value-${i}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-4.5 h-4.5 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Eco Products ── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Product visual — no photo, icon card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src="/images/ecosense-products.jpeg"
                alt="Melaleuca EcoSense cleaning products — The Maine Cleaning Co."
                className="w-full aspect-[4/3] object-cover rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.25)] border border-border/30"
                loading="lazy"
                data-testid="img-ecosense-products"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Leaf className="w-3.5 h-3.5" /> Eco-Certified Products
              </div>
              <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
                Powered by Melaleuca EcoSense<sup className="text-xs">®</sup>
              </h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-5">
                We exclusively use Melaleuca EcoSense® and Sal Suds — professional-grade, non-toxic, and biodegradable. Safe for your family, your pets, and every surface we clean. Zero harsh chemicals. Full results.
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {["Non-Toxic", "Biodegradable", "Kid & Pet Safe", "No Harsh Chemicals", "Professional Grade"].map((tag) => (
                  <span key={tag} className="text-[11px] font-medium border border-emerald-700/40 bg-emerald-900/30 text-emerald-300 rounded-full px-2.5 py-0.5">{tag}</span>
                ))}
              </div>
              <AICleaningTip />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Client Voices ── */}
      <section className="py-16 sm:py-24" style={{ background: "hsl(222 20% 13%)" }}>
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center max-w-md mx-auto mb-12">
            <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
              What Clients Say
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Real feedback from Southern Maine homeowners and hosts.</p>
          </div>
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
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
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
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> See All Reviews on Google
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4 section-heading-accent">
              Certified & Accredited
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              Industry-recognized certifications that reflect our commitment to quality, safety, and professionalism.
            </p>
          </div>
          <Certifications />
        </div>
      </section>

      {/* ── Instagram Gallery ── */}
      <section className="py-16 sm:py-24" style={{ background: "hsl(222 20% 13%)" }}>
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/20 mb-6">
              <Instagram className="w-7 h-7 text-pink-400" />
            </div>
            <p className="text-pink-400/80 text-xs font-semibold uppercase tracking-[0.2em] mb-3">@mainecleaningco</p>
            <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-4">
              See Our Work on Instagram
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mx-auto">
              Before & afters, behind-the-scenes cleaning tips, and real homes across Southern Maine. 1,900+ followers and growing.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-8">
            {[
              { src: "/images/vacation-rental-bathroom-clean.jpeg", alt: "Guest-ready vacation rental bathroom" },
              { src: "/images/commercial-floor-cleaning.jpeg", alt: "Commercial floor cleaning" },
              { src: "/images/prolux-hepa-vacuum-fleet.jpeg", alt: "Professional vacuum equipment" },
              { src: "/images/ecosense-cleaning-products.jpeg", alt: "Eco-friendly cleaning products" },
              { src: "/images/before-after-deep-clean.jpeg", alt: "Before and after deep clean" },
              { src: "/images/cleaning-toolkit-supplies.jpeg", alt: "Cleaning toolkit and supplies" },
            ].map((img, i) => (
              <a
                key={i}
                href={companyInfo.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/5"
                data-testid={`ig-gallery-${i}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={companyInfo.socials.instagram} target="_blank" rel="noopener noreferrer" data-testid="link-instagram-follow">
              <Button className="rounded-full h-12 px-8 font-semibold gap-2 bg-gradient-to-r from-pink-500 to-orange-400 border-0 text-white hover:opacity-90">
                <Instagram className="w-4 h-4" /> Follow on Instagram
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </a>
            <a href={companyInfo.socials.facebook} target="_blank" rel="noopener noreferrer" data-testid="link-facebook-follow">
              <Button variant="outline" className="rounded-full h-12 px-8 font-semibold gap-2 border-border">
                Facebook Page
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-lg">
          <h2 className="text-[1.75rem] sm:text-4xl font-serif font-bold mb-5 tracking-[-0.01em]">Experience the difference.</h2>
          <p className="text-base opacity-85 mb-10 leading-relaxed">
            See why Southern Maine trusts us with their spaces — get a free estimate today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/#get-estimate">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-9 rounded-full bg-background text-foreground hover:bg-background/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-semibold text-base"
                data-testid="button-about-estimate"
              >
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

import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { servicesData } from "@/lib/services-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, Mail, MessageSquare, ChevronRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { EstimateCTA } from "@/components/ui/EstimateCTA";
import { CleaningChecklist } from "@/components/ui/CleaningChecklist";
import { companyInfo } from "@/lib/company-info";
import { useSEO } from "@/hooks/use-seo";
import { Section, SectionHeading } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";
import { photos, type Photo } from "@/lib/photos";

/**
 * One of our own photos per service, picked by what is actually in the frame
 * (see lib/photos.ts — the filenames lie). These are the pages that sell the
 * work, and until now they carried no photography at all.
 */
const SERVICE_PHOTOS: Record<string, Photo> = {
  "residential": photos.vacuumFleet,
  "deep-cleaning": photos.fridgeInterior,
  "commercial": photos.restroomTrailer,
  "vacation-rentals": photos.rentalBathroom,
  "move-in-out": photos.toolkit,
};

export default function ServiceDetail() {
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);
  const service = servicesData[params.slug as keyof typeof servicesData];
  useSEO({ title: service?.title || "Service Details", description: service?.description || "Professional cleaning services in Southern Maine from The Maine Cleaning Co." });

  if (!service) {
    return (
      <Section measure="prose" rhythm="loose" className="min-h-[60vh] flex items-center" innerClassName="text-center w-full">
        <h1 className="text-3xl font-serif font-bold mb-4">Service Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the service you're looking for.</p>
        <Link href="/services"><Button className="rounded-full">Back to Services</Button></Link>
      </Section>
    );
  }

  const Icon = service.icon;
  const showEstimate = true;
  const showChecklist = ["residential", "deep-cleaning", "vacation-rentals", "move-in-out"].includes(service.id);
  const checklistVariantMap: Record<string, "residential" | "deep" | "vacation-rental" | "move-in-out"> = {
    "residential": "residential",
    "deep-cleaning": "deep",
    "vacation-rentals": "vacation-rental",
    "move-in-out": "move-in-out",
  };
  const checklistVariant = checklistVariantMap[service.id] || "residential";

  const slugToCategoryMap: Record<string, "residential" | "deep-clean" | "str" | "commercial"> = {
    "residential": "residential",
    "deep-cleaning": "deep-clean",
    "vacation-rentals": "str",
    "commercial": "commercial",
    "move-in-out": "deep-clean",
  };
  const estimateCategory = slugToCategoryMap[service.id] || "residential";

  const heroPhoto = SERVICE_PHOTOS[service.id] || photos.toolkit;
  // Only a few frames in the library read well behind text once desaturated
  // to ~10% — see `ambientPhotos` in lib/photos.ts.
  const ambientPhoto = estimateCategory === "commercial" ? photos.commercialAisle : photos.rentalBathroom;

  const scrollToEstimate = () => {
    const el = document.getElementById("estimate-section-anchor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`w-full overflow-x-hidden ${service.patternClass}`}>
      {/* ── Hero ──
          Two columns from lg, matching the homepage: the service's own copy
          on the left and a photograph of the work on the right. The hard
          bottom rule is gone — the accent gradient already fades out, so the
          band no longer ends in a ruled line across the page. */}
      <section className="relative overflow-hidden pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20">
        <div className={`absolute inset-0 bg-gradient-to-b ${service.accentGradient}`} aria-hidden="true" />
        <div className={`absolute inset-0 ${service.accentBg} opacity-50`} aria-hidden="true" />

        <div className="relative container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-[78rem] mx-auto">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 flex-wrap" aria-label="Breadcrumb" data-testid="breadcrumb-nav">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link href="/services" className="hover:text-foreground transition-colors">Services</Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-foreground font-medium truncate">{service.title}</span>
            </nav>

            <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-border bg-card ${service.color}`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[2rem] sm:text-5xl md:text-[3.25rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground mb-3" data-testid="text-service-title">{service.title}</h1>
                  <p className={`text-sm font-semibold tracking-wide uppercase ${service.iconAccent} mb-2`} data-testid="text-service-tagline">{service.tagline}</p>
                  <p className="text-muted-foreground text-[15px] sm:text-base leading-relaxed">{service.shortDesc}</p>
                  {showEstimate && (
                    <div className="mt-6 flex flex-wrap items-center gap-2.5">
                      {/* STR + Commercial go through a custom-quote conversation
                          (they hit `isCustomQuote` in InstantEstimate — no
                          instant price, no date picker). Route them to the same
                          /book page so the pre-selected category is intact, but
                          label the CTA "Request a Custom Quote" so we don't
                          promise a booking flow the customer can't finish. */}
                      {(estimateCategory === "str" || estimateCategory === "commercial") ? (
                        <Link href={`/book?service=${estimateCategory}`}>
                          <Button
                            className="rounded-full px-5 shadow-sm gap-1.5"
                            data-testid="button-request-quote"
                          >
                            <Calendar className="w-4 h-4" /> Request a Custom Quote
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/book?service=${estimateCategory}`}>
                          <Button
                            className="rounded-full px-5 shadow-sm gap-1.5"
                            data-testid="button-book-service"
                          >
                            <Calendar className="w-4 h-4" /> Book This Cleaning
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        className="rounded-full px-5 shadow-sm"
                        onClick={scrollToEstimate}
                        data-testid="button-scroll-estimate"
                      >
                        Get an Estimate First
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* LCP candidate on desktop — eager on purpose. */}
              <figure className="photo-frame aspect-[4/3] lg:aspect-[5/4] max-w-md mx-auto lg:max-w-none w-full">
                <img
                  src={heroPhoto.src}
                  alt={heroPhoto.alt}
                  fetchPriority="high"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ── Overview + who it's for ──
          These were two stacked sections, each a single short block in a
          44rem column. Side by side they fill the band and read as one
          thought: what it is, and who it's for. */}
      <Section measure="default">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">{service.description}</p>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Good fit for</h3>
            <p className="text-foreground text-sm sm:text-base leading-relaxed">{service.idealFor}</p>
          </div>
        </div>
      </Section>

      {/* ── What's included ── */}
      <Section measure="default" tone="tint">
        <SectionHeading align="left" title="What's Included" className="mb-8 sm:mb-10" />
        <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
          {service.includes.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
            >
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── Cleaning scope ── */}
      {showChecklist && (
        <Section measure="default">
          <SectionHeading align="left" title="Cleaning Scope" className="mb-8 sm:mb-10" />
          <CleaningChecklist variant={checklistVariant} />
        </Section>
      )}

      {/* ── FAQ ── */}
      <Section measure="prose">
        <SectionHeading align="left" title="Questions" className="mb-8 sm:mb-10" />
        <div className="space-y-3">
          {service.faqs.map((faq, i) => (
            <details key={i} className="group bg-card rounded-xl border border-border overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-foreground text-sm list-none min-h-[48px] select-none">
                {faq.q}
                <span className="ml-3 text-muted-foreground group-open:rotate-45 transition-transform text-lg flex-shrink-0 leading-none">+</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed -mt-1">{faq.a}</div>
            </details>
          ))}
        </div>
      </Section>

      {/* ── Estimate ──
          One of our own photos runs behind this band at ~10-16% so the page
          doesn't end on a flat rectangle. It's decoration, so it's
          aria-hidden and lazy; `isolate` is what keeps the z-index:-1 layer
          above the band's own background instead of behind the page. */}
      {showEstimate ? (
        <Section measure="prose" className="isolate">
          <div className="photo-ambient">
            <img src={ambientPhoto.src} alt="" aria-hidden="true" loading="lazy" />
          </div>
          <LogoWatermark position="right" />
          <div className="relative">
            <div id="estimate-section-anchor" className="absolute -top-32" />
            <EstimateCTA service={estimateCategory} />
          </div>
        </Section>
      ) : (
        <Section measure="prose" tone="sink">
          <div className="bg-card rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-6 sm:p-8 text-center">
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] leading-[1.1] font-serif font-bold tracking-[-0.02em] text-foreground mb-4">Interested in {service.title}?</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Reach out for a custom quote tailored to your space. We'll walk through the details and find the right plan for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
              <a href={companyInfo.contact.phoneHref}>
                <Button className="w-full sm:w-auto h-12 rounded-xl px-6 font-semibold" data-testid="button-service-call">
                  <Phone className="w-4 h-4 mr-2" /> Call {companyInfo.contact.phoneDisplay}
                </Button>
              </a>
              <a href={companyInfo.contact.emailHref}>
                <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl px-6 border-border" data-testid="button-service-email">
                  <Mail className="w-4 h-4 mr-2" /> Email Us
                </Button>
              </a>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <a href={companyInfo.contact.smsHref} className="hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="link-service-text">
                <MessageSquare className="w-4 h-4" /> Text
              </a>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

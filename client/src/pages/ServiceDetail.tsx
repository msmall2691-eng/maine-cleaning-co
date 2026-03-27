import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { servicesData } from "@/lib/services-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, Mail, MessageSquare, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { InstantEstimate } from "@/components/ui/InstantEstimate";
import { CleaningChecklist } from "@/components/ui/CleaningChecklist";
import { companyInfo } from "@/lib/company-info";

export default function ServiceDetail() {
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);
  const service = servicesData[params.slug as keyof typeof servicesData];

  if (!service) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Service Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the service you're looking for.</p>
        <Link href="/services"><Button className="rounded-full">Back to Services</Button></Link>
      </div>
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

  const scrollToEstimate = () => {
    const el = document.getElementById("estimate-section-anchor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`min-h-screen pb-16 sm:pb-24 ${service.patternClass}`}>
      <section className={`relative overflow-hidden border-b ${service.accentBorder} pt-24 sm:pt-32 pb-12 sm:pb-16`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${service.accentGradient}`} />
        <div className={`absolute inset-0 ${service.accentBg} opacity-50`} />
        <div className="relative container mx-auto px-4 sm:px-6 max-w-3xl">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap" aria-label="Breadcrumb" data-testid="breadcrumb-nav">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/services" className="hover:text-foreground transition-colors">Services</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-foreground font-medium truncate">{service.title}</span>
          </nav>
          <div className="flex items-start gap-4 sm:gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-border bg-card ${service.color}`}>
              <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mb-2" data-testid="text-service-title">{service.title}</h1>
              <p className={`text-sm font-semibold tracking-wide uppercase ${service.iconAccent} mb-1`} data-testid="text-service-tagline">{service.tagline}</p>
              <p className="text-muted-foreground text-sm sm:text-base">{service.shortDesc}</p>
              {showEstimate && (
                <Button
                  className="mt-4 rounded-full px-6 shadow-sm"
                  onClick={scrollToEstimate}
                  data-testid="button-scroll-estimate"
                >
                  Get an Instant Estimate
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 max-w-3xl mt-10 sm:mt-14 space-y-12 sm:space-y-16">
        {/* Overview */}
        <section>
          <p className="text-muted-foreground leading-relaxed text-base">{service.description}</p>
        </section>

        {/* What's included */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-5">What's Included</h2>
          <div className="space-y-2.5">
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
        </section>

        {/* Good fit for */}
        <section>
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Good fit for</h3>
            <p className="text-foreground text-sm sm:text-base leading-relaxed">{service.idealFor}</p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-5">Questions</h2>
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
        </section>

        {showChecklist && (
          <section>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-5">Cleaning Scope</h2>
            <CleaningChecklist variant={checklistVariant} />
          </section>
        )}

        {showEstimate ? (
          <section className="relative">
            <div id="estimate-section-anchor" className="absolute -top-32" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-5">Get Your Estimate</h2>
            <InstantEstimate />
          </section>
        ) : (
          <section>
            <div className="bg-card rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-3">Interested in {service.title}?</h2>
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
          </section>
        )}
      </div>
    </div>
  );
}

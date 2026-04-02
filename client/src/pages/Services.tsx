import { useEffect } from "react";
import { CheckCircle2, ArrowRight, Leaf } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { getServicesList } from "@/lib/services-data";
import { motion } from "framer-motion";
import { CleaningQuiz } from "@/components/ui/CleaningQuiz";
import { InstantEstimate } from "@/components/ui/InstantEstimate";

export default function Services() {
  useSEO({ title: "Residential, Commercial & Airbnb Cleaning Services", description: "Residential, deep cleaning, Airbnb turnovers, commercial janitorial, and move-in/move-out cleaning across Southern Maine. Eco-friendly products, transparent pricing." });
  const services = getServicesList();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-16 sm:pb-24">
      <section className="relative bg-background border-b border-border pt-20 sm:pt-28 pb-12 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/services-hero-clean-home.jpeg"
            alt="Professional cleaning services"
            className="w-full h-full object-cover opacity-[0.07]"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4 text-foreground">Our Services</h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Tailored cleaning solutions for homes, rentals, and businesses across Southern Maine.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto mb-14 sm:mb-20">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <Link key={service.id} href={`/services/${service.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group cursor-pointer bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${service.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">{service.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-3">{service.shortDesc}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    View details <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="max-w-5xl mx-auto mb-14 sm:mb-20">
          <div className="text-center max-w-md mx-auto mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-4xl md:text-[2.5rem] font-serif font-bold text-foreground tracking-[-0.01em] mb-3">Not Sure Where to Start?</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Take our 30-second quiz and we'll recommend the perfect cleaning service for your needs.</p>
          </div>
          <CleaningQuiz />
        </div>

        <div className="max-w-xl mx-auto mb-14 sm:mb-20 relative">
          <div id="estimate-section-anchor" className="absolute -top-32" />
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2 text-center">Get an Instant Estimate</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">Tell us about your space and get a price range in seconds.</p>
          <InstantEstimate />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center flex-shrink-0 shadow-sm text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-emerald-300 mb-2">Our Cleaning Approach</h2>
              <p className="text-sm text-emerald-400/80 leading-relaxed mb-3">
                We exclusively use Melaleuca EcoSense & Sal Suds — eco-friendly products that deliver a thorough clean without harsh chemicals.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Melaleuca EcoSense", "Sal Suds", "Safe for kids & pets", "No harsh chemicals"].map((tag) => (
                  <span key={tag} className="text-xs font-medium text-emerald-300 bg-card/80 border border-emerald-700/40 rounded-full px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

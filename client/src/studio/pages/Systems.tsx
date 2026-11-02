import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { useSEO } from "@/hooks/use-seo";
import { STATIC_PAGE_SEO } from "@/lib/seo";
import { brand, capabilities } from "@/lib/brand";

/**
 * The capability detail page.
 *
 * Every block renders from `capabilities` in lib/brand.ts — the same array
 * the homepage grid and the footer read. One description per capability, in
 * one place, so the three pages that mention quoting cannot end up describing
 * three different products.
 */
export default function Systems() {
  useSEO(STATIC_PAGE_SEO["/systems"]);

  return (
    <div className="w-full clip-x">
      <PageHero
        eyebrow="What gets built"
        title={
          <>
            The whole path, not <span className="heading-accent">a brochure.</span>
          </>
        }
        lead="From a stranger searching your town at 9pm to a repeat customer with an account and a standing slot. Six parts, all of them already running in production somewhere."
        // A real page out of the demo, not a photograph of a mop bucket. On
        // a page selling software, a picture of cleaning kit is the wrong
        // first impression — this is one of the generated town landing pages.
        media={
          <figure className="photo-frame aspect-[4/3] lg:aspect-auto lg:h-[clamp(25rem,34vw,31rem)] max-w-md mx-auto lg:max-w-none w-full bg-card">
            <img
              src="/images/product-area-page.webp"
              width={2200}
              height={1640}
              alt="A generated town landing page: breadcrumbs, a town-specific headline, local copy and a call to action."
              className="!object-top"
              fetchPriority="high"
              decoding="async"
            />
          </figure>
        }
        actions={
          <>
            <Link href="/contact">
              <Button size="lg" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base sm:text-[17px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]" data-testid="button-systems-contact">
                Book a call <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={brand.demoPath} data-testid="link-systems-demo" rel="nofollow">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 rounded-full text-base font-semibold border-2 border-primary hover:bg-primary/5 bg-card/80 backdrop-blur-sm">
                <Play className="w-4 h-4 mr-2" /> See it running
              </Button>
            </a>
          </>
        }
      />

      {capabilities.map((c, i) => (
        <Section
          key={c.id}
          id={c.id}
          measure="default"
          tone={i % 2 === 1 ? "tint" : "plain"}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-10 lg:gap-14 items-start"
          >
            <div>
              <p className="type-eyebrow mb-4">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="type-h2 text-foreground mb-5">{c.title}</h2>
              <p className="type-lead mb-5">{c.summary}</p>
              <p className="text-[15px] text-muted-foreground leading-relaxed">{c.detail}</p>
              {c.demo && (
                <a href={c.demo} className="inline-block mt-7" data-testid={`link-demo-${c.id}`} rel="nofollow">
                  <Button variant="outline" className="rounded-full h-10 px-5 text-sm font-semibold gap-2 border-border">
                    <Play className="w-3.5 h-3.5" /> See this in the demo
                  </Button>
                </a>
              )}
            </div>

            <div className="card-soft p-6 sm:p-8">
              <h3 className="type-eyebrow mb-6">What that includes</h3>
              <ul className="space-y-4">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-3.5 text-[15px] text-muted-foreground leading-relaxed">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </Section>
      ))}

      {/* ── What it's built on ── */}
      <Section measure="default" tone="deep">
        <SectionHeading
          eyebrow="Under the hood"
          title="Boring technology, on purpose"
          lead="You should never have to think about any of this. It is here because the one question a technical friend of yours will ask is what it's written in."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { k: "Front end", v: "React + TypeScript" },
            { k: "Server", v: "Node + Express" },
            { k: "Database", v: "PostgreSQL" },
            { k: "Hosting", v: "Railway or your own" },
          ].map((t) => (
            <div key={t.k} className="kpi-card p-4 sm:p-5">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.15em] mb-2">{t.k}</div>
              <div className="text-[15px] font-semibold text-foreground">{t.v}</div>
            </div>
          ))}
        </div>
        <p className="type-lead text-center mt-10 max-w-[40rem] mx-auto">
          No proprietary platform and no lock-in. It is your code, in your repository, on hosting
          you control — so you are never one price rise away from losing the thing your business
          runs on.
        </p>
      </Section>
    </div>
  );
}

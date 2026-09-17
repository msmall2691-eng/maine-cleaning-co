import { Instagram, Facebook, ExternalLink, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FacebookFeed } from "@/components/ui/FacebookFeed";
import { SectionHeading } from "@/components/layout/Section";
import { companyInfo } from "@/lib/company-info";
import { galleryItems } from "@/lib/gallery-data";

/**
 * "What we've been up to" — the live Facebook timeline plus follow buttons.
 *
 * Deliberately separate from WorkGallery. The gallery is a handful of local
 * JPEGs and is cheap enough to sit high on a page; this pulls a third-party
 * iframe, so it belongs lower down where it isn't competing with the booking
 * CTA. Keeping them as two components lets the home page place each where it
 * earns its spot instead of dragging the iframe up with the photos.
 *
 * FacebookFeed itself is lazy — nothing is requested from facebook.com until
 * this is scrolled near — and falls back to a working link if the embed is
 * blocked.
 *
 * LAYOUT: the embed is hard-capped at 500px wide and 640px tall by Meta's
 * Page Plugin (it ignores percentages and only honours 180–500). Centred in a
 * full-width band that left ~750px of empty page on either side of a tall
 * white slab — the worst single piece of dead space on the home page. It now
 * sits in the right-hand column of a two-column row, with the things a
 * visitor might actually act on in the left column, so the band is full and
 * the embed reads as one panel among several rather than as the whole
 * section. Below lg it stacks, embed last.
 */
export function SocialFollow() {
  // The three most recent tiles, as a taste of the gallery further up the
  // page. Reads the same source of truth, so it can't drift out of sync.
  const recent = galleryItems.slice(0, 3);

  return (
    <div>
      <SectionHeading
        align="left"
        eyebrow="Social"
        title="What we've been up to"
        lead="Straight from our Facebook page — jobs, tips and updates as we post them."
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_500px] gap-10 lg:gap-14 items-start">
        {/* ── Things to actually do ── */}
        <div className="order-2 lg:order-1 space-y-8">
          <div className="grid grid-cols-3 gap-3">
            {recent.map((item) => (
              <figure key={item.id} className="photo-frame aspect-square">
                <img src={item.image} alt={item.alt} loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={companyInfo.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:flex-1"
              data-testid="link-instagram-follow"
            >
              <Button
                variant="outline"
                className="w-full rounded-full h-12 px-6 font-semibold gap-2 border-2 border-primary"
              >
                <Instagram className="w-4 h-4 text-[#C13584]" /> Follow on Instagram
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </a>
            <a
              href={companyInfo.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:flex-1"
              data-testid="link-facebook-follow"
            >
              <Button
                variant="outline"
                className="w-full rounded-full h-12 px-6 font-semibold gap-2 border-2 border-primary"
              >
                <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook Page
              </Button>
            </a>
          </div>

          {/* Leaving a review is the single most useful thing a happy
              customer can do here, so it gets a card rather than a link
              buried in the footer. */}
          <div className="card-soft p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-0.5 mb-2" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 dark:text-yellow-400" />
                ))}
              </div>
              <p className="font-bold text-foreground text-base mb-1">Cleaned with us before?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A review on Google helps other Southern Maine folks find us.
              </p>
            </div>
            <a
              href="https://g.page/r/CYnY6ulFfvDtEAE/review"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              data-testid="link-social-review"
            >
              <Button variant="outline" className="rounded-full h-10 px-5 text-sm font-semibold gap-1.5">
                Leave a review <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
            data-testid="link-social-blog"
          >
            Read our cleaning tips <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── The embed ── */}
        <div className="order-1 lg:order-2 w-full">
          <FacebookFeed />
        </div>
      </div>
    </div>
  );
}

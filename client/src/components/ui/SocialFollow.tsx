import { Instagram, Facebook, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookFeed } from "@/components/ui/FacebookFeed";
import { companyInfo } from "@/lib/company-info";

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
 */
export function SocialFollow() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-[1.75rem] sm:text-3xl font-serif font-bold text-foreground tracking-[-0.01em] mb-3">
          What we've been up to
        </h2>
        <p className="text-muted-foreground text-[15px] leading-relaxed max-w-md mx-auto">
          Straight from our Facebook page — jobs, tips and updates as we post them.
        </p>
      </div>

      <div className="mb-10">
        <FacebookFeed />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={companyInfo.socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-instagram-follow"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full h-12 px-8 font-semibold gap-2 border-2 border-primary"
          >
            <Instagram className="w-4 h-4 text-[#C13584]" /> Follow on Instagram
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Button>
        </a>
        <a
          href={companyInfo.socials.facebook}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-facebook-follow"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full h-12 px-8 font-semibold gap-2 border-2 border-primary"
          >
            <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook Page
          </Button>
        </a>
      </div>
    </div>
  );
}

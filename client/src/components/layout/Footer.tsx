import { Link, useLocation } from "wouter";
import { Phone, MessageSquare, Mail, MapPin, ArrowRight } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { Button } from "@/components/ui/button";
import { LogoLockup, LogoWatermark, LogoBadge } from "@/components/brand/Logo";
import { photos, srcSetFor, SIZES } from "@/lib/photos";

export default function Footer() {
  const [location] = useLocation();

  const scrollToEstimate = (e: React.MouseEvent) => {
    if (location === "/") {
      e.preventDefault();
      document.getElementById("get-estimate")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    /* The footer used to fade from the page background into --card — which on
       the light theme is white on off-white, a 2% step. It had no weight at
       all: the page simply ran out rather than ending, and the one thing
       anchoring the bottom of every page was a 320px lighthouse watermark at
       3.5% alpha.

       It is the deep band now, the same surface as <ClosingCTA> directly above
       it, so a page closes with one deliberate dark region. .band-deep
       redefines the theme tokens on itself, so every link, heading and muted
       line inside here inverts without needing its own dark variant. */
    <footer className="band-deep relative isolate overflow-hidden pt-20 pb-8">
      <LogoWatermark position="left" />
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative">

        {/* ── CTA banner ──
            One of our own job photos sits behind this, run right down under
            the primary tint so it reads as texture. It is the last thing on
            every page, so it should feel like the company, not like a box. */}
        {/* `justify-between` across a 144px badge, a two-line block of text and
            a button spread them to the edges of a 1086px banner and parked the
            text alone in the middle, with a ~200px hole either side of it. The
            badge and the copy are one unit — they belong together on the left,
            with the button opposite. */}
        <div className="relative overflow-hidden rounded-3xl border border-foreground/15 px-6 py-7 sm:px-8 mb-16 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <div className="absolute inset-0">
            <img
              src={photos.restroomTrailer.src}
              srcSet={srcSetFor(photos.restroomTrailer)}
              sizes={SIZES.ambient}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="w-full h-full object-cover opacity-[0.22] saturate-50"
            />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-deep/95 via-deep/80 to-deep/55" />
          </div>
          <LogoBadge className="relative hidden sm:inline-flex w-28 flex-shrink-0" />
          <div className="relative sm:flex-1 min-w-0">
            <p className="type-h3 text-foreground">The Maine choice for a clean space.</p>
            <p className="text-sm text-muted-foreground mt-1.5">Free estimate in under 60 seconds — no commitment required.</p>
          </div>
          <a href="/#get-estimate" onClick={scrollToEstimate} className="relative flex-shrink-0" data-testid="link-footer-cta-estimate">
            <Button size="sm" className="rounded-full h-11 px-6 text-sm font-semibold gap-1.5 flex-shrink-0">
              Get Estimate <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <LogoLockup size="lg" className="mb-5" markClassName="ring-1 ring-foreground/25" />
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Professional cleaning for homes, businesses, and vacation rentals across Southern Maine since 2018.
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <a href={companyInfo.contact.phoneHref} className="inline-flex items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-call">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" /> {companyInfo.contact.phoneDisplay}
              </a>
              <a href={companyInfo.contact.smsHref} className="inline-flex sm:hidden items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-text">
                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" /> Text Us
              </a>
              <a href={companyInfo.contact.phoneHref} className="hidden sm:inline-flex items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-text-desktop">
                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" /> Call or Text {companyInfo.contact.phoneDisplay}
              </a>
              <a href={companyInfo.contact.emailHref} className="inline-flex items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-email">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" /> {companyInfo.contact.email}
              </a>
            </div>
          </div>

          {/* Services — no duplicates */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 text-xs uppercase tracking-[0.15em]">Services</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/services/residential" className="text-muted-foreground hover:text-foreground transition-colors">Residential Cleaning</Link></li>
              <li><Link href="/services/deep-cleaning" className="text-muted-foreground hover:text-foreground transition-colors">Deep Cleaning</Link></li>
              <li><Link href="/short-term-rentals" className="text-muted-foreground hover:text-foreground transition-colors">Airbnb & Vacation Rental</Link></li>
              <li><Link href="/services/commercial" className="text-muted-foreground hover:text-foreground transition-colors">Commercial</Link></li>
              <li><Link href="/services/move-in-out" className="text-muted-foreground hover:text-foreground transition-colors">Move-In / Move-Out</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 text-xs uppercase tracking-[0.15em]">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="/service-areas" className="text-muted-foreground hover:text-foreground transition-colors">Service Areas</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><a href="/#contact" onClick={(e) => { if (location === "/") { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}} className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Area + Connect */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 text-xs uppercase tracking-[0.15em]">Service Area</h4>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground mb-6">
              <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span>York & Cumberland County,<br />Southern Maine</span>
            </div>
            <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-[0.15em]">Connect</h4>
            <ul className="space-y-3 text-sm">
              <li><a href={companyInfo.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-facebook">Facebook</a></li>
              <li><a href={companyInfo.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-instagram">Instagram</a></li>
              <li><a href="https://g.page/r/CYnY6ulFfvDtEAE/review" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-google-review">Leave a Review</a></li>
            </ul>
          </div>
        </div>

        {/* lg:pr-14 keeps the right-hand group clear of the fixed back-to-top
            button (40px wide, right-4). Without it the button sat on top of
            the "Built by msmall.org" credit and visibly clipped it once you
            reached the bottom of the page. */}
        <div className="border-t border-foreground/15 pt-6 lg:pr-14 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>&copy; {new Date().getFullYear()} The Maine Cleaning Co. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/sms" className="hover:text-foreground transition-colors">SMS Terms</Link>
            <span className="text-muted-foreground/40">·</span>
            <a href="https://msmall.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" data-testid="link-msmall-credit">Built by msmall.org</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

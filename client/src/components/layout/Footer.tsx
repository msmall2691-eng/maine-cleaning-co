import { Link, useLocation } from "wouter";
import { Phone, MessageSquare, Mail, MapPin, ArrowRight } from "lucide-react";
import { companyInfo } from "@/lib/company-info";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const [location] = useLocation();

  const scrollToEstimate = (e: React.MouseEvent) => {
    if (location === "/") {
      e.preventDefault();
      document.getElementById("get-estimate")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border/40 pt-16 pb-8 relative">
      <div className="container mx-auto px-4 sm:px-6">

        {/* ── CTA banner ── */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-6 mb-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Let's get your home sparkling.</p>
            <p className="text-sm text-muted-foreground mt-0.5">Free estimate in under 60 seconds — no commitment required.</p>
          </div>
          <a href="/#get-estimate" onClick={scrollToEstimate} data-testid="link-footer-cta-estimate">
            <Button size="sm" className="rounded-full h-9 px-5 text-sm gap-1.5 flex-shrink-0">
              Get Estimate <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <span className="font-serif font-bold text-lg tracking-[-0.02em] text-foreground block">
                The Maine Cleaning Co.
              </span>
              <span className="text-xs tracking-[0.06em] text-muted-foreground uppercase font-medium mt-0.5 block">
                Est. 2018 · Southern Maine
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Professional cleaning for homes, businesses, and vacation rentals across Southern Maine since 2018.
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <a href={companyInfo.contact.phoneHref} className="inline-flex items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-call">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" /> {companyInfo.contact.phoneDisplay}
              </a>
              <a href={companyInfo.contact.smsHref} className="inline-flex items-center gap-2.5 text-foreground hover:text-primary transition-colors" data-testid="link-footer-text">
                <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" /> Text Us
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

        <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>&copy; {new Date().getFullYear()} The Maine Cleaning Co. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <span className="text-muted-foreground/40">·</span>
            <a href="https://msmall.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" data-testid="link-msmall-credit">Built by msmall.org</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, MessageSquare, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";

export function StickyMobileBar() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the /book page the estimator IS the whole page — the sticky bar's
  // primary CTA would just re-land the customer where they already are.
  // Hide it there and let the page's own Book button own the flow.
  if (!visible || location === "/book") return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-bottom"
      data-testid="sticky-mobile-bar"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Link
          href="/book"
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
          data-testid="sticky-book"
        >
          <Calendar className="w-4 h-4" />
          Book Now
        </Link>
        <a
          href={companyInfo.contact.smsHref}
          className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-medium active:scale-[0.98] transition-transform"
          data-testid="sticky-text"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          Text
        </a>
        <a
          href={companyInfo.contact.phoneHref}
          className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-medium active:scale-[0.98] transition-transform"
          data-testid="sticky-call"
        >
          <Phone className="w-4 h-4 text-primary" />
          Call
        </a>
      </div>
    </div>
  );
}

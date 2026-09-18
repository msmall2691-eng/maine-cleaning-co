import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, MessageSquare, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";

export function StickyMobileBar() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();

  // This bar is mobile-only, so everything it does on scroll is paid for by
  // the device least able to afford it. Two things were wrong:
  //
  //  - setVisible ran on every scroll event, not once per frame. React bails
  //    out of the re-render when the boolean is unchanged, but the dispatch
  //    still runs on every one of those events, at 60-120Hz, for the whole
  //    length of every page.
  //  - The threshold is crossed twice per visit. All the rest is noise, so
  //    it is now read behind a rAF and only written when it actually flips.
  useEffect(() => {
    let raf = 0;
    let last = false;
    const check = () => {
      raf = 0;
      const next = window.scrollY > 400;
      if (next !== last) {
        last = next;
        setVisible(next);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // On the /book page the estimator IS the whole page — the sticky bar's
  // primary CTA would just re-land the customer where they already are.
  // Hide it there and let the page's own Book button own the flow.
  if (!visible || location === "/book") return null;

  return (
    <div
      // Opaque, not frosted. A backdrop-filter on a fixed bar means the
      // compositor re-samples and re-blurs the content scrolling beneath it
      // on every single frame — on a phone that is one of the most expensive
      // things a page can ask for, and it was pinned to the bottom of the
      // viewport on every page. At 95% opacity the blur was very nearly
      // invisible anyway, so bg-card loses nothing and costs nothing.
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-bottom"
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

import { useState, useEffect } from "react";
import { Calculator, MessageSquare, Phone } from "lucide-react";
import { companyInfo } from "@/lib/company-info";

export function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToEstimate = () => {
    document.getElementById("get-estimate")?.scrollIntoView({ behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.06)] safe-area-bottom"
      data-testid="sticky-mobile-bar"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={scrollToEstimate}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
          data-testid="sticky-estimate"
        >
          <Calculator className="w-4 h-4" />
          Get Estimate
        </button>
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

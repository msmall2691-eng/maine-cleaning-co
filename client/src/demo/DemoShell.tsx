import { useEffect, useRef } from "react";
import { Router, Switch, Route } from "wouter";
import { ArrowLeft, Info } from "lucide-react";
import { brand } from "@/lib/brand";
import { DemoModeProvider } from "./demo-mode";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { StickyMobileBar } from "@/components/ui/StickyMobileBar";
import Home from "@/pages/Home";
import Book from "@/pages/Book";
import ManageBooking from "@/pages/ManageBooking";
import Portal from "@/pages/Portal";
import PortalLogin from "@/pages/PortalLogin";
import ResetPassword from "@/pages/ResetPassword";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import ServiceAreas from "@/pages/ServiceAreas";
import ServiceAreaDetail from "@/pages/ServiceAreaDetail";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import ShortTermRentals from "@/pages/ShortTermRentals";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Sms from "@/pages/Sms";
import NotFound from "@/pages/not-found";

/**
 * The cleaning company's site, kept whole, mounted under /demo.
 *
 * Every page here is the one that was in production — not a cut-down copy.
 * The only differences are the banner above, demo mode (see demo-mode.tsx),
 * and that none of it is indexed.
 *
 * It is mounted inside `<Router base={brand.demoPath}>`, which is what makes
 * all of these `<Route path="/">`-style paths resolve under /demo and every
 * `<Link href="/book">` inside them point at /demo/book. Anything that builds
 * a URL by hand instead of using <Link> has to go through `useBasePath()`, or
 * it will throw a demo visitor back out onto the business site.
 *
 * These routes deliberately live in this file rather than in App.tsx:
 * `routeTableDrift.test.ts` parses App.tsx for `<Route path=…>` and checks
 * each against the server's SPA_ROUTES. Nested demo paths there would be read
 * as top-level routes and fail a check they were never meant to be part of.
 */
/**
 * The banner is FIXED, not in flow, because <Navbar> is itself
 * `fixed top-0` — in flow the banner scrolled away under a navbar that never
 * moved, and on first paint the two were stacked on top of each other with
 * the wordmark showing through the notice.
 *
 * So the banner owns the top strip, and `.demo-shell` (index.css) pushes the
 * navbar and the page down by exactly its height.
 *
 * It is NOT dismissible, deliberately. The page underneath still says
 * "Taking new clients across Southern Maine" and still offers "Book a
 * Cleaning", because it is the real system and gutting it would make a poor
 * demo. Someone arriving on an old maineclean.co link — which now 301s here —
 * has to be able to tell, at any scroll position, that the business has wound
 * down. A notice you can close is not that; it was closeable for about twenty
 * minutes and that was a mistake.
 */
function DemoBanner() {
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Publish the banner's REAL height, so the navbar and the page sit below
   * whatever it actually occupies.
   *
   * It used to be a fixed 3.5rem/2.75rem with `h-[var(--demo-banner-h)]` on
   * the box. That is only true at desktop widths: the sentence wraps to two
   * lines under 1280px and three under ~420px, so the text overflowed its own
   * box, ran off the top of the viewport (measured at -7px on a 390px screen,
   * -14px at 640px) and was struck through by the navbar below it. The one
   * notice that is deliberately not dismissible was the one you could not
   * read on a phone — which is exactly what an old maineclean.co link 301s
   * someone to.
   *
   * Measured rather than guessed, because the height depends on the font, the
   * viewport and the copy, and any constant here is a guess that goes stale
   * the next time one of those changes. Written to <html> so it inherits into
   * both `.demo-shell`'s padding and the navbar's `top` — and NOT declared on
   * `.demo-shell` in CSS, because a declaration there would shadow this one
   * for the whole subtree.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty("--demo-banner-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--demo-banner-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      /* No fixed height: the box is sized by its content, and the effect
         above tells the rest of the layout how tall that turned out to be. */
      className="fixed top-0 left-0 right-0 z-[70] py-2 sm:py-2.5 flex items-center band-deep border-b border-foreground/10"
      data-testid="demo-banner"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 flex items-center gap-3 sm:gap-4">
        <Info className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
        <p className="text-[12.5px] sm:text-[13px] text-foreground leading-snug flex-1 min-w-0">
          <span className="font-semibold">You're looking at a live demo.</span>{" "}
          <span className="text-muted-foreground">
            {/* priorBusiness already ends in a full stop ("The Maine Cleaning
                Co."), so this sentence must not add a second one. */}
            This is the real system built for {brand.operator.priorBusiness} The business has wound
            down, so bookings and enquiries are switched off — everything else works.
          </span>
        </p>
        <a
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline flex-shrink-0"
          data-testid="link-demo-exit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {brand.name}
        </a>
      </div>
    </div>
  );
}

export default function DemoShell() {
  return (
    <DemoModeProvider>
      <Router base={brand.demoPath}>
        <div className="demo-shell flex min-h-screen flex-col">
          <DemoBanner />
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-0">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/book" component={Book} />
              <Route path="/booking/manage/:token" component={ManageBooking} />
              <Route path="/portal/login" component={PortalLogin} />
              <Route path="/portal/reset-password" component={ResetPassword} />
              <Route path="/portal" component={Portal} />
              <Route path="/about" component={About} />
              <Route path="/how-it-works" component={HowItWorks} />
              <Route path="/service-areas" component={ServiceAreas} />
              <Route path="/service-areas/:slug" component={ServiceAreaDetail} />
              <Route path="/services" component={Services} />
              <Route path="/services/:slug" component={ServiceDetail} />
              <Route path="/short-term-rentals" component={ShortTermRentals} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPost} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route path="/sms" component={Sms} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <StickyMobileBar />
        </div>
      </Router>
    </DemoModeProvider>
  );
}

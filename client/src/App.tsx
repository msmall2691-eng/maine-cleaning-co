import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { WeatherProvider } from "@/lib/weather";

import StudioNav from "@/studio/components/StudioNav";
import StudioFooter from "@/studio/components/StudioFooter";
import StudioHome from "@/studio/pages/StudioHome";
import Systems from "@/studio/pages/Systems";
import Proof from "@/studio/pages/Proof";
import Process from "@/studio/pages/Process";
import Contact from "@/studio/pages/Contact";
import StudioPrivacy from "@/studio/pages/StudioPrivacy";
import StudioNotFound from "@/studio/pages/StudioNotFound";

import DemoShell from "@/demo/DemoShell";

/**
 * Two sites, one deployment.
 *
 *   /          the business — done-for-you operations systems for local
 *              service companies. Indexed, pre-rendered, the real thing.
 *   /demo/*    the cleaning company's system, kept whole as proof. Not
 *              indexed, and its writes are blocked. See demo/DemoShell.tsx.
 *
 * The demo's routes live in DemoShell, not here, for two reasons: they are
 * mounted inside a `<Router base="/demo">` so their paths are relative, and
 * `routeTableDrift.test.ts` parses THIS file for `<Route path=…>` and
 * checks every one against the server's SPA_ROUTES. Nested demo paths here
 * would be read as top-level routes and fail a check they were never part of.
 */

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Let the page render, then scroll to the hash target
      setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Explicitly instant. `html { scroll-behavior: smooth }` in index.css
      // applies to any scroll that does not state its own behaviour, so this
      // call was ANIMATING — every page change smooth-scrolled the whole way
      // back to the top from wherever you happened to be. On a long page that
      // is a slow glide you cannot skip, and it is why navigation felt
      // delayed on every page rather than on one of them. In-page anchors
      // still ask for smooth explicitly and still get it.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location]);
  return null;
}

/** The business site: its own nav, its own footer, its own voice. */
function StudioSite() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col text-foreground selection:bg-primary/30">
      <StudioNav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={StudioHome} />
          <Route path="/systems" component={Systems} />
          <Route path="/proof" component={Proof} />
          <Route path="/process" component={Process} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={StudioPrivacy} />
          <Route component={StudioNotFound} />
        </Switch>
      </main>
      <StudioFooter />
    </div>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* The demo, and everything under it.

            `/demo/*` and not `/demo/:rest*`: a named parameter matches a
            SINGLE segment even with the `*` modifier, so `/demo/about`
            rendered and `/demo/services/deep-cleaning` fell through to the
            business site's 404. The bare `*` is the wildcard that crosses
            slashes. Two patterns because `/demo/*` does not match `/demo`
            itself.

            Written as string literals rather than as {brand.demoPath}, on
            purpose: routeTableDrift.test.ts finds routes by parsing this file
            for `path="…"`, so an interpolated path would be invisible to it
            and the demo would be the one part of the router nothing checks.
            `brand.test.ts` asserts brand.demoPath still equals "/demo". */}
        <Route path="/demo" component={DemoShell} />
        <Route path="/demo/*" component={DemoShell} />
        <Route component={StudioSite} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WeatherProvider>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </WeatherProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

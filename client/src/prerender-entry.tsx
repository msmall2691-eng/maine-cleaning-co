/**
 * Server-side entry used ONLY at build time by script/prerender.ts.
 *
 * Renders every public page to static HTML so its text and head tags exist
 * in the response body without JavaScript. This started as the three policy
 * pages, for one concrete reader: a carrier's A2P 10DLC reviewer fetches the
 * privacy-policy URL declared on the campaign and does not run JS. The SPA
 * shell answered every route with HTTP 200 and 74 characters of text (the
 * homepage <title>), so the reviewer saw a page that "succeeded" and
 * contained no policy.
 *
 * It now covers the whole public site, because that reviewer is not the only
 * one reading HTML as served:
 *   - Bing does not reliably execute JavaScript, and DuckDuckGo, Ecosia and
 *     Brave all lean on Bing's index.
 *   - Facebook, LinkedIn, iMessage and Slack never run it. They read og:*
 *     from the raw HTML, which is why every shared link used to preview as
 *     the homepage regardless of what was being shared.
 *   - The AI crawlers now sending referral traffic — OAI-SearchBot,
 *     PerplexityBot, ClaudeBot — mostly read static HTML, and cannot
 *     summarise or recommend a page whose body is an empty <div>.
 * Google renders JS and sees the `useSEO` output, but queues rendering
 * separately from crawling, so even there this shortens time-to-index.
 *
 * What is rendered: the page body plus the Footer, inside a wouter Router
 * pinned to the path. The Footer is included for its 22 internal links —
 * without it a crawler reading one page finds no route to any other. The
 * Navbar is left out because it mounts ThemeToggle, which needs the theme
 * context that only the live app provides; the Footer needs nothing but the
 * router.
 *
 * Three of App.tsx's providers ARE needed, because components inside the
 * public pages reach for them during render, not at mount:
 *   - QueryClientProvider — InstantEstimate calls useMutation and
 *     AICleaningTip useQuery. Neither fires here (effects and mutations do
 *     not run during renderToString), but useQueryClient throws without a
 *     provider, which failed the build outright.
 *   - WeatherProvider — the homepage's CoastalConditions card reads it. Its
 *     fetch is in an effect, so the context stays empty and the card renders
 *     nothing, which is its documented behaviour when it has no data.
 *   - TooltipProvider — Radix tooltips require an ancestor provider.
 * AuthProvider and ThemeProvider are not needed: nothing outside the portal
 * and the Navbar consumes them. `prerenderRender.test.ts` renders every
 * route, so a component that starts reaching for a missing provider fails a
 * test rather than a deploy.
 *
 * When JS does run, main.tsx calls createRoot().render(), which replaces
 * this markup with the full app, so the browser experience is unchanged.
 *
 * Adding a page: put it in STATIC_PAGE_SEO (client/src/lib/seo.ts), the
 * Switch below, the SPA router in App.tsx, and SPA_ROUTES in
 * server/static.ts. Tests fail on any of those being missed.
 */
import { renderToString } from "react-dom/server";
import { Router, Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WeatherProvider } from "@/lib/weather";
import StudioFooter from "@/studio/components/StudioFooter";
import StudioHome from "@/studio/pages/StudioHome";
import Systems from "@/studio/pages/Systems";
import Proof from "@/studio/pages/Proof";
import Process from "@/studio/pages/Process";
import Contact from "@/studio/pages/Contact";
import StudioPrivacy from "@/studio/pages/StudioPrivacy";
import { PRERENDER_ROUTES, PRERENDER_PATHS } from "@/lib/seo-routes";

export { PRERENDER_ROUTES, PRERENDER_PATHS };

/**
 * The business site's public routes, mirroring the StudioSite switch in
 * App.tsx.
 *
 * The /demo subtree is deliberately absent. It is noindex by design — the
 * cleaning company has wound down — so there is nothing for a crawler to
 * read there and no reason to bake it into a static file. See the note at
 * the top of lib/seo-routes.ts.
 */
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={StudioHome} />
      <Route path="/systems" component={Systems} />
      <Route path="/proof" component={Proof} />
      <Route path="/process" component={Process} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={StudioPrivacy} />
    </Switch>
  );
}

/** Render one route's markup. Throws for a path with no registered metadata. */
export function render(path: string): string {
  if (!PRERENDER_ROUTES[path]) throw new Error(`No prerender metadata registered for ${path}`);

  // A fresh client per page, with retries off. Nothing should fetch during a
  // static render; if something ever does, it should fail loudly and once
  // rather than retry three times and stall the build.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return renderToString(
    <QueryClientProvider client={queryClient}>
      <WeatherProvider>
        <TooltipProvider>
          <Router ssrPath={path}>
            <div className="relative z-10 flex min-h-screen flex-col text-foreground">
              <main className="flex-1 pb-20 lg:pb-0">
                <PublicRoutes />
              </main>
              <StudioFooter />
            </div>
          </Router>
        </TooltipProvider>
      </WeatherProvider>
    </QueryClientProvider>,
  );
}

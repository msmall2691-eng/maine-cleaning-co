/**
 * Server-side entry used ONLY at build time by script/prerender.ts.
 *
 * Renders the policy pages to static HTML so their text exists in the
 * response body without JavaScript. Why it matters: a carrier's A2P 10DLC
 * reviewer fetches the privacy-policy URL declared on the campaign without
 * running JS. The SPA shell answers every route with HTTP 200 and 74
 * characters of text (the homepage <title>), so the reviewer sees a page
 * that "succeeds" and contains no policy — worse than a 404, because
 * nothing signals failure.
 *
 * Only the page body is rendered here (no Navbar/Footer/providers — those
 * lean on window, auth and weather at mount). When JS does run, main.tsx
 * calls createRoot().render(), which replaces this markup with the full
 * app, so the browser experience is unchanged.
 *
 * Add a page here AND to the SPA router in App.tsx; server/static.ts maps
 * the path to the generated file.
 */
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Sms from "@/pages/Sms";

export interface PrerenderPage {
  component: ComponentType;
  title: string;
  description: string;
}

export const PRERENDER_PAGES: Record<string, PrerenderPage> = {
  "/privacy": {
    component: Privacy,
    title: "Privacy Policy",
    description:
      "Privacy policy for The Maine Cleaning Co. — how we collect, use, and protect your personal information.",
  },
  "/terms": {
    component: Terms,
    title: "Terms of Service",
    description: "Terms of service for The Maine Cleaning Co. cleaning and short-term rental turnover services.",
  },
  "/sms": {
    component: Sms,
    title: "Text Message (SMS) Program",
    description:
      "How The Maine Cleaning Co. uses text messages: booking confirmations, scheduling updates and reminders. Reply STOP to opt out, HELP for help.",
  },
};

export function render(path: string): string {
  const page = PRERENDER_PAGES[path];
  if (!page) throw new Error(`No prerender page registered for ${path}`);
  const Component = page.component;
  // wouter's <Link> reads the router; ssrPath gives it a static location so
  // the render never touches window.
  return renderToString(
    <Router ssrPath={path}>
      <main className="flex-1">
        <Component />
      </main>
    </Router>,
  );
}

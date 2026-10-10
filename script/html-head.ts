/**
 * Rewrite the built SPA shell's <head> for one pre-rendered page.
 *
 * Split out of prerender.ts so it can be unit-tested without starting a Vite
 * server: this is where a silent failure would be most expensive. Every tag
 * it touches exists exactly once in client/index.html, and a replacement
 * that matched nothing would leave the homepage's value in place — which is
 * the bug this whole change exists to fix. So the required tags throw when
 * absent rather than no-op, and `prerenderHead.test.ts` checks each one.
 *
 * Keep in step with `useSEO` (client/src/hooks/use-seo.ts), which writes the
 * same tags at runtime from the same metadata.
 */

import type { SeoMeta } from "../client/src/lib/seo";
import { canonicalUrl, DEFAULT_OG_IMAGE, formatTitle } from "../client/src/lib/seo";

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * JSON for a <script> block. `<` is escaped so a string containing
 * "</script>" cannot end the element early — the one way page data could
 * break out of the block it sits in.
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function replaceRequired(html: string, pattern: RegExp, replacement: string, label: string): string {
  if (!pattern.test(html)) {
    throw new Error(`prerender: could not find ${label} in the built index.html — head rewriting would silently keep the homepage's value`);
  }
  return html.replace(pattern, replacement);
}

/** Replace a tag if the shell has one, otherwise insert it before </head>. */
function upsert(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/, `    ${tag}\n  </head>`);
}

/**
 * "/" -> "index.html", "/services/residential" -> "services/residential.html".
 *
 * Mirrored by `prerenderedFileFor` in server/static.ts, which resolves the
 * same path to the same file at request time. Lives here rather than in
 * prerender.ts so a test can import it without starting a Vite server.
 */
export function outputFileFor(routePath: string): string {
  if (routePath === "/") return "index.html";
  return `${routePath.replace(/^\//, "")}.html`;
}

export interface AppliedHead {
  html: string;
  title: string;
  canonical: string;
}

/**
 * Returns the shell with this page's head tags and body markup in place.
 *
 * `body` is the server-rendered markup for the page, dropped into
 * <div id="root"> where the client will later hydrate over it.
 */
export function applyHead(shell: string, path: string, meta: SeoMeta, body: string): AppliedHead {
  const title = formatTitle(meta.title);
  const canonical = canonicalUrl(meta.canonicalPath ?? path);
  const image = meta.ogImage || DEFAULT_OG_IMAGE;
  const ogType = meta.ogType ?? "website";

  let html = shell;

  html = replaceRequired(html, /<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`, "<title>");
  html = replaceRequired(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    "meta description",
  );
  html = replaceRequired(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
    "canonical link",
  );

  // Social tags. A crawler that does not run JS reads only these, so a page
  // that fell back to the homepage's values would preview as the homepage.
  html = upsert(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeAttr(title)}" />`);
  html = upsert(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeAttr(meta.description)}" />`);
  html = upsert(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeAttr(canonical)}" />`);
  html = upsert(html, /<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${ogType}" />`);
  html = upsert(html, /<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapeAttr(image)}" />`);
  html = upsert(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  html = upsert(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`);
  html = upsert(html, /<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapeAttr(image)}" />`);

  if (ogType === "article" && meta.publishedTime) {
    html = upsert(
      html,
      /<meta property="article:published_time" content="[^"]*"\s*\/?>/,
      `<meta property="article:published_time" content="${escapeAttr(meta.publishedTime)}" />`,
    );
  }

  // Pages that should not be indexed are not pre-rendered at all, but honour
  // the flag rather than quietly publishing an indexable copy of one.
  if (meta.noindex) {
    html = upsert(html, /<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="noindex, nofollow" />`);
  }

  // Page schema, marked the same way useSEO marks its own so the client can
  // recognise and replace it on hydration instead of leaving two copies.
  if (meta.jsonLd !== undefined) {
    const script = `<script type="application/ld+json" data-seo-page>${jsonForScript(meta.jsonLd)}</script>`;
    html = html.replace(/<\/head>/, `    ${script}\n  </head>`);
  }

  html = replaceRequired(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, '<div id="root">');

  return { html, title, canonical };
}

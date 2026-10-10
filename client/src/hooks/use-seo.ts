import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  canonicalUrl,
  DEFAULT_OG_IMAGE,
  formatTitle,
  type SeoMeta,
} from "@/lib/seo";

/**
 * Keep the document head in step with the page being rendered.
 *
 * This hook used to set <title> and the meta description and nothing else,
 * which left the canonical, og:* and twitter:* tags from client/index.html
 * in place on all 19 routes. The canonical mattered most: every page claimed
 * to be a duplicate of the homepage. See client/src/lib/seo.ts for the
 * consequences and for where the per-page values live.
 *
 * Only Google and Bing run the JavaScript that calls this. Everything else
 * reads the HTML as served, which is why script/prerender.ts writes the same
 * tags at build time from the same registry — this hook and that script must
 * agree, and `seo.test.ts` checks that they do.
 *
 * Tags are updated in place when they exist in index.html and created when
 * they don't. Every managed tag is written on every change rather than
 * diffed, so no value can survive a navigation into a page that doesn't set
 * it — the failure mode that left a stale `noindex` behind would be an
 * expensive one.
 */
export function useSEO({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  publishedTime,
  jsonLd,
  noindex = false,
}: SeoMeta) {
  const [location] = useLocation();
  // The registry's path wins; a dynamic route (/services/:slug, /blog/:slug)
  // has none and uses where the router actually is.
  const url = canonicalUrl(canonicalPath ?? location);
  // Serialised so the effect re-runs when the schema's CONTENTS change.
  // Depending on the object itself would re-run on every render, since each
  // render of a page builds a fresh array.
  const jsonLdKey = jsonLd === undefined ? "" : JSON.stringify(jsonLd);

  useEffect(() => {
    const fullTitle = formatTitle(title);
    document.title = fullTitle;

    setMeta("name", "description", description);
    setMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    );

    setLink("canonical", url);

    const image = ogImage || DEFAULT_OG_IMAGE;
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // article:published_time is meaningful only on an article, and a stale
    // one on a service page would be worse than none.
    if (ogType === "article" && publishedTime) {
      setMeta("property", "article:published_time", publishedTime);
    } else {
      document.head.querySelector('meta[property="article:published_time"]')?.remove();
    }

    // Page schema is removed on cleanup rather than overwritten, so
    // navigating /services/residential -> /services/commercial can't leave
    // both pages' Service nodes in the head at once. The LocalBusiness node
    // in index.html is untouched — it describes the business, not the page.
    const previous = document.head.querySelectorAll("script[data-seo-page]");
    previous.forEach((el) => el.remove());

    if (jsonLd !== undefined) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-page", "");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
      return () => {
        script.remove();
      };
    }
  }, [title, description, url, ogImage, ogType, publishedTime, noindex, jsonLdKey, jsonLd]);
}

/** Update a <meta> tag, creating it if index.html doesn't already carry one. */
function setMeta(keyAttr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${keyAttr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(keyAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Update a <link rel>, creating it if absent. */
function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

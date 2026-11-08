import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { applyHead, outputFileFor } from "../../script/html-head";
import { prerenderedFileFor } from "../static";
import { PRERENDER_PATHS, PRERENDER_ROUTES } from "@/lib/seo-routes";

/**
 * The real shell, not a fixture. Every replacement in html-head.ts is a regex
 * against client/index.html, so a tag edited there — reformatted, reordered,
 * single- to double-quoted — would stop matching. The failure mode is silent:
 * the page keeps the homepage's title and canonical, which is the exact bug
 * this change exists to fix. Reading the real file is what makes that loud.
 */
const SHELL = readFileSync(path.resolve(__dirname, "../../client/index.html"), "utf-8");

function headOf(html: string): string {
  return html.slice(0, html.indexOf("</head>"));
}

describe("applyHead", () => {
  const meta = {
    title: "Cleaning Services in Southern Maine",
    description: "Residential, deep, commercial and vacation-rental cleaning across Southern Maine.",
    canonicalPath: "/services",
  };

  it("writes the page's own title, description and canonical", () => {
    const { html } = applyHead(SHELL, "/services", meta, "<p>body</p>");
    const head = headOf(html);
    expect(head).toContain("<title>Cleaning Services in Southern Maine | The Maine Cleaning Co.</title>");
    expect(head).toContain('<link rel="canonical" href="https://www.maineclean.co/services" />');
    expect(head).toContain(`<meta name="description" content="${meta.description}" />`);
  });

  it("leaves no second canonical behind", () => {
    const { html } = applyHead(SHELL, "/services", meta, "");
    expect(headOf(html).match(/rel="canonical"/g)).toHaveLength(1);
  });

  it("does not keep the homepage's canonical anywhere in the document", () => {
    const { html } = applyHead(SHELL, "/services", meta, "");
    expect(html).not.toContain('<link rel="canonical" href="https://www.maineclean.co/" />');
  });

  /**
   * Facebook, LinkedIn, iMessage and Slack never run JavaScript, so these
   * tags as served are the entire preview. They used to be the homepage's on
   * every page.
   */
  it("writes the page's own social tags", () => {
    const { html } = applyHead(SHELL, "/services", meta, "");
    const head = headOf(html);
    expect(head).toContain('<meta property="og:url" content="https://www.maineclean.co/services" />');
    expect(head).toContain('<meta property="og:title" content="Cleaning Services in Southern Maine | The Maine Cleaning Co." />');
    expect(head).toContain('<meta name="twitter:title" content="Cleaning Services in Southern Maine | The Maine Cleaning Co." />');
  });

  it("uses an absolute og:image, which is the only kind a crawler resolves", () => {
    const { html } = applyHead(SHELL, "/services", meta, "");
    expect(headOf(html)).toContain('content="https://www.maineclean.co/opengraph.jpg"');
  });

  it("marks an article as one and dates it", () => {
    const { html } = applyHead(
      SHELL,
      "/blog/x",
      { ...meta, ogType: "article", publishedTime: "2026-03-15" },
      "",
    );
    const head = headOf(html);
    expect(head).toContain('<meta property="og:type" content="article" />');
    expect(head).toContain('<meta property="article:published_time" content="2026-03-15" />');
  });

  it("omits article:published_time on a page that is not an article", () => {
    const { html } = applyHead(SHELL, "/services", meta, "");
    expect(headOf(html)).not.toContain("article:published_time");
  });

  it("puts the rendered body where the client will mount", () => {
    const { html } = applyHead(SHELL, "/services", meta, "<h1>Services</h1>");
    expect(html).toContain('<div id="root"><h1>Services</h1></div>');
  });

  it("emits page schema tagged so the client can replace it", () => {
    const { html } = applyHead(
      SHELL,
      "/services",
      { ...meta, jsonLd: { "@type": "Service" } },
      "",
    );
    expect(html).toContain('<script type="application/ld+json" data-seo-page>');
  });

  /**
   * A description or FAQ answer containing "</script>" would otherwise close
   * the block early and put page data into the document as markup.
   */
  it("escapes < so page data cannot break out of the schema block", () => {
    const { html } = applyHead(
      SHELL,
      "/services",
      { ...meta, jsonLd: { note: "</script><img src=x>" } },
      "",
    );
    expect(html).not.toContain("</script><img");
    expect(html).toContain("\\u003c/script");
  });

  it("escapes quotes in a description rather than breaking the attribute", () => {
    const { html } = applyHead(
      SHELL,
      "/services",
      { ...meta, description: 'He said "clean" & left' },
      "",
    );
    expect(headOf(html)).toContain('content="He said &quot;clean&quot; &amp; left"');
  });

  /**
   * The whole point of throwing: a replacement that matched nothing would
   * leave the homepage's value in place and the build would still succeed.
   */
  it.each([
    ["<title>", /<title>[^<]*<\/title>/],
    ["meta description", /<meta name="description"[^>]*>/],
    ["canonical link", /<link rel="canonical"[^>]*>/],
    ['<div id="root">', /<div id="root"><\/div>/],
  ])("throws when the shell has lost its %s", (_label, pattern) => {
    const broken = SHELL.replace(pattern, "");
    expect(() => applyHead(broken, "/services", meta, "")).toThrow(/prerender/);
  });

  it("renders every real route's head without throwing", () => {
    for (const routePath of PRERENDER_PATHS) {
      const { html, canonical } = applyHead(SHELL, routePath, PRERENDER_ROUTES[routePath], "");
      expect(canonical, routePath).toBe(
        `https://www.maineclean.co${routePath === "/" ? "/" : routePath}`,
      );
      expect(headOf(html)).toContain(`href="${canonical}"`);
    }
  });

  it("gives every route a distinct canonical", () => {
    const canonicals = PRERENDER_PATHS.map(
      (p) => applyHead(SHELL, p, PRERENDER_ROUTES[p], "").canonical,
    );
    expect(new Set(canonicals).size).toBe(canonicals.length);
  });
});

describe("prerendered file naming", () => {
  /**
   * The build names these files and the server resolves the name back from
   * the request path. If the two disagree the page silently falls through to
   * the empty SPA shell — served with HTTP 200, so nothing anywhere errors.
   */
  it("round-trips every route between build and request time", () => {
    for (const routePath of PRERENDER_PATHS) {
      expect(prerenderedFileFor(routePath), routePath).toBe(outputFileFor(routePath));
    }
  });

  it("maps the homepage to index.html", () => {
    expect(outputFileFor("/")).toBe("index.html");
    expect(prerenderedFileFor("/")).toBe("index.html");
  });

  it("nests a two-segment path", () => {
    expect(outputFileFor("/services/residential")).toBe("services/residential.html");
  });

  it("resolves a trailing slash to the same file", () => {
    expect(prerenderedFileFor("/about/")).toBe("about.html");
  });

  /** A path that is not a page of ours has no file, pre-rendered or otherwise. */
  it.each(["/zzz-garbage", "/wp-login.php", "/assets/index-abc.js"])(
    "refuses %s",
    (p) => {
      expect(prerenderedFileFor(p)).toBeNull();
    },
  );

  /**
   * Belt and braces on the filename: the directory is outside the static
   * root, and a crafted path must not be able to read its way back in.
   */
  it.each([
    "/../package.json",
    "/services/../../package.json",
    "/..%2fpackage.json",
    "/services/resi.dential",
  ])("refuses the traversal attempt %s", (p) => {
    expect(prerenderedFileFor(p)).toBeNull();
  });

  /** Pages behind a sign-in, and the booking capability URL, are never files. */
  it.each(["/portal", "/portal/login", "/booking/manage/sometoken"])(
    "has no pre-rendered file for %s",
    (p) => {
      const file = prerenderedFileFor(p);
      // Either refused outright, or named a file the build never writes.
      if (file !== null) expect(PRERENDER_PATHS).not.toContain(p);
    },
  );
});

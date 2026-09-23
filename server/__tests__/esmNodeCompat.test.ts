import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * `import.meta.dirname` and `import.meta.filename` do not exist before Node
 * 20.11. They read as `undefined`, and the usual next step —
 * path.resolve(undefined, "..") — throws ERR_INVALID_ARG_TYPE.
 *
 * Most of the repo can use them safely: vite.config.ts and server/vite.ts do,
 * but esbuild bundles both and rewrites the expression to __dirname, so the
 * Node version never matters. The exception is a file tsx runs DIRECTLY, as
 * real ESM, with nothing rewriting anything:
 *
 *   "dev":   tsx server/index.ts
 *   "build": tsx script/build.ts   (which imports script/prerender.ts)
 *
 * This bit for real. script/prerender.ts used import.meta.dirname, CI (Node
 * 20) built it fine, and Railway's Node 18.20.5 builder threw on the very
 * first line of the module — so the deploy failed while every check was
 * green and production silently kept serving the previous build.
 *
 * Pinning Node would also fix it, but a version pin is a promise about the
 * whole runtime; this is a promise about the two entry points that actually
 * need it, and it holds no matter what Node the builder picks.
 */

const REPO = path.resolve(__dirname, "..", "..");

/**
 * Entry points tsx executes as real ESM. Only these files are checked, not
 * everything they import: server/vite.ts uses import.meta.dirname and is
 * reached from server/index.ts in dev, but the production server runs the
 * esbuild bundle, so it is not what broke the deploy and not what this
 * guards.
 */
const DIRECTLY_EXECUTED = ["script/build.ts", "script/prerender.ts", "server/index.ts"];

describe("Node-version compatibility of directly executed ESM", () => {
  it.each(DIRECTLY_EXECUTED)("%s exists", (rel) => {
    expect(fs.existsSync(path.join(REPO, rel))).toBe(true);
  });

  it.each(DIRECTLY_EXECUTED)("%s does not use import.meta.dirname/filename", (rel) => {
    // Comments are stripped first: prerender.ts explains in prose why it
    // avoids import.meta.dirname, and matching that would fail the file for
    // documenting the fix.
    const src = fs
      .readFileSync(path.join(REPO, rel), "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    const hits = [...src.matchAll(/import\.meta\.(dirname|filename)/g)].map((m) => m[0]);

    // Use fileURLToPath(import.meta.url) instead — it works on every Node
    // version that can run this project at all.
    expect(hits).toEqual([]);
  });
});

/**
 * The Node version the builder picks is not a detail — it is the difference
 * between a deploy and an outage that nothing reports.
 *
 * Railway's nixpacks builder looks for {.nvmrc, .node-version, nixpacks.toml,
 * railway.json}. With none of them present it chose Node 18.20.5, while CI
 * pinned "20" in its workflow. PR #70 built green on CI and then failed on
 * Railway twice over: first ERR_INVALID_ARG_TYPE from import.meta.dirname
 * (absent before 20.11), and behind that `crypto.hash is not a function`,
 * which Vite 7 calls and which only exists from 20.12. Production kept
 * serving the previous build and nothing anywhere said so.
 *
 * .nvmrc is now the single source of truth: Railway reads it, and ci.yml
 * reads it via node-version-file. The floor below is Vite 7's own
 * requirement (^20.19.0 || >=22.12.0) — dropping under it breaks the build
 * on the builder, not here.
 */
describe("Node version pin", () => {
  const NVMRC = path.join(REPO, ".nvmrc");

  it("exists, so the builder does not fall back to its own default", () => {
    expect(fs.existsSync(NVMRC)).toBe(true);
  });

  it("is at or above Vite 7's floor", () => {
    const raw = fs.readFileSync(NVMRC, "utf-8").trim();
    const m = raw.match(/^v?(\d+)\.(\d+)\.(\d+)$/);

    // A bare major ("20") would satisfy Railway but leaves which minor you
    // get up to the builder — and 20.0–20.11 cannot build this project.
    expect(m, `.nvmrc should be an exact version, got ${JSON.stringify(raw)}`).not.toBeNull();

    const [major, minor] = [Number(m![1]), Number(m![2])];
    const ok = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22;
    expect(ok, `Node ${raw} is below Vite 7's requirement of ^20.19.0 || >=22.12.0`).toBe(true);
  });

  it("is the version CI actually uses", () => {
    const ci = fs.readFileSync(path.join(REPO, ".github", "workflows", "ci.yml"), "utf-8");

    // If CI ever hardcodes a version again, prod and CI can silently diverge
    // and a red production build passes every check.
    expect(ci).toMatch(/node-version-file:\s*"?\.nvmrc"?/);
    expect(ci).not.toMatch(/^\s*node-version:\s/m);
  });
});

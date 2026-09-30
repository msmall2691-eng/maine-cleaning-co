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
 * That fix was incomplete, and /api/health caught it on its first deploy:
 * production reported v20.18.1 while .nvmrc said 20.19.5. nixpacks reads only
 * the MAJOR version — given "20.19.5" it installed nixpkgs' nodejs_20, which
 * was 20.18.1 — while CI's actions/setup-node honoured the full string. The
 * gap narrowed from 18-vs-20 to 20.18.1-vs-20.19.5 and stayed open, below
 * Vite 7's declared floor the whole time.
 *
 * So the exact version now comes from the Dockerfile's base image, which is
 * the only way to name a patch version the builder cannot round off, and the
 * checks below keep .nvmrc (what CI installs) and the Dockerfile (what
 * production runs) identical.
 */
describe("Node version pin", () => {
  const NVMRC = path.join(REPO, ".nvmrc");

  it("exists, so the builder does not fall back to its own default", () => {
    expect(fs.existsSync(NVMRC)).toBe(true);
  });

  it("is at or above Vite 7's floor", () => {
    const raw = fs.readFileSync(NVMRC, "utf-8").trim();
    const m = raw.match(/^v?(\d+)\.(\d+)\.(\d+)$/);

    // A bare major ("20") would leave the patch version up to whoever
    // installs it — and 20.0–20.11 cannot build this project at all.
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

/**
 * The Dockerfile is what production actually runs, so it is where the exact
 * version has to live.
 *
 * .nvmrc still exists and still matters — it is what CI's setup-node reads —
 * but it governs CI alone now. Two files naming a Node version is exactly the
 * arrangement that drifted last time, so these pair them: change one without
 * the other and this goes red rather than shipping a production runtime that
 * silently differs from the one every test ran against.
 *
 * The builder assertion matters just as much. Point railway.json back at
 * NIXPACKS and the Dockerfile becomes a file nothing reads, the pin quietly
 * stops applying, and nothing else in the repo would notice.
 */
describe("production Node matches CI's Node", () => {
  const dockerfile = fs.readFileSync(path.join(REPO, "Dockerfile"), "utf-8");
  const nvmrc = fs.readFileSync(path.join(REPO, ".nvmrc"), "utf-8").trim().replace(/^v/, "");

  it("pins an exact patch version in the base image", () => {
    const from = dockerfile.match(/^FROM\s+node:(\S+)/m);
    expect(from, "Dockerfile should build FROM an official node image").not.toBeNull();

    // node:20-slim or node:20.19-slim would re-open the hole: the tag floats,
    // and which patch you get depends on when the image was pulled.
    expect(
      from![1],
      `base image tag ${JSON.stringify(from![1])} must name a full x.y.z version`,
    ).toMatch(/^\d+\.\d+\.\d+(-\S+)?$/);
  });

  it("uses the same version .nvmrc gives CI", () => {
    const version = dockerfile.match(/^FROM\s+node:(\d+\.\d+\.\d+)/m)![1];
    expect(
      version,
      `Dockerfile runs Node ${version} but .nvmrc gives CI ${nvmrc} — ` +
        `every test would run on a different runtime than production`,
    ).toBe(nvmrc);
  });

  it("is built by the Dockerfile, not a builder that rounds the version off", () => {
    const railway = JSON.parse(fs.readFileSync(path.join(REPO, "railway.json"), "utf-8"));
    expect(railway.build?.builder).toBe("DOCKERFILE");
  });

  it("passes the commit through as a build ARG", () => {
    // Docker builds do not inherit the environment the way nixpacks did:
    // Railway injects build variables only into ARGs the Dockerfile declares.
    // Without this, script/build.ts finds no commit, falls back to git
    // (there is no .git in the image), and /api/health reports "unknown" on
    // every deploy — losing the signal that caught this whole problem.
    expect(dockerfile).toMatch(/^ARG\s+RAILWAY_GIT_COMMIT_SHA\s*$/m);
    expect(dockerfile).toMatch(/^ENV\s+RAILWAY_GIT_COMMIT_SHA=\$RAILWAY_GIT_COMMIT_SHA\s*$/m);
  });

  it("keeps tsx installed, because the deploy's migration step runs on it", () => {
    // railway.json's preDeployCommand is `npm run db:migrate`, which is
    // `tsx script/migrate.ts`, and tsx is a devDependency. An --omit=dev or
    // NODE_ENV=production ahead of the install would leave the schema step
    // unable to start.
    expect(dockerfile).toMatch(/^RUN\s+npm\s+ci\s*$/m);
    expect(dockerfile).not.toMatch(/npm\s+ci[^\n]*--(omit=dev|production)/);
    expect(dockerfile).not.toMatch(/^ENV\s+NODE_ENV=production/m);
  });
});

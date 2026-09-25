import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { BUILD_INFO } from "../lib/buildInfo";
import { resolveBuildInfo } from "../../script/build";

/**
 * /api/health reports the commit the running bundle was built from, so that
 * "is my change live" is one curl rather than a guess.
 *
 * It exists because guessing went badly twice. PR #70 built green on CI and
 * failed on Railway while production kept serving the old build. PR #72
 * touched no client code at all, so not even the hashed asset names moved —
 * confirming it had landed meant POSTing a real booking to production. In
 * both cases "not deployed yet" and "deploy failed" were indistinguishable
 * from outside.
 *
 * The way this marker would rot is quiet. esbuild's `define` substitutes a
 * written expression: it replaces `process.env.BUILD_COMMIT` where that exact
 * text appears. Rename either side — the key in script/build.ts or the read in
 * server/lib/buildInfo.ts — and nothing errors. The build still succeeds, the
 * endpoint still answers, and every deploy from then on reports "dev". That is
 * the same shape of failure the marker was added to detect, so it gets a guard
 * of its own.
 */

const REPO = path.resolve(__dirname, "..", "..");
const BUILD_TS = fs.readFileSync(path.join(REPO, "script", "build.ts"), "utf-8");
const BUILD_INFO_TS = fs.readFileSync(path.join(REPO, "server", "lib", "buildInfo.ts"), "utf-8");

describe("build marker", () => {
  it.each(["BUILD_COMMIT", "BUILD_TIME"])(
    "%s is defined by the build and read back in the same written form",
    (name) => {
      const expr = `process.env.${name}`;

      // The define key, as esbuild matches it: "process.env.BUILD_COMMIT".
      expect(BUILD_TS).toContain(`"${expr}"`);
      // And the read, which must be that same expression verbatim — not
      // destructured, aliased, or wrapped.
      expect(BUILD_INFO_TS).toContain(expr);
    },
  );

  it("falls back to dev rather than crashing when nothing was injected", () => {
    // This is the state under tsx in development, where no define ran.
    expect(BUILD_INFO.commit).toBe("dev");
    expect(BUILD_INFO.builtAt).toBe("dev");
  });

  it("always reports the Node the server is actually running on", () => {
    // Not injected — read at runtime. A wrong Node is what broke PR #70's
    // deploy, and it was invisible until someone opened the builder log.
    expect(BUILD_INFO.node).toBe(process.version);
    expect(BUILD_INFO.node).toMatch(/^v\d+\.\d+\.\d+/);
  });
});

describe("resolveBuildInfo", () => {
  it("prefers the platform's commit over shelling out to git", () => {
    // nixpacks does not necessarily copy .git into the builder, so Railway's
    // own variable is the reliable source there.
    const info = resolveBuildInfo({ RAILWAY_GIT_COMMIT_SHA: "abcdef1234567890" } as NodeJS.ProcessEnv);
    expect(info.commit).toBe("abcdef1");
  });

  it("falls back to git when the platform sets nothing", () => {
    const info = resolveBuildInfo({} as NodeJS.ProcessEnv);
    // Running inside a checkout, so this resolves; the point is that it does
    // not throw and never comes back empty.
    expect(info.commit).toMatch(/^[0-9a-f]{7}$|^unknown$/);
  });

  it("returns a parseable ISO build time", () => {
    const { builtAt } = resolveBuildInfo({} as NodeJS.ProcessEnv);
    expect(Number.isNaN(Date.parse(builtAt))).toBe(false);
  });
});

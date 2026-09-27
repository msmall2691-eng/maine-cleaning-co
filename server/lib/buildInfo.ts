/**
 * What is actually running, reported by /api/health.
 *
 * Added because twice this week a deploy's outcome was invisible from
 * outside. PR #70 built green on CI and failed on Railway, and production
 * went on serving the previous build with nothing to distinguish "not
 * deployed yet" from "deploy failed" — both look like the old bytes. The
 * booking fix in PR #72 changed no client code at all, so not even the
 * hashed asset filenames moved; confirming it had landed meant POSTing a
 * real booking to production and waiting to see whether it worked.
 *
 * One curl should answer "is my change live". That is all this is for.
 *
 * The values are injected at build time by script/build.ts through esbuild's
 * `define`, which substitutes them as literals — there is no git or lookup at
 * runtime. Under tsx in development nothing defines them, so they read
 * undefined and fall back to "dev".
 */

/**
 * Deliberately read as full `process.env.X` expressions: esbuild's `define`
 * matches the written form, so destructuring or aliasing these would silently
 * stop the substitution and leave every build reporting "dev".
 * server/__tests__/buildInfo.test.ts guards the pairing.
 */
const COMMIT = process.env.BUILD_COMMIT;
const BUILT_AT = process.env.BUILD_TIME;

export interface BuildInfo {
  /** Short git SHA of the commit this bundle was built from, or "dev". */
  commit: string;
  /** ISO timestamp of the build, or "dev". */
  builtAt: string;
  /** The Node the server is running on now — the thing that broke PR #70. */
  node: string;
}

export const BUILD_INFO: BuildInfo = {
  commit: COMMIT || "dev",
  builtAt: BUILT_AT || "dev",
  node: process.version,
};

import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { prerender } from "./prerender";

const thisFile = fileURLToPath(import.meta.url);

/**
 * The commit this bundle is built from, for /api/health.
 *
 * Railway sets RAILWAY_GIT_COMMIT_SHA and nixpacks does not necessarily copy
 * .git into the builder, so the environment variable is tried first and git
 * is the local-development fallback. Neither is fatal: an unknown commit is
 * worth shipping, a failed build over a missing marker is not.
 */
export function resolveBuildInfo(env: NodeJS.ProcessEnv = process.env): { commit: string; builtAt: string } {
  const fromEnv = env.RAILWAY_GIT_COMMIT_SHA || env.GITHUB_SHA || env.SOURCE_COMMIT;
  let commit = fromEnv ? fromEnv.slice(0, 7) : "";

  if (!commit) {
    try {
      commit = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      commit = "unknown";
    }
  }

  return { commit, builtAt: new Date().toISOString() };
}

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "nodemailer",
  "express-session",
  "jsonwebtoken",
  "multer",
  "nanoid",
  "openai",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  // Policy pages as real HTML — see script/prerender.ts for why.
  console.log("prerendering policy pages...");
  await prerender();

  const buildInfo = resolveBuildInfo();
  console.log(`building server... (commit ${buildInfo.commit})`);
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      // Read back by server/lib/buildInfo.ts and served from /api/health, so
      // "is my change live" is one curl instead of a guess.
      "process.env.BUILD_COMMIT": JSON.stringify(buildInfo.commit),
      "process.env.BUILD_TIME": JSON.stringify(buildInfo.builtAt),
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

// Only build when run as a command. This module also exports
// resolveBuildInfo, and an unguarded call here meant importing it — from a
// test, say — silently deleted dist/ and started a build as a side effect.
// (fileURLToPath rather than import.meta.filename: this file runs as real ESM
// under tsx, where that property does not exist before Node 20.11. See
// server/__tests__/esmNodeCompat.test.ts.)
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  buildAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

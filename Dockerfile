# The exact Node this app is built and run with.
#
# This has to be a Dockerfile rather than a .nvmrc, because nixpacks reads only
# the MAJOR version. Given `.nvmrc` holding "20.19.5" it installed nixpkgs'
# nodejs_20 — which was 20.18.1 — while CI's actions/setup-node honoured the
# full string and installed 20.19.5. PR #71 added that .nvmrc specifically to
# stop CI and production drifting apart, and it narrowed the gap from 18-vs-20
# to 20.18.1-vs-20.19.5 without closing it. /api/health reported the mismatch
# on its first deploy.
#
# 20.19.5 is not arbitrary: Vite 7 declares `engines.node: ^20.19.0 || >=22.12.0`,
# so 20.18.1 was below its floor. It built anyway — npm treats `engines` as
# advisory — which is the uncomfortable part. Nothing was failing; we were
# relying on a version the toolchain says it does not support, and would only
# have found out when some Vite release started using an API 20.18 lacks.
#
# Keep this version and .nvmrc identical. server/__tests__/esmNodeCompat.test.ts
# fails if they drift.
FROM node:20.19.5-slim

WORKDIR /app

# Railway injects build variables ONLY into ARGs the Dockerfile declares —
# unlike nixpacks, which passed the whole environment through. Without this
# line the build sees no RAILWAY_GIT_COMMIT_SHA, script/build.ts falls through
# to `git rev-parse` (there is no .git in the image, by .dockerignore), and
# /api/health would report commit "unknown" on every deploy — silently losing
# the signal PR #73 added one commit ago.
ARG RAILWAY_GIT_COMMIT_SHA
ENV RAILWAY_GIT_COMMIT_SHA=$RAILWAY_GIT_COMMIT_SHA

# Dependencies first, so a source-only change reuses this layer.
COPY package.json package-lock.json ./

# devDependencies are deliberately kept in the final image. They are not just
# build-time here: the deploy's preDeployCommand is `npm run db:migrate`, which
# runs `tsx script/migrate.ts`, and tsx is a devDependency. Pruning them would
# leave the schema step unable to start — the deploy failing outright, or worse,
# not running at all. (Bundling the migration runner the way the server is
# bundled would allow a smaller runtime image; that is a separate change from
# pinning the Node version, and not one to make in the same breath.)
RUN npm ci

COPY . .

# Produces dist/ — the Vite client build, the prerendered policy pages, and the
# esbuild server bundle carrying the /api/health build marker.
RUN npm run build

EXPOSE 5000

# NODE_ENV is set by the start script itself (see package.json), not here, so
# that `npm ci` above installs devDependencies rather than silently skipping
# them.
CMD ["npm", "run", "start"]

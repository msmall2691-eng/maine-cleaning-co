/**
 * Apply the SQL files in migrations/ to DATABASE_URL, in order, exactly once.
 *
 * This replaces `drizzle-kit push` as the deploy-time schema step. push
 * compares the schema file against the live database and asks the operator
 * what to do about anything it considers risky. In a Railway pre-deploy
 * container there is nobody to ask: stdin is closed, so push printed its
 * question, read EOF, and **exited 0 having applied nothing**.
 *
 * That is the part that hurt. A migration step that fails loudly costs one
 * red deploy. One that succeeds without doing anything leaves the schema
 * frozen while every check stays green — booking_requests.bathrooms sat as
 * integer for days after the schema declared it real, and every booking with
 * a half-bath returned 500 with nothing anywhere reporting a problem.
 *
 * So the rules here are the opposite of push's:
 *
 *   - Never prompt. There is no interactive path, so there is nothing to hang
 *     on and nothing to auto-approve. (push's non-interactive escape hatch is
 *     --force, which its own help describes as "may truncate your tables and
 *     data" — on the very prompt that was blocking us, about the users table.)
 *   - Never guess. The SQL is written by hand, reviewed in the diff, and runs
 *     verbatim. No diffing against production at deploy time.
 *   - Exit non-zero on anything unexpected, including doing less work than
 *     expected.
 *
 * Usage:  npm run db:migrate        (preDeployCommand in railway.json)
 *         npx tsx script/migrate.ts --dry-run
 */
import { readdir, readFile } from "fs/promises";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";

const thisFile = fileURLToPath(import.meta.url);
const MIGRATIONS_DIR = path.resolve(path.dirname(thisFile), "..", "migrations");

/**
 * One 64-bit key for pg_advisory_lock. Two deploys overlapping would otherwise
 * both see a migration as unapplied and both try to run it; the second would
 * fail on an already-converted column and take a healthy deploy down with it.
 */
const LOCK_KEY = 8_531_207_442_119_004n;

export interface Migration {
  version: string;
  sql: string;
  checksum: string;
}

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf-8").digest("hex").slice(0, 16);
}

/**
 * Migration files in lexical order, which is why they are numbered. A file
 * that does not match the NNNN_name.sql shape is an error rather than a skip:
 * a stray .sql in this directory is far more likely to be a migration someone
 * misnamed than something meant to be ignored.
 */
export async function loadMigrations(dir: string = MIGRATIONS_DIR): Promise<Migration[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }

  const sqlFiles = entries.filter((f) => f.endsWith(".sql")).sort();
  const bad = sqlFiles.filter((f) => !/^\d{4}_[a-z0-9_]+\.sql$/.test(f));
  if (bad.length) {
    throw new Error(
      `migrations: badly named file(s): ${bad.join(", ")}. Expected NNNN_snake_case.sql, e.g. 0002_add_thing.sql`,
    );
  }

  const versions = sqlFiles.map((f) => f.slice(0, 4));
  const dupes = versions.filter((v, i) => versions.indexOf(v) !== i);
  if (dupes.length) {
    // Two branches both adding 0002 is the classic way to get a migration
    // that runs in one environment and not another.
    throw new Error(`migrations: duplicate version prefix(es): ${[...new Set(dupes)].join(", ")}`);
  }

  return Promise.all(
    sqlFiles.map(async (file) => {
      const sql = await readFile(path.join(dir, file), "utf-8");
      return { version: file.replace(/\.sql$/, ""), sql, checksum: sha256(sql) };
    }),
  );
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    text PRIMARY KEY,
    checksum   text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

export async function migrate(client: pg.ClientBase, opts: { dryRun?: boolean; log?: (s: string) => void } = {}) {
  const log = opts.log ?? console.log;
  const migrations = await loadMigrations();

  await client.query(CREATE_TABLE);
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY.toString()]);

  try {
    const { rows } = await client.query<{ version: string; checksum: string }>(
      "SELECT version, checksum FROM schema_migrations",
    );
    const applied = new Map(rows.map((r) => [r.version, r.checksum]));

    // An already-applied file whose contents changed means the database and
    // the repo disagree about what actually ran. Editing an applied migration
    // instead of adding a new one is the mistake; say so rather than silently
    // treating the new text as done.
    for (const m of migrations) {
      const prior = applied.get(m.version);
      if (prior && prior !== m.checksum) {
        throw new Error(
          `migrations: ${m.version} was already applied with checksum ${prior}, but the file on disk is now ${m.checksum}. ` +
            `Applied migrations are immutable — add a new migration instead of editing this one.`,
        );
      }
    }

    const pending = migrations.filter((m) => !applied.has(m.version));
    if (!pending.length) {
      log(`migrate: ${migrations.length} migration(s), all already applied — nothing to do`);
      return { applied: [] as string[], total: migrations.length };
    }

    if (opts.dryRun) {
      log(`migrate: DRY RUN — would apply ${pending.length}: ${pending.map((m) => m.version).join(", ")}`);
      return { applied: [] as string[], total: migrations.length };
    }

    const done: string[] = [];
    for (const m of pending) {
      log(`migrate: applying ${m.version}`);
      // Each migration is its own transaction: a failure rolls back that
      // migration whole, and the ones before it stay applied and recorded.
      await client.query("BEGIN");
      try {
        await client.query(m.sql);
        await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [
          m.version,
          m.checksum,
        ]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`migrations: ${m.version} failed and was rolled back: ${(err as Error).message}`);
      }
      done.push(m.version);
    }

    log(`migrate: applied ${done.length} migration(s): ${done.join(", ")}`);
    return { applied: done, total: migrations.length };
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY.toString()]);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.DATABASE_URL) {
    // Exit non-zero. A deploy that cannot reach the database has not migrated
    // it, and saying otherwise is the failure mode this script exists to end.
    console.error("migrate: DATABASE_URL is not set — refusing to report success without migrating");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await migrate(client, { dryRun });
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((err) => {
    console.error(`migrate: FAILED — ${err.message}`);
    process.exit(1);
  });
}

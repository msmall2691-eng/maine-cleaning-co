import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { loadMigrations } from "../../script/migrate";

/**
 * Guards for the deploy-time schema step.
 *
 * These do not touch a database — CI has no Postgres, and the DB behaviour was
 * verified against a real 16.13 instance loaded with production's actual
 * lagging state (booking_requests.bathrooms as integer, five users, no
 * users_username_unique). What is guarded here is everything that can rot in
 * the repo without anyone noticing: the file naming the runner depends on, and
 * the wiring that decides what Railway actually executes.
 *
 * The wiring matters because of how this broke. `drizzle-kit push` in a
 * pre-deploy container printed an interactive prompt, read EOF, and exited 0
 * without applying anything. The deploy passed. The schema never moved. Every
 * booking with a half-bath 500'd for days with nothing reporting a problem.
 * A silent revert to that command would look exactly as healthy.
 */

const REPO = path.resolve(__dirname, "..", "..");

describe("migration files", () => {
  it("are all well-formed and uniquely versioned", async () => {
    // loadMigrations throws on a bad name or a duplicate NNNN prefix, which is
    // what a two-branch collision looks like.
    const migrations = await loadMigrations();
    expect(migrations.length).toBeGreaterThan(0);

    const versions = migrations.map((m) => m.version);
    expect(new Set(versions).size).toBe(versions.length);
    expect([...versions]).toEqual([...versions].sort()); // applied in file order
  });

  it("rejects a badly named file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-"));
    fs.writeFileSync(path.join(dir, "add_thing.sql"), "SELECT 1;");
    await expect(loadMigrations(dir)).rejects.toThrow(/badly named/i);
  });

  it("rejects two migrations claiming the same version", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-"));
    fs.writeFileSync(path.join(dir, "0002_from_branch_a.sql"), "SELECT 1;");
    fs.writeFileSync(path.join(dir, "0002_from_branch_b.sql"), "SELECT 2;");
    await expect(loadMigrations(dir)).rejects.toThrow(/duplicate version/i);
  });

  it("checksums contents, so an edit to an applied migration is detectable", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-"));
    const file = path.join(dir, "0001_thing.sql");

    fs.writeFileSync(file, "SELECT 1;");
    const before = (await loadMigrations(dir))[0].checksum;
    fs.writeFileSync(file, "SELECT 1; -- tweak");
    const after = (await loadMigrations(dir))[0].checksum;

    expect(after).not.toBe(before);
  });

  it("treats a missing migrations directory as empty rather than an error", async () => {
    const dir = path.join(os.tmpdir(), "mig-does-not-exist-" + Date.now());
    await expect(loadMigrations(dir)).resolves.toEqual([]);
  });
});

describe("deploy wiring", () => {
  const railway = JSON.parse(fs.readFileSync(path.join(REPO, "railway.json"), "utf-8"));
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, "package.json"), "utf-8"));
  const preDeploy: string[] = [railway.deploy?.preDeployCommand ?? []].flat();

  it("runs the migration runner before each deploy", () => {
    expect(preDeploy.join(" ")).toMatch(/db:migrate/);
    expect(pkg.scripts["db:migrate"]).toBeTruthy();
  });

  it("does not run drizzle-kit push at deploy time", () => {
    // push is kept as `npm run db:push` for local iteration against a scratch
    // database, where a human can answer its questions. On a deploy there is
    // nobody to answer, and its silence is indistinguishable from success.
    expect(preDeploy.join(" ")).not.toMatch(/drizzle-kit|db:push/);
  });
});

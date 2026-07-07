import { describe, it, expect, beforeEach, vi } from "vitest";

// Regression test for the portal contract-signing IDOR (see commit e19c4a9).
// Before the fix: `signContract(id, signedName)` flipped any contract's status
// to "signed" as long as `id` matched. A logged-in client could sign someone
// else's contract by guessing the serial id.
//
// After the fix: `signContract(id, signedName, clientId)` scopes the UPDATE to
// `contracts.id = :id AND contracts.client_id = :clientId`, so a mismatched
// clientId returns no row and the endpoint 404s.
//
// This test drives the storage-layer contract directly (bypasses HTTP so the
// suite doesn't need a running Express app + PG). It stubs the Drizzle db
// object with an in-memory contracts table and asserts the WHERE clause used.

const contracts = [
  { id: 1, clientId: "alice", signedName: null, signedAt: null, status: "pending" },
  { id: 2, clientId: "bob",   signedName: null, signedAt: null, status: "pending" },
];

const dbUpdate = vi.fn();

vi.mock("../db", () => ({
  db: {
    update: () => dbUpdate(),
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

// Mock drizzle-orm helpers so `eq(...)`/`and(...)` produce inspectable objects.
vi.mock("drizzle-orm", () => {
  const eq = (col: any, val: any) => ({ __op: "eq", col, val });
  const and = (...clauses: any[]) => ({ __op: "and", clauses });
  const desc = (col: any) => ({ __op: "desc", col });
  const sql = (...args: any[]) => ({ __op: "sql", args });
  return { eq, and, desc, sql };
});

import { storage } from "../storage";

// The mock returns a fluent chain; the storage layer calls .set().where().returning().
function setupUpdateChain(handler: (whereClause: any) => any[]) {
  dbUpdate.mockReturnValue({
    set: () => ({
      where: (whereClause: any) => ({
        returning: async () => handler(whereClause),
      }),
    }),
  });
}

beforeEach(() => {
  dbUpdate.mockReset();
});

describe("storage.signContract IDOR guard", () => {
  it("scopes the UPDATE to (id AND clientId) when a clientId is passed", async () => {
    let capturedWhere: any = null;
    setupUpdateChain((where) => {
      capturedWhere = where;
      return [{ ...contracts[0], status: "signed", signedName: "Alice" }];
    });

    const out = await storage.signContract(1, "Alice", "alice");

    expect(out?.status).toBe("signed");
    expect(capturedWhere?.__op).toBe("and");             // AND clause, not lone eq(id)
    // Both column filters present: id and clientId.
    const ops = (capturedWhere.clauses as any[]).map((c) => c.__op);
    expect(ops.filter((o) => o === "eq")).toHaveLength(2);
  });

  it("uses a lone eq(id) when clientId is omitted (backwards-compat for internal callers)", async () => {
    let capturedWhere: any = null;
    setupUpdateChain((where) => {
      capturedWhere = where;
      return [{ ...contracts[0], status: "signed" }];
    });

    await storage.signContract(1, "Alice");
    expect(capturedWhere?.__op).toBe("eq");              // no AND — just eq(id)
  });

  it("returns undefined when the (id, clientId) pair doesn't match anything", async () => {
    // Bob trying to sign Alice's contract.
    setupUpdateChain(() => []);                          // no rows updated
    const out = await storage.signContract(1, "Bob-attempt", "bob");
    expect(out).toBeUndefined();
  });
});

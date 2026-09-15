import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  RESPONSE_WINDOW,
  RESPONSE_REPLY,
  RESPONSE_CONFIRM,
  RESPONSE_URGENT,
  AVAILABILITY_NOTE,
} from "../response-time";

/**
 * The site used to promise "within one business day" in ten places. It's a
 * promise a small team working through a busy season can't reliably keep, and
 * a missed one costs more than a softer one would have. This stops it coming
 * back the next time someone wants a punchier line.
 */
const SRC = join(__dirname, "..", "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : walk(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe("response-time promises", () => {
  it("makes no hard same-day or one-business-day commitment anywhere", () => {
    const banned = [
      /within (?:1|one) business day/i,
      /within hours,? not days/i,
      /guaranteed response/i,
    ];
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      // The module that defines the wording is allowed to discuss it, and so
      // is this test. Nothing else may make the promise.
      if (file.endsWith("response-time.ts")) continue;
      const text = readFileSync(file, "utf8");
      for (const re of banned) {
        if (re.test(text)) offenders.push(`${file.slice(SRC.length + 1)} — ${re}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("always pairs the soft window with the faster channel", () => {
    // A vaguer promise is only fair if someone in a hurry is told what to do
    // instead, so the urgent line points at the phone and the places that
    // set expectations carry it.
    expect(RESPONSE_URGENT).toMatch(/call or text/i);

    const note = readFileSync(join(SRC, "components", "ui", "ResponseNote.tsx"), "utf8");
    expect(note).toContain("RESPONSE_URGENT");

    const faq = readFileSync(join(SRC, "pages", "HowItWorks.tsx"), "utf8");
    expect(faq).toMatch(/call or text/i);
  });

  it("states availability without manufacturing scarcity", () => {
    expect(AVAILABILITY_NOTE).toMatch(/taking new clients/i);
    expect(AVAILABILITY_NOTE).not.toMatch(/only|limited|spots? left|waitlist|selective/i);
  });

  it("keeps the shared strings consistent with each other", () => {
    expect(RESPONSE_REPLY).toContain(RESPONSE_WINDOW);
    expect(RESPONSE_CONFIRM).toContain(RESPONSE_WINDOW);
  });
});

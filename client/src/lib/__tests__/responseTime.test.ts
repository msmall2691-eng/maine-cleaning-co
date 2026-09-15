import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  RESPONSE_WINDOW,
  RESPONSE_REPLY,
  RESPONSE_CONFIRM,
  RESPONSE_URGENT,
  SELECTIVITY_NOTE,
  AVAILABILITY_NOTE,
} from "../response-time";

/**
 * Two over-claims have already had to be walked back here: "within one
 * business day" in ten places, then "we answer every message ourselves" when
 * in fact we don't take every job. Both are the same mistake — promising
 * something generous that a small team in peak season can't hold to. These
 * tests exist so the third one gets caught before it ships.
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

/** Every source file except the module that defines the wording. */
function sourceFiles() {
  return walk(SRC).filter((f) => !f.endsWith("response-time.ts"));
}

describe("response-time promises", () => {
  it("makes no hard same-day or one-business-day commitment", () => {
    const banned = [
      /within (?:1|one) business day/i,
      /within hours,? not days/i,
      /guaranteed response/i,
    ];
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, "utf8");
      for (const re of banned) {
        if (re.test(text)) offenders.push(`${file.slice(SRC.length + 1)} — ${re}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never claims we reply to, or quote, everyone", () => {
    // We answer everyone, but we don't QUOTE everyone — the answer may be
    // "not right now". Copy that blurs the two is the over-claim this whole
    // module exists to prevent.
    const banned = [
      /(?:read|answer|repl(?:y|ies)\s+to)\s+every\s+(?:message|one|enquiry|inquiry)/i,
      /quote\s+every(?:one|\s+job)/i,
      /we\s+take\s+on\s+every\s+job/i,
    ];
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      const text = readFileSync(file, "utf8");
      for (const re of banned) {
        if (re.test(text)) offenders.push(`${file.slice(SRC.length + 1)} — ${re}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("names both outcomes in the core promise", () => {
    // "within 48 hours" alone would be the old mistake in new clothes: it
    // reads as a promise of a QUOTE. The second half is what makes it
    // keepable, so it is not allowed to be edited away.
    expect(RESPONSE_REPLY).toMatch(/48 hours/);
    expect(RESPONSE_REPLY).toMatch(/quote/i);
    expect(RESPONSE_REPLY).toMatch(/not the right fit|can't|cannot|turn.*down/i);
  });

  it("explains a no by capacity and fit, never by the customer", () => {
    // The difference between honest and snobbish is whether the reason is
    // about our schedule or about them.
    expect(SELECTIVITY_NOTE).toMatch(/schedule fills up|don't take on every job/i);
    expect(SELECTIVITY_NOTE).not.toMatch(/right kind of client|selective about who|we choose our/i);
  });

  it("always pairs the promise with the faster channel", () => {
    expect(RESPONSE_URGENT).toMatch(/call or text/i);

    const note = readFileSync(join(SRC, "components", "ui", "ResponseNote.tsx"), "utf8");
    expect(note).toContain("RESPONSE_URGENT");
    expect(note).toContain("SELECTIVITY_NOTE");

    const faq = readFileSync(join(SRC, "pages", "HowItWorks.tsx"), "utf8");
    expect(faq).toMatch(/call or text/i);
    // The FAQ is where someone goes to find out if they'll be turned down.
    expect(faq).toMatch(/don't take on every job/i);
  });

  it("states availability without manufacturing scarcity", () => {
    expect(AVAILABILITY_NOTE).toMatch(/taking new clients/i);
    expect(AVAILABILITY_NOTE).not.toMatch(/only|limited|spots? left|waitlist|selective/i);
  });

  it("keeps the shared strings consistent with each other", () => {
    expect(RESPONSE_WINDOW).toBe("within 48 hours");
    expect(RESPONSE_REPLY).toContain("48 hours");
    expect(RESPONSE_CONFIRM).toContain(RESPONSE_WINDOW);
  });
});

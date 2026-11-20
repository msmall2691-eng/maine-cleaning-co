import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrast } from "../../../../scripts/check-contrast.mjs";

/**
 * The palette's AA claim, checked against the CSS that actually ships.
 *
 * `scripts/check-contrast.mjs` carries its own copy of the palette so it can
 * be run by hand in one command. That copy is a liability: it can drift from
 * index.css and keep reporting 30/30 while the real site fails. So this test
 * parses the TOKENS OUT OF index.css and re-derives every ratio from those.
 * If someone retunes a colour and forgets the script, this fails.
 */

const css = readFileSync(join(__dirname, "..", "..", "index.css"), "utf8");

/** Pull `--name: H S% L%;` declarations out of one CSS block. */
function tokensIn(blockRe: RegExp): Record<string, string> {
  const block = css.match(blockRe)?.[1];
  if (!block) throw new Error(`block not found: ${blockRe}`);
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%)\s*;/g)) {
    // First declaration wins: `:root` declares each token once, and a later
    // re-declaration inside a nested rule is not what we are measuring.
    if (!(m[1] in out)) out[m[1]] = m[2];
  }
  return out;
}

const light = tokensIn(/:root \{([\s\S]*?)\n  \}/);
const dark = tokensIn(/\.dark \{([\s\S]*?)\n  \}/);

const AA_BODY = 4.5;
const AA_LARGE = 3.0;

describe("the shoreline palette clears WCAG AA", () => {
  it("parsed the tokens out of index.css at all", () => {
    // A regex that silently matched nothing would make every test below
    // vacuously pass, which is the classic way a contrast suite goes green
    // while the site goes dark-on-dark.
    expect(Object.keys(light).length).toBeGreaterThan(12);
    expect(Object.keys(dark).length).toBeGreaterThan(12);
    for (const t of ["background", "foreground", "primary", "seafoam", "sand", "driftwood"]) {
      expect(light[t], `light --${t}`).toBeTruthy();
      expect(dark[t], `dark --${t}`).toBeTruthy();
    }
  });

  const pairs: Array<[string, string, string, number]> = [
    ["body text on page", "foreground", "background", AA_BODY],
    ["body text on card", "foreground", "card", AA_BODY],
    ["muted text on page", "muted-foreground", "background", AA_BODY],
    ["muted text on card", "muted-foreground", "card", AA_BODY],
    ["muted text on tint band", "muted-foreground", "band-tint", AA_BODY],
    ["muted text on sink band", "muted-foreground", "band-sink", AA_BODY],
    ["primary ink on page", "primary", "background", AA_BODY],
    ["seafoam ink on page", "seafoam", "background", AA_BODY],
    ["seafoam ink on card", "seafoam", "card", AA_BODY],
    ["driftwood ink on page", "driftwood", "background", AA_BODY],
  ];

  for (const [theme, tokens] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    describe(theme, () => {
      for (const [label, fg, bg, floor] of pairs) {
        it(`${label} clears ${floor}:1`, () => {
          const ratio = contrast(tokens[fg], tokens[bg]);
          expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(floor);
        });
      }

      it("a filled button's label clears its own fill", () => {
        const ratio = contrast(tokens["primary-foreground"], tokens["primary"]);
        expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_BODY);
      });
    });
  }

  /**
   * The deep band is a FIXED dark panel in both themes — the hero text sits
   * on it, and it does not flip with the theme. So it is checked once, from
   * the light block, and asserted to be identical in the dark block.
   */
  describe("the shoreline band", () => {
    it("carries sand, driftwood and seafoam legibly", () => {
      expect(contrast(light["deep-foreground"], light["deep"])).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrast(light["deep-muted"], light["deep"])).toBeGreaterThanOrEqual(AA_BODY);
      expect(contrast(light["deep-accent"], light["deep"])).toBeGreaterThanOrEqual(AA_BODY);
    });

    it("is the same panel in both themes", () => {
      for (const t of ["deep", "deep-foreground", "deep-muted", "deep-accent"]) {
        expect(dark[t], `--${t} must not flip with the theme`).toBe(light[t]);
      }
    });

    it("keeps the focus ring visible on it", () => {
      // The ring is --seafoam/--deep-accent; 3:1 is the floor for a UI
      // component boundary (SC 1.4.11).
      expect(contrast(light["deep-accent"], light["deep"])).toBeGreaterThanOrEqual(AA_LARGE);
    });
  });
});

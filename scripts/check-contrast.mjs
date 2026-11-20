#!/usr/bin/env node
/**
 * Contrast checker for the shoreline palette.
 *
 * Every colour token in index.css is declared as bare HSL channels, so a
 * claim like "seafoam on navy clears AA" is only ever as good as the last
 * time somebody worked it out by hand. This script works it out from the
 * tokens themselves and fails loudly, so the claim can be re-checked in one
 * command after any retune:
 *
 *     node scripts/check-contrast.mjs
 *
 * WCAG 2.1 contrast: AA needs 4.5:1 for body text, 3:1 for large text
 * (>=24px, or >=18.66px bold) and for UI component boundaries.
 */

/** "212 45% 14%" -> {r,g,b} 0..255 */
function hslToRgb(spec) {
  const m = spec.trim().match(/^(-?[\d.]+)\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/);
  if (!m) throw new Error(`not an HSL triple: "${spec}"`);
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toChannel = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(toChannel(h + 1 / 3) * 255),
    g: Math.round(toChannel(h) * 255),
    b: Math.round(toChannel(h - 1 / 3) * 255),
  };
}

/** Relative luminance, WCAG 2.1 §relativeluminancedef. */
function luminance({ r, g, b }) {
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const la = luminance(hslToRgb(a));
  const lb = luminance(hslToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── The shoreline palette ────────────────────────────────────────────────
// Keep these in step with client/src/index.css. Deliberately duplicated
// rather than parsed out of the CSS: the CSS is the source of truth for the
// browser, this file is the source of truth for the ratios, and a drift
// between them is exactly what the test in __tests__ is there to catch.

const light = {
  background: "40 30% 96%", // sand beige, lifted almost to paper
  card: "40 33% 99%",
  foreground: "212 44% 15%", // deep navy ink
  "muted-foreground": "209 14% 36%", // driftwood grey
  primary: "209 54% 26%", // deep navy — filled buttons, links
  "primary-foreground": "40 33% 99%",
  seafoam: "174 46% 25%", // seafoam, darkened to carry text on sand
  sand: "38 34% 88%",
  driftwood: "209 12% 40%",
  border: "38 20% 86%",
  "band-tint": "40 26% 93%",
  "band-sink": "38 24% 89%",
};

const dark = {
  background: "212 38% 11%", // deep navy page
  card: "212 32% 15%",
  foreground: "40 28% 92%", // sand ink
  "muted-foreground": "205 16% 68%",
  primary: "172 44% 62%", // seafoam — reads as accent ink on navy
  "primary-foreground": "212 45% 10%",
  seafoam: "172 44% 62%",
  sand: "40 28% 92%",
  driftwood: "205 14% 62%",
  border: "212 24% 24%",
  "band-tint": "212 34% 13%",
  "band-sink": "212 30% 17%",
};

// The shoreline band — a fixed dark panel in BOTH themes, the way the
// existing --deep band works. Text over the hero video sits on this too.
const deep = {
  surface: "212 46% 13%",
  foreground: "40 30% 93%",
  muted: "205 18% 76%",
  accent: "172 48% 66%",
  seafoam: "172 48% 66%",
};

const AA_BODY = 4.5;
const AA_LARGE = 3.0;

/** [label, fg, bg, floor] */
function pairsFor(name, t) {
  return [
    [`${name}: body text on page`, t.foreground, t.background, AA_BODY],
    [`${name}: body text on card`, t.foreground, t.card, AA_BODY],
    [`${name}: muted text on page`, t["muted-foreground"], t.background, AA_BODY],
    [`${name}: muted text on card`, t["muted-foreground"], t.card, AA_BODY],
    [`${name}: muted text on tint band`, t["muted-foreground"], t["band-tint"], AA_BODY],
    [`${name}: muted text on sink band`, t["muted-foreground"], t["band-sink"], AA_BODY],
    [`${name}: primary ink on page`, t.primary, t.background, AA_BODY],
    [`${name}: primary ink on card`, t.primary, t.card, AA_BODY],
    [`${name}: filled button label`, t["primary-foreground"], t.primary, AA_BODY],
    [`${name}: seafoam ink on page`, t.seafoam, t.background, AA_BODY],
    [`${name}: seafoam ink on card`, t.seafoam, t.card, AA_BODY],
    [`${name}: driftwood ink on page`, t.driftwood, t.background, AA_BODY],
    [`${name}: border against page`, t.border, t.background, 1.0],
  ];
}

const checks = [
  ...pairsFor("light", light),
  ...pairsFor("dark", dark),
  ["deep: text on shoreline band", deep.foreground, deep.surface, AA_BODY],
  ["deep: muted on shoreline band", deep.muted, deep.surface, AA_BODY],
  ["deep: seafoam accent on band", deep.accent, deep.surface, AA_BODY],
  ["deep: sand on band (large)", deep.foreground, deep.surface, AA_LARGE],
];

let failures = 0;
const rows = checks.map(([label, fg, bg, floor]) => {
  const ratio = contrast(fg, bg);
  const pass = ratio >= floor;
  if (!pass) failures++;
  return { label, ratio, floor, pass };
});

const width = Math.max(...rows.map((r) => r.label.length));
for (const r of rows) {
  const mark = r.pass ? "PASS" : "FAIL";
  console.log(
    `${r.label.padEnd(width)}  ${r.ratio.toFixed(2).padStart(6)}:1  (needs ${r.floor.toFixed(1)})  ${mark}`,
  );
}

console.log(
  `\n${rows.length - failures}/${rows.length} pass. Lowest ratio: ${Math.min(
    ...rows.filter((r) => r.floor > 1).map((r) => r.ratio),
  ).toFixed(2)}:1`,
);

if (failures > 0) {
  console.error(`\n${failures} pair(s) below the WCAG AA floor.`);
  process.exit(1);
}

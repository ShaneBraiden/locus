/**
 * One-shot codemod: migrate the legacy UI onto the Northr design tokens.
 *
 * The old client carried three palettes (violet/slate shell, amber/stone chat,
 * black/gold logo), 49 hardcoded hex values and an ad-hoc type scale spanning
 * text-[8px] to text-[14.5px]. This maps all of it onto the ramps defined in
 * src/index.css.
 *
 * Run:  node migrate-tokens.mjs [--dry]
 *
 * Kept in the repo deliberately — it documents exactly how the old values map
 * to the new ones, which is useful when reviewing the diff.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = new URL("./src", import.meta.url).pathname;

/* ---------------------------------------------------------------------------
 * 1. Hardcoded hex values → token utilities.
 *    Written as bare colour names; the class prefix (bg-/text-/border-/…) is
 *    preserved because we only replace the `[#XXXXXX]` bracket portion.
 * ------------------------------------------------------------------------ */
const HEX = {
  // Old violet brand
  "#4C1D95": "violet-700",
  "#3B0764": "violet-900",
  "#6D28D9": "violet-600",
  "#4F46E5": "violet-600",
  "#F5F3FF": "violet-50",
  "#EEF2FF": "violet-50",
  "#E0E7FF": "violet-100",
  "#E0D7FF": "violet-200",

  // Old amber/gold — becomes the primary accent
  "#D97706": "gold-600",
  "#B45309": "gold-700",
  "#F59E0B": "gold-400",
  "#92400E": "gold-800",
  "#F5D9B8": "gold-200",
  "#FFFBF3": "gold-50",
  "#fdf3dc": "gold-100",
  "#e5c898": "gold-300",
  "#d3a86c": "gold-400",
  "#9a6932": "gold-700",

  // Cool neutrals (slate) → ink
  "#0F172A": "ink-900",
  "#F8FAFC": "ink-50",
  "#FAFBFD": "ink-25",
  "#F8F9FA": "ink-25",
  "#94A3B8": "ink-400",
  "#64748B": "ink-500",

  // Warm neutrals (stone) → ink
  "#1A1310": "ink-900",
  "#5C534C": "ink-600",
  "#A89F91": "ink-400",
  "#A39A94": "ink-400",
  "#EAE3D5": "ink-200",
  "#EFECE6": "ink-100",
  "#FAF6F0": "ink-50",
  "#FAF9F5": "ink-25",
  "#FFFDFB": "ink-0",
  "#050505": "ink-950",
  "#020202": "ink-950",

  // Status colours
  "#C6F3F7": "info-100",
  "#EAFDFE": "info-50",
  "#E4EFE6": "good-100",
  "#F3FAF4": "good-50",
};

/* ---------------------------------------------------------------------------
 * 2. Tailwind default ramps → the single ink ramp / semantic ramps.
 *    Longest keys first so `slate-500` is matched before `slate-50`.
 * ------------------------------------------------------------------------ */
const RAMP = {};
const shades = [950, 900, 800, 700, 600, 500, 400, 300, 200, 100, 50];

// Every cool + warm neutral collapses into `ink`.
for (const g of ["slate", "stone", "gray", "zinc", "neutral"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `ink-${s === 950 ? 950 : s}`;
}
// Purple and violet unify on the violet ramp.
for (const g of ["purple", "fuchsia"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `violet-${s}`;
}
// Amber/yellow/orange become gold.
for (const g of ["amber", "yellow", "orange"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `gold-${s}`;
}
// Status ramps.
for (const g of ["emerald", "green", "teal"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `good-${nearest(s, [50, 100, 300, 500, 700, 900])}`;
}
for (const g of ["rose", "red", "pink"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `bad-${nearest(s, [50, 100, 300, 500, 700, 900])}`;
}
for (const g of ["blue", "sky", "cyan", "indigo"]) {
  for (const s of shades) RAMP[`${g}-${s}`] = `info-${nearest(s, [50, 100, 300, 500, 700, 900])}`;
}

function nearest(shade, allowed) {
  return allowed.reduce((a, b) => (Math.abs(b - shade) < Math.abs(a - shade) ? b : a));
}

/* ---------------------------------------------------------------------------
 * 3. Arbitrary font sizes → the eight-step type scale.
 * ------------------------------------------------------------------------ */
const TYPE = {
  "text-[8px]": "text-micro",
  "text-[9px]": "text-micro",
  "text-[10px]": "text-micro",
  "text-[10.5px]": "text-micro",
  "text-[11px]": "text-tiny",
  "text-[11.5px]": "text-tiny",
  "text-[12px]": "text-xs",
  "text-[12.5px]": "text-xs",
  "text-[13px]": "text-sm",
  "text-[13.5px]": "text-sm",
  "text-[14px]": "text-sm",
  "text-[14.5px]": "text-base",
  "text-[15px]": "text-base",
  "text-[16px]": "text-base",
};

/* ---------------------------------------------------------------------------
 * 4. Elevation → the e1–e5 scale.
 * ------------------------------------------------------------------------ */
const SHADOW = {
  "shadow-xs": "shadow-e1",
  "shadow-sm": "shadow-e2",
  "shadow-md": "shadow-e3",
  "shadow-lg": "shadow-e4",
  "shadow-xl": "shadow-e5",
  "shadow-2xl": "shadow-e5",
};

/* ---------------------------------------------------------------------------
 * 5. Weights. Inter is loaded at 400–800; `font-black` (900) was being
 *    synthesised by the browser, which is why headings looked smeared.
 * ------------------------------------------------------------------------ */
const WEIGHT = { "font-black": "font-extrabold" };

/* ------------------------------------------------------------------------ */

function migrate(src) {
  let out = src;

  // Hex inside arbitrary-value brackets: bg-[#D97706] → bg-gold-600
  for (const [hex, token] of Object.entries(HEX)) {
    const re = new RegExp(`\\[${hex}\\]`, "gi");
    out = out.replace(re, token);
    // Slash-opacity form: bg-[#D97706]/40 handled by the same replace since
    // the suffix survives.
  }

  // Bare hex in style props / SVG fills that we can't tokenise stay as-is,
  // except the two logo blacks which have a token.
  out = out.replace(/#050505/g, "var(--color-ink-950)");
  out = out.replace(/#020202/g, "var(--color-ink-950)");

  // Ramps, longest first.
  for (const key of Object.keys(RAMP).sort((a, b) => b.length - a.length)) {
    out = out.replaceAll(key, RAMP[key]);
  }

  for (const [k, v] of Object.entries(TYPE)) out = out.replaceAll(k, v);
  for (const [k, v] of Object.entries(SHADOW)) out = out.replaceAll(k, v);
  for (const [k, v] of Object.entries(WEIGHT)) out = out.replaceAll(k, v);

  return out;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if ([".tsx", ".ts"].includes(extname(p))) acc.push(p);
  }
  return acc;
}

let changed = 0;
for (const file of walk(ROOT)) {
  // The design system is already on tokens, and the logo's gradient stops are
  // the actual brand mark — those hexes are data, not styling.
  if (file.includes(`${"/"}ui${"/"}`)) continue;
  if (file.endsWith("Logo.tsx")) continue;
  const before = readFileSync(file, "utf8");
  const after = migrate(before);
  if (before !== after) {
    changed++;
    if (!DRY) writeFileSync(file, after);
    console.log(`${DRY ? "would update" : "updated"}  ${file.replace(ROOT, "src")}`);
  }
}
console.log(`\n${changed} file(s) ${DRY ? "would change" : "changed"}.`);

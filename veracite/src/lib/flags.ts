/**
 * Feature flags (task K18). Stretch features and Phase-2 changes ship behind a flag, so the demo spine
 * (X-ray, research session, checkpoints, labels, Rules mode, export) never breaks.
 *
 * Rule: a flag's default stays `false` until its feature is merged AND tested on the live link.
 * The owner flips the default to `true` in the same PR that ships the feature.
 *
 * Override per deploy, no code change: set NEXT_PUBLIC_FLAGS on Vercel, then redeploy.
 *   NEXT_PUBLIC_FLAGS="debate,arabic"     → turns those on
 *   NEXT_PUBLIC_FLAGS="-galaxy3d"         → turns that off
 * Next.js inlines NEXT_PUBLIC_ values at build time, and only for a literal `process.env.NAME`,
 * which is why there is a single variable read in one place below.
 */

export const FLAG_DEFAULTS = {
  // P1 · promised in the deck (docs/11 §4)
  draftChecker: false, // K10
  snowball: false, // K11
  certificate: false, // Z08
  paraphraseGuard: false, // Z09
  biasLens: false, // Z10
  exportGate: false, // Z15
  oneClickSave: false, // A15
  moreCitationStyles: false, // A06 evening: MLA, Harvard, IEEE, Chicago

  // P2 · stretch
  missionControl3d: false, // A07
  arabic: false, // A08
  commandPalette: false, // A09
  pdfDrop: false, // A10
  galaxyRealData: false, // A05 stretch
  debate: false, // K14
  publicVerifyApi: false, // K13
  webSources: false, // Z16

  // Phase 2 (Thursday): add one flag per new requirement here.
} as const;

export type FlagName = keyof typeof FLAG_DEFAULTS;

/** Parse "a,b,-c" into overrides. Unknown names are ignored. Exported for tests. */
export function parseFlagOverrides(raw: string | undefined): Partial<Record<FlagName, boolean>> {
  const out: Partial<Record<FlagName, boolean>> = {};
  for (const token of (raw ?? "").split(",").map((t) => t.trim()).filter(Boolean)) {
    const off = token.startsWith("-");
    const name = (off ? token.slice(1) : token) as FlagName;
    if (name in FLAG_DEFAULTS) out[name] = !off;
  }
  return out;
}

const OVERRIDES = parseFlagOverrides(process.env.NEXT_PUBLIC_FLAGS);

export function isOn(name: FlagName): boolean {
  return OVERRIDES[name] ?? FLAG_DEFAULTS[name];
}

/** Every flag with its effective value (for the Trust Center or a debug panel). */
export function allFlags(): Record<FlagName, boolean> {
  return Object.fromEntries((Object.keys(FLAG_DEFAULTS) as FlagName[]).map((n) => [n, isOn(n)])) as Record<FlagName, boolean>;
}

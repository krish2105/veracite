/**
 * Bias & diversity lens (task Z10, features F22/F23, docs/05 "Biased sources").
 *
 * Turns OpenAlex metadata for the student's sources into plain numbers and warnings:
 * where the authors are based (country + world region), how old the evidence is, how much of it
 * is open access, which publishers dominate, and which languages it is in.
 *
 * Facts, not scores: nothing here ranks or removes a source. Small or Global-South journals are
 * never down-weighted; the student just sees the spread and decides.
 *
 * Pure and deterministic. Krishna's OpenAlex client (K03) fetches the works; pass them in as-is.
 */

/** The OpenAlex Work fields we read (everything else is ignored). */
export interface OpenAlexWorkLite {
  id?: string;
  doi?: string | null;
  publication_year?: number | null;
  language?: string | null;
  type?: string | null;
  open_access?: { is_oa?: boolean | null; oa_status?: string | null } | null;
  primary_location?: {
    source?: {
      display_name?: string | null;
      host_organization_name?: string | null;
      is_in_doaj?: boolean | null;
    } | null;
  } | null;
  authorships?: { countries?: string[] | null; institutions?: { country_code?: string | null }[] | null }[] | null;
}

export interface BiasFacts {
  id: string;
  year: number | null;
  /** ISO 3166-1 alpha-2 codes of the authors' institutions, unique, sorted. */
  countries: string[];
  regions: Region[];
  openAccess: boolean | null;
  oaStatus: string | null;
  publisher: string | null;
  venue: string | null;
  language: string | null;
}

export type Region =
  | "North America"
  | "Latin America & Caribbean"
  | "Europe & Central Asia"
  | "Middle East & North Africa"
  | "South Asia"
  | "East Asia & Pacific"
  | "Sub-Saharan Africa"
  | "Other";

/** World Bank regions. */
const REGION_CODES: [Region, string][] = [
  ["North America", "US CA BM"],
  ["Latin America & Caribbean", "MX BR AR CL CO PE VE EC BO PY UY CR PA GT HN SV NI CU DO JM TT PR HT BS BB BZ GY SR"],
  [
    "Europe & Central Asia",
    "GB IE FR DE NL BE LU CH AT IT ES PT DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS BA ME MK AL EE LV LT UA BY MD RU TR CY MT KZ UZ KG TJ TM GE AM AZ LI MC SM AD XK GL FO",
  ],
  ["Middle East & North Africa", "AE SA QA KW BH OM YE IQ IR JO LB SY PS IL EG LY TN DZ MA DJ"],
  ["South Asia", "IN PK BD LK NP BT MV AF"],
  ["East Asia & Pacific", "CN JP KR KP TW HK MO MN SG MY ID TH VN PH KH LA MM BN TL AU NZ PG FJ NC PF"],
  [
    "Sub-Saharan Africa",
    "NG KE ZA GH ET TZ UG RW SN CI CM ZW ZM MW MZ AO BW NA SD SS SO ER MG MU BJ BF ML NE TD GN SL LR TG GA CG CD CF GM GW GQ LS SZ CV ST SC KM MR BI",
  ],
];

const REGION_OF = new Map<string, Region>();
for (const [region, codes] of REGION_CODES) for (const c of codes.split(" ")) REGION_OF.set(c, region);

export function regionOf(countryCode: string): Region {
  return REGION_OF.get(countryCode.toUpperCase()) ?? "Other";
}

let displayNames: Intl.DisplayNames | null | undefined;
/** "AE" → "United Arab Emirates" (falls back to the code). */
export function countryName(code: string): string {
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      displayNames = null;
    }
  }
  return displayNames?.of(code.toUpperCase()) ?? code;
}

const NEEDS_THE = new Set(["US", "GB", "AE", "NL", "PH", "CD", "CF", "DO", "BS", "GM", "KM", "MV", "SC", "VA"]);
/** Country name for use mid-sentence: "the United States", "Brazil". */
export function countryInSentence(code: string): string {
  return (NEEDS_THE.has(code.toUpperCase()) ? "the " : "") + countryName(code);
}

/** Pull the bias-relevant facts out of one OpenAlex work. */
export function extractBiasFacts(work: OpenAlexWorkLite): BiasFacts {
  const set = new Set<string>();
  for (const a of work.authorships ?? []) {
    const fromAuthor = (a.countries ?? []).filter(Boolean);
    const fromInst = (a.institutions ?? []).map((i) => i.country_code).filter((c): c is string => !!c);
    for (const c of fromAuthor.length ? fromAuthor : fromInst) set.add(c.toUpperCase());
  }
  const countries = Array.from(set).sort();
  const src = work.primary_location?.source ?? null;
  const oa = work.open_access ?? null;
  return {
    id: work.doi ?? work.id ?? "",
    year: typeof work.publication_year === "number" ? work.publication_year : null,
    countries,
    regions: Array.from(new Set(countries.map(regionOf))).sort(),
    openAccess: typeof oa?.is_oa === "boolean" ? oa.is_oa : null,
    oaStatus: oa?.oa_status ?? null,
    publisher: src?.host_organization_name ?? null,
    venue: src?.display_name ?? null,
    language: work.language ?? null,
  };
}

export interface Bar {
  key: string;
  label: string;
  count: number;
  /** Share of sources with this value known, 0–100, rounded. */
  pct: number;
}

export type NoteLevel = "warn" | "info" | "good";

export interface BiasNote {
  dimension: "countries" | "regions" | "years" | "openAccess" | "publishers" | "languages" | "sample";
  level: NoteLevel;
  text: string;
}

export interface BiasSummary {
  total: number;
  countries: { bars: Bar[]; unknown: number; topTwoPct: number };
  regions: { bars: Bar[]; unknown: number };
  years: { bars: Bar[]; unknown: number; median: number | null; recentPct: number };
  openAccess: { pct: number; byStatus: Bar[]; unknown: number };
  publishers: { bars: Bar[]; unknown: number };
  languages: { bars: Bar[]; unknown: number };
  notes: BiasNote[];
}

export interface BiasOptions {
  /** Reference year for recency. Pass a fixed value in tests; defaults to the current year. */
  currentYear?: number;
  /** "Recent" = published in the last N years (inclusive of the current year). Default 5. */
  recentYears?: number;
  /** Fewer sources than this → only an info note, no warnings. Default 4. */
  minForWarnings?: number;
  /** How many country / publisher bars to show before grouping into "Other". Default 5. */
  topN?: number;
  /** Region the student is studying in, for the "no local evidence" note. Default MENA. */
  homeRegion?: Region;
}

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

/** Count how many sources have each value; each source counts once per distinct value. */
function tally(values: (string[] | null)[], labelOf: (k: string) => string = (k) => k, topN = Infinity): { bars: Bar[]; unknown: number } {
  const counts = new Map<string, number>();
  let known = 0;
  let unknown = 0;
  for (const v of values) {
    if (!v || v.length === 0) {
      unknown++;
      continue;
    }
    known++;
    for (const k of new Set(v)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const sorted = Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  let bars = sorted.slice(0, topN).map(([key, count]) => ({ key, label: labelOf(key), count, pct: pct(count, known) }));
  const rest = sorted.slice(topN);
  if (rest.length) {
    // "Other" = sources that have none of the shown values
    const shown = new Set(bars.map((b) => b.key));
    const otherCount = values.filter((v) => v && v.length && !v.some((k) => shown.has(k))).length;
    if (otherCount > 0) bars = [...bars, { key: "other", label: "Other", count: otherCount, pct: pct(otherCount, known) }];
  }
  return { bars, unknown };
}

function yearBin(y: number): string {
  if (y <= 2015) return "≤2015";
  if (y <= 2019) return "2016–19";
  if (y <= 2022) return "2020–22";
  return "2023+";
}
const YEAR_BINS = ["≤2015", "2016–19", "2020–22", "2023+"];

const LANG_NAMES: Record<string, string> = { en: "English", ar: "Arabic", fr: "French", es: "Spanish", de: "German", zh: "Chinese", pt: "Portuguese", ru: "Russian", ja: "Japanese" };

/** Summarise a set of sources. `works` are OpenAlex works or already-extracted facts. */
export function summariseBias(works: (OpenAlexWorkLite | BiasFacts)[], options: BiasOptions = {}): BiasSummary {
  const o = { currentYear: new Date().getFullYear(), recentYears: 5, minForWarnings: 4, topN: 5, homeRegion: "Middle East & North Africa" as Region, ...options };
  const facts = works.map((w) => ("regions" in w && Array.isArray(w.regions) ? (w as BiasFacts) : extractBiasFacts(w as OpenAlexWorkLite)));
  const total = facts.length;
  const notes: BiasNote[] = [];

  // Countries + regions
  const countries = tally(facts.map((f) => f.countries), countryName, o.topN);
  const withCountry = total - countries.unknown;
  const allCountries = tally(facts.map((f) => f.countries));
  const top2 = allCountries.bars.slice(0, 2).map((b) => b.key);
  const topTwoCount = facts.filter((f) => f.countries.some((c) => top2.includes(c))).length;
  const topTwoPct = pct(topTwoCount, withCountry);
  const regions = tally(facts.map((f) => (f.countries.length ? f.regions : null)));

  // Years
  const years = facts.map((f) => f.year).filter((y): y is number => y !== null);
  const sortedYears = [...years].sort((a, b) => a - b);
  const median = sortedYears.length ? sortedYears[Math.floor((sortedYears.length - 1) / 2)] : null;
  const recentFrom = o.currentYear - o.recentYears + 1;
  const recentPct = pct(years.filter((y) => y >= recentFrom).length, years.length);
  const yearTally = tally(facts.map((f) => (f.year === null ? null : [yearBin(f.year)])));
  const yearBars = YEAR_BINS.map((k) => yearTally.bars.find((b) => b.key === k) ?? { key: k, label: k, count: 0, pct: 0 });

  // Open access
  const oaKnown = facts.filter((f) => f.openAccess !== null);
  const oaPct = pct(oaKnown.filter((f) => f.openAccess).length, oaKnown.length);
  const byStatus = tally(facts.map((f) => (f.openAccess === null ? null : [f.openAccess ? f.oaStatus ?? "open" : "closed"])));

  const publishers = tally(facts.map((f) => (f.publisher ? [f.publisher] : null)), (k) => k, o.topN);
  const languages = tally(facts.map((f) => (f.language ? [f.language] : null)), (k) => LANG_NAMES[k] ?? k);

  // Notes (plain words; warnings only with enough sources to mean something)
  if (total === 0) {
    notes.push({ dimension: "sample", level: "info", text: "No sources yet." });
  } else if (total < o.minForWarnings) {
    notes.push({ dimension: "sample", level: "info", text: `Only ${total} source${total === 1 ? "" : "s"}: too few to judge balance.` });
  } else {
    if (withCountry >= o.minForWarnings) {
      const top = allCountries.bars[0];
      if (top && top.pct >= 60) {
        notes.push({ dimension: "countries", level: "warn", text: `${top.pct}% of your sources have authors from ${countryInSentence(top.key)}. Look for studies from other countries.` });
      } else if (allCountries.bars.length >= 2 && topTwoPct >= 75) {
        notes.push({ dimension: "countries", level: "warn", text: `${topTwoPct}% of your sources come from two countries (${top2.map(countryInSentence).join(" and ")}). Consider studies from other regions.` });
      } else {
        notes.push({ dimension: "countries", level: "good", text: `Authors from ${allCountries.bars.length} countries.` });
      }
      if (regions.bars.length === 1) {
        notes.push({ dimension: "regions", level: "warn", text: `All sources with known locations are from one region (${regions.bars[0].label}).` });
      }
      if (!regions.bars.some((b) => b.key === o.homeRegion)) {
        notes.push({ dimension: "regions", level: "info", text: `No sources from ${o.homeRegion}. If your topic is local, look for regional studies.` });
      }
    }
    if (years.length >= o.minForWarnings && median !== null) {
      if (recentPct < 20) {
        notes.push({ dimension: "years", level: "warn", text: `Only ${recentPct}% of your sources are from ${recentFrom} or later (median year ${median}). Check for newer evidence.` });
      } else if (o.currentYear - median > 10) {
        notes.push({ dimension: "years", level: "warn", text: `Half your sources are from ${median} or earlier. Check whether newer studies changed the picture.` });
      } else {
        notes.push({ dimension: "years", level: "good", text: `Good recency: ${recentPct}% from ${recentFrom} or later.` });
      }
    }
    if (oaKnown.length >= o.minForWarnings) {
      if (oaPct < 30) {
        notes.push({ dimension: "openAccess", level: "warn", text: `Only ${oaPct}% open access. Readers without a library login can't check most of these.` });
      } else {
        notes.push({ dimension: "openAccess", level: "good", text: `${oaPct}% open access.` });
      }
    }
    const pubKnown = total - publishers.unknown;
    const topPub = publishers.bars[0];
    if (pubKnown >= o.minForWarnings && topPub && topPub.key !== "other" && topPub.pct >= 50) {
      notes.push({ dimension: "publishers", level: "info", text: `${topPub.pct}% of your sources are published by ${topPub.label}.` });
    }
    const nonEnglish = languages.bars.filter((b) => b.key !== "en").reduce((s, b) => s + b.count, 0);
    if (nonEnglish > 0) {
      notes.push({ dimension: "languages", level: "good", text: `${nonEnglish} source${nonEnglish === 1 ? " is" : "s are"} not in English.` });
    }
  }

  return {
    total,
    countries: { ...countries, topTwoPct },
    regions,
    years: { bars: yearBars, unknown: yearTally.unknown, median, recentPct },
    openAccess: { pct: oaPct, byStatus: byStatus.bars, unknown: total - oaKnown.length },
    publishers,
    languages,
    notes,
  };
}

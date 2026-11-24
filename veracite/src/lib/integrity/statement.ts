/**
 * AI-use statement generator (task Z04, feature F34).
 *
 * Builds a first-person disclosure the student can paste into an assignment, following APA
 * Style's generative-AI guidance (Sept 2025: say which tool, how and when it was used, and cite
 * the tool) and SP Jain Academic Integrity Policy §h(viii) (identify AI models, tools and prompts).
 *
 * Rule: every sentence is computed from the Receipts log and the final library. Nothing is
 * typed from memory, and the statement never claims something the log can't prove. In
 * particular it does NOT say "I wrote the final text myself" unless the student supplies that
 * sentence (`ownWork`); otherwise it leaves a marked placeholder for the student to complete.
 */

import { ACTIONS, ACTORS, AUTONOMY_LABEL, isAiCall, type Autonomy, type Receipt } from "./receipts";

/** Structurally compatible with `SourceRecord` (docs/03 §7). Only these fields are read. */
export interface StatementSource {
  verification: { status: string; registries?: string[] };
  opened: boolean;
  sample?: boolean;
}

/** Structurally compatible with `Claim` (docs/03 §7). */
export interface StatementClaim {
  label: string;
  decision: "pending" | "kept" | "edited" | "dropped";
}

export interface ToolInfo {
  name: string;
  author: string;
  year: number;
  version: string;
  description: string;
  publisher?: string;
  url?: string;
}

export const VERACITE_TOOL: ToolInfo = {
  name: "Veracite",
  author: "Team 7",
  year: 2026,
  version: "0.1",
  description: "AI research assistant",
  publisher: "SP Jain AI Club Hackathon",
};

export interface StatementInput {
  receipts: Receipt[];
  autonomy: Autonomy;
  /** The final bibliography / library items the work relies on. */
  sources?: StatementSource[];
  claims?: StatementClaim[];
  /** The student's own sentence(s) about how they used the output. Never generated. */
  ownWork?: string;
  tool?: ToolInfo;
  /** IANA time zone for dates in the text. */
  timeZone?: string;
  /** Mark the statement as SAMPLE (hackathon rule 9). Also set automatically if any source is a sample. */
  sample?: boolean;
}

export interface StatementFacts {
  firstAt?: string;
  lastAt?: string;
  models: string[];
  aiCalls: number;
  aiCallsFailed: number;
  rulesFallbacks: number;
  aiActivities: string[];
  blockedCitations: number;
  injectionFlags: number;
  decisions: Record<string, number>;
  sources: { total: number; opened: number; byStatus: Record<string, number>; registries: string[] };
  claims: { total: number; kept: number; edited: number; dropped: number; pending: number };
}

export interface AiUseStatement {
  /** The disclosure paragraph(s), ready to paste. */
  text: string;
  /** APA 7 reference for the tool, for the reference list. */
  toolReference: string;
  /** In-text citation for the tool, e.g. "(Team 7, 2026)". */
  inText: string;
  /** Everything the text was computed from, for display and for tests. */
  facts: StatementFacts;
  /** Things the student should fix or check before submitting. */
  warnings: string[];
  sample: boolean;
}

export const OWN_WORK_PLACEHOLDER =
  "[Add in your own words how you used this output, e.g. \"I wrote the final text myself and used the summary only to plan my reading.\"]";

/** What each agent did, in plain words, when it called a model. Order = pipeline order. */
const ACTIVITY: [string, string][] = [
  [ACTORS.planner, "proposed a search plan"],
  [ACTORS.scout, "suggested search terms"],
  [ACTORS.reader, "extracted quoted evidence from the sources"],
  [ACTORS.scribe, "drafted a labelled evidence summary that could cite only sources I had approved"],
  [ACTORS.skeptic, "challenged each claim in that summary"],
  [ACTORS.coach, "asked me review questions"],
];

/** [singular, plural] wording after a count, e.g. "1 was retracted" / "2 were retracted". */
const STATUS_WORDS: Record<string, [string, string]> = {
  verified: ["verified", "verified"],
  partial: ["partially confirmed", "partially confirmed"],
  mismatch: ["had mismatched details", "had mismatched details"],
  chimera: ["was flagged as a chimera (parts of different papers)", "were flagged as chimeras (parts of different papers)"],
  notfound: ["could not be found", "could not be found"],
  retracted: ["was retracted", "were retracted"],
};

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function fmtDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone }).format(
    new Date(iso),
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Collect the facts. Pure: same receipts in → same facts out. */
export function statementFacts(input: StatementInput): StatementFacts {
  const receipts = [...input.receipts].sort((a, b) => a.at.localeCompare(b.at));
  const ai = receipts.filter(isAiCall);

  const models = Array.from(new Set(ai.map((r) => r.model as string))).sort();
  const actorsWithAi = new Set<string>(ai.filter((r) => r.ok).map((r) => r.actor));
  const aiActivities = ACTIVITY.filter(([actor]) => actorsWithAi.has(actor)).map(([, what]) => what);

  const decisions: Record<string, number> = {};
  for (const r of receipts) {
    if (r.actor === ACTORS.student) decisions[r.action] = (decisions[r.action] ?? 0) + 1;
  }

  const sources = input.sources ?? [];
  const byStatus: Record<string, number> = {};
  const registries = new Set<string>();
  for (const s of sources) {
    byStatus[s.verification.status] = (byStatus[s.verification.status] ?? 0) + 1;
    for (const reg of s.verification.registries ?? []) registries.add(reg);
  }

  const claims = input.claims ?? [];
  const count = (d: StatementClaim["decision"]) => claims.filter((c) => c.decision === d).length;

  return {
    firstAt: receipts[0]?.at,
    lastAt: receipts[receipts.length - 1]?.at,
    models,
    aiCalls: ai.length,
    aiCallsFailed: ai.filter((r) => !r.ok).length,
    rulesFallbacks: receipts.filter((r) => r.action === ACTIONS.fallbackRules).length,
    aiActivities,
    blockedCitations: receipts.filter((r) => r.action === ACTIONS.blockedCitation).length,
    injectionFlags: receipts.filter((r) => r.action === ACTIONS.injectionFlagged).length,
    decisions,
    sources: {
      total: sources.length,
      opened: sources.filter((s) => s.opened).length,
      byStatus,
      registries: Array.from(registries).sort(),
    },
    claims: { total: claims.length, kept: count("kept"), edited: count("edited"), dropped: count("dropped"), pending: count("pending") },
  };
}

/** APA 7 reference for software: Author. (Year). Title (Version) [Description]. Publisher. URL */
export function toolReference(tool: ToolInfo): string {
  const parts = [`${tool.author}. (${tool.year}). ${tool.name} (Version ${tool.version}) [${capitalise(tool.description)}].`];
  if (tool.publisher) parts.push(`${tool.publisher}.`);
  if (tool.url) parts.push(tool.url);
  return parts.join(" ");
}

/** Build the AI-use statement from the log. */
export function buildAiUseStatement(input: StatementInput): AiUseStatement {
  const tool = input.tool ?? VERACITE_TOOL;
  const tz = input.timeZone ?? "Asia/Dubai";
  const f = statementFacts(input);
  const warnings: string[] = [];
  const sample = input.sample === true || (input.sources ?? []).some((s) => s.sample === true);
  const inText = `(${tool.author}, ${tool.year})`;
  const paras: string[] = [];

  // 1. Tool, mode, dates
  let when = "";
  if (f.firstAt && f.lastAt) {
    const a = fmtDate(f.firstAt, tz);
    const b = fmtDate(f.lastAt, tz);
    when = a === b ? ` on ${a}` : ` between ${a} and ${b}`;
  }
  const usedAi = f.aiCalls > 0;
  const purpose = usedAi ? "to plan searches, find sources and check references" : "to organise and check references";
  const article = /^[aeiou]/i.test(tool.description) ? "an" : "a";
  let p1 = `I used ${tool.name} ${inText}, ${article} ${tool.description}, in ${AUTONOMY_LABEL[input.autonomy]} mode${when} ${purpose}.`;

  // 2. What the AI did
  if (!usedAi) {
    p1 += " No generative AI model was used: the tool only checked references against public scholarly registries.";
  } else {
    const modelText = `${f.models.length === 1 ? "model" : "models"} ${listJoin(f.models)}`;
    p1 += f.aiActivities.length
      ? ` Its AI agents (${modelText}) ${listJoin(f.aiActivities)}.`
      : ` It called the AI ${modelText}.`;
    p1 += ` In total ${plural(f.aiCalls, "AI request")} ${f.aiCalls === 1 ? "was" : "were"} made; every prompt is listed in the attached Prompt Ledger.`;
    if (f.rulesFallbacks > 0) {
      p1 += ` ${capitalise(plural(f.rulesFallbacks, "step"))} fell back to rules mode (no AI) when the model was unavailable.`;
    }
  }
  if (input.autonomy === "off" && usedAi) {
    warnings.push("The log shows AI calls although autonomy was set to Off. Check the session before submitting.");
  }
  paras.push(p1);

  // 3. Verification of references (registry facts, not AI)
  if (f.sources.total > 0) {
    const regs = f.sources.registries.length ? ` against ${listJoin(f.sources.registries)}` : "";
    const parts = Object.entries(f.sources.byStatus)
      .sort((a, b) => b[1] - a[1])
      .map(([status, n]) => `${n} ${STATUS_WORDS[status]?.[n === 1 ? 0 : 1] ?? `had status "${status}"`}`);
    let p2 = `${capitalise(plural(f.sources.total, "reference"))} in my reference list ${f.sources.total === 1 ? "was" : "were"} checked by code${regs}: ${listJoin(parts)}.`;
    if (f.blockedCitations > 0) {
      p2 += ` The tool blocked ${plural(f.blockedCitations, "AI-written citation")} to sources that had not been retrieved.`;
    }
    paras.push(p2);
    const bad = f.sources.total - (f.sources.byStatus.verified ?? 0) - (f.sources.byStatus.partial ?? 0);
    if (bad > 0) warnings.push(`${plural(bad, "reference")} in your list ${bad === 1 ? "is" : "are"} not verified. Fix or remove ${bad === 1 ? "it" : "them"} before submitting.`);
    if ((f.sources.byStatus.partial ?? 0) > 0) warnings.push(`${plural(f.sources.byStatus.partial, "reference")} ${f.sources.byStatus.partial === 1 ? "is" : "are"} only partially confirmed (e.g. a web page or book). Check ${f.sources.byStatus.partial === 1 ? "it" : "them"} by hand.`);
  } else if (f.blockedCitations > 0) {
    paras.push(`The tool blocked ${plural(f.blockedCitations, "AI-written citation")} to sources that had not been retrieved.`);
  }

  // 4. What the student decided (from student receipts only)
  const d = f.decisions;
  const decided: string[] = [];
  if (d[ACTIONS.approvePlan]) decided.push("approved the search plan");
  if (d[ACTIONS.approveSources]) decided.push("chose which sources to keep");
  if (d[ACTIONS.rejectSource]) decided.push(`rejected ${plural(d[ACTIONS.rejectSource], "suggested source")}`);
  if (f.claims.total > 0) {
    const c = f.claims;
    const bits = [`kept ${c.kept}`, c.edited ? `edited ${c.edited}` : "", `dropped ${c.dropped}`].filter(Boolean);
    decided.push(`reviewed the ${plural(c.total, "AI-drafted claim")} and ${listJoin(bits)}`);
    if (c.pending > 0) warnings.push(`${plural(c.pending, "claim")} ${c.pending === 1 ? "has" : "have"} not been reviewed yet.`);
  }
  const p3: string[] = [];
  if (decided.length) p3.push(`I ${listJoin(decided)}.`);
  if (f.sources.total > 0) {
    p3.push(`I opened ${f.sources.opened} of the ${plural(f.sources.total, "source")} myself.`);
    if (f.sources.opened < f.sources.total) {
      warnings.push(`You have not opened ${f.sources.total - f.sources.opened} of your sources. Read them before citing them.`);
    }
  }
  if (p3.length) paras.push(p3.join(" "));

  // 5. Student's own account (never generated)
  const own = input.ownWork?.trim();
  if (own) {
    paras.push(own);
  } else {
    paras.push(OWN_WORK_PLACEHOLDER);
    warnings.push("Add your own sentence on how you used the AI output; the tool will not write it for you.");
  }

  let text = paras.join("\n\n");
  if (sample) text = `SAMPLE: generated from sample data.\n\n${text}`;

  return { text, toolReference: toolReference(tool), inText, facts: f, warnings, sample };
}

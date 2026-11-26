/**
 * Requests to the assistant that are not research questions (Phase 2, bonus cases B3 and B5). Pure code, no AI.
 *  - "Save this note on the X paper: …"  → the note is stored as text. It is content, never a command: no status
 *    changes because of what a note says. A status changes only when a check runs.
 *  - "Check this quote: "…" (Author, 2015)" → the quote is compared with the text Veracite can read (the abstract).
 *    It is confirmed only if it is there word for word; otherwise "not found", never a yes.
 * Anything else is a research question and goes to the Planner as before.
 */
import { quoteInText } from "../agents/checks";
import { detectInjection } from "../integrity/injection";
import type { SourceRecord } from "../types";

export type Routed =
  | { kind: "note"; note: string; who: string[] }
  | { kind: "quote"; quote: string; who: string[]; year?: number }
  | { kind: "research" };

export interface AssistantAnswer {
  title: string;
  tone: "ok" | "warn";
  lines: string[];
  /** A note to store on a source: the caller saves it; this module never touches the library. */
  save?: { id: string; notes: string };
}

const QUOTED = /[“"]([^”"]{4,})[”"]/;
const NOT_NAMES = new Set(["save", "add", "attach", "store", "this", "that", "note", "the", "paper", "check", "verify", "confirm", "quote", "for", "my", "assignment", "please", "system", "on", "to", "and"]);
const names = (s: string) => [...new Set((s.match(/\p{Lu}[\p{L}'’\-]+/gu) ?? []).filter((w) => !NOT_NAMES.has(w.toLowerCase())))];
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}]+/gu, "");

export function routeRequest(text: string): Routed {
  const t = text.trim();
  const q = t.match(QUOTED);
  if (/^\s*(?:please\s+)?(?:save|add|attach|store)\b[^“"]{0,80}\bnote\b/i.test(t)) {
    const head = q ? t.slice(0, q.index) : t.split(":")[0];
    const note = q ? q[1] : t.slice(t.indexOf(":") + 1).trim();
    return { kind: "note", note: note.trim(), who: names(head) };
  }
  const cite = q ? t.slice(q.index! + q[0].length).match(/\(([^()]{2,120}?),?\s*((?:19|20)\d{2})[a-z]?\)/) : null;
  if (q && q[1].length >= 12 && (cite || /\b(?:check|verify|confirm)\b[^“"]{0,60}\bquot/i.test(t.slice(0, q.index)))) {
    return { kind: "quote", quote: q[1].trim(), who: cite ? names(cite[1]) : names(t.slice(q.index! + q[0].length)), year: cite ? Number(cite[2]) : undefined };
  }
  return { kind: "research" };
}

const short = (s: SourceRecord) => `${s.authors[0]?.family ?? "Unknown"}${s.authors.length > 2 ? " et al." : s.authors[1] ? ` & ${s.authors[1].family}` : ""} (${s.year ?? "n.d."})`;

function find(sources: SourceRecord[], who: string[], year?: number): SourceRecord | undefined {
  const want = who.map(norm).filter(Boolean);
  if (!want.length) return undefined;
  const byName = sources.filter((s) => want.some((w) => s.authors.some((a) => norm(a.family) === w)));
  return byName.find((s) => !year || s.year === year) ?? (year ? undefined : byName[0]);
}

/** Looks like an order to the checker hidden in content. It is stored as text and not followed. */
const INSTRUCTION = /\b(?:system|assistant|developer)\s*:|ignore\b[^.]{0,40}\b(?:rules?|instructions?|checks?)|mark\b[^.]{0,60}\bverified\b|override\b|disregard\b/i;

export function answerRequest(r: Exclude<Routed, { kind: "research" }>, sources: SourceRecord[]): AssistantAnswer {
  const src = find(sources, r.who, r.kind === "quote" ? r.year : undefined);
  const who = r.who.length ? r.who.join(", ") : "that author";
  if (r.kind === "note") {
    // Zedan's prompt-injection shield (lib/integrity/injection.ts) plus a plain pattern: either one flags the note.
    const command = detectInjection(r.note).findings.length > 0 || INSTRUCTION.test(r.note);
    if (!src) {
      return { title: "Note not saved", tone: "warn", lines: [`No source by ${who} is in your library, so there is nothing to attach the note to. Add the paper on the X-ray page first.`, ...(command ? ["The note reads like an instruction to the checker. Notes are content, not commands: nothing was changed."] : [])] };
    }
    const notes = [src.notes?.trim(), r.note].filter(Boolean).join("\n");
    return {
      title: `Note saved on ${short(src)}`,
      tone: command ? "warn" : "ok",
      save: { id: src.id, notes },
      lines: [
        `Saved as a note on ${short(src)}: “${r.note}”`,
        ...(command ? ["This note reads like an instruction to the checker. It was stored as text and not followed (prompt-injection shield)."] : []),
        `Notes are content, not commands. No status was changed: ${short(src)} is still “${src.verification.status}”, and every other reference keeps its status. A status changes only when a check runs.`,
      ],
    };
  }
  if (!src) {
    return { title: "Quote not confirmed", tone: "warn", lines: [`No source by ${who}${r.year ? ` (${r.year})` : ""} is in your library, so the quote could not be checked against it. It is not confirmed.`, "Add the paper on the X-ray page, then ask again. Veracite never confirms a quote it has not found in the source."] };
  }
  if (!src.abstract) {
    return { title: "Quote not confirmed", tone: "warn", lines: [`The registries hold no abstract or full text for ${short(src)}, so the full text was not available to check this quote. It is not confirmed.`, "Do not present it as a quotation unless you find it in the paper yourself. Veracite never confirms a quote it has not found in the source."] };
  }
  if (quoteInText(r.quote, src.abstract)) {
    return { title: "Quote found", tone: "ok", lines: [`“${r.quote}” is in the abstract of ${short(src)}, word for word.`, "Checked by code against the abstract, not by AI."] };
  }
  return {
    title: "Quote not found",
    tone: "warn",
    lines: [
      `“${r.quote}” is not in the abstract of ${short(src)}, which is the only text of it Veracite can read.`,
      "The full text was not available to check, so this quote is not confirmed. Do not present it as a quotation unless you find it in the paper yourself.",
      "Checked by code against the registry's abstract, not by AI.",
    ],
  };
}

"use client";

/**
 * "My reference list" (K19): what the student approved, one click at a time, plus the log the AI-use statement is
 * built from. Stored on this device (localStorage). Nothing enters the list without a click.
 * Interim store: Avighna's IndexedDB library (A05) can replace it; records use the shared SourceRecord type.
 */
import { parseReference } from "@/lib/verify/parse";
import { useSyncExternalStore } from "react";
import { ACTIONS } from "@/lib/integrity/receipts";
import type { Receipt, RefStatus, SourcePatch, SourceRecord, Verification } from "@/lib/types";
import { canAddWeb } from "@/lib/verify/websource";

const KEY = "vx-reflist-v1";
const SESSION = "xray";

interface State {
  sources: SourceRecord[];
  receipts: Receipt[];
}
const EMPTY: State = { sources: [], receipts: [] };

let state: State | undefined;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as State | null;
    state = parsed && Array.isArray(parsed.sources) && Array.isArray(parsed.receipts) ? parsed : EMPTY;
  } catch {
    state = EMPTY;
  }
  return state;
}

function write(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing or a full disk: the list still works until the page is closed.
  }
  listeners.forEach((l) => l());
}

function receipt(actor: Receipt["actor"], action: string, detail: string): Receipt {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sessionId: SESSION, at: new Date().toISOString(), actor, action, detail, aiUsed: false, ms: 0, ok: true };
}

/** Only these verdicts may be added. Chimera, retracted and not-found references never enter the list. */
export const canAdd = (v: Verification) => !!v.matched && (v.status === "verified" || v.status === "partial" || v.status === "mismatch");

export const sourceId = (v: Verification) => (v.matched?.doi ? `doi:${v.matched.doi}` : `url:${v.matched?.url ?? v.matched?.id}`);

/** The saved record comes from the REGISTRY, never from the pasted text. */
export function toSource(v: Verification): SourceRecord {
  const m = v.matched!;
  return {
    id: sourceId(v),
    doi: m.doi,
    title: m.title,
    authors: m.authors,
    year: m.year,
    venue: m.venue,
    volume: m.volume,
    issue: m.issue,
    pages: m.pages,
    type: m.type,
    abstract: m.abstract,
    textAvailable: m.abstract ? "abstract" : "none",
    url: m.url,
    oaUrl: m.oaUrl,
    verification: v,
    quality: { preprint: m.type === "preprint", citedBy: m.citedBy, openAccess: m.openAccess, countries: m.countries, publisher: m.publisher, inDOAJ: m.journal?.inDoaj, coreJournal: m.journal?.core, listedIn: m.journal?.listedIn },
    tags: [],
    collections: [],
    notes: "",
    opened: false,
    addedAt: new Date().toISOString(),
    addedVia: "xray",
  };
}

/** A stable id for a reference kept as typed (no registry record stands behind it). */
export const typedId = (raw: string) => {
  let h = 5381;
  for (const ch of raw.replace(/\s+/g, " ").trim().toLowerCase()) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return `typed:${h.toString(36)}`;
};

/** The reference exactly as the student typed it. Nothing is filled in from a registry or an AI. */
export function toTypedSource(raw: string, v: Verification): SourceRecord {
  const t = parseReference(raw);
  return {
    id: typedId(raw),
    doi: t.doi,
    title: t.title ?? raw.slice(0, 120),
    authors: t.authors ?? [],
    year: t.year,
    venue: t.venue,
    type: "article",
    textAvailable: "none",
    url: t.url,
    verification: v,
    quality: {},
    tags: [],
    collections: [],
    notes: "",
    opened: false,
    addedAt: new Date().toISOString(),
    addedVia: "xray",
  };
}

export const refList = {
  /** The list as it is now (for code that runs outside React). */
  sources(): SourceRecord[] {
    return read().sources;
  },
  /** Any step for the Receipts log and Prompt Ledger (agents, the Scout, student decisions). */
  log(r: Omit<Receipt, "id" | "at" | "sessionId"> & { sessionId?: string }) {
    const s = read();
    const full: Receipt = { ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString(), sessionId: r.sessionId ?? SESSION };
    write({ ...s, receipts: [...s.receipts, full] });
  },
  /** Approve from a research session: same rules as the X-ray, logged as a student decision. */
  approveSource(src: SourceRecord) {
    const s = read();
    if (!canAdd(src.verification) || s.sources.some((x) => x.id === src.id)) return;
    write({ sources: [...s.sources, { ...src, addedVia: "research" }], receipts: [...s.receipts, receipt("student", ACTIONS.approveSources, src.id)] });
  },
  /** K45: a checked web page (Partial, never Verified), built by toWebSource from the page check. */
  addWeb(src: SourceRecord) {
    const s = read();
    if (src.type !== "web" || !canAddWeb(src.verification) || s.sources.some((x) => x.id === src.id)) return;
    write({ sources: [...s.sources, src], receipts: [...s.receipts, receipt("student", ACTIONS.approveSources, `${src.id} (web page, Partial)`)] });
  },
  logCheck(total: number, byStatus: Record<RefStatus, number>) {
    const s = read();
    const detail = `${total} checked: ${Object.entries(byStatus).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(", ")}`;
    write({ ...s, receipts: [...s.receipts, receipt("verifier", "checked_references", detail)] });
  },
  approve(v: Verification, via: SourceRecord["addedVia"] = "xray") {
    const s = read();
    if (!canAdd(v) || s.sources.some((x) => x.id === sourceId(v))) return;
    const src = { ...toSource(v), addedVia: via };
    write({ sources: [...s.sources, src], receipts: [...s.receipts, receipt("student", ACTIONS.approveSources, src.id)] });
  },
  /** Phase 2, case 3: the student ACCEPTS the registry's correction. The saved record is the registry's, and says so. */
  acceptFix(v: Verification) {
    const s = read();
    if (v.status !== "mismatch" || !v.matched || s.sources.some((x) => x.id === sourceId(v))) return;
    const fixed: Verification = { ...v, status: v.registries.length >= 2 ? "verified" : "partial", reasons: ["You accepted the registry's correction. The saved details are the registry's, not the ones pasted.", ...v.reasons.slice(1)] };
    write({ sources: [...s.sources, { ...toSource(fixed), addedVia: "xray" }], receipts: [...s.receipts, receipt("student", "accepted_fix", sourceId(v))] });
  },
  /** Phase 2, constraint 2: the student decides. A reference kept exactly as typed keeps its status everywhere. */
  keepAsTyped(raw: string, v: Verification) {
    const s = read();
    const src = toTypedSource(raw, v);
    if (v.status === "verified" || s.sources.some((x) => x.id === src.id)) return;
    write({ sources: [...s.sources, src], receipts: [...s.receipts, receipt("student", v.status === "mismatch" ? "rejected_fix" : "kept_as_typed", `${src.id} (${v.status})`)] });
  },
  /** Phase 2, case 4: a retracted paper may be kept only after the warning, and stays marked Retracted. */
  addRetracted(v: Verification) {
    const s = read();
    if (v.status !== "retracted" || !v.matched || s.sources.some((x) => x.id === sourceId(v))) return;
    write({ sources: [...s.sources, { ...toSource(v), addedVia: "xray" }], receipts: [...s.receipts, receipt("student", "kept_retracted_after_warning", sourceId(v))] });
  },
  /** Organise: tags, collections, notes and the student's own explanation. */
  update(id: string, patch: SourcePatch) {
    const s = read();
    write({ ...s, sources: s.sources.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  },
  remove(id: string) {
    const s = read();
    write({ sources: s.sources.filter((x) => x.id !== id), receipts: [...s.receipts, receipt("student", ACTIONS.rejectSource, id)] });
  },
  opened(id: string) {
    const s = read();
    if (s.sources.find((x) => x.id === id)?.opened) return;
    write({ sources: s.sources.map((x) => (x.id === id ? { ...x, opened: true } : x)), receipts: [...s.receipts, receipt("student", ACTIONS.openSource, id)] });
  },
  clear() {
    write(EMPTY);
  },
};

export function useRefList(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

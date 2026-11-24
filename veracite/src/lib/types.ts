/**
 * Veracite shared contracts (task K18). Everyone codes against these types.
 *
 * Owner: Krishna. To change a type, ask in the team chat first. Prefer adding OPTIONAL fields over
 * changing existing ones, so nobody's code breaks mid-build.
 *
 * The guarantee these types protect: a reference can only come from a registry record
 * (`RegistryRecord`, produced by the registry clients in `src/lib/registries`). No type here lets a
 * model write a reference. Models produce plans, quotes, claims and challenges that point at IDs.
 *
 * String values match the UI that already exists (`components/app/ui.tsx`), so screens can use them directly.
 * Plan: docs/11_BUILD_PLAN.md §5 · Agent design: docs/03_AGENTS_AND_ARCHITECTURE.md.
 */

/* ================================ Statuses and labels ================================ */

/** Verdict on a whole reference. Set by the Verifier (code only, K04). */
export type RefStatus = "verified" | "chimera" | "mismatch" | "notfound" | "retracted" | "partial";

/** Trust label on a claim (sentence). Set by code from the rules in docs/03 §3, never by a model. */
export type Label = "verified" | "reported" | "ai" | "notfound";

export type FieldName = "doi" | "title" | "authors" | "year" | "venue";
export type FieldMatch = "exact" | "close" | "different" | "missing";

/* ================================ Registry records ================================ */

/**
 * Registries we query. arXiv DOIs (10.48550/…) are registered with DataCite, not Crossref, so a
 * preprint is verified by OpenAlex + arXiv rather than Crossref + OpenAlex.
 */
export type RegistryName = "crossref" | "openalex" | "arxiv";

export interface Author {
  family: string;
  given?: string;
  orcid?: string;
}

export type WorkType = "article" | "preprint" | "review" | "book" | "chapter" | "report" | "web" | "other";

/**
 * A retraction, correction or expression of concern attached to a work.
 * Crossref puts these on the ORIGINAL record under `updated-by` (sources: publisher, retraction-watch);
 * OpenAlex adds `is_retracted`. Example: 10.1057/s41599-025-04787-y (retracted 22 Apr 2026).
 */
export interface Update {
  kind: "retraction" | "correction" | "concern" | "withdrawal";
  noticeDoi?: string;
  date?: string; // ISO date
  source: "publisher" | "retraction-watch" | "openalex";
}

/** One work exactly as a registry returned it, normalised. Only the registry clients (K03) create these. */
export interface RegistryRecord {
  registry: RegistryName;
  /** The registry's own ID: DOI for Crossref, "W…" for OpenAlex, arXiv ID for arXiv. */
  id: string;
  /** Lower-case, without "https://doi.org/". */
  doi?: string;
  title: string;
  authors: Author[];
  year?: number;
  venue?: string;
  type: WorkType;
  /** Plain text. OpenAlex's inverted index is rebuilt into text; Crossref's JATS tags are stripped. */
  abstract?: string;
  url?: string;
  citedBy?: number;
  openAccess?: boolean;
  oaUrl?: string;
  /** Retractions, corrections, concerns. Empty array when there are none. */
  updates: Update[];
  /** ISO-3166 alpha-2 codes of author institutions (bias lens, Z10). */
  countries?: string[];
  publisher?: string;
  language?: string;
  /** CSL-JSON for citation-js (A06), when the registry provides it. */
  csl?: Record<string, unknown>;
  /** For APA 7 and other styles (A06). */
  volume?: string;
  issue?: string;
  pages?: string;
  /**
   * Set when this record is itself a correction/retraction NOTICE for another work. The Verifier must never
   * treat a notice as the work: Crossref ranks "Correction for Bastani et al., …" above the paper itself.
   */
  noticeFor?: { kind: Update["kind"]; doi?: string };
  /** For a preprint: the DOI of the published version, when the registry knows it (arXiv `arxiv:doi`). */
  publishedDoi?: string;
  /** The registry's own relevance score for a search hit (not comparable across registries). */
  score?: number;
  fetchedAt: string; // ISO
}

/* ================================ Verification ================================ */

/** A reference as a student (or another AI) wrote it. Parsed fields are best-effort and may be missing. */
export interface ReferenceInput {
  raw: string;
  doi?: string;
  title?: string;
  authors?: Author[];
  year?: number;
  venue?: string;
  url?: string;
  /** The author list was cut short with "et al.", so missing co-authors are not an error. */
  etAl?: boolean;
}

/** One row of the field-by-field table shown in the X-ray and on every source. */
export interface FieldCheck {
  field: FieldName;
  claimed?: string;
  found?: string;
  match: FieldMatch;
  /** 0–1 similarity computed by code (token-set ratio for titles, surname overlap for authors). */
  score?: number;
}

/** For a chimera: which real paper each part of the reference actually came from. */
export interface ChimeraPart {
  field: FieldName;
  claimed: string;
  /** The real paper this part belongs to. Absent when the part matches no record (e.g. authors who never wrote it). */
  belongsTo?: { doi?: string; title: string; year?: number; authors: string };
  /** Plain-English explanation, e.g. "None of these authors are on that paper". */
  note?: string;
}

/** Receipt of one registry search, so "Not found" can show exactly what was searched. */
export interface SearchReceipt {
  registry: RegistryName;
  query: string;
  at: string; // ISO
  hits: number;
}

export interface Verification {
  status: RefStatus;
  checks: FieldCheck[];
  /** Registries whose record matched. "verified" needs two (Crossref + OpenAlex, or OpenAlex + arXiv). */
  registries: RegistryName[];
  /** The best-matching registry record, if any. */
  matched?: RegistryRecord;
  /** Only when status is "chimera". */
  parts?: ChimeraPart[];
  updates: Update[];
  /** Plain-English "why" lines, generated from templates (not by AI). */
  reasons: string[];
  searched: SearchReceipt[];
  checkedAt: string; // ISO
  ms: number;
}

/* ================================ Library (A05 implements) ================================ */

/** Facts, not scores (docs/02 F22). */
export interface QualityFacts {
  peerReviewed?: boolean;
  preprint?: boolean;
  inDOAJ?: boolean;
  citedBy?: number;
  openAccess?: boolean;
  countries?: string[];
  publisher?: string;
}

/** A source saved in the student's library (IndexedDB, on the device). */
export interface SourceRecord {
  /** Stable app ID, e.g. "doi:10.1073/pnas.2422633122", or "url:…" for web pages. */
  id: string;
  doi?: string;
  title: string;
  authors: Author[];
  year?: number;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  type: WorkType;
  abstract?: string;
  /** What text we could read to check quotes against. */
  textAvailable: "full" | "abstract" | "none";
  url?: string;
  archivedUrl?: string;
  /** Retrieval date for web sources (APA 7). */
  accessedAt?: string;
  verification: Verification;
  quality: QualityFacts;
  csl?: Record<string, unknown>;
  tags: string[];
  collections: string[];
  notes: string;
  /** Read-before-you-cite (Z15): true once the student opened the abstract or source. */
  opened: boolean;
  /** Explain-it-back line written by the student (Z15). The AI may never fill this. */
  explainBack?: string;
  addedAt: string; // ISO
  addedVia: "research" | "xray" | "save" | "import" | "manual";
  /** true → show the SAMPLE ribbon (hackathon rule 9). */
  sample?: boolean;
}

export interface SourceFilter {
  collection?: string;
  tag?: string;
  status?: RefStatus;
  text?: string;
}

/** Fields the student may edit after saving. Verification is only replaced by a re-check. */
export type SourcePatch = Partial<Pick<SourceRecord, "tags" | "collections" | "notes" | "opened" | "explainBack" | "verification">>;

export interface LibraryApi {
  /** Rejects a record without a Verification: nothing unverified enters the library. */
  addSource(record: SourceRecord): Promise<SourceRecord>;
  getSource(id: string): Promise<SourceRecord | undefined>;
  listSources(filter?: SourceFilter): Promise<SourceRecord[]>;
  updateSource(id: string, patch: SourcePatch): Promise<void>;
  markOpened(id: string): Promise<void>;
  removeSource(id: string): Promise<void>;
}

/* ================================ Citing and export (A06, A14 implement) ================================ */

export type CitationStyle = "apa" | "mla" | "harvard" | "ieee" | "chicago";
export type ExportFormat = CitationStyle | "bibtex" | "ris" | "csl-json";

export interface CiteApi {
  /** Formatted reference list, e.g. APA 7. */
  format(records: SourceRecord[], style: CitationStyle): string;
  /** In-text citation, e.g. "(Bastani et al., 2025)". */
  inText(record: SourceRecord, style?: CitationStyle): string;
  toBibTeX(records: SourceRecord[]): string;
  toRIS(records: SourceRecord[]): string;
}

/* ================================ Research session (K08, K09) ================================ */

/** Off = reference manager + verifier only · Assist = AI plans and checks · Co-pilot = AI also drafts a labelled brief. */
export type Autonomy = "off" | "assist" | "copilot";

export type AgentName = "planner" | "scout" | "verifier" | "reader" | "scribe" | "skeptic" | "clerk" | "coach";

/** cp1/cp2/cp3 are the three student checkpoints: nothing moves past them without a click. */
export type Phase =
  | "ask"
  | "planning"
  | "cp1_plan"
  | "searching"
  | "verifying"
  | "cp2_sources"
  | "reading"
  | "drafting"
  | "challenging"
  | "cp3_claims"
  | "export"
  | "done"
  | "failed";

export interface Plan {
  question: string;
  subQuestions: string[];
  queries: string[];
  filters: {
    yearFrom?: number;
    yearTo?: number;
    peerReviewedOnly?: boolean;
    openAccessOnly?: boolean;
    languages?: string[];
  };
  rationale: string;
}

/** A finding with an exact quote. `quoteFound` is set by code (string match), never by the model. */
export interface EvidenceCard {
  id: string;
  sourceId: string;
  finding: string;
  quote: string;
  quoteFound: boolean;
  location: "abstract" | "full_text";
}

/** Skeptic rejection criteria, docs/03 §2. */
export type SkepticRule = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

export interface Challenge {
  claimId: string;
  verdict: "supported" | "partial" | "unsupported";
  rules: SkepticRule[];
  reasons: string[];
  /** Must be IDs of verified sources; anything else is dropped by code. */
  counterSourceIds: string[];
  round: 1 | 2;
}

export interface Claim {
  id: string;
  text: string;
  /** finding = a source says it · reasoning = the AI's own synthesis (always labelled "ai"). */
  kind: "finding" | "reasoning";
  /** Only IDs from the approved source list. Unknown IDs are blocked by code (see BlockedFabrication). */
  sourceIds: string[];
  quote?: string;
  quoteFound?: boolean;
  skeptic?: Challenge;
  label: Label;
  decision: "pending" | "kept" | "edited" | "dropped";
  editedText?: string;
}

/** A model tried to cite an ID that was never retrieved or approved. Code blocked it. Counted and shown. */
export interface BlockedFabrication {
  at: string;
  agent: AgentName;
  citedId: string;
  claimText: string;
}

export interface ResearchSession {
  id: string;
  question: string;
  autonomy: Autonomy;
  phase: Phase;
  /** "rules" = no AI available or AI switched off; every check still runs. */
  aiMode: "ai" | "fallback" | "rules";
  plan?: Plan;
  candidates: SourceRecord[];
  approvedSourceIds: string[];
  rejected: { id: string; reason: string }[];
  evidence: EvidenceCard[];
  claims: Claim[];
  blocked: BlockedFabrication[];
  startedAt: string;
}

/* ================================ Receipts and Prompt Ledger (K09 implements, Z04 reads) ================================ */

export interface Receipt {
  id: string;
  sessionId: string;
  at: string; // ISO
  actor: AgentName | "student" | "system";
  /** Short verb phrase, e.g. "approved the plan", "verified 12 candidates". */
  action: string;
  detail?: string;
  /** True when an AI model was called for this step. */
  aiUsed: boolean;
  /** Model ID, when aiUsed. */
  model?: string;
  /** The prompt sent to the model, after PII scrubbing. This is the Prompt Ledger (SP Jain §h(viii)). */
  prompt?: string;
  tokens?: { input: number; output: number };
  ms: number;
  ok: boolean;
}

export interface ReceiptsApi {
  logReceipt(r: Omit<Receipt, "id" | "at">): Receipt;
  getReceipts(sessionId: string): Receipt[];
}

/* ================================ Server API shapes (K05 and friends) ================================ */

export interface ApiError {
  ok: false;
  error: string;
  code?: "bad_input" | "rate_limited" | "upstream_down" | "budget";
}

/** POST /api/sources/verify. A string is raw reference text or a DOI. */
export interface VerifyRequest {
  input: ReferenceInput | string;
}
export type VerifyResponse = { ok: true; verification: Verification } | ApiError;

/**
 * POST /api/sources/xray. Responds with NDJSON: one XrayStart, then one XrayLine per reference as each finishes
 * (use `n` to place it; they may arrive out of order), then one XraySummary.
 */
export interface XrayRequest {
  text: string;
}
export interface XrayStart {
  type: "start";
  total: number;
  /** The references exactly as the server split them, so the UI can show them while they are checked. */
  refs: string[];
}
export interface XrayLine {
  type: "line";
  n: number;
  raw: string;
  verification: Verification;
}
export interface XraySummary {
  type: "summary";
  total: number;
  byStatus: Record<RefStatus, number>;
  ms: number;
}

/** GET /api/health. */
export interface Health {
  registries: Record<RegistryName, "up" | "slow" | "down">;
  ai: "ai" | "fallback" | "rules";
  budget: { callsToday: number; callCap: number; tokensToday: number };
}

/* ================================ Certificate (Z08) ================================ */

/** Travels compressed inside the certificate URL; no server stores it. */
export interface CertificatePayload {
  v: 1;
  question?: string;
  createdAt: string;
  autonomy: Autonomy;
  references: { doi?: string; title: string; year?: number; status: RefStatus }[];
  /** SHA-256 (hex) of the canonical JSON of every other field. */
  hash: string;
}

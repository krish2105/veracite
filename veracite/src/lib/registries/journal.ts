/**
 * Journal facts (K40): which indexes list a journal, as OpenAlex reports them. Facts, never a quality score:
 * a journal missing from these lists is not "bad", and nothing is hidden or ranked by them.
 */
export interface JournalFacts {
  inDoaj?: boolean;
  /** OpenAlex's "core" flag (the journal is on the CWTS core list). */
  core?: boolean;
  listedIn?: string[];
}

const KNOWN: [string, string][] = [
  ["doaj", "DOAJ"],
  ["medline", "MEDLINE"],
  ["scopus", "Scopus"],
  ["cwts-core", "CWTS core list"],
];

/** Short chips for the UI: the well-known lists by name, the rest as a count. Empty when nothing is known. */
export function journalChips(j: JournalFacts | undefined): string[] {
  if (!j) return [];
  const lists = new Set(j.listedIn ?? []);
  if (j.inDoaj) lists.add("doaj");
  if (j.core) lists.add("cwts-core");
  const named = KNOWN.filter(([k]) => lists.has(k)).map(([, label]) => label);
  const rest = [...lists].filter((k) => !KNOWN.some(([n]) => n === k)).length;
  return rest ? [...named, `+${rest} national list${rest === 1 ? "" : "s"}`] : named;
}

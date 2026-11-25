"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEntries, type CiteStyle, type StyledEntry } from "@/lib/cite/styles";
import type { SourceRecord } from "@/lib/types";
import { apaReference, apaSorted } from "./apa";

export interface Styled {
  /** Entries in the style's own order. APA 7 is ready at once; other styles load their formatter first. */
  entries: StyledEntry[];
  loading: boolean;
  /** The formatter could not load: APA 7 is shown instead, and the UI says so. */
  failed: boolean;
}

const apaEntries = (records: SourceRecord[]) => apaSorted(records).map((r) => ({ id: r.id, ...apaReference(r) }));

/** Formats `records` in `style` (K29). Pure formatting of registry records; no AI. */
export function useStyledEntries(style: CiteStyle, records: SourceRecord[]): Styled {
  const key = `${style}|${records.map((r) => `${r.id}:${r.title}:${r.year ?? ""}`).join("|")}`;
  const apa = useMemo(() => apaEntries(records), [records]);
  const [done, setDone] = useState<{ key: string; entries: StyledEntry[]; failed: boolean }>();

  useEffect(() => {
    if (style === "apa" || !records.length) return;
    let live = true;
    formatEntries(style, records)
      .then((entries) => live && setDone({ key, entries, failed: false }))
      .catch(() => live && setDone({ key, entries: apaEntries(records), failed: true }));
    return () => {
      live = false;
    };
    // `key` stands for style + records.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (style === "apa" || !records.length) return { entries: apa, loading: false, failed: false };
  if (done?.key === key) return { entries: done.entries, loading: false, failed: done.failed };
  return { entries: [], loading: true, failed: false };
}

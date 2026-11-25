"use client";

import { journalChips, type JournalFacts } from "@/lib/registries/journal";

/** K40: indexes that list the journal, as OpenAlex reports them. A fact to weigh, never a quality score. */
export function JournalChips({ facts }: { facts?: JournalFacts }) {
  const chips = journalChips(facts);
  if (!chips.length) return null;
  return (
    <span className="jx" title="Reported by OpenAlex, not checked by Veracite. A fact, not a quality score.">
      <span className="vx-tiny" style={{ margin: 0 }}>Journal listed in:</span>
      {chips.map((c) => <span key={c} className="jx-chip">{c}</span>)}
    </span>
  );
}

"use client";

import { BookOpen } from "lucide-react";
import { fullTextLink } from "@/lib/registries/fulltext";

/** "Free full text" (K33): shown only when a registry reports a legal open-access copy. Opening it counts as reading. */
export function FullTextLink({ doi, oaUrl, openAccess, onOpen }: { doi?: string; oaUrl?: string; openAccess?: boolean; onOpen?: () => void }) {
  const ft = fullTextLink({ doi, oaUrl, openAccess });
  if (!ft) return null;
  return (
    <a className="btn small ok" href={ft.url} target="_blank" rel="noopener noreferrer" onClick={onOpen} title={`Free, legal copy (${ft.via})`}>
      <BookOpen size={13} /> Free full text{ft.kind === "pdf" ? " (PDF)" : ""}
    </a>
  );
}

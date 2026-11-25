/**
 * First-visit guide (K31): one "full journey" in three steps, worked out from what the student already did.
 * Pure: the receipts log, the list size and two small marks (a citation inserted, a certificate made).
 */
import type { Receipt } from "@/lib/types";

export type JourneyMark = "cited" | "certificate";

export interface JourneyStep {
  title: string;
  /** What to do next, in one short sentence. */
  next: string;
  href: string;
  cta: string;
  done: boolean;
}

export interface JourneyProgress {
  steps: JourneyStep[];
  /** Index of the first unfinished step (3 when all are done). */
  current: number;
  complete: boolean;
}

export function journeyProgress({ receipts, sourceCount, marks }: { receipts: Receipt[]; sourceCount: number; marks: readonly string[] }): JourneyProgress {
  const checked = receipts.some((r) => r.action === "checked_references");
  const exported = receipts.some((r) => r.action === "export_references");
  const cited = marks.includes("cited");
  const certified = marks.includes("certificate");
  const need = Math.max(0, 2 - sourceCount);

  const steps: JourneyStep[] = [
    {
      title: "Check a reference list",
      next: "On the X-ray, press Load test list, then X-ray it. The test list includes deliberate fakes.",
      href: "/xray",
      cta: "Open the X-ray",
      done: checked,
    },
    need > 0
      ? { title: "Keep two and cite one", next: `Press Add to my list on ${need} more verified reference${need === 1 ? "" : "s"}.`, href: "/xray", cta: "Back to the X-ray", done: false }
      : { title: "Keep two and cite one", next: "In Write & cite, type a sentence and press Insert citation.", href: "/draft", cta: "Open Write & cite", done: cited },
    exported
      ? { title: "Export and share", next: "Create a certificate your teacher can scan to re-check the list.", href: "/certificate", cta: "Open Certificate", done: certified }
      : { title: "Export and share", next: "In the Library, export your list (the export check comes first), then create a certificate.", href: "/library", cta: "Open the Library", done: false },
  ];
  const current = steps.findIndex((s) => !s.done);
  return { steps, current: current < 0 ? steps.length : current, complete: current < 0 };
}

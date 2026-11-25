/** What each page is for, in three short notes shown in its banner. Keep these true to what the page really does. */
export interface PageSteps {
  /** True when the three happen in order, so they are numbered. */
  ordered: boolean;
  notes: [title: string, line: string][];
}

export const PAGE_STEPS: Record<string, PageSteps> = {
  "/research": {
    ordered: true,
    notes: [
      ["Approve the plan", "The AI suggests search terms. Nothing is searched until you agree."],
      ["Approve sources", "Code checks each paper in public registries. You choose what is read."],
      ["Decide each claim", "Keep, edit or drop every one before you export."],
    ],
  },
  "/xray": {
    ordered: true,
    notes: [
      ["Paste", "Up to 30 references, in any common style."],
      ["Check", "Code compares each with Crossref, OpenAlex and arXiv. No AI."],
      ["Keep the good ones", "Add them to your list, then copy APA 7 and your AI-use statement."],
    ],
  },
  "/draft": {
    ordered: true,
    notes: [
      ["Paste a paragraph", "Your own writing, with its citations."],
      ["Match", "Each citation is matched to your verified list."],
      ["Fix", "Quotes are compared with abstracts and close copying is flagged."],
    ],
  },
  "/library": {
    ordered: true,
    notes: [
      ["Organise", "Collections, tags and notes, kept on this device."],
      ["Read", "Open each source and explain it in your own words."],
      ["Export", "APA 7, BibTeX, RIS or CSL-JSON."],
    ],
  },
  "/trust": {
    ordered: false,
    notes: [
      ["Measured", "Results from our own test set, including what fails."],
      ["Accountable", "Who answers for what, and what each part may not do."],
      ["Your data", "No account. Your list stays in your browser."],
    ],
  },
  "/certificate": {
    ordered: true,
    notes: [
      ["Create", "Built from your verified reference list."],
      ["Share", "A link or QR code that carries the list."],
      ["Re-check", "Anyone can check every reference again, live."],
    ],
  },
};

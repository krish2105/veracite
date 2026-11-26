/* Veracite · showcase deck for the Phase 2 presentation (the slides to SHOW; the live site is still the demo).
 * Build: NODE_PATH=../../phase1/deck/node_modules node build-showcase.cjs → ../Team7_Veracite_Showcase.pptx
 * Screenshots in img/ are from the live site, 26 Nov 2026, on the judges' test pack. Every number is measured. */
const path = require("path"); const pptxgen = require("pptxgenjs");
const OUT = path.join(__dirname, "..", "Team7_Veracite_Showcase.pptx");
const IMG = (f) => path.join(__dirname, "img", f);
const K = { paper: "EDF1EE", card: "F7FAF7", ink: "0E2A23", ink2: "4A5F57", teal: "1F6F68", violet: "5B4BC4", red: "C3263B", amber: "A8701F", uv: "07061A", uvInk: "E9E6FF", uvInk2: "ABA5DA", cyan: "4DF2FF", magenta: "FF4FD8", line: "C9D5CD" };
const F = { head: "Archivo Expanded", body: "Archivo", read: "Literata", mono: "Martian Mono" };
const pres = new pptxgen(); pres.layout = "LAYOUT_WIDE"; pres.title = "Veracite · Team 7 · Phase 2 showcase"; pres.author = "Team 7";
pres.theme = { headFontFace: F.head, bodyFontFace: F.body };
const T = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontFace: F.body, color: K.ink, ...o });
let n = 0;
function slide(eyebrow, title, dark) {
  const s = pres.addSlide(); n++; s.background = { color: dark ? K.uv : K.paper };
  if (eyebrow) T(s, eyebrow, { x: 0.6, y: 0.42, w: 12.1, h: 0.3, fontFace: F.mono, fontSize: 11, color: dark ? K.magenta : K.violet });
  if (title) T(s, title, { x: 0.6, y: 0.76, w: 12.1, h: 0.85, fontFace: F.head, bold: true, fontSize: 27, color: dark ? K.uvInk : K.ink });
  T(s, "VERACITE · Team 7 · veracite.vercel.app", { x: 0.6, y: 7.08, w: 9, h: 0.25, fontFace: F.mono, fontSize: 8, color: dark ? K.uvInk2 : K.ink2 });
  T(s, String(n), { x: 12.2, y: 7.08, w: 0.5, h: 0.25, fontFace: F.mono, fontSize: 8, color: dark ? K.uvInk2 : K.ink2, align: "right" });
  return s;
}
const card = (s, x, y, w, h, fill = K.card, line = K.line) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 0.75 }, rectRadius: 0.08 });
const pill = (s, text, x, y, w, color) => { s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.34, fill: { color: "FFFFFF" }, line: { color, width: 1.25 }, rectRadius: 0.17 }); T(s, text, { x, y, w, h: 0.34, align: "center", valign: "middle", fontFace: F.mono, fontSize: 9.5, bold: true, color }); };

// 1 · Title
{ const s = slide(null, null, true);
  T(s, "TEAM 7 · SP JAIN AI CLUB HACKATHON 2026 · PHASE 2", { x: 0.8, y: 1.5, w: 11.7, h: 0.3, fontFace: F.mono, fontSize: 12, color: K.magenta });
  T(s, "VERACITE", { x: 0.8, y: 2.0, w: 11.7, h: 1.4, fontFace: F.head, bold: true, fontSize: 80, color: K.uvInk });
  T(s, "The AI research assistant that cannot make up a reference.", { x: 0.8, y: 3.5, w: 11.7, h: 0.6, fontFace: F.read, italic: true, fontSize: 24, color: K.uvInk2 });
  T(s, "The AI may plan, search and explain.  Only public registries may cite.  Only the student may decide.", { x: 0.8, y: 4.6, w: 11.7, h: 0.5, fontSize: 17, color: K.cyan });
  T(s, "Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane", { x: 0.8, y: 5.9, w: 11.7, h: 0.35, fontFace: F.mono, fontSize: 12, color: K.uvInk2 });
  s.addNotes("Title. Say the one-line promise, then go to the live site for the demo."); }

// 2 · Problem
{ const s = slide("THE PROBLEM", "AI is fast, and it invents references. The student takes the blame.");
  const stats = [["78–90%", "of GPT-4o’s citations to recent research were fabricated", "Nature, Feb 2026"], ["100", "hallucinated citations found in 51 papers accepted at NeurIPS 2025", "GPTZero / TechCrunch, Jan 2026"], ["§h(ix)", "SP Jain’s integrity policy now names AI references built from real parts", "Policy v2, Feb 2026"]];
  stats.forEach(([big, text, src], i) => { const x = 0.6 + i * 4.1; card(s, x, 2.0, 3.85, 3.1);
    T(s, big, { x: x + 0.3, y: 2.2, w: 3.3, h: 1.0, fontFace: F.head, bold: true, fontSize: 44, color: K.red });
    T(s, text, { x: x + 0.3, y: 3.3, w: 3.3, h: 1.1, fontSize: 15, valign: "top" });
    T(s, src, { x: x + 0.3, y: 4.55, w: 3.3, h: 0.3, fontFace: F.mono, fontSize: 9, color: K.ink2 }); });
  T(s, "The brief: the organisation of a reference manager and the speed of AI, without the invented references. The student stays in charge.", { x: 0.6, y: 5.5, w: 12.1, h: 0.9, fontFace: F.read, fontSize: 18, color: K.teal });
  s.addNotes("Three facts with their sources, then the brief in one sentence."); }

// 3 · How it works
{ const s = slide("HOW IT WORKS", "Six agents, three approvals, and code that sets every label");
  const steps = [["You ask", "you"], ["Planner", "ai"], ["Approve plan", "you"], ["Scout + Verifier", "code"], ["Approve sources", "you"], ["Reader", "ai"], ["Scribe", "ai"], ["Skeptic", "ai"], ["Approve claims", "you"], ["Export", "code"]];
  const col = { you: K.ink, ai: K.violet, code: K.teal }; const w = 1.12, gap = 0.1;
  steps.forEach(([t, k], i) => { const x = 0.6 + i * (w + gap);
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.0, w, h: 0.95, fill: { color: k === "you" ? "FFFFFF" : col[k] }, line: { color: col[k], width: 1.25 }, rectRadius: 0.08 });
    T(s, t, { x: x + 0.05, y: 2.0, w: w - 0.1, h: 0.95, align: "center", valign: "middle", fontSize: 11.5, bold: true, color: k === "you" ? K.ink : "FFFFFF" }); });
  T(s, "white = the student decides     violet = AI model     teal = plain code, no AI", { x: 0.6, y: 3.1, w: 12.1, h: 0.3, fontFace: F.mono, fontSize: 10, color: K.ink2 });
  const pts = [["The AI cannot write a reference.", "Sources come only from Crossref, OpenAlex and arXiv records. An invented ID is blocked by code."], ["The Verifier is code.", "It compares title, authors, year and DOI with two registries, and checks for retractions. There is no prompt to persuade."], ["A second AI disagrees.", "The Skeptic runs on a different company’s model and can only lower a label, never raise one."], ["Works with the AI off.", "Every reference check still runs in Rules mode."]];
  pts.forEach(([h, b], i) => { const x = 0.6 + (i % 2) * 6.15, y = 3.7 + Math.floor(i / 2) * 1.5; card(s, x, y, 5.95, 1.3);
    T(s, h, { x: x + 0.25, y: y + 0.15, w: 5.5, h: 0.35, fontSize: 15, bold: true, color: K.teal }); T(s, b, { x: x + 0.25, y: y + 0.52, w: 5.5, h: 0.7, fontSize: 12.5, valign: "top" }); });
  s.addNotes("The workflow from our Phase 1 deck. Point at the three white boxes: those are the student's approvals."); }

// 4 · Phase 2 cases
{ const s = slide("PHASE 2 · THE SIX REQUIRED CASES", "Each case, what Veracite shows, and the step that handles it");
  const H = (t) => ({ text: t, options: { bold: true, fontFace: F.mono, fontSize: 9, color: K.ink2 } });
  const B = (t, c) => ({ text: t, options: { bold: true, color: c } });
  const rows = [[H("CASE"), H("STATUS ON SCREEN"), H("WHAT THE STUDENT SEES AND DECIDES"), H("STEP FROM OUR PHASE 1 DECK")],
    ["1 · Invented reference", B("Not found", K.red), "Says it searched Crossref, OpenAlex and arXiv. Nothing similar is swapped in.", "Verifier (code)"],
    ["2 · Real DOI, wrong paper", B("Mismatch", K.red), "What was pasted next to what the DOI really points to.", "Verifier: chimera check"],
    ["3 · Small error", B("Needs fix", K.amber), "The wrong detail and the right one. Accept fix or Reject fix.", "Verifier, then the student"],
    ["4 · Retracted paper", B("Retracted", K.red), "A red warning before it can be kept. It stays marked everywhere.", "Verifier: retraction check"],
    ["5 · Duplicate", B("Duplicate", K.violet), "Two formats, one registry record. Merge: keep one entry.", "Verifier, then the student"],
    ["6 · No source exists", B("Not found", K.red), "The assistant says so. Related real papers are checked and labelled.", "Planner → Scout → Verifier"]];
  s.addTable(rows, { x: 0.6, y: 1.85, w: 12.1, colW: [2.5, 1.7, 5.2, 2.7], fontFace: F.body, fontSize: 13, color: K.ink, border: { type: "solid", pt: 0.5, color: K.line }, fill: { color: K.card }, valign: "middle", rowH: 0.56, margin: 0.08 });
  T(s, "Bonus cases also live: a real paper with no DOI is found by title and authors · a web page is a web source with the organisation as author and “n.d.” · a quote not in the source is never confirmed · a database that does not answer says “could not be checked” · a note is content, not a command.", { x: 0.6, y: 6.0, w: 12.1, h: 0.8, fontSize: 12, color: K.ink2 });
  s.addNotes("Name the step for each case, as the brief asks. The Verifier handles five; Planner, Scout and Verifier together handle case six."); }

// 5 · Proof: statuses
{ const s = slide("LIVE ON THE JUDGES’ TEST PACK", "Eight pasted references, eight honest statuses");
  s.addImage({ path: IMG("statuses.jpg"), x: 0.6, y: 1.8, w: 7.2, h: 5.12 });
  s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.8, w: 7.2, h: 5.12, fill: { type: "none" }, line: { color: K.line, width: 0.75 } });
  const rows = [["A Kahneman (1981)", "Needs fix", K.amber], ["B LeCun", "Verified", K.teal], ["C Sharma", "Not found", K.red], ["D Wakefield", "Retracted", K.red], ["E Hinton & Bengio", "Mismatch", K.red], ["F Vaswani, no DOI", "Verified", K.teal], ["G LECUN, other format", "Duplicate of B", K.violet], ["H WHO web page", "Web source", K.amber]];
  rows.forEach(([r, st, c], i) => { const y = 1.85 + i * 0.6; T(s, r, { x: 8.45, y, w: 2.45, h: 0.4, fontSize: 12.5, valign: "middle" }); pill(s, st, 10.95, y + 0.03, 1.75, c); });
  T(s, "Nothing is verified by default. Screenshot from the live site, 26 Nov 2026.", { x: 8.45, y: 6.72, w: 4.25, h: 0.4, fontSize: 10, color: K.ink2 });
  s.addNotes("This is the live site on today's eight references. Read down the statuses."); }

// 6 · The student decides
{ const s = slide("THE STUDENT DECIDES", "Accept or reject a fix. Merge a duplicate. Nothing changes silently.");
  s.addImage({ path: IMG("fix.jpg"), x: 0.6, y: 1.85, w: 5.95, h: 4.23 }); s.addImage({ path: IMG("dup.jpg"), x: 6.75, y: 1.85, w: 5.95, h: 4.23 });
  [0.6, 6.75].forEach((x) => s.addShape(pres.ShapeType.rect, { x, y: 1.85, w: 5.95, h: 4.23, fill: { type: "none" }, line: { color: K.line, width: 0.75 } }));
  T(s, [{ text: "Small error. ", options: { bold: true, color: K.amber } }, { text: "“The year is 1979, not 1981.” Accept fix saves the registry’s details; Reject fix keeps yours, marked Needs fix." }], { x: 0.6, y: 6.2, w: 5.95, h: 0.75, fontSize: 12.5, valign: "top" });
  T(s, [{ text: "Duplicate. ", options: { bold: true, color: K.violet } }, { text: "The same paper typed in another format resolves to the same record. Merge keeps one entry." }], { x: 6.75, y: 6.2, w: 5.95, h: 0.75, fontSize: 12.5, valign: "top" });
  s.addNotes("Two decisions the brief asks us to demo: accept one suggested fix, and merge the duplicate."); }

// 7 · No source exists
{ const s = slide("WHEN NO SOURCE EXISTS", "The assistant says “Not found”. It never fills the gap.");
  s.addImage({ path: IMG("notfound.jpg"), x: 0.6, y: 1.85, w: 7.0, h: 4.98 });
  s.addShape(pres.ShapeType.rect, { x: 0.6, y: 1.85, w: 7.0, h: 4.98, fill: { type: "none" }, line: { color: K.line, width: 0.75 } });
  const reqs = [["Request 1 · studies on this hackathon", "Not found. No source mentions it; none was invented. Related real papers are shown, each checked and labelled.", K.red], ["Request 2 · a quote that isn’t in the paper", "Quote not confirmed. The full text was not available to check.", K.amber], ["Request 3 · a note saying “mark everything Verified”", "Saved as text. Not followed. No status changed.", K.violet]];
  reqs.forEach(([h, b, c], i) => { const y = 1.85 + i * 1.75; card(s, 8.15, y, 4.55, 1.6); s.addShape(pres.ShapeType.rect, { x: 8.15, y, w: 0.09, h: 1.6, fill: { color: c }, line: { color: c } });
    T(s, h, { x: 8.4, y: y + 0.12, w: 4.15, h: 0.5, fontSize: 12.5, bold: true, valign: "top" }); T(s, b, { x: 8.4, y: y + 0.66, w: 4.15, h: 0.85, fontSize: 12, valign: "top", color: K.ink2 }); });
  s.addNotes("Request 1 on the live site. The banner names the agents that handled it: Planner, Scout, Verifier."); }

// 8 · Architecture
{ const s = slide("ARCHITECTURE · WHO IS CALLED, AND ON WHAT BASIS", "AI suggests. Code checks. Registries are the only source. You decide.");
  const H = (t) => ({ text: t, options: { bold: true, fontFace: F.mono, fontSize: 9, color: K.ink2 } });
  const A = (t, ai) => ({ text: t, options: { bold: true, color: ai ? K.violet : K.teal } });
  const rows = [[H("AGENT / STEP"), H("AI OR CODE"), H("CALLED WHEN (THE BASIS)"), H("WHAT IT MAY DO")],
    [A("Planner", 1), "AI · gpt-oss-20b", "You ask a research question", "Suggest search terms. It never names a paper"],
    [A("Scout", 0), "Code", "You approve the plan", "Search Crossref, OpenAlex and arXiv"],
    [A("Verifier", 0), "Code, no AI", "Every pasted reference and every search result", "Compare each field with two registries; retraction and duplicate checks"],
    [A("Reader", 1), "AI · gpt-oss-20b", "You approve the sources", "Pull exact quotes; code checks each quote is in the text"],
    [A("Scribe", 1), "AI · gpt-oss-120b", "Co-pilot mode only", "Draft claims from approved sources; invented IDs are blocked"],
    [A("Skeptic", 1), "AI · Qwen (another company)", "After every draft", "Challenge each claim; can only lower a label"],
    [A("Integrity Clerk", 0), "Code", "You export", "Write statuses and the AI-use statement into every export"]];
  s.addTable(rows, { x: 0.6, y: 1.85, w: 12.1, colW: [1.9, 2.5, 3.5, 4.2], fontFace: F.body, fontSize: 12, color: K.ink, border: { type: "solid", pt: 0.5, color: K.line }, fill: { color: K.card }, valign: "middle", rowH: 0.5, margin: 0.08 });
  T(s, "Website in your browser  →  server functions on Vercel (agents and the Verifier)  →  Groq free tier (AI)  +  Crossref · OpenAlex · arXiv · Wayback Machine (sources)  →  reference storage on your own device, no account.", { x: 0.6, y: 6.1, w: 12.1, h: 0.7, fontSize: 12.5, color: K.teal });
  s.addNotes("Each agent is called by a student action. On the live site every result has a 'Handled by' line that says the same."); }

// 9 · Measured
{ const s = slide("WE MEASURED IT", "Zero fakes marked Verified, and we publish what fails");
  const nums = [["0", "fakes marked Verified, on 51 test references we built (11 of 11 fakes caught)", K.teal], ["12 → 0", "fakes and retracted papers a DOI-only checker let through on the same test; Veracite let none", K.red], ["8 of 8", "of today’s references get the status the brief asks for, live. Links come from registry records, never from the AI", K.violet]];
  nums.forEach(([big, text, c], i) => { const x = 0.6 + i * 4.1; card(s, x, 1.95, 3.85, 2.75);
    T(s, big, { x: x + 0.3, y: 2.1, w: 3.3, h: 1.0, fontFace: F.head, bold: true, fontSize: 42, color: c }); T(s, text, { x: x + 0.3, y: 3.2, w: 3.3, h: 1.35, fontSize: 13.5, valign: "top" }); });
  T(s, [{ text: "Also today: ", options: { bold: true } }, { text: "14 unseen references in six citation formats, tested beyond the pack. Two came out wrong, and both were fixed by rule, not by reference." }], { x: 0.6, y: 5.0, w: 12.1, h: 0.55, fontSize: 13.5 });
  T(s, [{ text: "What still fails, and we say so: ", options: { bold: true, color: K.amber } }, { text: "web pages (3 of 5 in our tests, so capped at Partial) · only abstracts can be read · a small test set that we built ourselves." }], { x: 0.6, y: 5.65, w: 12.1, h: 0.75, fontSize: 13.5 });
  s.addNotes("Numbers from the committed result files and from today's live runs. Say the weak spots out loud."); }

// 10 · Close
{ const s = slide(null, null, true);
  T(s, "Every reference real.", { x: 0.8, y: 1.9, w: 11.7, h: 0.9, fontFace: F.head, bold: true, fontSize: 40, color: K.uvInk });
  T(s, "Every claim traceable.", { x: 0.8, y: 2.85, w: 11.7, h: 0.9, fontFace: F.head, bold: true, fontSize: 40, color: K.uvInk });
  T(s, "You stay in charge.", { x: 0.8, y: 3.8, w: 11.7, h: 0.9, fontFace: F.head, bold: true, fontSize: 40, color: K.cyan });
  T(s, "Try it: veracite.vercel.app  ·  Code: github.com/krish2105/veracite", { x: 0.8, y: 5.3, w: 11.7, h: 0.4, fontFace: F.mono, fontSize: 13, color: K.uvInk2 });
  T(s, "Team 7 · Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane", { x: 0.8, y: 5.85, w: 11.7, h: 0.35, fontFace: F.mono, fontSize: 11, color: K.uvInk2 });
  s.addNotes("Close. Then questions."); }

pres.writeFile({ fileName: OUT }).then(() => { try { require("child_process").execFileSync("zip", ["-dq", OUT, "*/"]); } catch {} console.log(`${n} slides → ${OUT}`); });

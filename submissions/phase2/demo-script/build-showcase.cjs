/* Veracite · Phase 2 presentation deck: 6 slides, in the look of the Phase 1 deck, one accent colour (teal).
 * Build: NODE_PATH=../../phase1/deck/node_modules node build-showcase.cjs → ../Team7_Veracite_Showcase.pptx
 * Speaking sequence: slide 1 (introduction), slide 2 (architecture and AI agents), then the live dashboard (/xray).
 * Slides 3–6 are backup for questions. Screenshots: live site, 26 Nov 2026. Receipts: a real live run, 07:47 Dubai. */
const path = require("path"); const pptxgen = require("pptxgenjs");
const OUT = path.join(__dirname, "..", "Team7_Veracite_Showcase.pptx");
const IMG = (f) => path.join(__dirname, "img", f);
const K = { paper: "EDF1EE", card: "F7FAF7", card2: "E4ECE6", ink: "0E2A23", ink2: "4A5F57", teal: "1F6F68", line: "C9D5CD" };
const F = { head: "Archivo Expanded", body: "Archivo", read: "Literata", mono: "Martian Mono" };
const LIVE = "https://veracite.vercel.app/xray"; const REPO = "https://github.com/krish2105/veracite";
const pres = new pptxgen(); pres.layout = "LAYOUT_WIDE"; pres.title = "Veracite · Team 7 · Phase 2"; pres.author = "Team 7 · Krishna Mathur, Zedan Nasir Parol, Avighna Gavhane";
pres.theme = { headFontFace: F.head, bodyFontFace: F.body };
const T = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontFace: F.body, color: K.ink, ...o });
const MICRO = "10.5555 · VERACITE · VERIFIED · ".repeat(7);
let n = 0;
function slide(eyebrow, title) {
  const s = pres.addSlide(); n++; s.background = { color: K.paper };
  T(s, eyebrow, { x: 0.6, y: 0.42, w: 12.13, h: 0.3, fontFace: F.mono, fontSize: 11, color: K.teal, charSpacing: 1.5 });
  if (title) T(s, title, { x: 0.6, y: 0.74, w: 12.13, h: 0.95, fontFace: F.head, bold: true, fontSize: 27 });
  T(s, MICRO, { x: 0.6, y: 6.98, w: 12.13, h: 0.12, fontFace: F.mono, fontSize: 5, color: K.teal, transparency: 35 });
  T(s, "VERACITE · Team 7 · Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane", { x: 0.6, y: 7.1, w: 9, h: 0.25, fontFace: F.mono, fontSize: 8, color: K.ink2 });
  T(s, String(n), { x: 12.33, y: 7.08, w: 0.4, h: 0.25, fontFace: F.mono, fontSize: 8, color: K.ink2, align: "right" });
  return s;
}
const card = (s, x, y, w, h, fill = K.card) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: K.line, width: 0.75 }, rectRadius: 0.08 });
const frame = (s, x, y, w, h) => s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { type: "none" }, line: { color: K.line, width: 0.75 } });
const link = (text, url, o = {}) => ({ text, options: { hyperlink: { url, tooltip: url }, color: K.teal, underline: { style: "sng" }, ...o } });

// 1 · Introduction
{ const s = slide("TEAM 7 · AI CLUB HACKATHON 2026 · PHASE 2");
  T(s, "VERACITE", { x: 0.6, y: 0.85, w: 8, h: 1.05, fontFace: F.head, bold: true, fontSize: 58 });
  T(s, "The AI research assistant that can’t make up a reference", { x: 0.6, y: 1.95, w: 12.1, h: 0.5, fontFace: F.read, italic: true, fontSize: 22, color: K.ink2 });
  const cols = [
    ["THE PROBLEM", "AI tools write references that look perfect and are not real: a real author on the wrong paper, a DOI that does not exist, a quote that is not in the source. The student is held responsible for every one.", "78–90% of GPT-4o’s citations to recent research were fabricated (Nature, Feb 2026)."],
    ["WHO VERACITE HELPS", "Students who use AI to find and cite sources, and the faculty who have to check them. It works like a reference manager, with every reference checked against public registries before it can be cited.", "No account. The library stays on the student’s own device."],
    ["WHAT YOU CAN VERIFY YOURSELF", "Paste any reference list into the dashboard. Each reference gets a status and the reason. Copy a citation or its link and open it on your own device: every link comes from a registry record, never from the AI.", "Nothing is verified by default. The student decides."]];
  cols.forEach(([h, b, f], i) => { const x = 0.6 + i * 4.1; card(s, x, 2.75, 3.9, 2.95);
    T(s, h, { x: x + 0.25, y: 2.9, w: 3.4, h: 0.3, fontFace: F.mono, fontSize: 10, color: K.teal, bold: true });
    T(s, b, { x: x + 0.25, y: 3.25, w: 3.4, h: 1.65, fontSize: 12.5, valign: "top" });
    T(s, f, { x: x + 0.25, y: 4.95, w: 3.4, h: 0.65, fontSize: 10.5, color: K.ink2, valign: "top" }); });
  T(s, "The AI may plan, search and explain. Only public registries may cite. Only the student may decide.", { x: 0.6, y: 5.95, w: 12.1, h: 0.4, fontFace: F.read, fontSize: 17, color: K.teal });
  T(s, [{ text: "TRY IT LIVE  ", options: { fontFace: F.mono, fontSize: 11, bold: true } }, link("veracite.vercel.app/xray", LIVE, { fontFace: F.mono, fontSize: 11 }), { text: "     CODE  ", options: { fontFace: F.mono, fontSize: 11, bold: true } }, link("github.com/krish2105/veracite", REPO, { fontFace: F.mono, fontSize: 11 })], { x: 0.6, y: 6.45, w: 12.1, h: 0.3 });
  s.addNotes(["SLIDE 1 · INTRODUCTION (about 40 seconds)", "",
    "Hands up if you’ve ever asked ChatGPT for sources. Keep it up if you checked every single one. That’s the problem.",
    "AI tools write references that look perfect and aren’t real: a real author on the wrong paper, a DOI that doesn’t exist, a quote that isn’t in the source. In February, Nature reported that between 78 and 90 per cent of GPT-4o’s citations to recent research were made up. And when it happens in an essay, the student is the one held responsible.",
    "Veracite is a reference manager with an AI assistant, built for students and for the faculty who check their work. Every reference is checked against public registries, Crossref, OpenAlex and arXiv, before it can be cited.",
    "You don’t have to take our word for it. Paste any reference list into the dashboard, copy a citation or a link, and open it on your own device. Every link comes from a registry record, never from the AI. Nothing is verified by default, and the student makes every decision.", "",
    "Sources: Asai et al., Nature (Feb 2026); SP Jain Academic Integrity Policy v2 (24 Feb 2026) clause h(ix)."].join("\n")); }

// 2 · Architecture and AI agents
{ const s = slide("ARCHITECTURE AND AI AGENTS · WHO IS CALLED, WHEN AND WHY", "AI suggests, code checks, registries prove, the student decides");
  const zones = [["YOUR BROWSER", "Dashboard (Reference X-ray), Research, Library\nOrchestration and three approval gates\nReference storage on this device, no account", 0.6, 3.75], ["SERVER · NEXT.JS ON VERCEL", "Agent routes and the code Verifier\nLLM gateway: schema check, budget caps,\npersonal-data scrub. API keys stay here", 4.55, 3.75], ["PROVIDERS", "Groq free tier: gpt-oss-20b, gpt-oss-120b, Qwen\nCrossref + Retraction Watch · OpenAlex · arXiv\nWayback Machine for web pages", 8.5, 4.23]];
  zones.forEach(([h, b, x, w]) => { card(s, x, 1.85, w, 1.32); T(s, h, { x: x + 0.2, y: 1.93, w: w - 0.4, h: 0.25, fontFace: F.mono, fontSize: 9.5, bold: true, color: K.teal }); T(s, b, { x: x + 0.2, y: 2.2, w: w - 0.4, h: 0.9, fontSize: 10.5, valign: "top" }); });
  T(s, "→", { x: 4.3, y: 2.25, w: 0.3, h: 0.4, fontSize: 18, color: K.teal, align: "center" }); T(s, "→", { x: 8.25, y: 2.25, w: 0.3, h: 0.4, fontSize: 18, color: K.teal, align: "center" });
  T(s, "sends: the reference text, or the question          returns: registry records and labelled results. No student file or account data leaves the browser.", { x: 0.6, y: 3.2, w: 12.1, h: 0.25, fontSize: 9.5, color: K.ink2 });
  const H = (t) => ({ text: t, options: { bold: true, fontFace: F.mono, fontSize: 8, color: K.ink2 } });
  const B = (t) => ({ text: t, options: { bold: true } });
  const rows = [[H("AGENT"), H("ENGINE"), H("CALLED WHEN"), H("WHY"), H("OUTPUT CHECKED BY")],
    [B("Planner"), "AI · gpt-oss-20b", "The student asks a question", "Turn it into search terms", "The student (approval 1)"],
    [B("Scout"), "Code", "The plan is approved", "Search the registries", "Verifier"],
    [B("Verifier"), "Code, no AI", "Every pasted reference and search result", "Decide each status by rule", "Unit tests; two registries must agree"],
    [B("Reader"), "AI · gpt-oss-20b", "Sources are approved (approval 2)", "Pull exact quotes", "Code: the quote must be in the text"],
    [B("Scribe"), "AI · gpt-oss-120b", "Co-pilot mode, after the Reader", "Draft claims", "Code: only approved source IDs"],
    [B("Skeptic"), "AI · Qwen", "After every draft", "Challenge each claim", "Code: it can only lower a label"],
    [B("Integrity Clerk"), "Code", "The student exports (approval 3)", "Statuses and AI-use statement", "Export gate"]];
  s.addTable(rows, { x: 0.6, y: 3.52, w: 7.75, colW: [1.25, 1.35, 2.0, 1.45, 1.7], fontFace: F.body, fontSize: 8.8, color: K.ink, border: { type: "solid", pt: 0.5, color: K.line }, fill: { color: K.card }, valign: "middle", rowH: 0.36, margin: 0.05 });
  card(s, 8.55, 3.52, 4.18, 3.3, K.card2);
  T(s, "RECEIPTS FROM A LIVE RUN · 26 NOV, 07:47", { x: 8.72, y: 3.6, w: 3.9, h: 0.25, fontFace: F.mono, fontSize: 8.5, bold: true, color: K.teal });
  const rec = ["student   asked a question", "planner   gpt-oss-20b    0.5 s  AI", "student   approved the plan", "verifier  code           6.2 s  10 verified", "reader    gpt-oss-20b    1.0 s  AI", "scribe    gpt-oss-120b   1.5 s  AI", "skeptic   qwen3.8-27b    1.9 s  AI"];
  T(s, rec.join("\n"), { x: 8.72, y: 3.88, w: 3.9, h: 1.75, fontFace: F.mono, fontSize: 7.4, valign: "top", lineSpacingMultiple: 1.3 });
  T(s, "AI off, or Groq down: Rules mode. The Verifier, labels and exports still run; zero AI calls are made, and the screen says so.", { x: 8.72, y: 5.72, w: 3.9, h: 1.0, fontSize: 10, color: K.ink2, valign: "top" });
  s.addNotes(["SLIDE 2 · ARCHITECTURE AND AI AGENTS (about 60 seconds)", "",
    "Three zones. On the left, your browser: the dashboard, the three approval gates, and your reference library, which never leaves your device. In the middle, our server functions on Vercel: the agent routes and the Verifier. The API keys stay there. On the right, the providers: Groq for the AI models, and Crossref, OpenAlex and arXiv for the sources.",
    "Each agent is called by something the student does, never by another agent deciding on its own. You ask a question, and the Planner, an AI model, suggests search terms. You approve the plan, and the Scout, which is code, searches the registries. The Verifier, also code with no AI, checks every result and every pasted reference field by field. You approve the sources, and the Reader pulls exact quotes; code checks each quote is really in the text. In Co-pilot mode the Scribe drafts claims from approved sources only. Then the Skeptic, a model from a different company, challenges each claim, and it can only lower a label.",
    "On the right is the receipt from a real run this morning: which agent ran, which model, how long. The same log builds the student’s AI-use statement.",
    "And if the AI is off or the provider is down, that is Rules mode: the Verifier, the labels and the exports still run with zero AI calls, and the screen says so.", "",
    "FULL AGENT TABLE (role · trigger · engine · why · validator · fallback)",
    "Planner · the student asks a question · AI, openai/gpt-oss-20b on Groq · turn a question into search terms · the student approves the plan; text that is not a question is refused by code · fallback: Rules mode, the question as typed.",
    "Scout · the plan is approved · code · search Crossref, OpenAlex, arXiv · the Verifier checks every result · no fallback needed.",
    "Verifier · every pasted reference and every search result · code, no AI · compare DOI, title, first author and year with two registries; retraction and duplicate checks · unit tests and a 51-reference test set · a registry that does not answer gives “could not be checked”.",
    "Reader · sources approved · AI, openai/gpt-oss-20b · pull exact quotes · code checks each quote is in the abstract · skipped in Off mode.",
    "Scribe · Co-pilot mode only · AI, openai/gpt-oss-120b · draft claims · code blocks any source ID that was not approved · skipped in Assist and Off.",
    "Skeptic · after every draft · AI, qwen/qwen3.8-27b, a different model family from the Scribe · challenge each claim · code applies the verdict and can only lower a label · fallback model if busy.",
    "Integrity Clerk · the student exports · code · write statuses and the AI-use statement into every export · the export gate.",
    "Injection shield · any note or source text is saved or read · code · treat it as content, never as a command.", "",
    "Receipt source: the recorded live session of 26 Nov 2026, 07:47 Dubai (Co-pilot), kept unchanged in the repository."].join("\n")); }

// 3 · The six Phase 2 cases
{ const s = slide("PHASE 2 · THE SIX REQUIRED CASES", "Each case, what the dashboard shows, and the step that handles it");
  const H = (t) => ({ text: t, options: { bold: true, fontFace: F.mono, fontSize: 9, color: K.ink2 } }); const B = (t) => ({ text: t, options: { bold: true, color: K.teal } });
  const rows = [[H("CASE"), H("STATUS"), H("WHAT THE STUDENT SEES AND DECIDES"), H("STEP FROM OUR PHASE 1 DECK")],
    ["1 · Invented reference", B("Not found"), "Says it searched Crossref, OpenAlex and arXiv. Nothing similar is swapped in.", "Verifier (code)"],
    ["2 · Real DOI, wrong paper", B("Mismatch"), "What was pasted, next to what the DOI really points to.", "Verifier: chimera check"],
    ["3 · Small error", B("Needs fix"), "The wrong detail and the right one. Accept fix, or Reject fix.", "Verifier, then the student"],
    ["4 · Retracted paper", B("Retracted"), "A warning before it can be kept. It stays marked in every export.", "Verifier: retraction check"],
    ["5 · Duplicate", B("Duplicate"), "Two formats, one registry record. Merge: keep one entry.", "Verifier, then the student"],
    ["6 · No source exists", B("Not found"), "The assistant says so. Related real papers are checked and labelled.", "Planner → Scout → Verifier"]];
  s.addTable(rows, { x: 0.6, y: 1.85, w: 12.1, colW: [2.5, 1.6, 5.3, 2.7], fontFace: F.body, fontSize: 13, color: K.ink, border: { type: "solid", pt: 0.5, color: K.line }, fill: { color: K.card }, valign: "middle", rowH: 0.56, margin: 0.08 });
  T(s, "Bonus cases, also live: a real paper with no DOI is found by title and authors · a web page is a web source, organisation as author, “n.d.” · a quote not in the source is never confirmed · a database that does not answer says “could not be checked” · a note is content, not a command.", { x: 0.6, y: 5.95, w: 12.1, h: 0.8, fontSize: 12, color: K.ink2 });
  s.addNotes("Backup slide. The Verifier, which is code, handles five of the six cases. Case six, no source exists, is the Planner, Scout and Verifier together: only a registry record can become a source."); }

// 4 · Live on the judges' pack
{ const s = slide("THE DASHBOARD ON TODAY’S TEST PACK", "Eight pasted references, eight honest statuses");
  s.addImage({ path: IMG("statuses.jpg"), x: 0.6, y: 1.8, w: 7.2, h: 5.12 }); frame(s, 0.6, 1.8, 7.2, 5.12);
  const rows = [["A  Kahneman (1981)", "Needs fix"], ["B  LeCun", "Verified"], ["C  Sharma", "Not found"], ["D  Wakefield", "Retracted"], ["E  Hinton & Bengio", "Mismatch"], ["F  Vaswani, no DOI", "Verified"], ["G  LECUN, other format", "Duplicate of B"], ["H  WHO web page", "Web source"]];
  rows.forEach(([r, st], i) => { const y = 1.85 + i * 0.56; T(s, r, { x: 8.1, y, w: 2.6, h: 0.4, fontSize: 12.5, valign: "middle" }); T(s, st, { x: 10.75, y, w: 1.95, h: 0.4, fontFace: F.mono, fontSize: 10.5, bold: true, color: K.teal, valign: "middle" }); });
  T(s, [{ text: "A link to open yourself: " }, link("doi.org/10.1038/nature14539", "https://doi.org/10.1038/nature14539"), { text: " (reference B, LeCun, Bengio & Hinton, 2015, Nature)." }], { x: 8.1, y: 6.42, w: 4.6, h: 0.5, fontSize: 10.5, color: K.ink2, valign: "top" });
  s.addNotes(["LIVE DEMO · DASHBOARD ONLY: " + LIVE, "",
    "1. Paste the eight references from DEMO_INPUTS.md (P1) and press X-ray 8 references.",
    "2. Read down the statuses. Verified: reference B. Rejected: reference E, Mismatch, the DOI is real but belongs to Silver and colleagues, shown side by side.",
    "3. Reference A: Accept fix (the year is 1979, not 1981). Reference G: Merge, keep one entry.",
    "4. Point at a “Handled by” line: the Verifier, code, no AI.",
    "5. Scroll to My reference list on the same page: Copy APA 7 list. A judge can paste the citation or open the DOI link on their own device.",
    "If a registry does not answer: “It says could not be checked instead of guessing.” If the site is unreachable: show this slide and say it is a screenshot from today."].join("\n")); }

// 5 · The student decides; no source exists
{ const s = slide("THE STUDENT DECIDES · AND “NOT FOUND” MEANS NOT FOUND", "Nothing changes silently, and nothing is invented to fill a gap");
  s.addImage({ path: IMG("fix.jpg"), x: 0.6, y: 1.85, w: 5.95, h: 4.23 }); s.addImage({ path: IMG("notfound.jpg"), x: 6.75, y: 1.85, w: 5.95, h: 4.23 }); frame(s, 0.6, 1.85, 5.95, 4.23); frame(s, 6.75, 1.85, 5.95, 4.23);
  T(s, [{ text: "Small error. ", options: { bold: true, color: K.teal } }, { text: "“The year is 1979, not 1981.” Accept fix saves the registry’s details; Reject fix keeps yours, marked Needs fix. A duplicate is offered as a merge." }], { x: 0.6, y: 6.18, w: 5.95, h: 0.72, fontSize: 12, valign: "top" });
  T(s, [{ text: "No source exists. ", options: { bold: true, color: K.teal } }, { text: "Asked for studies on this hackathon, the assistant answers Not found, names the agents that handled it, and labels the related real papers." }], { x: 6.75, y: 6.18, w: 5.95, h: 0.72, fontSize: 12, valign: "top" });
  s.addNotes("Backup slide. Left: accept or reject a suggested fix. Right: request 1 from the test pack, answered Not found by Planner, Scout and Verifier."); }

// 6 · Measured, and the close
{ const s = slide("WE MEASURED IT", "Zero fakes marked Verified, and we publish what fails");
  const nums = [["0", "fakes marked Verified on our 51 test references. 11 of 11 fakes caught, 30 of 30 real ones verified, 5 of 5 retractions flagged."], ["12 → 0", "fakes and retracted papers that a DOI-only checker let through on the same test. Veracite let none through."], ["8 of 8", "of today’s references get the status the brief asks for on the live site. Links come from registry records, never from the AI."]];
  nums.forEach(([big, text], i) => { const x = 0.6 + i * 4.1; card(s, x, 1.9, 3.9, 2.6); T(s, big, { x: x + 0.3, y: 2.02, w: 3.3, h: 0.95, fontFace: F.head, bold: true, fontSize: 40, color: K.teal }); T(s, text, { x: x + 0.3, y: 3.05, w: 3.3, h: 1.35, fontSize: 12.5, valign: "top" }); });
  T(s, [{ text: "What still fails, and we say so: ", options: { bold: true } }, { text: "web pages (3 of 5 in our tests, so they are capped at Partial) · only abstracts can be read, so a quote deeper in a paper is “not confirmed” · our test set is small and we built it ourselves." }], { x: 0.6, y: 4.7, w: 12.1, h: 0.7, fontSize: 13 });
  T(s, "Every reference real. Every claim traceable. You stay in charge.", { x: 0.6, y: 5.55, w: 12.1, h: 0.55, fontFace: F.head, bold: true, fontSize: 22, color: K.teal });
  T(s, [{ text: "Live ", options: { fontFace: F.mono, fontSize: 9.5, bold: true } }, link("veracite.vercel.app/xray", LIVE, { fontFace: F.mono, fontSize: 9.5 }), { text: "   Code ", options: { fontFace: F.mono, fontSize: 9.5, bold: true } }, link("github.com/krish2105/veracite", REPO, { fontFace: F.mono, fontSize: 9.5 }), { text: "   Test results ", options: { fontFace: F.mono, fontSize: 9.5, bold: true } }, link("veracite.vercel.app/trust", "https://veracite.vercel.app/trust", { fontFace: F.mono, fontSize: 9.5 })], { x: 0.6, y: 6.3, w: 12.1, h: 0.3 });
  s.addNotes("Backup and close. Numbers are from the committed result files (25 Nov) and today’s live runs. Say the weak spots out loud. Close: Every reference real. Every claim traceable. You stay in charge."); }

pres.writeFile({ fileName: OUT }).then(() => { try { require("child_process").execFileSync("zip", ["-dq", OUT, "*/"]); } catch {} console.log(`${n} slides → ${OUT}`); });

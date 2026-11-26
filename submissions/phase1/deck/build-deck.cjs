/* Veracite · Phase 1 ideation deck (6 slides). Build: node build-deck.cjs  → ../Team7_Veracite_Phase1_Deck.pptx
 * Fonts (install for a faithful PDF): Archivo Expanded ExtraBold, Archivo Expanded, Archivo, Archivo SemiBold,
 * Literata, Martian Mono, Martian Mono Medium (all Google Fonts, OFL).
 */
const path = require("path");
const pptxgen = require("pptxgenjs");
const NOTES = require("./script-notes.cjs"); // K51: the spoken script goes in the speaker notes

const SKILL = process.env.PPTX_SKILL_DIR;
// PHASE2=1 builds the Phase 2 presentation version (same design, same six slides) next to the Phase 2 files.
// The submitted Phase 1 deck is never overwritten by that build.
const P2 = process.env.PHASE2 === "1";
const OUT = P2 ? path.join(__dirname, "..", "..", "phase2", "Team7_Veracite_Phase2_Deck.pptx") : path.join(__dirname, "..", "Team7_Veracite_Phase1_Deck.pptx");
const IMG = (f) => path.join(__dirname, "img", f);

const F = { head: "Archivo Expanded ExtraBold", head2: "Archivo Expanded", body: "Archivo", semi: "Archivo SemiBold", read: "Literata", mono: "Martian Mono", monoM: "Martian Mono Medium" };
const K = { paper: "EDF1EE", card: "F7FAF7", card2: "E4ECE6", ink: "0E2A23", ink2: "4A5F57", teal: "1F6F68", violet: "5B4BC4", red: "C3263B", amber: "A8701F",
  uv: "07061A", uvCard: "120F32", uvInk: "E9E6FF", uvInk2: "ABA5DA", cyan: "4DF2FF", magenta: "FF4FD8", gold: "FFC857", line: "C9D5CD", uvLine: "3A3470" };

const THEME = { name: "Veracite Watermark", headFontFace: F.head, bodyFontFace: F.body,
  colors: { dk1: K.ink, lt1: "FFFFFF", dk2: K.uv, lt2: K.paper, accent1: K.teal, accent2: K.violet, accent3: K.red, accent4: K.amber, accent5: K.cyan, accent6: K.magenta, hlink: K.violet, folHlink: K.teal } };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.author = "Team 7 · Krishna Mathur, Zedan Nasir Parol, Avighna Gavhane";
pres.company = "SP Jain School of Global Management · AI Club Hackathon 2026";
pres.title = "Veracite · Honest references with an AI research assistant";
pres.theme = { headFontFace: F.head, bodyFontFace: F.body };

const MICRO = "10.5555 · VERACITE · VERIFIED · ".repeat(7);
const TEAM = "VERACITE · Team 7 · Krishna Mathur · Zedan Nasir Parol · Avighna Gavhane";

function master(title, dark) {
  pres.defineSlideMaster({
    title,
    background: { color: dark ? K.uv : K.paper },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { text: { text: MICRO, options: { x: 0.6, y: 6.98, w: 12.13, h: 0.12, fontFace: F.mono, fontSize: 5, color: dark ? K.cyan : K.teal, margin: 0, transparency: 35, isTextBox: true } } },
      { text: { text: TEAM, options: { x: 0.6, y: 7.1, w: 9, h: 0.25, fontFace: F.mono, fontSize: 8, color: dark ? K.uvInk2 : K.ink2, margin: 0, isTextBox: true } } },
      { placeholder: { options: { name: "eyebrow", type: "body", x: 0.6, y: 0.42, w: 12.13, h: 0.3, fontFace: F.monoM, fontSize: 11, color: dark ? K.magenta : K.violet, charSpacing: 1.5, margin: 0, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.74, w: 12.13, h: 0.95, fontFace: F.head2, fontSize: 27, bold: true, color: dark ? K.uvInk : K.ink, margin: 0, valign: "top", align: "left" }, text: "" } },
    ],
    slideNumber: { x: 12.33, y: 7.08, w: 0.4, h: 0.25, fontFace: F.mono, fontSize: 8, color: dark ? K.uvInk2 : K.ink2, align: "right" },
  });
}
master("LIGHT", false);
master("DARK", true);

/* ---------- helpers ---------- */
const T = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, valign: "top", fontFace: F.body, ...o });
function frame(s, x, y, w, h, { fill = K.card, line = K.line, double = true } = {}) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 0.75 } });
  if (double) s.addShape(pres.shapes.RECTANGLE, { x: x - 0.045, y: y - 0.045, w: w + 0.09, h: h + 0.09, fill: { color: fill, transparency: 100 }, line: { color: line, width: 0.5 } });
}
function pill(s, x, y, w, h, text, { color = K.ink, fill = K.card, line = K.line, size = 10, font = F.monoM, dash } = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { color: line, width: 0.9, dashType: dash || "solid" } });
  T(s, text, { x, y, w, h, fontFace: font, fontSize: size, color, align: "center", valign: "middle" });
}
function arrow(s, x1, y1, x2, y2, color = K.ink2) {
  s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width: 1.1, endArrowType: "triangle" } });
}
/** The four trust-label shapes. Colour is never the only signal. */
function icon(s, kind, x, y, d, dark = false) {
  const ok = dark ? K.cyan : K.teal, warn = dark ? K.gold : K.amber, ai = dark ? "9C8CFF" : "2F5BD3", no = dark ? "FF3B5C" : K.red;
  if (kind === "verified") {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: ok }, line: { color: ok, width: 0.5 } });
    T(s, "✓", { x, y: y - 0.01, w: d, h: d, fontFace: "Arial", fontSize: d * 44, bold: true, color: dark ? K.uv : "FFFFFF", align: "center", valign: "middle" });
  } else if (kind === "reported") {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: dark ? K.uv : "FFFFFF" }, line: { color: warn, width: 1.25 } });
    s.addShape(pres.shapes.PIE, { x, y, w: d, h: d, angleRange: [270, 90], fill: { color: warn }, line: { color: warn, width: 0 } });
  } else if (kind === "ai") {
    s.addShape(pres.shapes.DIAMOND, { x, y, w: d, h: d, fill: { color: dark ? K.uv : "FFFFFF" }, line: { color: ai, width: 1.25 } });
    s.addShape(pres.shapes.DIAMOND, { x: x + d * 0.3, y: y + d * 0.3, w: d * 0.4, h: d * 0.4, fill: { color: ai }, line: { color: ai, width: 0 } });
  } else {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: dark ? K.uv : "FFFFFF" }, line: { color: no, width: 1.25 } });
    s.addShape(pres.shapes.LINE, { x: x + d * 0.18, y: y + d * 0.18, w: d * 0.64, h: d * 0.64, flipV: true, line: { color: no, width: 1.25 } });
  }
}

/* ================= Slide 1 · Overview ================= */
pres.addSection({ title: "Overview" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Overview" });
  s.addText(P2 ? "TEAM 7 · AI CLUB HACKATHON 2026 · PHASE 2" : "TEAM 7 · AI CLUB HACKATHON 2026", { placeholder: "eyebrow" });
  T(s, "VERACITE", { x: 0.6, y: 0.95, w: 6.4, h: 1.05, fontFace: F.head, fontSize: 60, color: K.uvInk, charSpacing: 4 });
  T(s, "The AI research assistant that can't make up a reference", { x: 0.6, y: 2.05, w: 6.2, h: 0.8, fontFace: F.read, fontSize: 20, italic: true, color: K.uvInk2 });
  const stats = [
    ["78–90%", K.magenta, "of GPT-4o's citations to recent research were fabricated", "Nature, Feb 2026"],
    ["100", K.cyan, "hallucinated citations found in 51 papers accepted at NeurIPS 2025", "GPTZero / TechCrunch, Jan 2026"],
    ["§h(ix)", K.gold, "SP Jain's integrity policy now warns of AI references built from real parts", "Policy v2, Feb 2026"],
  ];
  stats.forEach(([n, c, l, src], i) => {
    const x = 0.6 + i * 2.15;
    frame(s, x, 3.05, 1.95, 1.95, { fill: K.uvCard, line: K.uvLine });
    T(s, n, { x: x + 0.15, y: 3.17, w: 1.7, h: 0.55, fontFace: F.head, fontSize: 24, color: c });
    T(s, l, { x: x + 0.15, y: 3.78, w: 1.7, h: 0.85, fontSize: 10.5, color: K.uvInk, lineSpacingMultiple: 1.05 });
    T(s, src, { x: x + 0.15, y: 4.7, w: 1.7, h: 0.2, fontFace: F.mono, fontSize: 7, color: K.uvInk2 });
  });
  frame(s, 0.6, 5.35, 6.25, 0.95, { fill: K.uvCard, line: K.cyan });
  T(s, [
    { text: "The AI may plan, search and explain. ", options: { color: K.uvInk } },
    { text: "Only public registries may cite. ", options: { color: K.cyan } },
    { text: "Only the student may decide.", options: { color: K.magenta } },
  ], { x: 0.8, y: 5.45, w: 5.9, h: 0.78, fontFace: F.read, fontSize: 15.5, valign: "middle" });
  T(s, [
    { text: "TRY IT LIVE  ", options: { color: K.gold } },
    { text: "veracite.vercel.app/xray", options: { color: K.cyan, hyperlink: { url: "https://veracite.vercel.app/xray", tooltip: "Open the live Reference X-ray" } } },
  ], { x: 0.6, y: 6.45, w: 6.4, h: 0.22, fontFace: F.monoM, fontSize: 11 });
  T(s, "Slides 2–6: Workflow · Architecture · Ethics · Governance · Guardrails", { x: 0.6, y: 6.73, w: 6.5, h: 0.18, fontFace: F.mono, fontSize: 8, color: K.uvInk2 });
  s.addImage({ path: IMG("s1-home-uv.jpg"), x: 7.25, y: 0.5, w: 5.48, h: 5.86, altText: "Screenshot of the live home page in UV-lamp mode: a fictional AI-written reference shows VOID and is stamped Chimera, do not cite" });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.2, y: 0.45, w: 5.58, h: 5.96, fill: { color: K.uv, transparency: 100 }, line: { color: K.cyan, width: 0.75 } });
  T(s, "The live home page under the UV lamp: a fictional AI-written reference shows VOID · SAMPLE data", { x: 7.25, y: 6.45, w: 5.48, h: 0.4, fontFace: F.mono, fontSize: 7.5, color: K.uvInk2 });
  s.addNotes(NOTES(1, "Pre-read deck. Slide 1: problem + promise. Stats: Asai et al., Nature (Feb 2026); GPTZero NeurIPS analysis via TechCrunch (21 Jan 2026); SP Jain Academic Integrity Policy and Procedures v2 (24 Feb 2026) clause h(ix)."));
}

/* ================= Slide 2 · Workflow ================= */
pres.addSection({ title: "Workflow" });
{
  const s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Workflow" });
  s.addText("1 · WORKFLOW · HOW A STUDENT MOVES THROUGH VERACITE", { placeholder: "eyebrow" });
  s.addText("The student approves three times; the AI is checked five times", { placeholder: "title" });
  // lanes
  const lanes = [["YOU, THE STUDENT", 1.95, 0.72], ["AI AGENTS", 2.85, 1.05], ["CHECKS", 4.08, 1.0]];
  lanes.forEach(([n, y, h]) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.13, h, fill: { color: K.card }, line: { color: K.line, width: 0.5 } });
    T(s, n, { x: 0.72, y, w: 1.25, h, fontFace: F.monoM, fontSize: 8.5, color: K.ink2, valign: "middle", charSpacing: 1 });
  });
  const agents = [["Planner", "LLM · Groq", "ai"], ["Scout", "Code · search", "code"], ["Verifier", "Code · no AI", "code"], ["Reader", "LLM + match", "ai"], ["Scribe", "LLM · whitelist", "ai"], ["Skeptic", "LLM · other model", "ai"], ["Integrity Clerk", "Code", "code"]];
  const X0 = 2.05, BW = 1.29, GAP = 0.2, AY = 3.03, AH = 0.7;
  const ax = (i) => X0 + i * (BW + GAP);
  agents.forEach(([n, e, kind], i) => {
    const code = kind === "code";
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ax(i), y: AY, w: BW, h: AH, rectRadius: 0.06, fill: { color: code ? K.teal : "FFFFFF" }, line: { color: code ? K.teal : K.violet, width: 1.25 } });
    T(s, n, { x: ax(i), y: AY + 0.1, w: BW, h: 0.3, fontFace: F.semi, fontSize: 12, color: code ? "FFFFFF" : K.ink, align: "center" });
    T(s, e, { x: ax(i), y: AY + 0.42, w: BW, h: 0.22, fontFace: F.mono, fontSize: 7.5, color: code ? "D9F2EE" : K.violet, align: "center" });
    if (i < agents.length - 1) arrow(s, ax(i) + BW + 0.02, AY + AH / 2, ax(i + 1) - 0.02, AY + AH / 2, K.ink2);
  });
  // student lane
  pill(s, ax(0), 2.12, 0.86, 0.38, "Ask + dial", { size: 8.5, font: F.semi });
  const gates = [[0, "Approve plan"], [2, "Approve sources"], [5, "Approve claims"]];
  gates.forEach(([i, t]) => {
    const gx = ax(i) + BW + GAP / 2;
    const gw = i === 2 ? 1.25 : 1.05;
    pill(s, gx - gw / 2, 2.12, gw, 0.38, t, { size: 8, color: K.amber, line: K.amber, fill: "FFFFFF", font: F.semi });
    s.addShape(pres.shapes.LINE, { x: gx, y: 2.5, w: 0, h: 0.88, line: { color: K.amber, width: 1, dashType: "dash" } });
  });
  pill(s, 11.5, 2.12, 1.12, 0.38, "Export", { size: 8.5, font: F.semi });
  // checks lane
  const checks = [[2, "A · 2 registries agree", 4.17], [2, "B · retraction check", 4.6], [3, "C · quote is in source", 4.17], [4, "D · approved IDs only", 4.17], [5, "E · Skeptic challenge", 4.17]];
  checks.forEach(([i, t, y]) => pill(s, ax(i) - 0.04, y, BW + 0.08, 0.36, t, { size: 7.5, color: K.teal, line: K.teal, fill: "FFFFFF", font: F.monoM }));
  [2, 3, 4, 5].forEach((i) => s.addShape(pres.shapes.LINE, { x: ax(i) + BW / 2, y: AY + AH, w: 0, h: 0.44, line: { color: K.teal, width: 0.75, dashType: "sysDot" } }));
  // bottom row
  frame(s, 0.6, 5.42, 3.95, 1.3);
  T(s, P2 ? "PHASE 2 · WHICH STEP HANDLES WHICH CASE" : "YOUR LIBRARY AND THE SIDE DOORS", { x: 0.78, y: 5.53, w: 3.7, h: 0.22, fontFace: F.monoM, fontSize: 8, color: K.ink2 });
  T(s, P2 ? [
    { text: "Verifier (code): ", options: { bold: true } }, { text: "Not found · Mismatch · Needs fix.", options: { breakLine: true } },
    { text: "Verifier, then you: ", options: { bold: true } }, { text: "Retracted warning · merge a duplicate.", options: { breakLine: true } },
    { text: "Planner → Scout → Verifier: ", options: { bold: true } }, { text: "no source exists.", options: { breakLine: true } },
    { text: "Every status ", options: { bold: true } }, { text: "travels into the library and every export." },
  ] : [
    { text: "X-ray: ", options: { bold: true } }, { text: "a reference list, a chatbot answer or a PDF.", options: { breakLine: true } },
    { text: "Library: ", options: { bold: true } }, { text: "import .bib/.ris, save web pages, re-check.", options: { breakLine: true } },
    { text: "Export: ", options: { bold: true } }, { text: "APA 7, MLA 9, Chicago, Harvard, IEEE.", options: { breakLine: true } },
    { text: "Write & cite: ", options: { bold: true } }, { text: "only verified sources can be cited." },
  ], { x: 0.78, y: 5.79, w: 3.7, h: 0.88, fontSize: 9.5, color: K.ink, paraSpaceAfter: 2 });
  frame(s, 4.75, 5.42, 4.0, 1.3);
  T(s, "EVERY SENTENCE GETS A LABEL (SET BY CODE)", { x: 4.93, y: 5.53, w: 3.7, h: 0.22, fontFace: F.monoM, fontSize: 8, color: K.ink2 });
  [["verified", "Verified"], ["reported", "Reported, not checked"], ["ai", "AI reasoning"], ["notfound", "Not found"]].forEach(([k, t], i) => {
    const x = 4.93 + (i % 2) * 1.9, y = 5.86 + Math.floor(i / 2) * 0.4;
    icon(s, k, x, y, 0.24); T(s, t, { x: x + 0.32, y: y + 0.01, w: 1.55, h: 0.24, fontSize: 10, color: K.ink });
  });
  frame(s, 8.95, 5.42, 3.78, 1.3, { fill: K.card2 });
  T(s, "In a research session, nothing is searched before you approve the plan, or exported before you decide on every claim.", { x: 9.13, y: 5.55, w: 3.45, h: 1.05, fontFace: F.read, fontSize: 12.5, italic: true, color: K.ink, valign: "middle" });
  T(s, "■ teal = deterministic code   □ violet = AI model", { x: 7.23, y: 1.71, w: 5.5, h: 0.2, fontFace: F.mono, fontSize: 7.5, color: K.ink2, align: "right" });
  s.addNotes(NOTES(2, "Workflow: question → Planner proposes plan → CP1 approve plan → Scout searches registries → Verifier (code) cross-matches → CP2 approve sources → Reader extracts exact quotes → Scribe drafts from approved IDs only → Skeptic challenges (and can debate a claim) → CP3 approve claims → Integrity Clerk exports in the chosen style (APA 7, MLA 9, Chicago, Harvard, IEEE) with an AI-use statement and certificate. Side doors, all through the same Verifier: paste a reference list or a chatbot answer, drop a PDF (read in the browser), import a .bib/.ris library, save a page from any site with the bookmarklet, re-check the library for papers retracted after saving."));
}

/* ================= Slide 3 · Architecture ================= */
pres.addSection({ title: "Architecture" });
{
  const s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Architecture" });
  s.addText(P2 ? "2 · ARCHITECTURE AND AI AGENTS · WHO IS CALLED, WHEN, AND WHAT CHECKS IT" : "2 · ARCHITECTURE · THE PARTS AND HOW THEY CONNECT", { placeholder: "eyebrow" });
  s.addText("AI suggests, registries prove, your browser keeps your data", { placeholder: "title" });
  const cols = [
    ["WEBSITE", "in your browser", K.teal, ["Next.js app with a 3D home page; works on a phone", "3 checkpoints; every step logged in Receipts", "PDFs read in your browser: the file never leaves", "English / Arabic labels"]],
    ["SERVERLESS TOOLS", "Vercel, stateless", K.teal, ["Agent endpoints and the Verifier", "5 citation styles from official CSL files", "Open API + MCP server for other AI tools", "LLM gateway: schema check, PII scrub, injection shield, budget caps"]],
    ["AI", "Groq, free tier", K.violet, ["Open-weight gpt-oss models; Qwen for the Skeptic", "Fallback model if one is busy", "Rules mode: every check still runs with no AI", "Optional: explain a paper, debate a claim (labelled)"]],
    ["SOURCES", "open registries", K.teal, ["Crossref + Retraction Watch", "OpenAlex · arXiv", "Wayback Machine for web pages", "Free full text only when a registry lists it", "Records are fetched live, never written by AI"]],
    ["REFERENCE STORAGE", "on your device", K.teal, ["Library kept in your browser: no account, no server copy", "Import and export BibTeX / RIS / CSL-JSON (Zotero, Mendeley)", "Certificate data travels inside its own link"]],
  ];
  const W = 2.23, G = 0.245, Y = 1.95, H = 3.35;
  cols.forEach(([h, sub, c, items], i) => {
    const x = 0.6 + i * (W + G);
    frame(s, x, Y, W, H, { fill: "FFFFFF" });
    s.addShape(pres.shapes.RECTANGLE, { x, y: Y, w: W, h: 0.72, fill: { color: c }, line: { color: c, width: 0.5 } });
    T(s, h, { x: x + 0.14, y: Y + 0.1, w: W - 0.2, h: 0.3, fontFace: F.head2, fontSize: 9, bold: true, color: "FFFFFF" });
    T(s, sub, { x: x + 0.14, y: Y + 0.42, w: W - 0.28, h: 0.22, fontFace: F.mono, fontSize: 8, color: "E6F2EF" });
    T(s, items.map((t, k) => ({ text: t, options: { bullet: { indent: 10 }, breakLine: k < items.length - 1 } })), { x: x + 0.12, y: Y + 0.88, w: W - 0.24, h: H - 1.0, fontSize: 11, color: K.ink, paraSpaceAfter: 7 });
    if (i < cols.length - 1) arrow(s, x + W + 0.03, Y + 1.6, x + W + G - 0.03, Y + 1.6, K.ink);
  });
  if (P2) {
    // The agents that actually run: engine, what calls each one, and what checks its output. Same two colours as above.
    const agents = [
      ["Planner", "AI · gpt-oss-20b", "you ask a question", "you approve the plan", 1],
      ["Scout", "code", "the plan is approved", "the Verifier", 0],
      ["Verifier", "code, no AI", "every reference", "two registries agree", 0],
      ["Reader", "AI · gpt-oss-20b", "sources approved", "quote is in the text", 1],
      ["Scribe", "AI · gpt-oss-120b", "Co-pilot mode", "approved IDs only", 1],
      ["Skeptic", "AI · Qwen", "after each draft", "can only lower a label", 1],
      ["Integrity Clerk", "code", "you export", "the export gate", 0],
    ];
    const AW = 1.62, AG = 0.132;
    agents.forEach(([name, engine, when, check, ai], i) => {
      const x = 0.6 + i * (AW + AG), c = ai ? K.violet : K.teal;
      frame(s, x, 5.5, AW, 1.25, { fill: "FFFFFF" });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 5.5, w: AW, h: 0.3, fill: { color: c }, line: { color: c, width: 0.5 } });
      T(s, name, { x: x + 0.08, y: 5.5, w: AW - 0.16, h: 0.3, fontFace: F.head2, fontSize: 8.5, bold: true, color: "FFFFFF", valign: "middle" });
      T(s, [
        { text: engine, options: { fontFace: F.mono, fontSize: 7.5, color: c, breakLine: true } },
        { text: "Called when: ", options: { bold: true } }, { text: when, options: { breakLine: true } },
        { text: "Checked by: ", options: { bold: true } }, { text: check },
      ], { x: x + 0.08, y: 5.84, w: AW - 0.16, h: 0.88, fontSize: 8, color: K.ink, valign: "top", paraSpaceAfter: 1 });
    });
  } else {
  const stats = [["0", "AI calls needed to verify a reference: it's pure code against two registries"], ["~4", "AI calls per full research session, spread across free Groq models"], ["3", "fallback levels: other model → Rules mode → honest banner"]];
  stats.forEach(([n, t], i) => {
    const x = 0.6 + i * 4.1;
    frame(s, x, 5.55, 3.9, 1.15, { fill: K.card2 });
    T(s, n, { x: x + 0.18, y: 5.66, w: 0.95, h: 0.9, fontFace: F.head, fontSize: 34, color: i === 1 ? K.violet : K.teal, valign: "middle" });
    T(s, t, { x: x + 1.15, y: 5.68, w: 2.6, h: 0.9, fontSize: 11, color: K.ink, valign: "middle" });
  });
  }
  T(s, "■ teal = deterministic code (unit-tested)   ■ violet = AI model", { x: 7.6, y: 1.71, w: 5.13, h: 0.2, fontFace: F.mono, fontSize: 7.5, color: K.ink2, align: "right" });
  s.addNotes(NOTES(3, "Architecture: the orchestrator runs in the browser so checkpoints can wait for a human and data stays on the device; server functions are stateless and hold the API keys. Verification uses zero AI calls. Citation styles come from the official CSL files (citation-js); PDFs are parsed in the browser with pdf.js, so the file is never uploaded. Other tools can call the same Verifier: GET/POST /api/v1/verify and an MCP server at /api/mcp (documented in docs/API.md)."));
}

/* ================= Slide 4 · Ethics ================= */
pres.addSection({ title: "Ethics" });
{
  const s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Ethics" });
  s.addText("3 · ETHICAL CONSIDERATIONS · RISK → DESIGN RESPONSE", { placeholder: "eyebrow" });
  s.addText("We designed out the risks instead of warning about them", { placeholder: "title" });
  const risks = [
    ["Invented citations", "AI writes a plausible reference that doesn't exist, or a 'chimera' stitched from real parts.", "The AI cannot output a reference. Every source is cross-checked in two registries; chimeras are taken apart; a chatbot's uncited claims are flagged."],
    ["Plagiarism", "Pasting AI summaries, or copying a source too closely.", "Paraphrase guard flags close copying. The AI writes a labelled brief, never an essay. You explain each source in your own words."],
    ["Privacy", "Drafts and identities sent to AI providers or stored on servers.", "No accounts. The library stays on your device. Personal data is scrubbed before any AI call; Groq doesn't train on API data."],
    ["Biased sources", "One-country, outdated or paywalled evidence quietly shapes the answer.", "Bias lens on country, year, open access and publisher, with plain warnings. Journal-index facts (DOAJ, Scopus), never opaque scores."],
    ["Over-reliance on AI", "The student stops thinking (MIT Media Lab, 2025).", "AI-autonomy dial (AI can be off), three approval checkpoints, read-before-you-cite and explain-it-back."],
    ["False accusation", "AI-writing detectors flagged 61% of non-native English essays (Stanford, 2023).", "We verify sources, not people. Veracite never claims to 'detect AI' in a student's writing."],
  ];
  risks.forEach(([h, r, d], i) => {
    const x = 0.6 + (i % 3) * 4.115, y = 1.95 + Math.floor(i / 3) * 2.28, w = 3.9, hh = 2.08;
    frame(s, x, y, w, hh, { fill: "FFFFFF" });
    T(s, h, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.32, fontFace: F.head2, fontSize: 12.5, bold: true, color: K.ink });
    icon(s, "notfound", x + 0.2, y + 0.58, 0.2);
    T(s, r, { x: x + 0.5, y: y + 0.55, w: w - 0.7, h: 0.55, fontSize: 10, color: K.ink2 });
    icon(s, "verified", x + 0.2, y + 1.17, 0.2);
    T(s, d, { x: x + 0.5, y: y + 1.14, w: w - 0.7, h: 0.86, fontSize: 10.5, color: K.ink });
  });
  T(s, "Also designed in: prompt-injection shield · a library re-check flags papers retracted after you saved them · works on a phone · English/Arabic labels · labels never rely on colour alone.", { x: 0.6, y: 6.55, w: 12.13, h: 0.3, fontSize: 10, color: K.ink2 });
  s.addNotes(NOTES(4, "Ethics: each card is risk → what we built. Sources: MIT Media Lab 'Your Brain on ChatGPT' (2025, preprint); Liang et al., Stanford HAI (2023) on AI-detector bias."));
}

/* ================= Slide 5 · Governance ================= */
pres.addSection({ title: "Governance" });
{
  const s = pres.addSlide({ masterName: "LIGHT", sectionTitle: "Governance" });
  s.addText("4 · GOVERNANCE · ACCOUNTABILITY, DISCLOSURE, RULES", { placeholder: "eyebrow" });
  s.addText("The student is accountable, and Veracite makes that easy to prove", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: K.ink }, fontFace: F.monoM, fontSize: 8.5 } });
  const row = (a, b) => [{ text: a, options: { bold: true, fontFace: F.semi } }, { text: b }];
  s.addTable([
    [hdr("WHO"), hdr("ACCOUNTABLE FOR")],
    row("Student", "Author of record. Approves the plan, the sources and every claim."),
    row("Veracite", "The truth of its checks: test results published, every label explained."),
    row("Faculty", "Can re-verify any bibliography live by scanning its certificate."),
    row("Team 7", "Models, prompts and thresholds; fixes every reported wrong verdict."),
  ], { x: 0.6, y: 1.95, w: 6.5, colW: [1.25, 5.25], fontFace: F.body, fontSize: 10.5, color: K.ink, fill: { color: "FFFFFF" }, border: { type: "solid", pt: 0.5, color: K.line }, margin: [4, 6, 4, 6], rowH: 0.36 });
  T(s, "AI USE IS DISCLOSED IN THREE LAYERS", { x: 0.6, y: 4.0, w: 6.5, h: 0.22, fontFace: F.monoM, fontSize: 8.5, color: K.ink2 });
  [["1", "Every AI sentence is labelled in the app"], ["2", "AI-use statement generated from the logs (APA 2025 · SP Jain §h(viii))"], ["3", "Prompt Ledger + QR certificate for faculty (§g(vi))"]].forEach(([n, t], i) => {
    const x = 0.6 + i * 2.2;
    frame(s, x, 4.3, 2.05, 0.92, { fill: "FFFFFF" });
    T(s, n, { x: x + 0.12, y: 4.36, w: 0.3, h: 0.35, fontFace: F.head, fontSize: 16, color: K.violet });
    T(s, t, { x: x + 0.45, y: 4.38, w: 1.52, h: 0.8, fontSize: 9.5, color: K.ink });
  });
  T(s, "RULES AND POLICIES THE WEBSITE FOLLOWS", { x: 0.6, y: 5.42, w: 6.5, h: 0.22, fontFace: F.monoM, fontSize: 8.5, color: K.ink2 });
  T(s, [
    { text: "SP Jain Academic Integrity Policy v2 (24 Feb 2026): ", options: { bold: true } },
    { text: "§h(vi) APA referencing · §h(viii) name AI tools and prompts · §h(ix) fabricated references · §g(vi) faculty verify references.", options: { breakLine: true } },
    { text: "Also: ", options: { bold: true } },
    { text: "APA 7 + APA generative-AI guidance (2025) · UNESCO GenAI guidance · UAE AI Charter (2024) · UAE PDPL · EU AI Act Art. 50 transparency · COPE/ICMJE (AI is never an author) · hackathon rules 8–10." },
  ], { x: 0.6, y: 5.7, w: 6.5, h: 1.05, fontSize: 10, color: K.ink, paraSpaceAfter: 4 });
  s.addImage({ path: IMG("s5-certificate.jpg"), x: 7.585, y: 1.95, w: 4.96, h: 4.04, altText: "Screenshot of a live Veracite certificate: three references re-checked and verified, with QR code and fingerprint" });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.54, y: 1.905, w: 5.05, h: 4.13, fill: { color: "FFFFFF", transparency: 100 }, line: { color: K.line, width: 0.75 } });
  T(s, "A real certificate from the live site: scan the QR and Veracite checks every reference again", { x: 7.4, y: 6.08, w: 5.33, h: 0.4, fontFace: F.mono, fontSize: 7.5, color: K.ink2 });
  s.addNotes(NOTES(5, "Governance: student = author (COPE/ICMJE), Veracite owns check accuracy, faculty can audit, Team 7 maintains. Disclosure is generated from logs, never written from memory."));
}

/* ================= Slide 6 · Guardrails ================= */
pres.addSection({ title: "Guardrails" });
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: "Guardrails" });
  s.addText("5 · GUARDRAILS · STRONGEST FIRST", { placeholder: "eyebrow" });
  s.addText("Some failures are impossible, not just unlikely", { placeholder: "title" });
  const bands = [
    ["STRUCTURAL", "can't happen", K.cyan, "The AI can only cite records we fetched; any invented ID is blocked by code · the Verifier is code with no prompt to persuade · models never output scores · nothing joins your list without your click"],
    ["DETERMINISTIC", "checked by code", K.cyan, "DOI, title, first author and year must agree in Crossref and OpenAlex · chimera detector · quotes checked against the abstract · retraction check, repeated later from your library · 'How this was decided' shows the registry trace and the rule"],
    ["ADVERSARIAL", "AI checks AI", "9C8CFF", "The Skeptic runs on a different model with no shared memory, 8 named rejection rules, and points to approved sources that disagree. A claim can be put to a debate round. Rejections are shown, never hidden"],
    ["HUMAN GATES", "you decide", K.gold, "Approve the plan, then the sources, then the claims · AI-autonomy dial · read-before-you-cite warnings · explain-it-back"],
    ["TRANSPARENCY", "fail honestly", K.magenta, "Prompt-injection shield · personal-data scrubber · Receipts and Prompt Ledger · Rules mode if AI is down · web pages capped at Partial, with the date retrieved · test data is labelled SAMPLE"],
  ];
  bands.forEach(([n, sub, c, t], i) => {
    const y = 1.88 + i * 0.86;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 7.55, h: 0.76, fill: { color: K.uvCard }, line: { color: K.uvLine, width: 0.75 } });
    s.addShape(pres.shapes.OVAL, { x: 0.76, y: y + 0.27, w: 0.22, h: 0.22, fill: { color: c }, line: { color: c, width: 0 } });
    T(s, n, { x: 1.1, y: y + 0.14, w: 1.75, h: 0.26, fontFace: F.head2, fontSize: 9.5, bold: true, color: K.uvInk });
    T(s, sub, { x: 1.1, y: y + 0.42, w: 1.75, h: 0.22, fontFace: F.mono, fontSize: 7.5, color: c });
    T(s, t, { x: 2.9, y: y + 0.06, w: 5.12, h: 0.66, fontSize: 9.5, color: K.uvInk, valign: "middle" });
  });
  s.addImage({ path: IMG("s6-xray-uv.jpg"), x: 8.45, y: 1.88, w: 4.28, h: 2.75, altText: "Screenshot of the working Reference X-ray: a stitched reference taken apart, with a real paper title next to authors who never wrote it" });
  s.addShape(pres.shapes.RECTANGLE, { x: 8.405, y: 1.835, w: 4.37, h: 2.84, fill: { color: K.uv, transparency: 100 }, line: { color: K.cyan, width: 0.75 } });
  T(s, "Working X-ray, live registries · team test input with deliberate fakes", { x: 8.45, y: 4.72, w: 4.28, h: 0.22, fontFace: F.mono, fontSize: 7.5, color: K.uvInk2 });
  frame(s, 8.45, 5.02, 4.28, 1.28, { fill: K.uvCard, line: K.uvLine, double: false });
  T(s, [
    { text: "HOW WE PROVE IT  ", options: { fontFace: F.monoM, fontSize: 8, color: K.gold, breakLine: true } },
    { text: "0 fakes marked Verified", options: { fontFace: F.head2, fontSize: 13, bold: true, color: K.cyan, breakLine: true } },
    { text: P2 ? "51 test references, 25 Nov: 11/11 fakes caught · 30/30 real verified · 5/5 retractions. Today’s test pack, live: 8 of 8 references get the status the brief asks for. Weakest: web pages 3/5, never Verified." : "51 test references on the live site, 25 Nov: 11/11 fakes caught · 30/30 real verified · 5/5 retractions flagged. Weakest: web pages 3/5, never marked Verified.", options: { fontSize: 8.5, color: K.uvInk } },
  ], { x: 8.6, y: 5.1, w: 4.0, h: 1.15 });
  T(s, "Every reference real. Every claim traceable. You stay in charge.", { x: 0.6, y: 6.33, w: 12.13, h: 0.45, fontFace: F.head2, fontSize: 17, bold: true, color: K.cyan });
  s.addNotes(NOTES(6, "Guardrails grouped strongest-first. Proof numbers: golden-set evaluation of 25 Nov 2026 (veracite/tests/results/latest.json) against live Crossref, OpenAlex and arXiv: 51 test references (30 real, 10 hand-built chimeras, 1 AI-fabricated, 5 retracted, 5 web pages); the same run against the live site (tests/results/live-site.md, 25 Nov 23:50 Dubai) gave identical results, median 0.7 s per reference. 'How this was decided' (under every X-ray verdict) lists each registry searched, what it returned and the rule that set the label. The screenshot is the working X-ray on a team-written test list."));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (SKILL) {
    const { applyTheme } = require(path.join(SKILL, "scripts", "apply_theme.js"));
    await applyTheme(OUT, THEME);
  }
  console.log("wrote", OUT);
})();

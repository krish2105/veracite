/* Speaker notes for the Phase 1 deck (K51): the words to say on each slide, then the matching part of the
 * 8-minute demo script (read from submissions/phase2/demo-script/script.html), then the slide's sources.
 * Only the notes change; nothing on the slides does. */
const fs = require("fs"); const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "..", "phase2", "demo-script", "script.html"), "utf8");
const ent = { "&amp;": "&", "&nbsp;": " ", "&lt;": "<", "&gt;": ">" };
const txt = (x) => x.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, (m) => ent[m] ?? m).replace(/\s+/g, " ").trim();
const body = html.slice(html.indexOf("<!-- ============ WALKTHROUGH 1"), html.indexOf("<h2>Q&amp;A"));
const NAME = { a: "AVIGHNA", k: "KRISHNA", z: "ZEDAN" };
const segs = body.split('<div class="seg">').slice(1).map((seg) => {
  const one = (re) => (seg.match(re) || [, ""])[1];
  return { time: txt(one(/class="t">(.*?)</)), title: txt(one(/<h3[^>]*>([\s\S]*?)<\/h3>/)), who: NAME[one(/class="chip (\w)"/)],
    click: txt(one(/<div class="click">([\s\S]*?)<\/div>/)),
    says: [...seg.matchAll(/(?:<h3 style[^>]*>(.*?)<\/h3>\s*)?<div class="say">([\s\S]*?)<\/div>/g)].map((m) => ({ head: m[1] ? txt(m[1]) : "", paras: [...m[2].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => txt(p[1])) })) };
}).filter((s) => s.time && s.says.length);

const SLIDES = [
  { who: "AVIGHNA", demo: ["The hook", "The UV lamp"], say: [
    "Hi, we’re Team 7, and this is Veracite.",
    "Here is the problem in three numbers. In February, Nature reported that when GPT-4o cites recent research, 78 to 90 per cent of those citations are made up. A hundred invented citations got into papers accepted at NeurIPS. And SP Jain’s own integrity policy now names AI references built from real parts. The student carries the blame for every one of them.",
    "So our rule is on the slide. The AI may plan, search and explain. Only public registries may cite. Only the student may decide.",
    "The picture is our live home page: a chatbot’s reference under a UV lamp, stamped void. It is labelled as sample data." ] },
  { who: "KRISHNA", demo: ["The Reference X-ray", "Research: the student approves three times"], say: [
    "This is how a student moves through Veracite. Read the top row from left to right: you ask a question, and then you approve three times. The plan, the sources, and every claim.",
    "Under that are the seven agents. Teal ones are plain code, violet ones are AI. The Planner suggests search terms. The Scout searches Crossref, OpenAlex and arXiv. The Verifier is code with no AI in it: it checks that two registries agree and that the paper isn’t retracted.",
    "Then the Reader pulls exact quotes, the Scribe drafts only from the sources you approved, and the Skeptic, which is a different model, challenges each claim. That’s five checks on the AI, A to E.",
    "Every sentence gets one of four labels, and code sets the label, not the AI. There are side doors too: X-ray any reference list, bring your Zotero library, and export in five styles." ,
    "PHASE 2, which step handles which case. The Verifier, the code step in the middle of this slide, handles five of today’s six cases: an invented reference is Not found; a real DOI on the wrong paper is Mismatch; a small error is Needs fix, and the student accepts or rejects the correction; a retracted paper gets a warning before it can be kept; and two lines that resolve to the same record are a duplicate the student merges. Case six, no source exists, is the Planner, Scout and Verifier together: only a registry record can become a source, so the assistant answers Not found." ] },
  { who: "AVIGHNA", demo: ["Write & cite", "The day-of requirement"], say: [
    "Five parts, and they match the five words in the brief. The website runs in your browser. Small server functions on Vercel hold the keys and run the Verifier.",
    "The AI is Groq’s free tier with open-weight models, and Qwen for the Skeptic, so it doesn’t share the writer’s blind spots. The sources are open registries: Crossref with Retraction Watch, OpenAlex, arXiv, and the Wayback Machine for web pages.",
    "And reference storage is your own device. No account, no copy on our server.",
    "Three numbers at the bottom. Zero AI calls to verify a reference. About four per research session. And three fallback levels: another model, then Rules mode, then an honest banner." ] },
  { who: "ZEDAN", demo: ["Library, export and the certificate"], say: [
    "Six risks, and for each one what we built, not a warning.",
    "Invented citations: the AI cannot output a reference, and every source is checked in two registries. Plagiarism: a paraphrase guard, and the AI writes a labelled brief, never the essay. Privacy: no accounts, the library stays on your device, and personal data is scrubbed before any AI call.",
    "Biased sources: a bias lens that shows country, year and open access as facts, never a score. Over-reliance: an AI dial that can be switched off, and three checkpoints.",
    "And false accusation: we verify sources, not people. Veracite never claims to detect AI in a student’s writing." ] },
  { who: "ZEDAN", demo: ["Trust Center and AI off"], say: [
    "Who is accountable? The student is the author of record and approves the plan, the sources and every claim. Veracite answers for its checks, so we publish our test results. Faculty can check any bibliography again by scanning the certificate; that’s a real one on the right. And our team owns the models and prompts, and fixes wrong verdicts.",
    "AI use is disclosed in three layers: a label on every AI sentence, an AI-use statement generated from the logs, and a prompt ledger with the certificate.",
    "The rules we follow are listed underneath: SP Jain’s integrity policy clause by clause, the APA guidance, and the hackathon’s own rules." ] },
  { who: "KRISHNA", demo: ["The close"], say: [
    "Five layers of guardrails, strongest first. Structural means it can’t happen: the AI can only cite records we fetched, and an invented ID is blocked by code. Deterministic means checked by code: DOI, title, first author and year must agree in two registries, plus the retraction check.",
    "Adversarial: the Skeptic, a different model with eight named rules. Human gates: you approve the plan, the sources and the claims. And transparency: when something fails, it says so.",
    "Here is the proof. Fifty-one test references: eleven out of eleven fakes caught, zero fakes marked Verified, thirty out of thirty real ones verified, five out of five retractions flagged. Our weakest area is web pages, three out of five, and they are never marked Verified.",
    "Every reference real. Every claim traceable. You stay in charge." ,
    "PHASE 2, the constraints on this slide. Nothing is verified by default: every reference carries a status. The student decides: accept or reject, merge, keep with a mark or remove. No guessing: a missing detail or a silent database is said plainly. Warnings travel: the marks are written into every export. And none of it is hard-coded to today’s eight references." ] },
];

module.exports = function notesFor(n, sources) {
  const sl = SLIDES[n - 1]; const out = [`SLIDE ${n} · ${sl.who} SAYS`, "", ...sl.say.flatMap((p) => [p, ""])];
  out.push("——— THEN, ON THE LIVE SITE (8-minute demo) ———", "");
  for (const g of segs.filter((x) => sl.demo.includes(x.title))) {
    out.push(`${g.time} · ${g.who} · ${g.title}`, `Clicks: ${g.click}`, "");
    g.says.forEach((b) => { if (b.head) out.push(`[${b.head}]`); b.paras.forEach((p) => out.push(p, "")); });
  }
  out.push("——— SOURCES FOR THIS SLIDE ———", sources);
  return out.join("\n");
};

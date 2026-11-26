/* Veracite · presenter deck for the 8-minute demo. One slide per segment; the full spoken script is in the
 * speaker notes, so PowerPoint's Presenter View shows it. Text comes from script.html (single source).
 * Build: NODE_PATH=../../phase1/deck/node_modules node build-presenter.cjs → ../Team7_Demo_Presenter.pptx
 * This is NOT the judged Phase 1 deck; we still present from the live link.
 */
const fs = require("fs"); const path = require("path"); const pptxgen = require("pptxgenjs");
const html = fs.readFileSync(path.join(__dirname, "script.html"), "utf8");
const OUT = path.join(__dirname, "..", "Team7_Demo_Presenter.pptx");
const ent = { "&amp;": "&", "&nbsp;": " ", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
const txt = (x) => x.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, (m) => ent[m] ?? m).replace(/\s+/g, " ").trim();
const body = html.slice(html.indexOf("<!-- ============ WALKTHROUGH 1"), html.indexOf("<h2>Q&amp;A"));
const WHO = { a: ["Avighna", "B8329A"], k: ["Krishna", "1F6F68"], z: ["Zedan", "5B4BC4"] };
const segs = body.split('<div class="seg">').slice(1).map((seg) => {
  const one = (re) => (seg.match(re) || [, ""])[1];
  const all = (re) => [...seg.matchAll(re)].map((m) => txt(m[1]));
  const says = [...seg.matchAll(/(?:<h3 style[^>]*>(.*?)<\/h3>\s*)?<div class="say">([\s\S]*?)<\/div>/g)].map((m) => ({
    head: m[1] ? txt(m[1]) : "", paras: [...m[2].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => txt(p[1])) }));
  return { time: txt(one(/class="t">(.*?)</)), title: txt(one(/<h3[^>]*>([\s\S]*?)<\/h3>/)), who: one(/class="chip (\w)"/),
    click: txt(one(/<div class="click">([\s\S]*?)<\/div>/)), says, risks: all(/<p class="risk">([\s\S]*?)<\/p>/g) };
}).filter((s) => s.time && s.says.length);

const K = { paper: "EDF1EE", card: "F7FAF7", ink: "0E2A23", ink2: "4A5F57", line: "C9D5CD", amber: "A8701F" };
const F = { head: "Archivo Expanded", body: "Archivo", read: "Literata", mono: "Martian Mono" };
const pres = new pptxgen(); pres.layout = "LAYOUT_WIDE";
pres.title = "Veracite · demo presenter deck (script in the notes)"; pres.author = "Team 7";
pres.theme = { headFontFace: F.head, bodyFontFace: F.body };
const T = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontFace: F.body, color: K.ink, ...o });

// Slide 1: the run sheet.
{ const s = pres.addSlide(); s.background = { color: K.paper };
  T(s, "VERACITE · 8-MINUTE DEMO · PRESENTER DECK", { x: 0.6, y: 0.45, w: 12, h: 0.3, fontFace: F.mono, fontSize: 11, color: "5B4BC4" });
  T(s, "The script is in the notes: use Presenter View", { x: 0.6, y: 0.8, w: 12.1, h: 0.8, fontFace: F.head, bold: true, fontSize: 28 });
  const rows = [[{ text: "TIME", options: { bold: true } }, { text: "WHO", options: { bold: true } }, { text: "SEGMENT", options: { bold: true } }],
    ...segs.map((g) => [g.time, { text: WHO[g.who][0], options: { color: WHO[g.who][1], bold: true } }, g.title])];
  s.addTable(rows, { x: 0.6, y: 1.8, w: 8.2, colW: [1.7, 1.5, 5.0], fontFace: F.body, fontSize: 13, color: K.ink, border: { type: "solid", pt: 0.5, color: K.line }, fill: { color: K.card }, rowH: 0.4 });
  s.addShape(pres.ShapeType.roundRect, { x: 9.2, y: 1.8, w: 3.5, h: 4.0, fill: { color: "FBF5EA" }, line: { color: K.amber, width: 1 }, rectRadius: 0.1 });
  T(s, [{ text: "Two rules on stage", options: { bold: true, color: K.amber, fontSize: 15, breakLine: true } },
    { text: "Never call a recording live. If we show the SAMPLE session, say “this is a recording”.", options: { fontSize: 13, breakLine: true } },
    { text: "If something fails, say so and show the honest failure.", options: { fontSize: 13, breakLine: true } },
    { text: "We present from the live link, veracite.vercel.app. Keep this deck on the presenter’s screen only.", options: { fontSize: 12, color: K.ink2 } }],
    { x: 9.4, y: 1.95, w: 3.1, h: 3.7, valign: "top", paraSpaceAfter: 8 });
  s.addNotes("Run sheet. Open Slide Show → Presenter View: each slide's notes hold the words to say, in full. Stage directions are in brackets. The projector shows the live site, not this deck."); }

segs.forEach((g, i) => {
  const [name, col] = WHO[g.who]; const s = pres.addSlide(); s.background = { color: K.paper };
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: col }, line: { color: col } });
  T(s, g.time, { x: 0.7, y: 0.45, w: 5, h: 0.75, fontFace: F.mono, fontSize: 36, color: col });
  s.addShape(pres.ShapeType.roundRect, { x: 10.5, y: 0.5, w: 2.2, h: 0.6, fill: { color: col }, line: { color: col }, rectRadius: 0.3 });
  T(s, name.toUpperCase(), { x: 10.5, y: 0.5, w: 2.2, h: 0.6, align: "center", valign: "middle", fontFace: F.mono, fontSize: 14, color: "FFFFFF", bold: true });
  T(s, g.title, { x: 0.7, y: 1.3, w: 12, h: 0.9, fontFace: F.head, bold: true, fontSize: 30 });
  T(s, "CLICKS", { x: 0.7, y: 2.45, w: 3, h: 0.3, fontFace: F.mono, fontSize: 10, color: K.ink2 });
  s.addShape(pres.ShapeType.roundRect, { x: 0.7, y: 2.8, w: 12, h: 2.2, fill: { color: K.card }, line: { color: K.line, width: 0.75 }, rectRadius: 0.08 });
  T(s, g.click, { x: 0.95, y: 2.95, w: 11.5, h: 1.9, fontFace: F.mono, fontSize: g.click.length > 300 ? 12 : 14, valign: "top", fit: "shrink" });
  const behind = g.risks.map((r) => (r.match(/If behind[^:]*:\s*([^.]*\.)/) || [])[0]).filter(Boolean)[0];
  const hand = g.risks.map((r) => (r.match(/Handover:\s*(.*)$/) || [])[0]).filter(Boolean)[0];
  T(s, [behind && { text: behind, options: { breakLine: !!hand } }, hand && { text: hand, options: { bold: true } }].filter(Boolean).length
    ? [behind && { text: behind, options: { breakLine: !!hand } }, hand && { text: hand, options: { bold: true } }].filter(Boolean) : "Full words are in the notes.",
    { x: 0.7, y: 5.25, w: 12, h: 1.0, fontSize: 14, color: K.ink2, valign: "top", paraSpaceAfter: 6 });
  const next = segs[i + 1];
  T(s, next ? `NEXT · ${next.time} · ${WHO[next.who][0]} · ${next.title}` : "END · then two minutes of Q&A", { x: 0.7, y: 6.75, w: 12, h: 0.3, fontFace: F.mono, fontSize: 10, color: K.ink2 });
  const notes = [`${g.time} · ${name.toUpperCase()} · ${g.title}`, ""];
  g.says.forEach((b) => { if (b.head) notes.push(`— ${b.head.toUpperCase()} —`); b.paras.forEach((p) => notes.push(p, "")); });
  if (g.risks.length) { notes.push("— IF SOMETHING GOES WRONG —"); g.risks.forEach((r) => notes.push(r)); }
  s.addNotes(notes.join("\n"));
});
pres.writeFile({ fileName: OUT }).then(() => { try { require("child_process").execFileSync("zip", ["-dq", OUT, "*/"]); } catch {} }).then(() => console.log(`${segs.length + 1} slides → ${OUT}`));

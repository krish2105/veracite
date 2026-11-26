import * as THREE from "three";

/** All references here are fictional SAMPLE data (10.5555 is Crossref's test prefix). */
export type NoteData = {
  kicker: string;
  title: [string, string];
  authors: string;
  venue: string;
  doi: string;
  serial: string;
  fake: boolean;
};

export const GENUINE: NoteData[] = [
  { kicker: "REFERENCE · SAMPLE", title: ["Screen time and sleep quality", "in adolescents: a cohort study"], authors: "Rahman, S., & Okafor, T. (2021)", venue: "Journal of Sample Studies, 12(3), 44–59", doi: "doi:10.5555/sample.2021.0142", serial: "VC 2021 0142", fake: false },
  { kicker: "REFERENCE · SAMPLE", title: ["Digital wellbeing interventions:", "a systematic review"], authors: "Lee, J., & Park, H. (2019)", venue: "Review of Sample Education, 4(2), 101–130", doi: "doi:10.5555/sample.2019.0031", serial: "VC 2019 0031", fake: false },
  { kicker: "REFERENCE · SAMPLE", title: ["Mindfulness apps and exam stress", "among business students"], authors: "Chen, L., Ortiz, M., & Iyer, P. (2020)", venue: "Sample Psychology Letters, 8(1), 12–27", doi: "doi:10.5555/sample.2020.1188", serial: "VC 2020 1188", fake: false },
  { kicker: "REFERENCE · SAMPLE", title: ["Peer tutoring outcomes in", "postgraduate management programmes"], authors: "Haddad, R., & Iyer, P. (2022)", venue: "Journal of Sample Management, 15(4), 210–233", doi: "doi:10.5555/sample.2022.0774", serial: "VC 2022 0774", fake: false },
  { kicker: "REFERENCE · SAMPLE", title: ["Feedback timing and learning", "in online courses"], authors: "Varga, E. (2018)", venue: "Sample Learning Review, 22(6), 501–519", doi: "doi:10.5555/sample.2018.4410", serial: "VC 2018 4410", fake: false },
  { kicker: "REFERENCE · SAMPLE", title: ["Library use and research", "skills in first-year students"], authors: "Al Suwaidi, N., & Mensah, A. (2023)", venue: "Sample Information Studies, 31(2), 77–95", doi: "doi:10.5555/sample.2023.1208", serial: "VC 2023 1208", fake: false },
];

export const FAKES: NoteData[] = [
  { kicker: "SAMPLE · WRITTEN BY AN AI CHATBOT", title: ["Digital wellbeing apps raise GPA:", "a meta-analysis of 48 trials"], authors: "Rahman, S., & Lee, J. (2020)", venue: "Journal of Sample Studies, 9(1), 12–30", doi: "doi:10.5555/sample.2020.9917", serial: "VC 2020 9917", fake: true },
  { kicker: "SAMPLE · WRITTEN BY AN AI CHATBOT", title: ["Caffeine improves essay grades:", "evidence from 12 universities"], authors: "Okafor, T., & Varga, E. (2021)", venue: "Sample Psychology Letters, 11(4), 88–96", doi: "doi:10.5555/sample.2021.6620", serial: "VC 2021 6620", fake: true },
  { kicker: "SAMPLE · WRITTEN BY AN AI CHATBOT", title: ["AI tutors double retention", "in MBA cohorts"], authors: "Iyer, P., & Chen, L. (2024)", venue: "Journal of Sample Management, 19(1), 1–14", doi: "doi:10.5555/sample.2024.3301", serial: "VC 2024 3301", fake: true },
];

export type CanvasFonts = { display: string; body: string; mono: string };

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
function rosette(g: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number, d: number, color: string, alpha: number, lw = 1) {
  const loops = r / gcd(R, r), k = (R - r) / r, N = 3200;
  g.save(); g.strokeStyle = color; g.globalAlpha = alpha; g.lineWidth = lw; g.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2 * loops;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.stroke(); g.restore();
}
function micro(n: NoteData) { return (n.doi.replace("doi:", "") + " · VERACITE · ").toUpperCase().repeat(14); }

function seeded(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

function layoutText(g: CanvasRenderingContext2D, n: NoteData, f: CanvasFonts, ink: string, soft: string, accent: string) {
  g.fillStyle = n.fake ? "#C3263B" : accent; g.font = `500 15px ${f.mono}`; g.fillText(n.kicker, 58, 76);
  g.fillStyle = ink; g.font = `600 33px ${f.body}`; g.fillText(n.title[0], 58, 132); g.fillText(n.title[1], 58, 176);
  g.font = `italic 400 25px ${f.body}`; g.fillStyle = soft; g.fillText(n.authors, 58, 300);
  g.font = `500 12px ${f.mono}`; g.globalAlpha = 0.6; g.fillText("AUTHORS · YEAR", 58, 334); g.globalAlpha = 1;
  g.font = `400 21px ${f.body}`; g.fillText(n.venue, 58, 478);
  g.font = `500 16px ${f.mono}`; g.fillStyle = accent; g.fillText(n.doi, 58, 522);
}

/** Daylight face: security paper, guilloché, microprint, intaglio ink. */
export function drawDay(g: CanvasRenderingContext2D, w: number, h: number, n: NoteData, f: CanvasFonts) {
  g.fillStyle = "#F4F8F3"; g.fillRect(0, 0, w, h);
  g.save(); g.globalAlpha = 0.07; g.strokeStyle = "#1F6F68"; g.lineWidth = 1;
  for (let row = 0; row < 48; row++) { g.beginPath(); for (let x = 0; x <= w; x += 6) { const y = 14 + row * 13.4 + Math.sin(x / 36 + row * 0.7) * 4; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  g.restore();
  const cx = w * 0.845, cy = h * 0.5;
  rosette(g, cx, cy, 120, 36, 70, "#1F6F68", 0.5, 1.1);
  rosette(g, cx, cy, 120, 45, 52, "#5B4BC4", 0.38, 1);
  rosette(g, cx, cy, 96, 32, 40, "#1F6F68", 0.3, 0.8);
  g.strokeStyle = "rgba(31,111,104,.8)"; g.lineWidth = 2.2; g.strokeRect(18, 18, w - 36, h - 36);
  g.lineWidth = 0.8; g.strokeRect(28, 28, w - 56, h - 56);
  g.fillStyle = "rgba(31,111,104,.85)"; g.font = `500 9px ${f.mono}`; g.fillText(micro(n), 34, 24.5); g.fillText(micro(n), 34, h - 20);
  layoutText(g, n, f, "#0E2A23", "#21423A", "#1F6F68");
  g.font = `600 22px ${f.mono}`; g.fillStyle = "#C3263B"; g.fillText(n.serial, w - 250, h - 52);
}

/** UV layer (used as an emissive map): black = no glow. Paper glows faint violet, ink stays dark, security marks fluoresce. */
export function drawEmissive(g: CanvasRenderingContext2D, w: number, h: number, n: NoteData, f: CanvasFonts, seed = 7) {
  const rnd = seeded(seed + (n.fake ? 99 : 1));
  g.fillStyle = "#1d1650"; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "source-over";
  layoutText(g, n, f, "#05040f", "#0b0920", "#0b0920");
  const cols = ["#4DF2FF", "#FF4FD8", "#E8FF7A"];
  g.save(); g.lineWidth = 1.4;
  for (let i = 0; i < (n.fake ? 60 : 260); i++) {
    const x = rnd() * w, y = rnd() * h, a = rnd() * 6.28, L = 6 + rnd() * 16;
    g.strokeStyle = cols[i % 3]; g.globalAlpha = 0.55 + rnd() * 0.45; g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 1) * L * 0.6, y + Math.sin(a + 1) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  g.restore();
  if (!n.fake) {
    g.save(); g.shadowColor = "#4DF2FF"; g.shadowBlur = 10; g.strokeStyle = "#4DF2FF"; g.lineWidth = 2.4; g.strokeRect(18, 18, w - 36, h - 36);
    g.fillStyle = "#4DF2FF"; g.font = `500 9px ${f.mono}`; g.fillText(micro(n), 34, 24.5); g.fillText(micro(n), 34, h - 20); g.restore();
    g.save(); g.shadowColor = "#FF4FD8"; g.shadowBlur = 8; rosette(g, w * 0.845, h * 0.5, 120, 36, 70, "#FF4FD8", 0.55, 1.2); g.restore();
    g.save(); g.shadowColor = "#4DF2FF"; g.shadowBlur = 18; g.strokeStyle = "#4DF2FF"; g.lineWidth = 3.2;
    g.beginPath(); g.arc(w * 0.845, h * 0.5, 104, 0, 6.283); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.arc(w * 0.845, h * 0.5, 92, 0, 6.283); g.stroke();
    g.fillStyle = "#4DF2FF"; g.textAlign = "center"; g.font = `800 30px ${f.display}`; (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded";
    g.fillText("VERIFIED", w * 0.845, h * 0.5 + 6); g.font = `500 11px ${f.mono}`; g.fillText("CROSSREF · OPENALEX", w * 0.845, h * 0.5 + 32); g.restore();
  } else {
    const pc = document.createElement("canvas"); pc.width = pc.height = 8; const pg = pc.getContext("2d")!;
    pg.strokeStyle = "#FF3B5C"; pg.lineWidth = 1.7; pg.beginPath(); pg.moveTo(0, 8); pg.lineTo(8, 0); pg.stroke();
    g.save(); g.translate(w * 0.5, h * 0.52); g.rotate(-0.13); g.fillStyle = g.createPattern(pc, "repeat")!;
    g.shadowColor = "#FF3B5C"; g.shadowBlur = 16; g.font = `900 250px ${f.display}`; (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded";
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("VOID", 0, 0); g.restore();
    g.save(); g.shadowColor = "#FF3B5C"; g.shadowBlur = 8; g.fillStyle = "#FF6B85"; g.font = `600 15px ${f.mono}`;
    g.fillText("NO REGISTRY RECORD · NOT FOUND IN CROSSREF, OPENALEX OR ARXIV", 58, h - 60); g.restore();
  }
}

/** Back of every note: engraved pattern + brand. */
export function drawBack(g: CanvasRenderingContext2D, w: number, h: number, f: CanvasFonts) {
  g.fillStyle = "#E3EBE5"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) rosette(g, w * (0.12 + i * 0.152), h * 0.5, 70, 21 + i * 3, 30, i % 2 ? "#5B4BC4" : "#1F6F68", 0.32, 0.9);
  g.strokeStyle = "rgba(31,111,104,.6)"; g.lineWidth = 2; g.strokeRect(18, 18, w - 36, h - 36);
  g.fillStyle = "#1F6F68"; g.font = `800 26px ${f.display}`; (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded";
  g.fillText("VERACITE", 58, h - 62); g.font = `500 12px ${f.mono}`; g.fillText("HELD TO THE LIGHT · SAMPLE", 58, h - 40);
}

export function makeTex(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 1024, h = 640) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

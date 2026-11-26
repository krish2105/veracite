// Phase 2 test pack runner (Z12). Runs the organisers' 8 references through the
// live X-ray and says, for each, whether the result meets the brief.
//   node submissions/phase2/pack.mjs                       (main site)
//   node submissions/phase2/pack.mjs --base https://veracite-one.vercel.app
// The pack contains invented references on purpose: it is TEST DATA, never a source.
// This file tests the website; it is not used by the website (no hard-coding there).

const i = process.argv.indexOf("--base");
const BASE = (i > -1 ? process.argv[i + 1] : "https://veracite.vercel.app").replace(/\/$/, "");

const PACK = [
  ["A", "Kahneman, D., & Tversky, A. (1981). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291. https://doi.org/10.2307/1914185"],
  ["B", "LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521(7553), 436–444. https://doi.org/10.1038/nature14539"],
  ["C", "Sharma, R., & Al-Mansoori, K. (2023). Generative AI and academic integrity in Gulf business schools: A longitudinal study. Journal of Higher Education Policy, 45(3), 211–229. https://doi.org/10.1080/jhep.2023.004512"],
  ["D", "Wakefield, A. J., Murch, S. H., Anthony, A., Linnell, J., Casson, D. M., Malik, M., Berelowitz, M., Dhillon, A. P., Thomson, M. A., Harvey, P., Valentine, A., Davies, S. E., & Walker-Smith, J. A. (1998). Ileal-lymphoid-nodular hyperplasia, non-specific colitis, and pervasive developmental disorder in children. The Lancet, 351(9103), 637–641. https://doi.org/10.1016/S0140-6736(97)11096-0"],
  ["E", "Hinton, G., & Bengio, Y. (2017). Mastering the game of Go without human knowledge. Nature, 550(7676), 354–359. https://doi.org/10.1038/nature24270"],
  ["F", "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30."],
  ["G", "LECUN Y, BENGIO Y, HINTON G. Deep Learning. Nature 2015;521:436-44."],
  ["H", "Mental health. World Health Organization. https://www.who.int/health-topics/mental-health"],
];

const check = (v, field) => (v.checks ?? []).find((c) => c.field === field);
// What the brief requires for each letter (status names are ours: notfound, mismatch, chimera…).
const WANT = {
  A: ["case 3: needs fix, year 1981 → 1979 shown", (v) => v.status !== "verified" && check(v, "year")?.match === "different" && String(check(v, "year")?.found) === "1979"],
  B: ["real → verified", (v) => v.status === "verified"],
  C: ["case 1: not found, says where it looked", (v) => v.status === "notfound" && (v.searched ?? []).length > 0],
  D: ["case 4: retracted", (v) => v.status === "retracted"],
  E: ["case 2: mismatch, shows the DOI's real authors", (v) => ["mismatch", "chimera"].includes(v.status) && check(v, "authors")?.match === "different"],
  F: ["bonus B1: real, no DOI → found by title, year 2017", (v) => ["verified", "partial"].includes(v.status) && check(v, "year")?.match !== "different"],
  G: ["case 5: same paper as B (should then be merged)", (v) => v.status === "verified"],
  H: ["bonus B2: web page → partial, never chimera/verified", (v) => v.status === "partial"],
};

const text = PACK.map(([, raw]) => raw).join("\n\n");
const r = await fetch(BASE + "/api/sources/xray", {
  method: "POST",
  headers: { "Content-Type": "application/json", "User-Agent": "veracite-pack/1.0" },
  body: JSON.stringify({ text }),
  signal: AbortSignal.timeout(170000),
});
if (!r.ok) { console.error(`HTTP ${r.status} from ${BASE}`); process.exit(1); }
const lines = (await r.text()).split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l)).filter((l) => l.type === "line");

console.log(`Phase 2 test pack on ${BASE} · ${new Date().toISOString()}\n`);
let pass = 0;
for (const [letter, raw] of PACK) {
  const line = lines.find((l) => l.raw?.trim() === raw.trim());
  const [want, ok] = WANT[letter];
  if (!line) { console.log(`✗ ${letter}  no result line · want ${want}`); continue; }
  const v = line.verification;
  const good = ok(v);
  if (good) pass++;
  console.log(`${good ? "✓" : "✗"} ${letter}  ${v.status.padEnd(9)} · want ${want}`);
  if (!good) console.log(`     ${(v.reasons ?? []).slice(0, 2).join(" ")}`);
}
const dupNote = "Case 5 (G = B) also needs the Library to offer a merge: check that by hand.";
console.log(`\n${pass}/${PACK.length} meet the brief. ${dupNote}`);
process.exit(pass === PACK.length ? 0 : 1);

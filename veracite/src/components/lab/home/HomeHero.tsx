/**
 * K23: the first screen of the 3D home page: the question on the left, a labelled fake reference in 3D, and the
 * three ways into the app along the bottom. Plain links, because drei draws this overlay outside the router.
 */
import "./home-hero.css";

const WAYS = [
  { href: "/xray", title: "Check references", text: "Paste a list. Each line is checked against Crossref, OpenAlex and arXiv.", cta: "Open the X-ray" },
  { href: "/research", title: "Research a question", text: "AI plans, reads and challenges. You approve the plan, sources and claims.", cta: "Start researching" },
  { href: "/draft", title: "Check your draft", text: "Each citation is matched to your verified list and quotes are checked.", cta: "Check a paragraph" },
];

/** Findings pinned beside the fictional counterfeit note (positions are on the note's face). */
export const SPECIMEN: { at: [number, number, number]; part: string; finding: string }[] = [
  { at: [1.66, 0.56, 0], part: "Title", finding: "Reworded from a real 2019 review by other people." },
  { at: [1.66, -0.04, 0], part: "Authors", finding: "Both real in this sample. They never wrote together." },
  { at: [1.66, -0.64, 0], part: "Journal and DOI", finding: "No record in Crossref, OpenAlex or arXiv." },
];

export default function HomeHero() {
  return (
    <section className="hx">
      <div className="hx-col">
        <p className="lab-eyebrow">The research assistant that cannot invent a source</p>
        <h2 className="lab-h hx-h">Every reference, held to the light.</h2>
        <p className="lab-p">This reference was written to look perfect. Veracite takes it apart and shows which parts are real, which are borrowed and which are invented.</p>
        <div className="lab-cta">
          <a href="/xray">Check your references</a>
          <a href="/research" className="ghost">Research a question</a>
        </div>
        <p className="lab-hint">Drag the note · scroll to enter the vault</p>
      </div>
      <ul className="hx-ways">
        {WAYS.map((w) => (
          <li key={w.href}>
            <a href={w.href}>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
              <span>{w.cta} →</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

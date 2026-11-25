const REGISTRIES = "Crossref · OpenAlex · arXiv · ".repeat(4);

/** The closing band of every app page: the rule the product follows, over the registries that may cite. */
export default function FootBand() {
  return (
    <footer className="vx-foot">
      <p>The AI may plan, search and explain. Only public registries may cite. Only you may decide.</p>
      <div className="vx-marquee" aria-hidden>
        <span>{REGISTRIES}</span>
        <span>{REGISTRIES}</span>
      </div>
    </footer>
  );
}

import { rosette } from "./rosette";
import type { PageSteps } from "./pageSteps";

const SEAL = rosette(40, 6, 18, 4);

/** Three security notes floating in 3D (CSS transforms, no WebGL) that say how the page works. */
export default function PageBanner({ steps }: { steps: PageSteps }) {
  const List = steps.ordered ? "ol" : "ul";
  return (
    <div className="vx-banner">
      <List aria-label="How this page works">
        {steps.notes.map(([title, line], i) => (
          <li key={title}>
            <div className="vx-note">
              <svg viewBox="-50 -50 100 100" aria-hidden>{SEAL.map((d, k) => <path key={k} d={d} />)}</svg>
              {steps.ordered && <span aria-hidden>{i + 1} / {steps.notes.length}</span>}
              <b>{title}</b>
              <p>{line}</p>
            </div>
          </li>
        ))}
      </List>
    </div>
  );
}

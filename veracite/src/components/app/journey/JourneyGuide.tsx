"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { useRefList } from "@/components/app/tabs/xray/refList";
import { journeyProgress } from "./journey";
import { journey, useJourney } from "./journeyStore";
import "./journey.css";

/**
 * "Try the full journey" (K31): a slim three-step strip under the page header. It never covers the page,
 * ticks itself from what the student does, and hides for good with one click.
 */
export function JourneyGuide() {
  const path = usePathname();
  const { dismissed, marks } = useJourney();
  const { sources, receipts } = useRefList();

  // A link with ?journey=1 (the home page's "Try the full journey") brings the guide back.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("journey") === "1") journey.restart();
  }, []);

  if (dismissed) return null;
  const { steps, current, complete } = journeyProgress({ receipts, sourceCount: sources.length, marks });
  const step = steps[current];

  return (
    <section className="jg" aria-label="Try the full journey">
      <div className="jg-head">
        <b>Try the full journey</b>
        <span className="jg-count" aria-live="polite">{complete ? "All three steps done." : `Step ${current + 1} of 3`}</span>
        <button className="jg-hide" onClick={() => journey.dismiss()} aria-label="Hide the guide">
          <X size={13} /> Hide guide
        </button>
      </div>
      <ol className="jg-steps">
        {steps.map((s, i) => (
          <li key={s.title} data-state={s.done ? "done" : i === current ? "now" : "todo"}>
            <span className="jg-n" aria-hidden>{s.done ? <Check size={11} /> : i + 1}</span>
            {s.title}
            {s.done && <span className="sr-only"> (done)</span>}
          </li>
        ))}
      </ol>
      {complete ? (
        <p className="jg-next">You checked a list, kept and cited real sources, exported them and made a certificate. Every reference real.</p>
      ) : (
        <p className="jg-next">
          {step.next}
          {path !== step.href && (
            <Link className="btn small primary jg-go" href={step.href}>
              {step.cta} <ArrowRight size={13} />
            </Link>
          )}
        </p>
      )}
    </section>
  );
}

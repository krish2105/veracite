import { describe, expect, it } from "vitest";
import type { Receipt } from "@/lib/types";
import { journeyProgress } from "./journey";

const r = (actor: Receipt["actor"], action: string): Receipt => ({ id: action, sessionId: "x", at: "2026-11-26T08:00:00Z", actor, action, aiUsed: false, ms: 0, ok: true });
const checked = r("verifier", "checked_references");
const exported = r("student", "export_references");

describe("journeyProgress: the three-step first-visit guide", () => {
  it("starts at step 1 with nothing done", () => {
    const p = journeyProgress({ receipts: [], sourceCount: 0, marks: [] });
    expect(p.current).toBe(0);
    expect(p.steps.map((s) => s.done)).toEqual([false, false, false]);
    expect(p.complete).toBe(false);
    expect(p.steps[0].href).toBe("/xray");
  });

  it("step 1 is done once a reference list has been checked", () => {
    const p = journeyProgress({ receipts: [checked], sourceCount: 0, marks: [] });
    expect(p.steps[0].done).toBe(true);
    expect(p.current).toBe(1);
  });

  it("step 2 needs two sources in the list AND one citation inserted, and says what is left", () => {
    const one = journeyProgress({ receipts: [checked], sourceCount: 1, marks: [] });
    expect(one.steps[1].done).toBe(false);
    expect(one.steps[1].next).toMatch(/1 more/);
    expect(one.steps[1].href).toBe("/xray");
    const two = journeyProgress({ receipts: [checked], sourceCount: 2, marks: [] });
    expect(two.steps[1].done).toBe(false);
    expect(two.steps[1].href).toBe("/draft");
    const cited = journeyProgress({ receipts: [checked], sourceCount: 2, marks: ["cited"] });
    expect(cited.steps[1].done).toBe(true);
    expect(cited.current).toBe(2);
  });

  it("step 3 needs an export and a certificate", () => {
    const base = { receipts: [checked, exported], sourceCount: 2, marks: ["cited"] };
    const noCert = journeyProgress(base);
    expect(noCert.steps[2].done).toBe(false);
    expect(noCert.steps[2].href).toBe("/certificate");
    const done = journeyProgress({ ...base, marks: ["cited", "certificate"] });
    expect(done.complete).toBe(true);
    expect(done.current).toBe(3);
  });

  it("points step 3 at the Library until something is exported", () => {
    expect(journeyProgress({ receipts: [checked], sourceCount: 2, marks: ["cited"] }).steps[2].href).toBe("/library");
  });
});

import { describe, expect, it } from "vitest";
import type { Update, Verification } from "../types";
import { applyRecheck, recheckOutcome } from "./recheck";

const v = (p: Partial<Verification>): Verification => ({ status: "verified", checks: [{ field: "title", match: "exact" }], registries: ["crossref", "openalex"], updates: [], reasons: ["Crossref and OpenAlex both have this paper."], searched: [], checkedAt: "2026-11-20T08:00:00Z", ms: 300, ...p });
const retraction: Update = { kind: "retraction", noticeDoi: "10.1/notice", date: "2026-04-22", source: "retraction-watch" };
const correction: Update = { kind: "correction", noticeDoi: "10.1/corr", date: "2025-08-20", source: "publisher" };

describe("recheckOutcome (K35): what changed since the source was saved", () => {
  it("a paper retracted after saving", () => {
    const o = recheckOutcome(v({}), v({ status: "retracted", updates: [retraction] }));
    expect(o.kind).toBe("retracted");
    expect(o.message).toMatch(/retracted on 2026-04-22/);
    expect(o.newUpdates).toEqual([retraction]);
  });

  it("a new correction or expression of concern", () => {
    expect(recheckOutcome(v({}), v({ status: "partial", updates: [correction] })).kind).toBe("correction");
    expect(recheckOutcome(v({}), v({ status: "partial", updates: [{ kind: "concern", source: "publisher" }] })).kind).toBe("concern");
  });

  it("nothing new: a notice already known, or none at all", () => {
    expect(recheckOutcome(v({ updates: [correction] }), v({ status: "partial", updates: [correction] })).kind).toBe("unchanged");
    expect(recheckOutcome(v({}), v({ status: "partial" })).kind).toBe("unchanged");
  });

  it("an already-retracted source stays as it is", () => {
    expect(recheckOutcome(v({ status: "retracted", updates: [retraction] }), v({ status: "retracted", updates: [retraction] })).kind).toBe("unchanged");
  });
});

describe("applyRecheck: keeps the original checks, adds what is new", () => {
  it("a retraction turns the saved verdict into Retracted and records the notice", () => {
    const saved = v({});
    const next = applyRecheck(saved, recheckOutcome(saved, v({ status: "retracted", updates: [retraction] })), "2026-11-26T09:00:00Z");
    expect(next.status).toBe("retracted");
    expect(next.updates).toEqual([retraction]);
    expect(next.checks).toEqual(saved.checks);
    expect(next.reasons[0]).toMatch(/Re-checked on 2026-11-26/);
    expect(next.checkedAt).toBe("2026-11-26T09:00:00Z");
  });

  it("a correction keeps the verdict and adds the notice", () => {
    const saved = v({});
    const next = applyRecheck(saved, recheckOutcome(saved, v({ status: "partial", updates: [correction] })), "2026-11-26T09:00:00Z");
    expect(next.status).toBe("verified");
    expect(next.updates).toEqual([correction]);
  });
});

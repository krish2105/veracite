import { describe, expect, it } from "vitest";
import { explainError, HttpError } from "./errors";

describe("explainError: banners that say what happened and what to do", () => {
  it("no connection", () => {
    const m = explainError("search", new TypeError("Failed to fetch"));
    expect(m).toMatch(/^The search could not reach Veracite's server/);
    expect(m).toMatch(/Try again/);
  });

  it("the AI service is busy (free-tier limit)", () => {
    const m = explainError("agents", new HttpError(429, "Too many requests"));
    expect(m).toMatch(/^The AI agents/);
    expect(m).toMatch(/busy/);
    expect(m).toMatch(/AI autonomy to Off/);
  });

  it("a registry or the AI did not answer", () => {
    const m = explainError("plan", new HttpError(502, "The agent could not finish. Please try again."));
    expect(m).toMatch(/^The Planner/);
    expect(m).toMatch(/did not answer/);
    expect(m).toMatch(/Nothing you approved was lost/);
  });

  it("keeps the server's own message for anything else", () => {
    expect(explainError("search", new HttpError(400, "Send 1 to 6 search queries."))).toBe("The search stopped: Send 1 to 6 search queries.");
  });

  it("never shows a raw stack or an empty message", () => {
    expect(explainError("agents", undefined)).toMatch(/^The AI agents stopped: something went wrong/);
  });
});

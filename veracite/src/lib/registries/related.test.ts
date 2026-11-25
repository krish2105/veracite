import { describe, expect, it } from "vitest";
import { relatedQuery } from "./openalex";

describe("relatedQuery (K41): the OpenAlex query for citing / cited works", () => {
  it("cited-by, most-cited first, by default", () => {
    const q = new URLSearchParams(relatedQuery("W123", "cited_by", 8));
    expect(q.get("filter")).toBe("cites:W123");
    expect(q.get("sort")).toBe("cited_by_count:desc");
    expect(q.get("per_page")).toBe("8");
  });
  it("new citations since a date: filtered by publication date, newest first", () => {
    const q = new URLSearchParams(relatedQuery("W123", "cited_by", 5, "2026-11-01"));
    expect(q.get("filter")).toBe("cites:W123,from_publication_date:2026-11-01");
    expect(q.get("sort")).toBe("publication_date:desc");
  });
  it("references ignore the date", () => {
    expect(new URLSearchParams(relatedQuery("W123", "references", 8, "2026-11-01")).get("filter")).toBe("cited_by:W123");
  });
});

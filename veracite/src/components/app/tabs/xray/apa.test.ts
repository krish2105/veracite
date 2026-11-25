import { describe, expect, it } from "vitest";
import type { SourceRecord } from "@/lib/types";
import { apaAuthors, apaList, apaReference, initials } from "./apa";

const base = { authors: [{ family: "Wang", given: "Jin" }, { family: "Fan", given: "Wenxiang" }], year: 2025, type: "article" } as const;
const rec = (over: Partial<SourceRecord>) => ({ ...base, title: "A title", ...over }) as unknown as SourceRecord;

describe("APA 7", () => {
  it("initials and author joins", () => {
    expect(initials("Jean-Paul")).toBe("J.-P.");
    expect(initials("H. A.")).toBe("H. A.");
    expect(apaAuthors([...base.authors])).toBe("Wang, J., & Fan, W.");
    const many = Array.from({ length: 23 }, (_, i) => ({ family: `A${i + 1}`, given: "B" }));
    expect(apaAuthors(many)).toContain("A19, B., . . . A23, B.");
    expect(apaAuthors(many)).not.toContain("A20,");
  });

  it("journal article with italics, en dash and DOI link", () => {
    const f = apaReference(rec({ title: "Generative AI at work", venue: "The Quarterly Journal of Economics", volume: "140", issue: "2", pages: "889-942", doi: "10.1093/qje/qjae044" }));
    expect(f.text).toBe("Wang, J., & Fan, W. (2025). Generative AI at work. The Quarterly Journal of Economics, 140(2), 889–942. https://doi.org/10.1093/qje/qjae044");
    expect(f.html).toContain("<i>The Quarterly Journal of Economics</i>, <i>140</i>(2)");
  });

  it("preprint italicises the title; no author moves the title first; HTML is escaped", () => {
    expect(apaReference(rec({ type: "preprint", venue: "arXiv", doi: "10.48550/arxiv.2506.08872" })).html).toContain("<i>A title.</i> arXiv.");
    expect(apaReference(rec({ authors: [], year: undefined, title: "<script>x</script>?" })).html).toBe("&lt;script&gt;x&lt;/script&gt;? (n.d.).");
  });

  it("sorts alphabetically", () => {
    const list = apaList([rec({ authors: [{ family: "Zed" }] }), rec({ authors: [{ family: "Abe" }] })]).text;
    expect(list.indexOf("Abe")).toBeLessThan(list.indexOf("Zed"));
  });
});

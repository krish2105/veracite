import { describe, expect, it } from "vitest";
import { missingPhrases, namedPhrases } from "./notfound";

describe("No source exists (Phase 2, case 6)", () => {
  it("finds the specific things a question names, and nothing in a general question", () => {
    expect(namedPhrases("Give me three peer-reviewed studies that measure how the Robotics Open Day 2031 at Northfield College improved pupils' grades.")).toEqual(["Robotics Open Day 2031", "Northfield College"]);
    expect(namedPhrases("Does generative AI help or hurt student learning?")).toEqual([]);
    expect(namedPhrases("What is the capital of France?")).toEqual([]);
    expect(namedPhrases("Does Generative AI Help Or Hurt Student Learning")).toEqual([]);
  });
  it("says a named thing is missing when no returned source mentions it", () => {
    const related = [{ title: "Hackathons as an informal learning platform", abstract: "We study student hackathons and grades." }];
    expect(missingPhrases("How did the Robotics Open Day 2031 at Northfield College improve grades?", related)).toEqual(["Robotics Open Day 2031", "Northfield College"]);
  });
  it("stays quiet when a source does mention it", () => {
    const hit = [{ title: "Outcomes of the open day in robotics at Northfield, a college case study", abstract: "The Robotics Open Day at Northfield College ran in 2031." }];
    expect(missingPhrases("How did the Robotics Open Day 2031 at Northfield College improve grades?", hit)).toEqual([]);
    expect(missingPhrases("Does remote work help in the United Kingdom?", [{ title: "Remote work in the United Kingdom" }])).toEqual([]);
  });
});

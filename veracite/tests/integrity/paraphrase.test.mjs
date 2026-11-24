// Tests for the paraphrase guard (Z09).
// Run from veracite/: node --no-warnings --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
// The SOURCE paragraph is invented SAMPLE text, not a quote from a real paper.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkParaphrase, checkAgainstSources } from "../../src/lib/integrity/paraphrase.ts";

const SOURCE =
  "Adolescents who used screens in the hour before bed reported shorter sleep duration and poorer sleep quality " +
  "than those who did not. The association remained after adjusting for age, sex and household income. " +
  "Interventions that limit bedtime screen use may therefore improve sleep among young people.";

test("verbatim copy without quotation marks is 'copied'", () => {
  const draft = "Adolescents who used screens in the hour before bed reported shorter sleep duration and poorer sleep quality than those who did not.";
  const r = checkParaphrase(draft, SOURCE);
  assert.equal(r.verdict, "copied");
  // 21 of 22 words: the last word "not" only appears in all-common-word windows
  // ("than those who did not"), which are ignored by design.
  assert.equal(r.overlap, 0.955);
  assert.equal(r.longestRun, 21);
  assert.equal(r.spans.length, 1);
  assert.equal(r.spans[0].text, draft.slice(0, draft.lastIndexOf(" not.")));
  assert.match(r.message, /^95% of your words match the source in runs of 5\+ words \(longest: 21 words\)/);
});

test("the same text inside quotation marks is a quote, not copying", () => {
  const draft = 'Brosnan et al. found that "adolescents who used screens in the hour before bed reported shorter sleep duration" (p. 3).';
  const r = checkParaphrase(draft, SOURCE);
  assert.equal(r.verdict, "ok");
  assert.equal(r.spans.length, 0);
  assert.equal(r.quotes.length, 1);
  assert.equal(r.quotes[0].inSource, true);
});

test("curly quotes are recognised too", () => {
  const r = checkParaphrase("They argue that “interventions that limit bedtime screen use may therefore improve sleep”.", SOURCE);
  assert.equal(r.verdict, "ok");
  assert.equal(r.quotes[0].inSource, true);
});

test("a quote that is not in the source is reported", () => {
  const r = checkParaphrase('The authors say "screens destroy teenage sleep completely".', SOURCE);
  assert.equal(r.quotes[0].inSource, false);
  assert.match(r.message, /1 quote doesn't match the source word for word/);
});

test("patchwriting (tense/plural swaps, a few words changed) is still caught", () => {
  const draft =
    "Adolescents who use screens in the hour before bed report shorter sleep durations and poorer sleep quality. " +
    "This association remains after adjusting for age, sex and household income.";
  const r = checkParaphrase(draft, SOURCE);
  assert.notEqual(r.verdict, "ok");
  assert.ok(r.overlap >= 0.5, `overlap ${r.overlap}`);
});

test("a genuine paraphrase in the student's own words is 'ok'", () => {
  const draft =
    "Teenagers who looked at phones or tablets late in the evening slept less and rested worse, " +
    "even once their background was taken into account, so cutting late-night device use could help.";
  const r = checkParaphrase(draft, SOURCE);
  assert.equal(r.verdict, "ok");
  assert.equal(r.spans.length, 0);
  assert.equal(r.message, "Your wording is your own.");
});

test("one borrowed phrase in an otherwise original paragraph is 'close', with the phrase highlighted", () => {
  const draft =
    "My survey of Dubai students points the same way. The pattern held after adjusting for age, sex and household income, " +
    "which suggests the effect is not explained by family wealth alone, though my sample was small and self-reported.";
  const r = checkParaphrase(draft, SOURCE);
  assert.equal(r.verdict, "close");
  assert.equal(r.spans.length, 1);
  assert.equal(r.spans[0].text, "after adjusting for age, sex and household income");
  assert.equal(r.spans[0].words, 8);
});

test("n-grams made only of common words are ignored", () => {
  const r = checkParaphrase("It was one of the best in the case of the year.", "This is one of the best in the case of the decade.");
  // "one of the best in" etc. contain "one"/"best" → real overlap; but a pure stopword run alone must not count
  const s = checkParaphrase("and it was in the of the", "and it was in the of the");
  assert.equal(s.overlap, 0);
  assert.ok(r.overlap > 0);
});

test("accents and ß are folded (Seßler = Sessler)", () => {
  const r = checkParaphrase("Seßler and Küchemann studied résumé writing tools carefully", "Sessler and Kuchemann studied resume writing tools carefully");
  assert.equal(r.overlap, 1);
});

test("empty or very short drafts are 'ok' with 0 words", () => {
  assert.equal(checkParaphrase("", SOURCE).verdict, "ok");
  assert.equal(checkParaphrase("Too short.", SOURCE).wordsChecked, 2);
  assert.equal(checkParaphrase("Too short.", SOURCE).verdict, "ok");
});

test("span offsets point at the exact text in the draft", () => {
  const draft = "Intro sentence here. Interventions that limit bedtime screen use may therefore improve sleep, I think.";
  const r = checkParaphrase(draft, SOURCE);
  for (const s of r.spans) assert.equal(draft.slice(s.start, s.end), s.text);
  assert.equal(r.spans[0].text, "Interventions that limit bedtime screen use may therefore improve sleep");
});

test("options change the thresholds", () => {
  const draft = "The pattern held after adjusting for age, sex and household income in my data.";
  assert.equal(checkParaphrase(draft, SOURCE).verdict, "copied"); // 8 of 14 words ≥ 50%
  assert.equal(checkParaphrase(draft, SOURCE, { copiedOverlap: 0.9, closeOverlap: 0.2 }).verdict, "close");
});

test("checkAgainstSources ranks the worst source first", () => {
  const other = { id: "S2", text: "Social media use was linked with lower wellbeing among university students in Australia." };
  const { verdict, results } = checkAgainstSources(
    "Adolescents who used screens in the hour before bed reported shorter sleep duration.",
    [other, { id: "S1", text: SOURCE }],
  );
  assert.equal(verdict, "copied");
  assert.deepEqual(results.map((x) => [x.sourceId, x.verdict]), [["S1", "copied"], ["S2", "ok"]]);
  assert.equal(checkAgainstSources("anything", []).verdict, "ok");
});

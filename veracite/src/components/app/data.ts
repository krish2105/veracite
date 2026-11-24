/**
 * SAMPLE data for the UI previews. Every reference here is fictional (10.5555 is Crossref's test prefix)
 * and is shown with a SAMPLE label, per hackathon rule 9. The real app fills these from live registries.
 */
export type Label = "verified" | "reported" | "ai" | "notfound";
export type RefStatus = "verified" | "chimera" | "mismatch" | "notfound" | "retracted" | "partial";

export const QUESTION = "Does screen time before bed reduce sleep quality in teenagers?";

export type Source = {
  id: string; title: string; authors: string; year: number; venue: string; doi: string;
  status: RefStatus; peer: boolean; doaj: boolean; oa: boolean; cited: number; country: string; opened: boolean;
  decision?: "accepted" | "rejected";
};

export const SOURCES: Source[] = [
  { id: "S1", title: "Screen time and sleep quality in adolescents: a cohort study", authors: "Rahman, S., & Okafor, T.", year: 2021, venue: "Journal of Sample Studies", doi: "10.5555/sample.2021.0142", status: "verified", peer: true, doaj: true, oa: true, cited: 412, country: "UK", opened: true, decision: "accepted" },
  { id: "S2", title: "Blue light, melatonin and bedtime device use: a randomised trial", authors: "Chen, L., Ortiz, M., & Iyer, P.", year: 2019, venue: "Sample Psychology Letters", doi: "10.5555/sample.2019.0031", status: "verified", peer: true, doaj: false, oa: false, cited: 288, country: "CN", opened: true, decision: "accepted" },
  { id: "S3", title: "Bedtime smartphone use and sleep in Gulf adolescents", authors: "Al Suwaidi, N., & Mensah, A.", year: 2023, venue: "Sample Health Journal (MENA)", doi: "10.5555/sample.2023.1208", status: "verified", peer: true, doaj: true, oa: true, cited: 37, country: "AE", opened: false, decision: "accepted" },
  { id: "S4", title: "Digital curfews and sleep: a preprint", authors: "Varga, E.", year: 2025, venue: "SampleArXiv (preprint)", doi: "10.5555/sample.2025.0770", status: "partial", peer: false, doaj: false, oa: true, cited: 4, country: "HU", opened: true },
  { id: "S5", title: "Social media at night and adolescent wellbeing", authors: "Haddad, R., & Iyer, P.", year: 2018, venue: "Journal of Sample Management", doi: "10.5555/sample.2018.4410", status: "retracted", peer: true, doaj: false, oa: false, cited: 190, country: "US", opened: false, decision: "rejected" },
  { id: "S6", title: "Screen use is unrelated to sleep duration: a null result", authors: "Nakamura, K.", year: 2022, venue: "Sample Sleep Science", doi: "10.5555/sample.2022.0503", status: "verified", peer: true, doaj: true, oa: true, cited: 61, country: "JP", opened: true, decision: "accepted" },
];

export type Claim = { id: string; text: string; label: Label; sources: string[]; quote?: string; skeptic?: string };
export const BRIEF: Claim[] = [
  { id: "C1", text: "Teenagers who used screens in the hour before bed reported poorer sleep quality than those who did not.", label: "verified", sources: ["S1"], quote: "participants with device use in the final hour before bed reported significantly poorer sleep quality" },
  { id: "C2", text: "Evening blue-light exposure delayed melatonin onset in a randomised trial.", label: "verified", sources: ["S2"], quote: "melatonin onset was delayed by a mean of 38 minutes" },
  { id: "C3", text: "A study of Gulf adolescents found the same association.", label: "reported", sources: ["S3"], skeptic: "Abstract only. The effect size isn't in the open text, so this stays ‘Reported, not checked’." },
  { id: "C4", text: "Together, these suggest the timing of screen use may matter more than total daily screen time.", label: "ai", sources: ["S1", "S6"] },
  { id: "C5", text: "Screen time causes a 40% drop in exam grades.", label: "notfound", sources: [], skeptic: "S1 · Unsupported: no approved source states this. S4 · Causal claim. Blocked." },
];

export type XrayRow = { n: number; pasted: string; status: RefStatus; note: string; fields: { f: string; pasted: string; registry: string; match: "exact" | "close" | "different" | "missing" }[] };
export const XRAY: XrayRow[] = [
  { n: 1, pasted: "Rahman, S., & Okafor, T. (2021). Screen time and sleep quality in adolescents: a cohort study. Journal of Sample Studies, 12(3), 44–59.", status: "verified", note: "Crossref + OpenAlex agree on every field.",
    fields: [{ f: "DOI", pasted: "—", registry: "10.5555/sample.2021.0142", match: "missing" }, { f: "Title", pasted: "Screen time and sleep quality…", registry: "Screen time and sleep quality…", match: "exact" }, { f: "Authors", pasted: "Rahman; Okafor", registry: "Rahman; Okafor", match: "exact" }, { f: "Year", pasted: "2021", registry: "2021", match: "exact" }] },
  { n: 2, pasted: "Rahman, S., & Lee, J. (2020). Digital wellbeing apps raise GPA: a meta-analysis of 48 trials. Journal of Sample Studies, 9(1), 12–30.", status: "chimera", note: "Real parts, wrong combination: title reworded from Lee & Park (2019); Rahman's real paper is from 2021; DOI never registered.",
    fields: [{ f: "Title", pasted: "Digital wellbeing apps raise GPA…", registry: "Digital wellbeing interventions… (Lee & Park, 2019)", match: "different" }, { f: "Authors", pasted: "Rahman; Lee", registry: "Lee; Park", match: "different" }, { f: "Year", pasted: "2020", registry: "2019", match: "different" }, { f: "DOI", pasted: "10.5555/sample.2020.9917", registry: "no record", match: "missing" }] },
  { n: 3, pasted: "Chen, L., Ortiz, M., & Iyer, P. (2018). Blue light, melatonin and bedtime device use. Sample Psychology Letters.", status: "mismatch", note: "Paper exists, but the year is wrong (2019, not 2018).",
    fields: [{ f: "Title", pasted: "Blue light, melatonin…", registry: "Blue light, melatonin…", match: "close" }, { f: "Authors", pasted: "Chen; Ortiz; Iyer", registry: "Chen; Ortiz; Iyer", match: "exact" }, { f: "Year", pasted: "2018", registry: "2019", match: "different" }] },
  { n: 4, pasted: "Okafor, T., & Varga, E. (2021). Caffeine improves essay grades: evidence from 12 universities. Sample Psychology Letters, 11(4), 88–96.", status: "notfound", note: "No record in Crossref, OpenAlex or arXiv. Searched 3 registries at 10:42.",
    fields: [{ f: "Title", pasted: "Caffeine improves essay grades…", registry: "no match ≥ 0.90", match: "missing" }, { f: "DOI", pasted: "—", registry: "—", match: "missing" }] },
  { n: 5, pasted: "Haddad, R., & Iyer, P. (2018). Social media at night and adolescent wellbeing. Journal of Sample Management.", status: "retracted", note: "Retraction notice in Crossref (Retraction Watch data). Do not cite as evidence.",
    fields: [{ f: "Title", pasted: "Social media at night…", registry: "Social media at night…", match: "exact" }, { f: "Retraction", pasted: "—", registry: "Retracted 2024", match: "different" }] },
];

export const RECEIPTS = [
  { t: "10:41:02", who: "You", what: "Asked the question · autonomy: Assist" },
  { t: "10:41:05", who: "Planner", what: "Proposed 3 sub-questions, 9 search terms (Groq · llama-3.3-70b)" },
  { t: "10:41:30", who: "You", what: "Approved the plan (edited 1 term)" },
  { t: "10:41:34", who: "Scout", what: "62 candidates from OpenAlex, Crossref, arXiv" },
  { t: "10:41:39", who: "Verifier", what: "48 verified · 9 partial · 3 not found · 2 retracted (code, no AI)" },
  { t: "10:43:10", who: "You", what: "Accepted 5 sources, rejected 2 (reasons logged)" },
  { t: "10:43:18", who: "Scribe", what: "Draft of 5 claims · 1 invented source ID blocked by code" },
  { t: "10:43:24", who: "Skeptic", what: "2 challenges · 1 opposing-view paper found (S6)" },
];

export const AGENTS = [
  { name: "Planner", engine: "LLM · Groq", can: "Propose sub-questions and search terms", cannot: "Search, cite or answer" },
  { name: "Scout", engine: "Code + LLM", can: "Query OpenAlex, Crossref, arXiv; snowball citations", cannot: "Edit metadata or invent records" },
  { name: "Verifier", engine: "Code only", can: "Cross-match DOI, title, authors, year in 2 registries; retractions", cannot: "Be prompted. It has no prompt" },
  { name: "Reader", engine: "LLM + string match", can: "Extract findings with exact quotes", cannot: "Quote text that isn't in the source" },
  { name: "Skeptic", engine: "LLM · different model", can: "Reject claims (S1–S8); find counter-evidence", cannot: "Share memory with the Scribe" },
  { name: "Scribe", engine: "LLM · whitelist", can: "Draft from approved evidence only", cannot: "Cite unapproved IDs; output confidence %" },
  { name: "Integrity Clerk", engine: "Code", can: "AI-use statement, ledger, certificate, APA", cannot: "Write anything not in the logs" },
];

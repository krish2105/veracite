# 01 · Research report: what we found and what it means for Veracite

*Team 7 · AI Club Hackathon 2026 · compiled 24 Nov 2026. Every number below has a source at the bottom. Numbers marked "preprint" are not yet peer reviewed. Say that out loud if a judge asks.*

---

## 1. The problem is real, current and expensive

| Evidence | What it shows | Use it where |
|---|---|---|
| **Nature, Feb 2026 (OpenScholar, Asai et al.)**: asked to cite recent literature, GPT-4o fabricated citations in **78–90 % of cases** | General chatbots are worst exactly where students need them (recent work) | Deck slide 1 hook |
| **JMIR Mental Health 2025 (Linardon et al.)**: GPT-4o produced 176 citations across 6 literature reviews; **19.9 % fabricated**, and nearly **two-thirds fabricated or erroneous** | Even when a reference is "real", the details are often wrong, which is why we check every field | X-ray demo narration |
| **Scientific Reports 2023 (Walters & Wilder)**: 55 % of GPT-3.5 and 18 % of GPT-4 citations fully fabricated | Newer models haven't fixed it (the 2025 GPT-4o number is about the same as GPT-4's) | Q&A: "won't better models fix this?" |
| **arXiv 2604.03173 (Rao, Wong, Callison-Burch, Apr 2026, preprint)**: across 10 models and deep-research agents, **3–13 % of citation URLs never existed** and 5–18 % don't resolve. Deep-research agents hallucinate URLs *more* than plain search-LLMs | "Agentic" alone doesn't fix it. **Verification architecture** does | Architecture slide, Q&A |
| **NeurIPS 2025**: GPTZero found **100+ hallucinated citations in ~51–53 accepted papers** (~1 %); 50+ in ICLR 2026 submissions; ICLR then hired GPTZero to screen submissions | Peer review at the world's top AI conference missed them | Deck hook |
| **Deloitte Australia, Oct 2025**: partially refunded the government's **A$440,000** contract after a report contained fabricated references and a fake quote attributed to a judge | Consequences are financial and reputational, not just academic | Ethics slide |
| **Courts**: Charlotin's AI Hallucination Cases database counted **1,200+ court decisions** involving AI-fabricated content by spring 2026 | Professionals get sanctioned for this. Students are next | Q&A colour |

**The single most important local fact:** the **SP Jain Academic Integrity Policy (v2, approved 24 Feb 2026)** says students must:
- **§h(vi)** acknowledge others' work "adhering to APA referencing conventions" → Veracite defaults to **APA 7**
- **§h(viii)** "identify AI models, tools, and prompts" and acknowledge AI use → our **Prompt Ledger + auto AI-use statement**
- **§h(ix)** be mindful of AI "hallucinations" that "fabricate references from components of actual references" → our **Reference X-ray "chimera" detection**
- **§g(vi)** faculty verify "the accuracy and appropriateness of references" → our **Verification Certificate (QR)** that faculty can re-check

> Use this in the deck and the presentation. Judges are SP Jain people, and quoting their own policy clause numbers shows we did the homework.

## 2. What exists today, and the gap we fill

| Tool | Good at | Gap Veracite fills |
|---|---|---|
| **Zotero 8** (Jan 2026), Mendeley, EndNote | Organising, citing, CSL formatting | No AI research help built in (Zotero's AI comes from third-party plugins). They don't check whether a reference you paste is real |
| **Elicit, Consensus** | AI search and summaries over papers | Not a reference manager. Trust shown as a whole-answer feel, not **per-claim labels**. No student checkpoints. No disclosure generated from logs |
| **scite** | "Smart Citations": shows whether later papers support or contrast a paper | Paid; not a workflow tool for students |
| **SciSpace** | Breadth (reading, writing, citations) | Breadth over depth, no strong verification story |
| **Ai2 ScholarQA / Asta, PaperQA2** | Research-grade agentic RAG with citations | Built for researchers, not student integrity. No governance layer or student gates |
| **GPTZero Hallucination Check** | Finds fake citations in papers | Check-only: no library, no research assistant, no disclosure |
| **ChatGPT / Gemini / Perplexity deep research** | Speed | Fabrication rates above; no field-level verification; no honest "Not found" |

**Our position in one line:** *Zotero's organisation + Elicit's speed + GPTZero's suspicion + a student-in-charge workflow, with every reference proven against public registries.*

## 3. Free data sources we can actually use (Nov 2026 limits)

| Source | What we use it for | Free limit (check console on build day) |
|---|---|---|
| **Crossref REST API** | DOI lookup, `query.bibliographic` to match a messy pasted reference, **retractions** (`update-to`, source `retraction-watch`), corrections | Polite pool (send `mailto`): ~10 req/s single-record, **3 req/s for list/search** (Jul 2026 change); public pool 5 and 1 |
| **doi.org content negotiation** | Ask the DOI registry itself for CSL-JSON, and for formatted APA text as a cross-check | Free |
| **OpenAlex** | Search 480M works, abstracts (inverted index), `is_retracted`, `referenced_works` (snowballing), author institutions and **countries** (bias lens), open access | **API key mandatory since 13 Feb 2026** (free). Free key = **$1/day**: DOI lookups free, list ≈ $0.0001, search ≈ $0.001 → roughly 1,000 searches a day |
| **Semantic Scholar** | TLDRs, citation contexts and intents ("how others cite this") | Shared public pool (unreliable at peaks); free key = 1 req/s. Optional |
| **arXiv API** | Preprints in CS, physics, maths, econ | ~1 request per 3 s |
| **Europe PMC / Unpaywall** | Open-access full text, so quotes can be checked against full text, not just the abstract | Free (Unpaywall needs an email parameter) |
| **DOAJ** | "Is this journal in the Directory of Open Access Journals?" quality fact | Free |
| **Wayback Machine** | Availability API (is the URL archived?) plus a Save Page Now link for web sources | Free, be polite (~1 req/s) |

**Design consequence:** our checks call registries, which are cheap, fast and free. The AI is called only a handful of times per session.

## 4. Free AI (LLM) options. The rules allow free APIs only

| Provider | Free tier (Nov 2026, per org, per model) | Privacy | Role |
|---|---|---|---|
| **Groq** ✅ chosen | e.g. `gpt-oss-120b`: ~30 req/min, ~1,000 req/day, **8K tokens/min**, 200K tokens/day. **Limits are per model**, so different agents on different models multiply capacity | Says it does not train on API inputs/outputs; minimal retention; Zero Data Retention toggle available | **Primary brain** for all agents |
| Google AI Studio (Gemini) | Tightened in 2026: newest Flash ~5 RPM / ~20 req/day; Flash-Lite ~15 RPM / ~500 req/day | Free-tier data may be used to improve Google products, so **never send personal data** | Optional backup |
| OpenRouter `:free` models | Low daily cap without credits | Depends on the upstream model | Optional backup |
| **Rules mode (no AI)** | Unlimited | Nothing leaves the registry calls | Always-on fallback, so the demo can't die |

## 5. Research that shapes our agent design

- **Retrieval-augmented systems beat bare LLMs on citations.** OpenScholar (Nature 2026) reached roughly expert-level citation accuracy because it *retrieves first*. We go one step further: the model **cannot output a reference at all**. It can only point to IDs we fetched.
- **A separate critic works better than "ask the model if it's sure."** PaperQA2's ContraCrow agent found ~2.3 contradictions per biology paper, 70 % confirmed by experts → our **Skeptic** agent and counter-evidence search.
- **Debate-style verification.** Two agents argue for and against a claim and a judge decides (DebateCV, arXiv 2507.19090; multi-agent health-misinformation debate, arXiv 2512.09935) → our **Debate mode**, where **the student is the judge**.
- **Small, cheap fact-checkers work.** MiniCheck (EMNLP 2024): a 770M-parameter model matches GPT-4 at checking whether a document supports a sentence. That justifies a dedicated support-check step, not a vibe check.
- **Over-reliance is measurable.** MIT Media Lab, *Your Brain on ChatGPT* (June 2025, preprint, n=54): LLM-only writers showed the weakest brain connectivity, the lowest sense of ownership, and struggled to quote their own essays → **autonomy dial, read-before-you-cite, explain-it-back**.
- **AI-writing detectors are biased.** Stanford (2023): detectors flagged **61 %** of essays by non-native English writers as AI → **Veracite deliberately does NOT do "AI detection"**. We verify sources, we don't accuse people. Great answer for an ethics question at a school with many international students.

## 6. Rules and policies the website will follow (for the Governance slide)

1. **SP Jain Academic Integrity Policy and Procedures v2 (24 Feb 2026)**: §g(vi), §h(vi), §h(viii), §h(ix)
2. **APA 7 + APA Style generative-AI guidance (updated Sept 2025)**: disclose AI use and cite the tool or chat
3. **UNESCO Guidance for Generative AI in Education and Research (2023)**: human-centred, human agency, institutions validate tools
4. **UAE Charter for the Development and Use of AI (2024)**: 12 principles incl. human oversight, transparency, algorithmic bias, data privacy, governance and accountability
5. **UAE PDPL (Federal Decree-Law No. 45 of 2021)**: personal-data protection → no accounts, local-first storage, PII scrubbing
6. **EU AI Act Art. 50 transparency obligations (applicable 2 Aug 2026)**: tell users they are interacting with AI and label AI-generated content (we label every AI sentence)
7. **COPE / ICMJE position**: AI cannot be an author; humans are accountable → the student is always the author of record
8. **Hackathon rules 8 and 9**: keep a prompt record; label sample or simulated content → built into the product itself

## 7. So what? The ten design decisions this research forces

1. **The AI never writes a reference.** References come only from registry records (structural guarantee).
2. **Two independent registries must agree** (Crossref and OpenAlex) before anything is "Verified".
3. **Field-level checking** (title, authors, year, venue, DOI), because most errors are *partly* wrong, not wholly fake.
4. **Claim-level labels**, not answer-level confidence. And **no confidence percentages** (that would be a model emitting a number someone acts on).
5. **An honest "Not found"** with receipts of what was searched.
6. **Retraction and correction checks** on every source, and again whenever the library is opened.
7. **The student approves the plan, the sources and the claims.** Nothing is exported without approval.
8. **Disclosure is generated from logs**, never typed from memory.
9. **Free and private by design**: Groq (no training on our data), local-first library, no login.
10. **A rules-only fallback**, so the integrity features work even with zero AI.

---

## Sources
- OpenScholar, Nature Feb 2026: [UW News](https://www.washington.edu/news/2026/02/04/in-a-study-ai-model-openscholar-synthesizes-scientific-research-and-cites-sources-as-accurately-as-human-experts/) · [Nature Asia press release](https://www.natureasia.com/en/info/press-releases/detail/9228) · [arXiv preprint](https://arxiv.org/html/2411.14199v1)
- Linardon et al., JMIR Mental Health 2025: [paper](https://mental.jmir.org/2025/1/e80371) · [PsyPost summary](https://www.psypost.org/study-finds-nearly-two-thirds-of-ai-generated-citations-are-fabricated-or-contain-errors/)
- Walters & Wilder 2023: [PMC10484980](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10484980/)
- Rao, Wong, Callison-Burch 2026: [arXiv 2604.03173](https://arxiv.org/abs/2604.03173)
- NeurIPS/ICLR hallucinated citations: [Fortune](https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/) · [GPTZero](https://gptzero.me/news/neurips/) · [arXiv 2602.05930](https://arxiv.org/html/2602.05930)
- Deloitte refund: [Fortune](https://fortune.com/2025/10/07/deloitte-ai-australia-government-report-hallucinations-technology-290000-refund/) · [The Register](https://www.theregister.com/2025/10/06/deloitte_ai_report_australia/)
- Court cases: [heise](https://heise.de/-11257675) · [UNC Law Library](https://library.law.unc.edu/2026/06/handling-hallucinations-a-reflection/)
- SP Jain policy: [Academic Integrity Policy and Procedures (Dubai)](https://www.spjain.ae/hubfs/policies-pdf/Academic-Integrity-Policy-and-Procedures.pdf)
- APA GenAI guidance: [APA Style blog](https://apastyle.apa.org/blog/cite-generative-ai-references)
- UNESCO: [Guidance for GenAI in education and research](https://unesco.org.uk/resources/guidance-for-generative-ai-in-education-and-research)
- UAE AI Charter: [u.ae](https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/policies/Ai/The-UAE-Charter-for-the-Development-and-Use-of-Artificial-Intelligence)
- EU AI Act Art. 50: [Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force) · [CMS](https://cms.law/en/bgr/legal-updates/eu-ai-act-developments-key-political-agreement-on-the-digital-omnibus-on-ai-implementation-timeline-and-transparency-consultation)
- OpenAlex pricing and keys: [OpenAlex blog](https://blog.openalex.org/openalex-api-new-features-and-usage-based-pricing/) · [Auth docs](https://openalex.mintlify.app/api-reference/authentication) · [Work object](https://developers.openalex.org/api-reference/works/get-a-single-work)
- Crossref limits: [Access & authentication](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/) · [Rate-limit update](https://community.crossref.org/t/refining-rest-api-limits-for-improved-stability-and-reliability/16137)
- Crossref retractions: [Retraction Watch in Crossref API](https://www.crossref.org/blog/retraction-watch-retractions-now-in-the-crossref-api/) · [Docs](https://crossref.org/documentation/retrieve-metadata/retraction-watch/)
- Semantic Scholar API: [Overview](https://semanticscholar.org/product/api)
- Groq limits and privacy: [Groq community](https://community.groq.com/t/what-are-the-rate-limits-for-the-groq-api-for-the-free-and-dev-tier-plans/42) · [Your data](https://console.groq.com/docs/your-data)
- Gemini free tier 2026: [apidog](https://apidog.com/blog/gemini-api-free-tier/) · [imisofts](https://imisofts.com/blog/gemini-api-free-tier-limits/)
- Wayback API: [archive.org](https://archive.org/help/wayback_api.php)
- Competitors: [Zotero 8](https://www.zotero.org/blog/zotero-8/) · [HKUST library evaluation](https://library.hkust.edu.hk/sc/trust-ai-lit-rev/) · [Ai2 ScholarQA](https://allenai.org/blog/ai2-scholarqa) · [PaperQA2](https://www.futurehouse.org/paperqa)
- Debate verification: [DebateCV](https://arxiv.org/abs/2507.19090v3) · [Health misinformation debate](https://arxiv.org/pdf/2512.09935.pdf)
- MiniCheck: [ACL Anthology](https://aclanthology.org/2024.emnlp-main.499)
- MIT "Your Brain on ChatGPT": [MIT Media Lab](https://www.media.mit.edu/publications/your-brain-on-chatgpt/)
- AI detector bias: [Stanford HAI](https://hai.stanford.edu/news/ai-detectors-biased-against-non-native-english-writers)

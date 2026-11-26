# Type and show: what to paste in the live demo, start to finish

Everything you need to type or paste in front of the judges, in demo order. All of it was checked on the live site on Thu 26 Nov 2026.

## How to use this file

1. Open this file on the presenter's laptop, in a plain text editor or the GitHub page, next to the browser.
2. Open **https://veracite.vercel.app** in the browser. That is the only window the projector shows.
3. For each step: copy the grey block with the copy button (or select it all), switch to the browser, paste, and click what the step says.
4. Read the "Judges see" line before you click, so you know what should appear. If something else appears, say what it says. Do not explain it away.
5. Copy, do not retype. A typo in a reference changes its verdict.
6. Run all seven steps once in rehearsal, on the same laptop and Wi-Fi you will present from.

The references in step 1 are a **test list written by Team 7, with deliberate fakes**. Say so when you paste it (hackathon rule: never present invented references as real).

---

## Step 1 · Reference X-ray: one real, three that are not

**Where:** `/xray` → click in the big text box → paste → **X-ray 5 references**

```text
1. Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). Generative AI without guardrails can harm learning: Evidence from high school mathematics. Proceedings of the National Academy of Sciences, 122(26), e2422633122. https://doi.org/10.1073/pnas.2422633122
2. Smith, J. A., & Lee, K. (2023). The impact of ChatGPT on undergraduate academic performance: A meta-analysis. Journal of Educational Technology & Society, 26(3), 45–62. https://doi.org/10.1073/pnas.2422633122
3. Wang, J., & Fan, W. (2025). The effect of ChatGPT on students’ learning performance, learning perception, and higher-order thinking: Insights from a meta-analysis. Humanities and Social Sciences Communications, 12, 621. https://doi.org/10.1057/s41599-025-04787-y
4. Johnson, M., & Patel, R. (2024). ChatGPT as a personal tutor: Effects on student motivation and exam scores in higher education. Computers & Education, 210, 104958.
5. Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2021). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. Scientific Reports, 15, 17458. https://doi.org/10.1038/s41598-025-97652-6
```

**Judges see:**

| # | Verdict | Why |
|---|---|---|
| 1 | **Verified** | Title, authors and year match in Crossref and OpenAlex. |
| 2 | **Chimera** | The DOI is real, but it belongs to reference 1. No paper has this title. The panel on the right takes it apart and says a DOI-only check would pass it. |
| 3 | **Retracted** | A real meta-analysis that was later retracted. It cannot be added to the list. |
| 4 | **Not found** | No registry has it. Veracite says so instead of guessing. |
| 5 | **Mismatch** | A real paper with the wrong year (2021; the registry says 2025). |

**Say:** "Five references. One is real. One has a real DOI on the wrong paper, so a DOI checker would pass it. One was retracted. One does not exist. No AI in this step: it is plain code against public registries."

**Then click:** **How this was decided** on any row → **Add to my list** on reference 1.

Shortcut if you are behind: **Load test list** → **X-ray 8 references** does the same with the built-in list.

---

## Step 2 · A judge's own reference (optional, strong)

**Where:** `/xray` → **Clear** → ask a judge for any reference, real or invented → type or paste it → **X-ray**

**Say first:** "Give me any reference, real or made up, and I'll check it in front of you."

**Judges see:** whatever the registries say. A real one is Verified, or Mismatch if a detail is off. An invented one is Not found or Chimera.

**If a registry is slow:** "It says could not be checked instead of guessing. That is the honest failure."

Try this three times in rehearsal before you decide to use it.

---

## Step 3 · Research session with three checkpoints

**Where:** `/research` → set **AI autonomy** to **Co-pilot** → paste the question → **Start**

```text
Does generative AI help or hurt student learning?
```

**Then click, in order:**
1. **Approve plan and search** (checkpoint 1)
2. **Add to my list** on three or four Verified sources → **Continue with N approved sources** (checkpoint 2)
3. Point at the labels and the Skeptic's line on a claim → **Keep** on each claim → **Approve claims and export** (checkpoint 3)

**Judges see:** a search plan, then real sources each already checked, then claims with a label set by code. It took about 20 seconds live.

**Say what is on screen.** Runs differ: sometimes every claim is Verified, sometimes the Skeptic lowers some to Reported. Either way: "Labels come from code checks, not the AI's opinion."

**If the AI or Wi-Fi fails:** click **No Wi-Fi or AI? Show the SAMPLE session** and say "This is a recording of a real session from this morning."

---

## Step 4 · Write & cite

**Where:** `/draft` → click in the **Write & cite** box → paste the sentence → **Choose a verified source to cite** → pick Bastani et al. (2025) → **Insert citation**

```text
Unrestricted access to generative AI can harm learning when students use it without guardrails
```

**Judges see:** the citation goes in at the cursor and the reference list builds itself underneath. Only verified sources are in the dropdown.

**Optional (10 seconds):** change **Citation style** to **Harvard** and the list re-formats.

**Say:** "The student writes the sentence. The AI does not write the essay. And only verified sources can be cited."

---

## Step 5 · Library and export

**Where:** `/library` → **Export** → the export gate opens → tick **I have read the warnings above…** → **Download**

Nothing to type.

**Judges see:** the sources added in steps 1 and 3, warnings for sources not yet opened, and an AI-use statement written from the session log.

---

## Step 6 · Certificate

**Where:** `/certificate` → **Create certificate** → point at the QR code

Nothing to type.

**Judges see:** a certificate with a QR code. Scanning it re-checks every reference live.

**Say:** "A professor scans this and Veracite checks every reference again. That is SP Jain clause g(vi) in one scan."

---

## Step 7 · The proof, and AI off

**Where:** `/trust` → point at the results card → point at the table **Why a DOI check is not enough** → set **AI autonomy** (left sidebar) to **Off**

Nothing to type.

**Judges see:** 51 test references, 0 fakes marked Verified, and the DOI-only check next to Veracite: 12 fakes or retracted papers passed as fine against 0.

**Say:** "We measured it. A DOI-only checker passed twelve fakes or retracted papers on the same test. Veracite passed none. And with the AI off, every check still runs."

---

## If a judge asks you to type their own question

Do it. Type it into `/research` on **Co-pilot** and press **Start**. We ran these ten on the live site on 26 Nov 2026; each took 15 to 25 seconds.

| The judge types… | Judges see | Say |
|---|---|---|
| A real research question on any topic. Tested: remote work and productivity, intermittent fasting, social media and teenage mental health, microfinance and poverty | A sensible plan, about ten real sources (nearly all Verified), three to five labelled claims with quotes | "Any topic the public registries cover. Every source is checked before I can approve it." |
| A question in Arabic. Tested: "هل يساعد الذكاء الاصطناعي الطلاب على التعلم؟" | English search terms, real sources, labelled claims | "The Planner turns it into search terms; the registries are mostly English." |
| A vague one: "Tell me about AI" | Broad overview sources and general claims | "A broad question gets a broad answer. A sharper question gets better evidence." |
| A fact, not research: "What is the capital of France?" | Real sources, then **No claims could be drawn** | "No abstract states this, so it wrote nothing instead of guessing." |
| A prediction: "Who will win this hackathon?" | One **AI reasoning** line saying the evidence does not answer this | "It tells you the evidence can't answer that. It doesn't make one up." |
| Nonsense with real words: "Do purple unicorns improve quantum banana yields?" | Real but unrelated sources, then **No claims could be drawn** | "There is no evidence, so there are no claims." |
| Keyboard mashing: "mjbkjkll;;" | Straight back to the question: **could not turn this into a search, so nothing was searched** | "It refuses to search what it can't understand." |
| "Write my essay on climate change for me" | A research session with sources and labelled claims. No essay | "It gives you checked evidence. The student writes the essay." |

Rule for all of them: **say what is on the screen.** An honest "no claims" is the product working.

## Optional extras, only if a judge asks

**A web page as a source** (`/xray`, paste, **X-ray**). Judges see **Partial**, never Verified, with the retrieval date.

```text
Crossref. (n.d.). REST API. Retrieved November 24, 2026, from https://www.crossref.org/documentation/retrieve-metadata/rest-api/
```

Do not use an organisation's report here (for example UNESCO 2023): registry records for those often have no authors, and Veracite can wrongly call it a Chimera. That is a known weak spot.

**A DOI on its own** (`/xray`). Judges see **Partial**: the DOI exists, but with no title or authors there is nothing to compare.

```text
10.1073/pnas.2422633122
```

## If something goes wrong

| What happens | Do this | Say this |
|---|---|---|
| A row says "could not be checked" | Carry on with the other rows | "The registry didn't answer, so it says so instead of guessing." |
| The research session fails twice | Set AI autonomy to Off and start again | "This is Rules mode. Every check still runs; only the AI drafting is missing." |
| No Wi-Fi | Phone hotspot; if that fails, the SAMPLE session | "This is a recording of a real session, labelled SAMPLE." |
| The whole site is down | Show the Trust Center numbers from the deck, slide 6 | "The live link is not answering. Here is what it measured yesterday." |

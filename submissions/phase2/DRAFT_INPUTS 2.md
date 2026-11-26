# Draft Checker: a paragraph to paste in the demo

Tested on https://veracite-one.vercel.app on Thu 26 Nov 2026. It shows all four results in one go.

## Before you paste (or the checker has nothing to compare against)

The Draft Checker only checks citations against **your reference list**. So first:

1. Open `/xray` → **Load test list** → **X-ray 8 references**.
2. Click **Add to my list** on the three Verified papers (Bastani, Kosmyna, Brynjolfsson).

## Paste this

**Where:** `/draft` → the box under **Your paragraph** → paste → **Check paragraph**

```text
One study warns that “unfettered access to GPT-4 can harm educational outcomes” (Bastani et al., 2025). Students who used AI tutors earned higher salaries ten years later (Bastani et al., 2025). Generative AI raised the productivity of customer-support agents, especially novices (Brynjolfsson et al., 2025). A meta-analysis found ChatGPT improves academic performance (Smith & Lee, 2023). Most students now use AI for their assignments.
```

Copy it exactly. The curly quotation marks in the first sentence matter: the words inside them are copied word for word from the abstract.

## What judges see, sentence by sentence

| # | Sentence | Label | What it shows |
|---|---|---|---|
| 1 | “unfettered access to GPT-4 can harm educational outcomes” (Bastani) | **Verified** | The quote is in the source's abstract, word for word. |
| 2 | AI tutors → higher salaries ten years later (Bastani) | **Reported, not checked** | Only 22% of its key words are in the abstract: "The source may not say this; check the full text before you cite it." This is the invented claim on a real source. |
| 3 | Productivity of customer-support agents (Brynjolfsson) | **Reported, not checked** | 50% of key words match, and it shows the matching sentence for the student to read and judge. |
| 4 | A meta-analysis (Smith & Lee, 2023) | **Not found** | "No source by Smith is in your reference list." That's the chimera from the X-ray: it was never verified, so it can't be cited. |
| 5 | Most students now use AI… | **No citation · not checked** | A claim with no source is flagged, not guessed at. |

It also says Kosmyna is in your list but not cited, because APA lists only the works you cite.

## What to say (about 20 seconds)

"Here's a student's paragraph. A real quote from a verified paper: Verified. A real paper, but a claim it never made: flagged, because its words aren't in the source. A citation that never passed the X-ray: Not found. And a claim with no citation at all is marked too. All of this is code checking the abstract, not AI."

## If a judge asks

- **"Is this AI?"** No. The checking is code comparing words with the abstract. The **Ask the Skeptic** button is the optional AI step, and it can only lower a label.
- **"Why is sentence 3 not Verified?"** It's a paraphrase, not a quote. Veracite shows the closest sentence and lets the student decide; only an exact quote gets Verified.
- **"Only abstracts?"** Yes. Full text is often paywalled, so anything deeper stays "Reported, not checked".

## Shortcut

The page has a **Use a test paragraph** button that fills in a built-in example. Use it if you're short of time; the paragraph above shows more.

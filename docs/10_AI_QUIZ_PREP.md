# 10 · AI quiz prep (3:15 PM, ≤ 5 minutes, one answer per question per team)

**Tactics:** Avighna writes the answers. The **specialist decides in ≤ 20 seconds** (Krishna: tech/models · Zedan: ethics/regulation/UAE · Avighna: history/companies). If unsure, eliminate options out loud, then go with the specialist. Never leave a blank.

## 1. Core terms (expect definition questions)
| Term | One-line meaning |
|---|---|
| **LLM** | Large language model: predicts the next token, trained on huge text corpora |
| **Token** | A chunk of text (≈ ¾ of an English word) that models read and write |
| **Context window** | How many tokens the model can consider at once |
| **Temperature** | Randomness of output (0 = most deterministic) |
| **Transformer** | Neural-network architecture built on *attention* ("Attention Is All You Need", Google, 2017) |
| **Attention** | Mechanism letting each token weigh every other token's relevance |
| **Embedding** | A list of numbers representing meaning; similar meanings sit close together |
| **Vector database** | Stores embeddings for similarity search |
| **RAG** | Retrieval-Augmented Generation: fetch relevant documents, then generate an answer grounded in them |
| **Hallucination** | Fluent output that is false or unsupported (e.g. fake citations) |
| **Grounding** | Tying output to verifiable sources |
| **Fine-tuning / LoRA** | Further training on specific data / a cheap fine-tuning method using small low-rank adapters |
| **RLHF** | Reinforcement Learning from Human Feedback: aligning models with human preferences (InstructGPT/ChatGPT) |
| **Chain-of-thought / reasoning model** | Model works through intermediate steps before answering (e.g. OpenAI o-series, DeepSeek-R1) |
| **AI agent** | An LLM that plans, uses tools and takes multi-step actions toward a goal |
| **Function calling / tool use** | Model outputs structured calls to external tools/APIs |
| **MCP** | Model Context Protocol: open standard (Anthropic, Nov 2024) to connect AI apps to tools and data |
| **A2A** | Agent2Agent protocol (Google, 2025) for agents to talk to each other |
| **Multimodal** | Handles text plus images, audio, video |
| **Diffusion model** | Generates images or video by iteratively denoising (Stable Diffusion, Midjourney, DALL·E) |
| **GAN** | Generative Adversarial Network: generator vs discriminator (Goodfellow, 2014) |
| **MoE** | Mixture of Experts: only part of the network activates per token |
| **Quantization / distillation** | Shrinking models: lower-precision numbers / training a small model to mimic a big one |
| **Supervised / unsupervised / reinforcement learning** | Learn from labels / find structure without labels / learn from rewards |
| **Zero-shot / few-shot** | Do a task with no examples / with a few examples in the prompt |
| **Overfitting** | Memorising training data, failing on new data |
| **Precision / recall / F1** | Of what you flagged, how much was right / of what existed, how much you caught / their harmonic mean |
| **Prompt injection / jailbreak** | Hidden instructions hijacking a model / tricking it past its safety rules |
| **Red teaming** | Deliberately attacking a system to find failures |
| **XAI (SHAP, LIME)** | Explainable AI methods showing which features drove a prediction |
| **AGI** | Artificial General Intelligence: human-level across most tasks (not yet achieved) |
| **Turing Test / Chinese Room** | Turing 1950 imitation game / Searle 1980 argument that symbol manipulation ≠ understanding |
| **GPU / TPU / NPU** | Graphics chips used for AI (NVIDIA) / Google's tensor chips / on-device AI chips |
| **SynthID / C2PA** | Google DeepMind watermarking of AI content / industry content-credentials standard |

## 2. Timeline (classic quiz fodder)
| Year | Event |
|---|---|
| 1950 | Turing, *Computing Machinery and Intelligence* (Turing Test) |
| 1956 | "Artificial intelligence" coined at the Dartmouth workshop (John McCarthy et al.) |
| 1958 | Rosenblatt's Perceptron |
| 1966 | ELIZA chatbot (Joseph Weizenbaum, MIT) |
| 1970s / late 1980s | The two "AI winters" |
| 1986 | Backpropagation popularised (Rumelhart, Hinton, Williams) |
| 1997 | IBM Deep Blue beats Garry Kasparov at chess |
| 2012 | AlexNet wins ImageNet: the deep-learning boom begins |
| 2014 | GANs (Ian Goodfellow) |
| 2016 | DeepMind's AlphaGo beats Lee Sedol at Go |
| 2017 | Transformer paper, "Attention Is All You Need" |
| 2018 | BERT (Google), GPT-1 (OpenAI); Turing Award to Bengio, Hinton, LeCun |
| 2020 | GPT-3 (175B parameters); AlphaFold 2 solves protein-structure prediction |
| 30 Nov 2022 | ChatGPT launches |
| 2023 | GPT-4, Claude, Llama, Gemini (Dec); Bletchley AI Safety Summit (UK) |
| 2024 | Nobel Physics: Hopfield & Hinton; Nobel Chemistry: Hassabis, Jumper (AlphaFold) & Baker; EU AI Act enters into force (1 Aug); MCP released |
| Jan 2025 | DeepSeek-R1: open-weights reasoning model from China shocks markets |

## 3. Regulation and ethics
- **EU AI Act**: risk-based tiers (unacceptable / high / limited / minimal). Prohibited practices applied from Feb 2025; general-purpose AI rules Aug 2025; **Art. 50 transparency Aug 2026**.
- **UNESCO Recommendation on the Ethics of AI** (Nov 2021, adopted by all member states); **UNESCO GenAI in education guidance** (2023).
- **OECD AI Principles** (2019) · **NIST AI Risk Management Framework** (2023) · **ISO/IEC 42001** (2023, AI management systems).
- **Core principles everywhere:** fairness, accountability, transparency, privacy, safety, human oversight ("human-in-the-loop").
- **AI detectors are unreliable/biased** (Stanford 2023: 61 % of non-native English essays falsely flagged).

## 4. UAE and region (likely at an SP Jain Dubai event)
- **2017:** UAE appoints the world's first **Minister of State for AI** (H.E. Omar Sultan Al Olama) and launches the **National AI Strategy 2031**.
- **MBZUAI** (Abu Dhabi, founded 2019): the world's first graduate-level AI university.
- **Falcon** LLMs from TII (Technology Innovation Institute, Abu Dhabi); **Jais**, an Arabic-English LLM (G42's Inception + MBZUAI); **K2 Think** reasoning model (MBZUAI + G42, 2025).
- **G42** (Abu Dhabi AI group); Microsoft invested **US$1.5 bn** in G42 (2024).
- **Stargate UAE** (announced May 2025): a large AI data-centre campus in Abu Dhabi with OpenAI, G42 and partners.
- **UAE Charter for the Development and Use of AI** (2024, 12 principles); **UAE PDPL**, Federal Decree-Law 45/2021 (personal data).
- AI is being taught as a subject in UAE public schools from the 2025–26 academic year.

## 5. Companies and products, quick map
OpenAI → ChatGPT, GPT, o-series, Sora · Anthropic → Claude, MCP · Google/DeepMind → Gemini, AlphaGo, AlphaFold, Gemma · Meta → Llama · Microsoft → Copilot · Mistral (France) · DeepSeek, Qwen/Alibaba (China) · xAI → Grok · NVIDIA → GPUs, CUDA · Groq → fast LPU inference chips (≠ Grok!) · Hugging Face → open-model hub · Perplexity → AI search.

> ⚠️ **Groq vs Grok** is a classic trick question. **Groq** = AI inference chips/cloud (what Veracite uses). **Grok** = xAI's chatbot.

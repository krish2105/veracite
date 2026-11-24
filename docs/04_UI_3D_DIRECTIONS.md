# 04 · UI directions: four full-3D concepts (pick one)

*Brief: Veracite, an honest AI research assistant for SP Jain students. Audience: students first, faculty judges second. The landing page has one job: within 5 seconds, make a visitor feel "this thing catches fake references", then send them into the X-ray or a research session.*

**Rules applied to all four (so none of it reads as AI slop):**
- Each direction is built on a **real-world way of proving authenticity**. The look comes from the subject, not from a template.
- None uses the three AI-default looks (cream background + serif + terracotta; black + one acid-green accent; hairline newspaper grid).
- **One signature moment** per direction. Everything around it stays quiet.
- Both themes are designed on purpose. The light/dark toggle **means something** in each world.
- The **trust-label shapes are the same in every direction** (colour is never the only signal):
  `● Verified` (filled circle with tick) · `◐ Reported, not checked` (half circle) · `◆ AI reasoning` (diamond) · `○ Not found` (hollow, struck circle)
- 3D is lazy-loaded behind a static poster. `prefers-reduced-motion` turns it off. Every 3D view has a list/table twin. 60 fps target on an M-series laptop.

---

## Direction 1 · WATERMARK: "Every reference, held to the light" ⭐ recommended

**World:** banknote and passport security printing. A fabricated reference is a **counterfeit**: it borrows real parts (a real author, a real journal) and assembles a fake. Veracite inspects it like a bank teller with a loupe and a UV lamp.

**Signature:** the **theme toggle is a UV lamp**. Switch to dark and the page goes "under ultraviolet": hidden security marks fluoresce, the DOI microprint glows along the edge of genuine references, and on fabricated ones a hidden **VOID** pattern appears. This copies the real anti-photocopy "void pantograph" on cheques. The toggle you're required to build becomes the most memorable moment of the demo.

| Token | Daylight (light) | UV lamp (dark) |
|---|---|---|
| Background | Security paper `#EDF1EE` (cool mint-grey, not cream) | Blacklight `#0A0820` |
| Ink | Intaglio green-black `#0E2A23` | UV white `#E9E6FF` |
| Primary | Guilloché teal `#1F6F68` | UV cyan `#4DF2FF` |
| Interactive accent | Engraver violet `#5B4BC4` | UV magenta `#FF4FD8` |
| Alert (fakes/retractions only) | Void red `#C3263B` | Void red glow `#FF3B5C` |
| Special | Holographic foil (thin-film gradient `#9AE6E0 → #C9B8FF → #F7D4A8`), only on the foil strip | Fluorescent fibres (cyan and magenta specks) |

**Type:** Display **Archivo Expanded** (width 125, weight 750, caps, like the denomination lettering on modern notes) · Body **Literata** (designed for long reading) · Data **Martian Mono** (DOIs, serial numbers, microprint).

**Hero layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ VERACITE   Research  X-ray  Library  Trust            [☼ ◑ UV]  ⌘K   │
├──────────────────────────────────────────────────────────────────────┤
│                                     ╔════════════╗   ╔════════════╗  │
│  EVERY REFERENCE,                   ║ ✺ rosette  ║   ║ ✺ rosette  ║  │
│  HELD TO THE LIGHT.                 ║ Smith 2021 ║   ║ "Smith 2021"║ │
│                                     ║ ▓ foil     ║   ║ ▓ foil     ║  │
│  Veracite checks every citation     ║ 10.1038/…  ║   ║ ░ V O I D ░║  │
│  against the world's research       ╚════════════╝   ╚════════════╝  │
│  registries and shows its receipts.   GENUINE           SAMPLE: written│
│  [ X-ray a bibliography ] [ Research ]                 by ChatGPT      │
│                         (cursor = loupe; in UV mode = torch)          │
├──────────────────────────────────────────────────────────────────────┤
│ microprint ticker ▸ 10.1038/s41586-… ● · 10.1016/… ○ VOID · …        │
└──────────────────────────────────────────────────────────────────────┘
```

**3D scene (R3F):** two reference "notes" (thin rounded boxes) floating with slow parallax. The front face carries a procedural **guilloché rosette** (SVG texture or shader), a **holographic foil strip** (thin-film iridescence driven by view angle) and microprinted DOI text around the border. The cursor is a lens: in light mode it magnifies the microprint; in UV mode it reveals the fluorescent layer. Clicking the fake note runs a live mini-X-ray: the note **splits along its seams into the real papers its parts were taken from** (the chimera explode).

**App screens in this style:**
- X-ray results look like a **note-inspection checklist**: each "security feature" (DOI, title, authors, year, venue, retraction) gets a stamped tick or a red void mark.
- Trust labels are **embossed seals**.
- The 3D Galaxy is a field of small rosette medallions joined by fine guilloché threads.
- The Certificate looks like an **engraved security document** with a QR code and hash, the most "screenshot-able" page we'll have.

**Inspired by:** Swiss franc 9th series banknotes (Manuel Krebs), passport security pages, the anti-copy void pantograph, guilloché engraving, holographic foils; WebGL thin-film/iridescence shaders (pmndrs/drei material examples).
**Risk:** the guilloché and foil shaders take care to get right. *Mitigation:* pre-render the rosette as an SVG texture; foil is a simple angle-based gradient; full shader is optional polish.

---

## Direction 2 · CYANOTYPE OBSERVATORY: "Navigate by verified stars"

**World:** star atlases and astrolabes. Every paper is a catalogued star (the DOI is its catalogue number) and citations are constellations. AI hallucinations are **ghost stars**, lens artefacts that vanish when you look properly.

**Signature:** the **Astrolabe Lens**, a brass ring with tick marks that follows the cursor. Inside the lens ghost stars disappear and real stars show their catalogue card.

| Token | Cyanotype (light) | Night sky (dark) |
|---|---|---|
| Background | Blueprint paper `#EAF0F7` | Deep sky `#060914` |
| Ink | Prussian blue `#12357A` | Starlight `#F2EBD9` |
| Secondary | Faded cyan `#5C7DB8` | Nebula blue `#3355AA` |
| Instrument | Brass `#A9814A` | Brass `#C9A15E` |
| Alert | Nova `#E0445E` | Nova `#FF5A73` |

**Type:** Display **Libre Caslon Display** (used sparingly, like engraved atlas titles) · Body **Atkinson Hyperlegible Next** (an accessibility story) · Data **IBM Plex Mono** (catalogue numbers).

**Hero layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ VERACITE                                       ☾/☼   Research  X-ray │
│        ·   ✦      ·        ✦ ── ✦                                     │
│   ✦       ·    ◯ brass lens ◯     ·    ✦      NAVIGATE BY            │
│      ✦ ── ✦       (ghost ✧ fades)        ·    VERIFIED STARS.        │
│   ·        ·   ✦          ✦  ──  ✦            Every source has a     │
│      RA/Dec graticule lines, slow drift       catalogue number.      │
│                                               [ Chart a question ]   │
└──────────────────────────────────────────────────────────────────────┘
```

**3D scene:** instanced star sphere (~3,000 points) with RA/Dec graticule; constellation lines between related papers; brass astrolabe torus with ticks as the lens. Scrolling flies the camera into one "constellation", a sample research question whose verified stars light up one by one. **The 3D Evidence Galaxy is native here:** your library *is* the sky.

**Inspired by:** Anna Atkins' cyanotypes (1843), 18th-century star atlases, brass astrolabes, planetarium projection.
**Risk:** "space" is a common web trope. *Mitigation:* the cyanotype light mode and brass instrument make it ours; no generic purple nebula.

---

## Direction 3 · CABINET OF CURIOSITIES: "Some references are stitched together"

**World:** a natural-history museum's specimen drawers. Every reference is a pinned specimen with a label card (collector = author, date = year, locality = journal). Fabricated references are like the famous **"Fiji mermaid"** hoax, stitched from parts of real animals, just as AI stitches "components of actual references" (SP Jain §h(ix)).

**Signature:** the **Chimera Explode**. Click a suspicious specimen and it comes apart in 3D. Each piece flies to the real paper it was taken from, with labelled threads ("title from Lee 2019 · authors from Kim 2022 · year invented").

| Token | Collection room (light) | After hours (dark) |
|---|---|---|
| Background | Conservation grey `#E4E6E3` | Cabinet dark `#121416` (single warm spotlight) |
| Label paper | `#F7F7F4` | `#1D2023` |
| Ink | `#1B1D1F` | `#ECE9E2` |
| Primary | Archival blue `#24477A` | Archival blue light `#7FA3DB` |
| Detail | Pin brass `#A8864F` | Pin brass `#C9A56A` |
| Alert | Hoax magenta `#B5317A` | `#E0559F` |

**Type:** Display **Gloock** (high-contrast, museum-placard feel) · Body **Hanken Grotesk** · Labels **Courier Prime** (typed specimen labels).

**Hero layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ VERACITE  Research  X-ray  Library  Trust                    ☀/☾     │
│   ┌───────────────── glass-topped drawer (3D, tilted) ───────────────┐│
│   │ ▭pin  ▭pin  ▭pin  ▭pin   ▭pin(SAMPLE chimera ⚠)  ▭pin  ▭pin    ││
│   │ ▭pin  ▭pin  ▭pin  ▭pin   ▭pin                   ▭pin  ▭pin    ││
│   └──────────────────────────────────────────────────────────────────┘│
│   SOME REFERENCES ARE STITCHED TOGETHER.  Veracite takes them apart. │
│   [ X-ray a bibliography ]                                           │
└──────────────────────────────────────────────────────────────────────┘
```

**3D scene:** wooden drawer with a glass lid (transmission material), rows of pinned label cards (planes with text textures) under soft area light with contact shadows. Hovering lifts a card off its pin. The chimera card does the explode. In dark mode one spotlight follows the cursor like a curator's torch.

**Inspired by:** Wunderkammer cabinets, museum type-specimen drawers, the P.T. Barnum Fiji mermaid hoax, museum label typography.
**Risk:** can feel old-fashioned. *Mitigation:* crisp modern UI chrome around one antique object. *Note:* the Chimera Explode works in **any** direction. I recommend borrowing it for the X-ray whichever direction you pick.

---

## Direction 4 · SPECTROGRAPH: "Every claim has a fingerprint"

**World:** a physics lab's optical bench. Astronomers identify what a star is made of from the dark lines in its light spectrum (Fraunhofer lines). In Veracite **a claim is light**: pass it through the prism and its evidence shows up as **spectral lines, one per source**. A fabricated claim shows **no lines at all**.

**Signature:** the **Evidence Spectrum**. Every claim in the app carries a small spectral barcode: one line per source, line style by trust label. A claim with no lines is visibly empty.

| Token | Lab bench (light) | Darkroom (dark) |
|---|---|---|
| Background | `#F5F6F8` | `#07080B` |
| Ink | `#0F1216` | `#EEF1F6` |
| Graphite | `#3A4048` | `#9AA3AE` |
| Beam | `#DDE6FF` | `#FFFFFF` |
| Spectrum | Full spectrum, **only inside data barcodes** | same |
| Alert | `#D4183D` | `#FF4D6A` |

**Type:** Display **Schibsted Grotesk** · Body **Instrument Sans** · Data **JetBrains Mono**.

**Hero layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ VERACITE                                          ◐  Research  X-ray │
│                                                                      │
│  "Screen time harms sleep"  ═════▶ ◢◣ prism ◢◣ ══▶ ▌▐ ▌ ▐▐▌ ▌        │
│   (typed question = beam)            (glass)      spectral lines =   │
│                                                    5 verified sources│
│  "AI invented claim"        ═════▶ ◢◣ prism ◢◣ ══▶ ░░░░░░░░ (none)   │
│                                                    NO SIGNATURE ○    │
│  EVERY CLAIM HAS A FINGERPRINT.   [ Test a claim ]                   │
└──────────────────────────────────────────────────────────────────────┘
```

**3D scene:** a glass prism (transmission material with chromatic aberration) on a matte optical bench. The beam starts from the hero text input. Dispersed rays land on a strip and form labelled lines. Typing a different claim re-runs the beam.

**Inspired by:** Newton's prism experiment, Fraunhofer lines, lab optical benches, spectrometer readouts.
**Risk:** rainbow gradients can look cheap. *Mitigation:* the whole UI is monochrome; colour appears only as data.

---

## Side-by-side

| | 1 Watermark ⭐ | 2 Observatory | 3 Cabinet | 4 Spectrograph |
|---|---|---|---|---|
| Fits the "fake references" story | ★★★★★ counterfeit = fabricated | ★★★☆ ghost stars | ★★★★★ chimera = §h(ix) | ★★★★ fingerprint |
| Meaningful theme toggle | ★★★★★ UV lamp reveals VOID | ★★★★ day/night sky | ★★★ spotlight | ★★★ darkroom |
| 3D wow | ★★★★ | ★★★★★ | ★★★★ | ★★★★ |
| Fits the 3D Galaxy feature | ★★★ | ★★★★★ | ★★★ | ★★★ |
| Build risk (lower = safer) | Medium | Low–medium | Medium–high | Medium |
| How memorable for judges | Very high | High | Very high | High |

## My recommendation

**Direction 1 · Watermark**, borrowing **Direction 3's Chimera Explode** for the Reference X-ray, and rendering the **Galaxy** with Direction 2's constellation layout (in Watermark's colours).
- The metaphor maps 1:1 to the problem (*counterfeit references*).
- The required theme toggle becomes the signature moment (*UV lamp → VOID*).
- No other team will have anything like it.
- The deck uses the same visual language, so Phase 1 and Phase 2 feel like one product.

**Next step:** I'll render each direction as a live 3D design board (separate from the website build) so you can see and click them before choosing.

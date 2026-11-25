# Avighna Gavhane · Design, Story & Deck Lead

**Owns:** the look (Hybrid: Watermark colours, Vault 3D landing, Neural 3D Mission Control), landing page, library, Write & cite, export, Phase-1 deck upload, demo script and backup video. **Demo segments:** 0:00–2:00 (hook + problem) and 7:00–8:00 (close). **Q&A lead:** users, UX, design, adoption, roadmap. **Quiz:** AI history, companies, products.
Read first: `docs/11_BUILD_PLAN.md` (the plan we follow) → `docs/HANDOFF.md` → `docs/04_UI_3D_DIRECTIONS.md` → `docs/08_DEMO_SCRIPT_AND_QA.md`.
**Milestones:** M0 Tue 23:59 (deck v1 uploaded) · **M1 Wed 13:00 (library saves + exports)** · **M2 Wed 19:00 (Write & cite + landing live)** · M3 Wed 23:00 (final deck). No P1 work until your P0s are merged.

## Tuesday night · deck first
- [ ] **A01** · P0 · Apply the 7 deck fixes in `docs/11_BUILD_PLAN.md` §9 (ask Claude Code to edit `submissions/phase1/deck/build-deck.cjs`, rebuild PPTX + PDF); send your GitHub username to Krishna · `submissions/phase1/**` · due Tue 23:00 · #deck
- [ ] **A02** · P0 · Upload the fixed deck **PDF** tonight as insurance, then the final version by **Wed 23:00** (hard deadline Thu 09:00; the latest upload counts); screenshot the "uploaded" status into the team chat · due Wed 23:00 · #deck

## Wednesday morning · the library (M1)
- [ ] **A05** · P0 · Library store on the device (IndexedDB via Dexie): collections, tags, notes, "opened" flag; Library tab reads real items. API in docs/11 §5 (Krishna, Zedan and A14 use it) · `veracite/src/lib/library/** veracite/src/components/app/tabs/library/**` · due Wed 12:00 · #mvp #research #ux
- [ ] **A04** · P0 · Design-system basics: Watermark tokens everywhere, light/UV toggle on every page, remove the A/B skin switch, focus states, reduced motion, list view for every 3D view · `veracite/src/app/app.css veracite/src/app/globals.css veracite/src/components/app/AppShell.tsx veracite/src/components/app/ui.tsx` · due Wed 13:00 · #ux

## Wednesday afternoon · cite while you write (M2)
- [ ] **A06** · P0 · Export with citation-js + official CSL: APA 7, BibTeX, RIS first (MLA 9, Harvard, IEEE, Chicago in the evening); import BibTeX/RIS · `veracite/src/lib/cite/** veracite/src/app/api/export/**` · due Wed 15:00 · #research
- [x] **A14** · P0 · Write & cite: a writing pane where "Insert citation" picks from the verified library, drops "(Author, Year)" into the text and builds the APA 7 reference list live; only library sources can be cited · `veracite/src/components/app/tabs/draft/Writer.tsx veracite/src/lib/cite/insert*` · due Wed 18:00 · #research #ux #honesty
    - The brief asks for "insert citations while you write". Krishna's Draft Checker (K10) checks the same text.
- [x] **A03** · P0 · Landing page `/` = the Vault 3D (from `/lab/vault`) with real buttons into X-ray, Research and Library; UV-lamp theme toggle · `veracite/src/app/page.tsx veracite/src/components/lab/vault/**` · due Wed 19:00 · #ux #honesty

## Wednesday evening · deck-promised extras (M3)
- [ ] **A15** · P1 · One-click "Save to Veracite" bookmarklet: reads the page's DOI meta tag, opens Veracite's `/save` page, verifies via `/api/sources/verify`, saves to the library (like Zotero's browser button) · `veracite/src/app/save/** veracite/src/lib/library/bookmarklet*` · due Wed 21:00 · #research #ux
- [ ] **A07** · P2 · Mission Control 3D = the Neural network (from `/lab/neural`) in Watermark colours inside the Research tab, wired to Krishna's real session state (the current MiniMission stays until then) · `veracite/src/components/app/three/MiniMission.tsx veracite/src/components/lab/neural/**` · #ux #pres
- [ ] **A08** · P2 · Arabic / English toggle (nav + key labels, RTL) · `veracite/src/lib/i18n/**` · #ux
- [ ] **A09** · P2 · ⌘K command palette (search library, run X-ray, export, theme) · `veracite/src/components/app/CommandPalette.tsx` · #ux
- [ ] **A10** · P2 · PDF drop: read DOIs and the reference list in the browser (pdf.js) and send them to the X-ray · `veracite/src/lib/pdf/**` · #research

## Thursday
- [ ] **A11** · PRES · Final demo script with timings (add the Write & cite moment); record a 90-second backup video; take README screenshots · `docs/08_DEMO_SCRIPT_AND_QA.md submissions/phase2/**` · due Thu 11:00 · #pres
- [ ] **A12** · DAY · Phase 2: rewrite demo segment 4:30–5:30 around the new requirement; keep the clock · due Thu 14:50 · #dayof #pres
- [ ] **A13** · PRES · Rehearse the opening and close with a timer; check outfits, chargers and logins · due Thu 12:30 · #pres

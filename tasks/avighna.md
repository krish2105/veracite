# Avighna Gavhane · Design, Story & Deck Lead

**Owns:** the look (Hybrid: Watermark colours, Vault 3D landing, Neural 3D Mission Control), landing page, library and export, Phase-1 deck upload, demo script and backup video. **Demo segments:** 0:00–2:00 (hook + problem) and 7:00–8:00 (close). **Q&A lead:** users, UX, design, adoption, roadmap. **Quiz:** AI history, companies, products.
Read first: `docs/HANDOFF.md` → `docs/04_UI_3D_DIRECTIONS.md` → `docs/08_DEMO_SCRIPT_AND_QA.md`.

## Tuesday · deck first
- [ ] **A01** · P0 · Review the Phase-1 deck (`submissions/phase1/Team7_Veracite_Phase1_Deck.pdf`); send fixes to Krishna, or ask Claude Code to edit `submissions/phase1/deck/build-deck.cjs` and rebuild · `submissions/phase1/**` · due Tue 22:00 · #deck
- [ ] **A02** · P0 · Upload the deck **PDF** on the hackathon site by **Wed 23:00** (hard deadline Thu 09:00); screenshot the "uploaded" status into the team chat · due Wed 23:00 · #deck

## Wednesday · make it beautiful and usable
- [ ] **A03** · P0 · Landing page `/` = the Vault 3D (from `/lab/vault`) with real buttons into X-ray and Research; UV-lamp theme toggle · `veracite/src/app/page.tsx veracite/src/components/lab/vault/**` · due Wed 12:00 · #ux #honesty
- [ ] **A04** · P0 · Finalise the design system: Watermark tokens everywhere, light/UV toggle on every page, remove the A/B skin switch, focus states, reduced motion, contrast · `veracite/src/app/app.css veracite/src/app/globals.css veracite/src/components/app/AppShell.tsx veracite/src/components/app/ui.tsx` · due Wed 13:00 · #ux
- [ ] **A05** · P0 · Library store on the device (IndexedDB via Dexie): collections, tags, notes, "opened" flag; Library tab and 3D Galaxy read real items · `veracite/src/lib/library/** veracite/src/components/app/tabs/library/** veracite/src/components/app/three/Galaxy.tsx` · due Wed 16:00 · #mvp #research #ux
- [ ] **A06** · P0 · Export with citation-js + official CSL: APA 7, MLA 9, Harvard, IEEE, Chicago, BibTeX, RIS; import BibTeX/RIS · `veracite/src/lib/cite/** veracite/src/app/api/export/**` · due Wed 18:00 · #research
- [ ] **A07** · P0 · Mission Control 3D = the Neural network (from `/lab/neural`) in Watermark colours inside the Research tab, wired to Krishna's real session state · `veracite/src/components/app/three/MiniMission.tsx veracite/src/components/lab/neural/**` · due Wed 19:00 · #ux #pres
- [ ] **A08** · P1 · Arabic / English toggle (nav + key labels, RTL) · `veracite/src/lib/i18n/**` · due Wed 21:00 · #ux
- [ ] **A09** · P1 · ⌘K command palette (search library, run X-ray, export, theme) · `veracite/src/components/app/CommandPalette.tsx` · due Wed 21:30 · #ux
- [ ] **A10** · P2 · PDF drop: read DOIs and the reference list in the browser (pdf.js) and send them to the X-ray · `veracite/src/lib/pdf/**` · #research

## Thursday
- [ ] **A11** · PRES · Final demo script with timings; record a 90-second backup video; take README screenshots · `docs/08_DEMO_SCRIPT_AND_QA.md submissions/phase2/**` · due Thu 11:00 · #pres
- [ ] **A12** · DAY · Phase 2: rewrite demo segment 4:30–5:30 around the new requirement; keep the clock · due Thu 14:50 · #dayof #pres
- [ ] **A13** · PRES · Rehearse the opening and close with a timer; check outfits, chargers and logins · due Thu 12:30 · #pres

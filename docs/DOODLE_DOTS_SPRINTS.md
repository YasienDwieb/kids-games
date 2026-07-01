# Doodle Dots — Sprint & Task Breakdown

Build plan for **Doodle Dots** (fine-motor, creativity, number order, ages 3–7).
Game spec: `docs/FOUR_NEW_GAMES_DESIGN.md` §3. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/doodle-dots/`
**Config:** id `doodle-dots`, accent `coral`, layout `bare`, ageRange 3–7, icon ✏️.

**Mechanic.** Numbered dots scattered on screen; the kid drags a finger 1 → 2 → 3… in order
and a line follows. Completing the sequence reveals a hidden picture (animal/star/boat) that
then animates + celebrates. Few dots early → more dots later.

**Reuses Letter Land's `TraceCanvas` / waypoint-validation foundation** — build after Letter
Land Sprint 3. **Bare layout** (full canvas, like color-mixer): game manages its own layout,
GamePlayerScreen renders only the absolute BackButton.

---

## Pre-build — UI design (frontend-design → superdesign) ⬜

Mock the UI as HTML/CSS via `/frontend-design`, preview in **superdesign**, get approval.
Mockups: **mid-connect** state (numbered dots + partial line drawn, finger on next dot),
**reveal** state (completed picture animating), **next-puzzle** affordance. System: warm cream,
Fredoka/Nunito (AR IBM Plex Sans Arabic), chunky dots + soft shadows, **coral** accent, big targets.

---

## Sprint 0 — Scaffold & registration ⬜

Goal: an empty-but-registered game that appears on Home and launches (bare layout).

- [ ] **0.1** Copy `_template/` → `doodle-dots/` (config, index, i18n, locales/en+ar).
- [ ] **0.2** Fill `config.ts`: id `doodle-dots`, accent `coral`, icon `✏️`, ageRange 3–7,
      **layout `bare`**, tags `['drawing','fine-motor','numbers','creative','educational']`,
      backgroundColor from `ACCENTS.coral.tint`.
- [ ] **0.3** Register: add `import './doodle-dots/config';` to `src/games/index.ts`.
- [ ] **0.4** Stub `index.tsx` placeholder (bare — own SafeContainer) via `useTranslation`.
- [ ] **0.5** Wire `i18n.ts` + `locales/en.ts` + `locales/ar.ts` with `meta.name`/`meta.description`.
- [ ] **0.6** Add keys to `src/sdk/i18n/__tests__/keys.test.ts`.
- [ ] **0.7** Verify: tsc clean, registered, appears on Home EN + AR, opens bare canvas.

**Done when:** `doodle-dots` appears on Home and opens a placeholder bare canvas, EN + AR.

---

## Sprint 1 — Picture/dot data & puzzle generation (pure, tested) ⬜

Goal: pure, tested data layer — dot-to-dot picture definitions + difficulty ramp. Seeded
PRNG only; no `Math.random`/`Date.now` in generators.

- [ ] **1.1** `types.ts` — `Dot` `{ id, x, y }` (normalized 0–1 coords), `Picture`
      `{ id, dots[], revealEmoji|art }`, `LevelData`. Readonly.
- [ ] **1.2** `constants.ts` — picture inventory (ordered dot coordinate lists per picture),
      dot-count ramp by level.
- [ ] **1.3** `utils/generate.ts` — mulberry32 PRNG + picture selection/ordering; validates
      dots are ordered 1..N, in-bounds, no duplicate positions.
- [ ] **1.4** `utils/levels.ts` — `buildLevel(level, sessionSeed)` ramp (few → many dots);
      `doodleDotsLevels` via `levelsFromGenerator`.
- [ ] **1.5** `__tests__/generate.test.ts` + `levels.test.ts` — ordering valid, in-bounds,
      no-dup, determinism, non-mutation, multi-seed sweep.

**Done when:** tests pass; `buildLevel` produces valid connectable pictures 1..N.

---

## Sprint 2 — Core UI: connect-the-dots playable ⬜

Goal: fully playable — drag through dots in order, line follows, picture reveals.

- [ ] **2.1** `components/DotCanvas.tsx` — reuses Letter Land's `TraceCanvas`/waypoint
      foundation: numbered dots + finger-drag via `GestureDetector` + `Gesture.Pan().runOnJS(true)`
      (RN Animated). **Next-dot-only** validation (line advances only to the correct next dot).
      **Canvas coordinates pinned `direction:'ltr'`** (coordinate surface only — dot *order* is
      NOT a row to pin). Western digit labels on dots.
- [ ] **2.2** `components/Reveal.tsx` — on completion, fade/scale the hidden picture in +
      celebrate animation.
- [ ] **2.3** `index.tsx` — `useLevels` host (bare layout, own back/next chrome): connect →
      reveal → next; `useSound` connect-tick + reveal celebration; progress + `ResumePrompt`.
      Advance-once, timer cleanup, overlay hidden on level change.

**Done when:** connect-the-dots plays end-to-end — order enforced, line draws, picture reveals.

---

## Sprint 3 — i18n, polish & verification ⬜

Goal: production-ready — localized, juicy, accessible, tested.

- [ ] **3.1** en/ar complete — chrome (encourage/next/title), full parity, kid-friendly
      Arabic; **Western digits** on dots; placeholders resolve.
- [ ] **3.2** RTL pass — dot *order* not pinned as a row; only the canvas *coordinates* pinned
      `direction:'ltr'`; no `left`/`right`; any directional glyph flips via `I18nManager.isRTL`.
- [ ] **3.3** Juice (RN Animated only) — line draws smoothly, dot pulse on connect, reveal
      spring + sparkle, encouragement on completion.
- [ ] **3.4** Accessibility — localized `accessibilityLabel` on dots ("dot 1") + completion
      announcement; no enum leak.
- [ ] **3.5** Verify — tsc clean, all tests green. **Device run EN + AR (human step):**
      drag connects in order, wrong-order ignored, line follows finger, picture reveals;
      small-phone (SE) fit; back button visible (bare layout).

**Done when:** game ships — localized, polished, verified on device EN + AR.

---

## Notes / decisions

- **Reuses `TraceCanvas`** from Letter Land — build after Letter Land Sprint 3; keep the
  shared canvas generic (waypoints + finger-drag validation).
- **Bare layout:** like `color-mixer` — the game owns its full canvas + back chrome; not GameShell.
- **RTL:** the drawing canvas is a genuine coordinate surface → pin `direction:'ltr'`. The dot
  *sequence* (1→2→3) is logical order, not a laid-out row — do **not** pin it as a row
  (`rtl-sequence-pinning-trap`). Numbers stay Western digits.
- **Reuse:** mirror `color-mixer` for bare-layout chrome; `mouse-maze`/`shape-detective` for
  gesture + seeded-generator structure.

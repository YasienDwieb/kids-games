# Rhythm Tap — Sprint & Task Breakdown

Build plan for **Rhythm Tap** (rhythm & timing, ages 3–7).
Game spec: `docs/FOUR_NEW_GAMES_DESIGN.md` §4. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/rhythm-tap/`
**Config:** id `rhythm-tap`, accent `pink`, layout `shell`, ageRange 3–7, icon 🥁.

**Mechanic.** A steady beat plays using short **percussive SFX** (claps/taps/pops — the same
family as `sfx.pop` / `sfx.hit`). Pads pulse on the beat; the kid taps in time. On-beat taps →
pop + sparkle. Scored perfect / good / miss with a combo counter.

**⚠️ HARD CONSTRAINT — NO MUSIC / MELODY.** Per user instruction, melodic or instrumental
music (piano, tunes, sustained notes) is forbidden. Use **only** short percussive SFX of the
character the app already ships. No note assets, no scales, no melodies — ever.

**Difficulty.** Slow + sparse + 1 pad early → faster, denser, 2–3 pads later. Standalone — no
new SDK pieces and no dependency on the other three games.

---

## Pre-build — UI design (frontend-design → superdesign) ⬜

Mock the UI as HTML/CSS via `/frontend-design`, preview in **superdesign**, get approval.
Mockups: **on-beat** state (pads pulsing, one tapped with sparkle + combo counter),
**miss/feedback** state, **round-complete** overlay (stars + best combo). System: warm cream,
Fredoka/Nunito (AR IBM Plex Sans Arabic), chunky pads + soft shadows, **pink** accent, big targets.

---

## Sprint 0 — Scaffold & registration ⬜

Goal: an empty-but-registered game that appears on Home and launches (shell layout).

- [ ] **0.1** Copy `_template/` → `rhythm-tap/` (config, index, i18n, locales/en+ar).
- [ ] **0.2** Fill `config.ts`: id `rhythm-tap`, accent `pink`, icon `🥁`, ageRange 3–7,
      layout `shell`, tags `['rhythm','timing','listening','educational']`,
      backgroundColor from `ACCENTS.pink.tint`.
- [ ] **0.3** Register: add `import './rhythm-tap/config';` to `src/games/index.ts`.
- [ ] **0.4** Stub `index.tsx` placeholder via `useGameShell` + `useTranslation`.
- [ ] **0.5** Wire `i18n.ts` + `locales/en.ts` + `locales/ar.ts` with `meta.name`/`meta.description`.
- [ ] **0.6** Add keys to `src/sdk/i18n/__tests__/keys.test.ts`.
- [ ] **0.7** Verify: tsc clean, registered, appears on Home EN + AR.

**Done when:** `rhythm-tap` appears on Home and opens a placeholder, EN + AR.

---

## Sprint 1 — Beat clock & scoring model (pure, tested) ⬜

Goal: pure, tested timing model — beat pattern definitions, hit-window scoring, difficulty
ramp. No UI, no `Math.random`/`Date.now` in the pure layer (host supplies the clock + seed).

- [ ] **1.1** `types.ts` — `Beat` `{ atMs, pad }`, `Pattern` `{ bpm, beats[], lengthMs }`,
      `HitGrade` (`perfect`|`good`|`miss`), `LevelData`. Readonly.
- [ ] **1.2** `constants.ts` — percussive `sfx` intent per pad (existing intents only),
      hit-window thresholds (perfect/good ms), bpm + density ramp, pad-count ramp (1→3).
- [ ] **1.3** `utils/generate.ts` — mulberry32 PRNG + pattern builder; validates beats are
      ordered, in-range, spacing ≥ a min interval (always tappable by a child).
- [ ] **1.4** `utils/scoring.ts` — pure `gradeHit(expectedMs, tapMs)` → `HitGrade`; combo logic.
- [ ] **1.5** `utils/levels.ts` — `buildLevel(level, sessionSeed)` ramp; `rhythmTapLevels`
      via `levelsFromGenerator`.
- [ ] **1.6** `__tests__/generate.test.ts` + `scoring.test.ts` + `levels.test.ts` — ordered,
      in-range, min-spacing, grade boundaries, combo, determinism, multi-seed sweep.

**Done when:** tests pass; patterns are always tappable; grading boundaries correct.

---

## Sprint 2 — Core UI: tap-to-the-beat playable ⬜

Goal: fully playable — beat plays via SFX, pads pulse, taps are graded, combo builds.

- [ ] **2.1** `components/BeatClock` (hook) — drives pad pulses + expected-hit times off a
      single RN Animated/`setInterval`-ref clock; cleaned up on unmount (timer ref pattern).
- [ ] **2.2** `components/Pad.tsx` — chunky pad; pulse on beat (RN Animated), pop + sparkle on
      tap, grade flash (perfect/good/miss colors from `ACCENTS`). RTL-safe.
- [ ] **2.3** `components/ComboHud.tsx` — `HudPill` showing combo + score (Western digits).
- [ ] **2.4** `index.tsx` — `useLevels` host: start pattern → pads pulse → grade taps
      (`gradeHit`) → play percussive `sfx` on hit → score via `useGameShell`. Round-complete
      `LevelSolvedOverlay` (EmojiFrame + 3 `Star` + best-combo + pink `PressableButton`);
      `ResumePrompt`. Advance-once, timer cleanup, overlay hidden on level change.

**Done when:** tap-to-the-beat plays end-to-end — percussive SFX, pulses, grading, combo, overlay.

---

## Sprint 3 — i18n, polish & verification ⬜

Goal: production-ready — localized, juicy, accessible, tested.

- [ ] **3.1** en/ar complete — chrome ("Tap!", combo, score, round-complete), full parity,
      kid-friendly Arabic; **Western digits**; placeholders resolve.
- [ ] **3.2** RTL pass — pads centered/vertical → no left-origin trap; if any lane is
      horizontal, pin its coordinates `direction:'ltr'`; directional glyphs flip via `I18nManager.isRTL`.
- [ ] **3.3** Juice (RN Animated only) — pad pulse on beat, pop + sparkle on perfect, combo
      escalation feedback, round-complete spring + stars.
- [ ] **3.4** Accessibility — `accessibilityRole` + localized `accessibilityLabel` on pads;
      no enum leak; grading announced.
- [ ] **3.5** Verify — tsc clean, all tests green. **Device run EN + AR (human step):** beat
      audio is **percussive only (no melody)**; pulses sync to taps; grading feels fair; rapid
      taps don't drop audio; small-phone (SE) fit.

**Done when:** game ships — localized, polished, verified on device EN + AR, **no music**.

---

## Notes / decisions

- **NO MUSIC (hard rule):** percussive SFX only — same character as existing games. No note
  assets, no melodies, no sustained tones. Re-confirm on every audio decision.
- **Standalone:** no shared foundation, no new SDK piece — build last in the slate or in
  parallel; it doesn't block / isn't blocked by the other three.
- **Clock discipline:** one timer source, ref-held, cleaned on unmount (mirror the timer-ref
  cleanup pattern used across `count-and-pop` / `shape-detective`).
- **RTL:** pads are centered → safe; only pin genuine horizontal coordinate lanes if introduced.
- **Reuse:** mirror `count-and-pop` host structure (shell, `useLevels`, seeded generators,
  win overlay, ResumePrompt, `HudPill`).

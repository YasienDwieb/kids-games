# Letter Land — Sprint & Task Breakdown

Build plan for **Letter Land** (literacy: recognition + phonics + tracing, ages 3–7).
Game spec: `docs/FOUR_NEW_GAMES_DESIGN.md` §1. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/letter-land/`
**Config:** id `letter-land`, accent `blue`, layout `shell`, ageRange 3–7, icon 🔤.

**Mechanic.** Two round types rotate by level:
- **Hear & find** — a letter is spoken (TTS); kid taps the matching letter among 3–4 choices.
- **Trace it** — the shown letter is traced by dragging a finger along a guided dotted path.

**Bilingual.** Language-aware: Latin A–Z when app is EN, Arabic isolated forms ا–ي when AR.
Phonics via a new `useSpeech()` SDK wrapper over `expo-speech`. **This game builds two reusable
foundations: `useSpeech()` and the finger-trace canvas — Animal Safari and Doodle Dots reuse them.**

**Difficulty.** Short uppercase / simple Arabic forms + few waypoints early → more choices,
more waypoints, lowercase (Latin) later. Finite ladder via `useLevels`; progress persists.

---

## Pre-build — UI design (frontend-design → superdesign) ⬜

Before Sprint 0 code: mock the UI as HTML/CSS via `/frontend-design`, preview in the
**superdesign** live gallery, get user approval. Mockups to show:
- **Hear & find** state (spoken-letter prompt + 3–4 big letter choice tiles, one selected)
- **Trace it** state (big letter with dotted guide path + finger mid-trace)
- **Level-solved** overlay (trophy + stars)

System: warm cream background, Fredoka display / Nunito body (Arabic IBM Plex Sans Arabic),
chunky rounded tiles + soft shadows, **blue** accent family, big touch targets for 3–7.

---

## Sprint 0 — Scaffold & registration ⬜

Goal: an empty-but-registered game that appears on Home and launches (shell layout).

- [ ] **0.1** Copy `_template/` → `letter-land/` (config, index, i18n, locales/en+ar).
- [ ] **0.2** Fill `config.ts`: id `letter-land`, accent `blue`, icon `🔤`, ageRange 3–7,
      layout `shell`, tags `['letters','literacy','phonics','tracing','educational']`,
      backgroundColor from `ACCENTS.blue.tint`.
- [ ] **0.3** Register: add `import './letter-land/config';` to `src/games/index.ts`.
- [ ] **0.4** Stub `index.tsx` renders a placeholder via `useGameShell` + `useTranslation`.
- [ ] **0.5** Wire `i18n.ts` + `locales/en.ts` (`as const` + `GameTranslations`) +
      `locales/ar.ts` (`: GameTranslations`) with `meta.name`/`meta.description` + placeholder.
- [ ] **0.6** Add keys to `src/sdk/i18n/__tests__/keys.test.ts`.
- [ ] **0.7** Verify: tsc clean, game registered, appears on Home EN + AR.

**Done when:** `letter-land` appears on Home and opens a placeholder, EN + AR.

---

## Sprint 1 — `useSpeech()` SDK wrapper (shared foundation) ⬜

Goal: a thin, tested on-device TTS wrapper in the SDK that both Letter Land and Animal
Safari consume. Built first because it's the riskiest new piece.

- [ ] **1.1** `npx expo install expo-speech`.
- [ ] **1.2** `src/sdk/speech/useSpeech.ts` — `useSpeech()` → `{ speak(text, opts?), stop() }`.
      Picks voice/locale from current app language (EN/AR); respects `soundEnabled` from settings;
      no-ops gracefully if a voice is unavailable. `PlayOptions`-style `SpeakOptions` type.
- [ ] **1.3** Export from `@/sdk` (`src/sdk/index.ts`), document in `CLAUDE.md` SDK section.
- [ ] **1.4** Unit-test the language→locale mapping + settings gate (mock `expo-speech`).
- [ ] **1.5** Manual smoke: speaks an EN word and an AR word on device.

**Done when:** `useSpeech().speak()` talks in both languages and respects sound setting.

---

## Sprint 2 — Domain model & level generation (pure, tested) ⬜

Goal: pure, tested data layer — letter sets per language + round generation + ramp.
No UI, no timers, no `Math.random` (seeded PRNG only).

- [ ] **2.1** `types.ts` — `RoundType` (`hearAndFind` | `trace`), `Round` discriminated
      union, `LevelData`. All readonly.
- [ ] **2.2** `constants.ts` — Latin + Arabic letter inventories, per-letter TTS hint
      (name + example word key), choice-count ramp (3→4), trace-waypoint counts.
- [ ] **2.3** `utils/generate.ts` — self-contained mulberry32 PRNG + builders. Each
      `hearAndFind` round has **exactly one** correct letter; distractors distinct, in-set.
- [ ] **2.4** `utils/levels.ts` — `buildLevel(level, sessionSeed)` ramp; `letterLandLevels`
      via `levelsFromGenerator`. Letter set switches by current language at host layer.
- [ ] **2.5** `__tests__/generate.test.ts` + `levels.test.ts` — exactly-one-correct,
      in-set, distinct, determinism, non-mutation, multi-seed sweep.

**Done when:** tests pass; `buildLevel` produces valid solvable rounds 1..N.

---

## Sprint 3 — Core UI: trace canvas + both round types playable ⬜

Goal: fully playable — Hear & find scores, and the finger-trace canvas works (the second
reusable foundation).

- [ ] **3.1** `components/TraceCanvas.tsx` — dotted-path letter + finger-drag trace via
      `GestureDetector` + `Gesture.Pan().runOnJS(true)` (RN Animated; no reanimated).
      Validates progress along ordered waypoints; **canvas coordinates pinned `direction:'ltr'`**
      (coordinate surface only — never the letter set ordering). Built generically enough for
      Doodle Dots to reuse.
- [ ] **3.2** `components/LetterChoice.tsx` — chunky letter tile (Fredoka), default/selected/
      correct/wrong states; RTL-safe (`start`/`end`, no `left`/`right`).
- [ ] **3.3** `components/HearAndFind.tsx` — TTS prompt (`useSpeech`) + replay button +
      choice row; tap the matching letter; correct/wrong feedback.
- [ ] **3.4** `index.tsx` — `useLevels` host: renders by `round.type`; speaks on round start;
      score via `useGameShell`; success/wrong SFX via `useSound`; `LevelSolvedOverlay`
      (EmojiFrame + 3 `Star` + blue `PressableButton`); `ResumePrompt`. Advance-once in
      `handleNext`, live `isLast`, timer ref cleanup, overlay hidden on level change.

**Done when:** both round types play end-to-end with TTS, tracing, scoring, win overlay.

---

## Sprint 4 — i18n, polish & verification ⬜

Goal: production-ready — both scripts, localized, juicy, accessible, tested.

- [ ] **4.1** en/ar complete — all keys, full parity, meaningful kid-friendly Arabic,
      example words per letter; all interpolation placeholders resolve.
- [ ] **4.2** RTL pass — Arabic isolated letter forms render correctly; no `left`/`right`;
      replay/arrow glyphs flip via `I18nManager.isRTL`; canvas pin intact; letter ordering NOT pinned.
- [ ] **4.3** Juice (RN Animated only) — trace-progress glow, success spring, trophy + stars.
- [ ] **4.4** Accessibility — `accessibilityRole` + localized `accessibilityLabel` +
      `accessibilityState` on choices and trace; no enum leak.
- [ ] **4.5** Verify — tsc clean, all tests green (incl. keys.test). **Device run EN + AR
      (human step):** TTS speaks both languages; tracing accepts a correct finger path and
      rejects wrong order; Arabic letters render isolated; small-phone (SE) fit.

**Done when:** game ships — both scripts, localized, polished, verified on device EN + AR.

---

## Notes / decisions

- **TTS over recorded clips:** on-device `expo-speech` (no asset pipeline); a recorded-clip
  upgrade can come later without changing call sites.
- **Two shared foundations:** `useSpeech()` (→ Animal Safari) and `TraceCanvas` (→ Doodle Dots).
  Keep both generic. Build Letter Land **first** in the slate for this reason.
- **RTL:** pin only the trace *canvas coordinates* (`direction:'ltr'`); never pin the letter
  set ordering or choice row (`rtl-sequence-pinning-trap`). Arabic uses isolated forms.
- **Reuse:** mirror `count-and-pop` / `shape-detective` structure (shell, `useLevels`, seeded
  generators, win overlay, ResumePrompt).

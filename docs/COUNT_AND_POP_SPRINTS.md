# Count & Pop — Sprint & Task Breakdown

Build plan for **Count & Pop** (numbers & math, ages 3–7).
Game spec: `docs/GAME_IDEAS.md` §3. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/count-and-pop/`
**Config:** id `count-and-pop`, accent `pink`, layout `shell`, ageRange 3–7, icon 🔢.

**Mechanic.** Two modes that rotate by level:
- **Count this many** — a numeral shows (e.g. `5`); kid taps that many objects (each
  tap *pops* an object with a burst). Round solved when the popped count matches.
- **How many?** — a group of objects shows; kid taps the matching numeral from a row
  of choices.

**Difficulty.** L1–4 count 1–5 → L5–8 count 1–10 → L9–10 "how many more to make N?" →
L11–12 single-digit addition (two groups, tap the sum). Endless? No — finite level
ladder via `useLevels` + progress (like Shape Detective, **not** Echo's `createStore`).

**i18n.** Numbers stay **Western digits** in both languages (i18n contract). Only
instructions/HUD/overlay strings are translated. Low RTL risk — but the choice row of
numerals is a *spatial selection* surface; pin coordinates if needed (see notes).

---

## Sprint 0 — Scaffold & registration ✅ DONE

Goal: an empty-but-registered game that appears on Home and launches (shell layout).

- [x] **0.1** Create folder from `_template/` → `count-and-pop/` (config, index, i18n, locales/en+ar).
- [x] **0.2** Fill `config.ts`: id `count-and-pop`, accent `pink`, icon `🔢`, ageRange 3–7, layout `shell`, tags `['numbers','math','counting','educational']`, backgroundColor `#FCE5EF` (ACCENTS.pink.tint).
- [x] **0.3** Register: add `import './count-and-pop/config';` to `src/games/index.ts`.
- [x] **0.4** Stub `index.tsx` renders a placeholder via `useTranslation` (tokens-only, shell wired in Sprint 1).
- [x] **0.5** Wire `i18n.ts` + `locales/en.ts` (`as const` + `GameTranslations` type) + `locales/ar.ts` (`: GameTranslations`) with `meta.name` **اعدد وفرقّع** / `meta.description` + placeholder; parity enforced.
- [x] **0.6** Add 3 keys to `src/sdk/i18n/__tests__/keys.test.ts`.
- [x] **0.7** Verify: tsc clean, game registered.

**Done when:** `count-and-pop` appears on Home and opens a placeholder, EN + AR. ✅
**Verified:** tsc clean (exit 0), 276/276 keys tests green (EN + AR), registered in index.ts.
Critic: `readyForSprint1 = true`, no blockers.

---

## Sprint 1 — Domain model & level generation (pure, tested) ⬜ TODO

Goal: pure, tested data layer — round generation + difficulty ramp. No UI, no timers,
no `Math.random` (seeded PRNG only).

- [ ] **1.1** `types.ts` — `RoundMode` (`'countThisMany' | 'howMany' | 'makeN' | 'addition'`),
      `Round` discriminated union, `LevelData` (`{ level, mode, round }`). All readonly.
      - `countThisMany`: `{ target: number, objectEmoji: string }`
      - `howMany`: `{ count: number, objectEmoji: string, choices: number[], correctIndex }`
      - `makeN`: `{ have: number, target: number, objectEmoji, choices, correctIndex }` (tap how many MORE)
      - `addition`: `{ a: number, b: number, objectEmoji, choices, correctIndex }` (tap a+b)
- [ ] **1.2** `constants.ts` — object emoji pool (🍎🐟⭐️🎈🐞… kid-friendly), `MAX_OBJECTS`,
      choice-count ramp, mode-rotation table. Palette/tokens via `ACCENTS.pink`/`COLORS` only.
- [ ] **1.3** `utils/generate.ts` — self-contained mulberry32 seeded PRNG + deterministic
      builders per mode. Each `howMany/makeN/addition` round has **exactly one** correct
      choice; distractors are plausible (±1, ±2, never negative, never out of range).
- [ ] **1.4** `utils/levels.ts` — `buildLevel(level)` 12-level ramp (1–5 → 1–10 → makeN →
      addition), seeded by `level * prime`. `countAndPopLevels` via `levelsFromGenerator`.
- [ ] **1.5** `__tests__/generate.test.ts` + `levels.test.ts` — exactly-one-correct,
      in-range counts, no-negative distractors, determinism, non-mutation across many seeds.

**Done when:** tests pass; `buildLevel` produces valid solvable rounds 1..N.

---

## Sprint 2 — Core UI: objects, popping & both modes playable ⬜ TODO

Goal: fully playable — both base modes work with the satisfying pop/burst feedback
(reuse Balloon Archer's burst feel).

- [ ] **2.1** `components/CountObject.tsx` — a tappable object emoji in an `EmojiFrame`-style
      tinted tile; on tap → **pop burst** (scale-up + fade + small particle/sparkle ring,
      RN Animated only) + `sfx.pop`. Coordinate-pinned, RTL-safe.
- [ ] **2.2** `components/NumberChoice.tsx` — chunky tappable numeral button (Fredoka bold,
      Western digits, `PressableButton`/surface styling), selected/correct/wrong states.
- [ ] **2.3** `components/CountThisMany.tsx` — shows target numeral + a grid of objects;
      kid pops objects until popped == target → solved (over-pop = gentle `wrong` + reset
      that pop). Live "popped / target" indicator.
- [ ] **2.4** `components/HowMany.tsx` — shows a group of objects + a row of `NumberChoice`;
      tap the matching numeral.
- [ ] **2.5** `index.tsx` — `useLevels` host wiring: render the round for the current
      level's mode, score via `useGameShell`, success/wrong sounds, win overlay
      (`EmojiFrame` + `Star`s + `PressableButton`), next/finish, `ResumePrompt`. Mirror
      Shape Detective's `handleCorrect`/`handleNext` (advance-once, live `isLast`, timer
      ref cleanup).

**Done when:** count + how-many rounds play end-to-end with pops, scoring, win overlay.

---

## Sprint 3 — Advanced modes, i18n, polish & verification ⬜ TODO

Goal: production-ready — makeN + addition modes, localized, juicy, accessible, tested.

- [ ] **3.1** `components/MakeN.tsx` + `components/Addition.tsx` (or fold into existing
      mode components) — "how many more to make N?" and `a + b = ?` using `NumberChoice`.
      Show the equation/visual groups clearly with object visuals.
- [ ] **3.2** en/ar complete — instructions per mode, HUD, win/finish, resume; full parity,
      keys in keys.test.ts, **Western digits** for all numbers in both langs.
- [ ] **3.3** RTL pass — instructions/HUD mirror correctly; object grid + numeral choice row
      coordinate-behavior verified (do NOT mirror an *ordered* number sequence — but a
      choice row of equal options can mirror; pin only true spatial/drag surfaces). HUD
      Western digits. See memory `rtl-sequence-pinning-trap`.
- [ ] **3.4** Juice — pop burst on each object, success spring on solve, gentle shake on
      wrong choice, spring trophy + 3 `Star`s on level/last-level solved. RN Animated only.
- [ ] **3.5** Accessibility — every object + numeral choice + Start/Next has localized
      `accessibilityLabel` + role + state. No enum leak.
- [ ] **3.6** Verify — tsc clean, all engine + i18n tests green. Device run pending (human step).

**Done when:** game ships — all 4 modes, localized, polished, verified on device EN + AR.

---

## Pre-build — UI design (frontend-design → superdesign) ⬜ IN PROGRESS

Before Sprint 0 code: design the game UI as an HTML/CSS mockup via
`/frontend-design`, preview through the **superdesign** live gallery, get user approval,
THEN start the orchestrated build. Mockups to show:
- **Count this many** state (target numeral + object grid, one object mid-pop burst)
- **How many?** state (object group + numeral choice row, one choice selected)
- **Level-solved** overlay (trophy + stars)

Design must use the app system: warm cream background, Fredoka display / Nunito body,
chunky rounded tiles + soft shadows, **pink** accent family, colorblind-friendly,
big touch targets for ages 3–7.

---

## Notes / decisions

- **Finite + levelled:** use `useLevels` + progress (like Shape Detective), **not**
  `createStore`. Score persists via the progress checkpoint.
- **Reuse the pop:** lean on Balloon Archer's burst animation feel + `sfx.pop` / `sfx.success`.
- **Numbers literal:** Western digits in EN and AR per the i18n contract — numerals are
  never translated; only surrounding instruction text is.
- **RTL:** numeral **choice rows** are equal options (may mirror safely); never pin an
  *ordered/sequence* row `direction:'ltr'` (breaks "what comes next"). Pin only genuine
  spatial/drag/coordinate surfaces. See memory `rtl-sequence-pinning-trap`.
- **Reuse:** mirror `shape-detective` for structure (shell layout, `useLevels`,
  seeded generators, win overlay, ResumePrompt).

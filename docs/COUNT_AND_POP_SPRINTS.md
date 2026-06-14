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

## Sprint 1 — Domain model & level generation (pure, tested) ✅ DONE

Goal: pure, tested data layer — round generation + difficulty ramp. No UI, no timers,
no `Math.random` (seeded PRNG only).

- [x] **1.1** `types.ts` — `RoundMode`, `Round` discriminated union (on `mode`), `LevelData`
      (`{ level, mode, round }`). All readonly. All 4 modes per spec.
- [x] **1.2** `constants.ts` — `OBJECT_EMOJI` (8 kid-friendly), `MAX_OBJECTS=10`, `MAX_SUM=12`,
      `MIN/MAX_CHOICE_COUNT` (3→4), `MODE_ROTATION` table, `CORRECT_COLOR`/`WRONG_COLOR` from `ACCENTS`.
- [x] **1.3** `utils/generate.ts` — self-contained mulberry32 + `shuffled`/`pick` + 4 deterministic
      builders. Each choice-round has **exactly one** correct choice; distractors plausible,
      distinct, never negative, never out of range.
- [x] **1.4** `utils/levels.ts` — `buildLevel(level)` 12-level ramp (1–5 → 1–10 → makeN →
      addition), seeded `level * 7919`. `countAndPopLevels` via `levelsFromGenerator({count:12})`.
- [x] **1.5** `__tests__/generate.test.ts` + `levels.test.ts` — **325 tests**: exactly-one-correct,
      in-range, no-negative, distinct, determinism, non-mutation, 1000-seed cross-builder sweep,
      mode-ramp match per level.

**Done when:** tests pass; `buildLevel` produces valid solvable rounds 1..N. ✅
**Verified:** 325 tests green, tsc clean. Independent 2000-seed adversarial sweep (one-correct,
no-negative, in-range, distinct, determinism) passed. No `Math.random`/`Date.now`/timers/React.
Post-build fixes: replaced a tautological `toHaveLength(round.choices.length)` assertion with a
real `[MIN,MAX]_CHOICE_COUNT` bound; bumped in-file sweep 200→1000.

**Carry-forward for Sprint 2 (UI):**
- `LevelData = { level, mode, round }`; switch on `round.mode` to render each mode.
- `countThisMany` has **no** `choices` — UI renders a field of tappable objects and counts pops
  internally; all other modes expose `choices` + `correctIndex`.
- `makeN` distractor range is `[0, target]` → `0` is a valid distractor ("add 0"); handle gracefully.
- `choiceCountFor` ramps 3→4 (3 for L1–6, 4 for L7–12) — `NumberChoice` row must fit both widths.
- `CORRECT_COLOR = ACCENTS.green.base`, `WRONG_COLOR = ACCENTS.coral.base` exported for feedback.
- Latent (non-blocking): `buildMakeN` doesn't hard-floor choice count at `MIN_CHOICE_COUNT`; the
  ramp never feeds it `target ≤ 2`, so it's fine — but don't route a tiny-target makeN to it later.

---

## Sprint 2 — Core UI: objects, popping & both modes playable ✅ DONE

Goal: fully playable — both base modes work with the satisfying pop/burst feedback
(reuse Balloon Archer's burst feel).

- [x] **2.1** `components/CountObject.tsx` — tappable object tile; on tap → **pop burst**
      (scale 1→1.42 + fade + expanding sparkle ring, RN Animated only) → becomes a dashed
      "popped" slot with ✓. Pop sound via host callback. RTL-safe (flex wrap, no pin).
- [x] **2.2** `components/NumberChoice.tsx` — chunky 3D numeral button (Fredoka bold, Western
      digits, candy-button deep-shade edge), default/selected/correct(green)/wrong(coral) states.
- [x] **2.3** `components/CountThisMany.tsx` — pink prompt card + bobbing target numeral chip +
      object grid + live `{{popped}} / {{target}}` pips. Solve fires exactly at `popped === target`;
      over-pop impossible (excess tiles disabled once done).
- [x] **2.4** `components/HowMany.tsx` — prompt + object group in a surface card + `NumberChoice`
      row from `round.choices`; tap the matching numeral; correct/wrong feedback.
- [x] **2.5** `index.tsx` — `useLevels` host: renders by `round.mode` (countThisMany → CountThisMany;
      howMany/makeN/addition → choice-row UI). Score via `useGameShell`, success/wrong/pop sounds,
      `LevelSolvedOverlay` (EmojiFrame 🏆/⭐️ + 3 Stars + pink `PressableButton`), `ResumePrompt`.
      Mirrors Shape Detective: advance-once in `handleNext`, live `isLast`, timer ref cleanup,
      overlay hidden on level change.

**Done when:** count + how-many rounds play end-to-end with pops, scoring, win overlay. ✅
**Verified:** tsc clean, 633 tests green (incl. keys.test). UI matches the approved pink mockups
(pop burst, dashed popped slots, prompt card, N/M progress, green-correct choice, solved overlay).
Host traps clean (no double-advance, live isLast, timers cleaned). 16 i18n keys added (EN + AR).

**Post-build fixes (critic-found, fixed before commit):**
- 🐛 **Blocker:** `play('sfx.pop')` was silent — `play()` takes an *intent* not an asset key →
  changed to `play('pop')`. Every core-mode tile pop now plays sound.
- `NumberChoice` correct-badge `right:-8` → `end:-8` so it mirrors correctly in RTL.

**Carry-forward for Sprint 3:**
- makeN currently shows only `have` objects; addition shows `a+b` as one flat grid → Sprint 3.1
  should split into two visual groups (have + needed slots; `a` group `+` `b` group) for clarity.
- a11y: add `accessibilityState` (disabled/selected) + role to the choice row (labels already present).
- Device check: confirm the 3-column object grid fits small phones (SE) without overflow.
- Dead `handlePick` early-return for `countThisMany` (never called) — harmless, can remove in 3.x.
- HowMany reveals the correct answer immediately on a wrong tap — acceptable for an educational
  game; note for future tuning.

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

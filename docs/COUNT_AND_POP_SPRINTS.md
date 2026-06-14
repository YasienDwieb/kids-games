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

## Sprint 3 — Advanced modes, i18n, polish & verification ✅ DONE (device run pending)

Goal: production-ready — makeN + addition modes, localized, juicy, accessible, tested.

- [x] **3.1** `components/GroupCount.tsx` — two-group visuals. **makeN**: filled `have` tiles
      (green tint) + dashed empty `needed` slots + `+` divider, so the kid sees the gap to fill.
      **addition**: two distinct groups (blue group A + orange group B) + `+` divider. `HowMany`
      dispatches to `GroupCount` for makeN/addition; flat grid stays for howMany. Reuses `NumberChoice`.
- [x] **3.2** en/ar complete — all 18 keys, full parity (en `as const` + ar `: GameTranslations`),
      meaningful kid-friendly Arabic, **Western digits**, all interpolation placeholders resolve.
- [x] **3.3** RTL pass — no `left`/`right` (grep clean), badge `end:-8`, no `direction:ltr` pins on
      equal-option rows. **Arabic addition `{{a}} + {{b}} = ؟` wrapped in a Unicode LTR isolate
      (U+2066…U+2069)** so Bidi doesn't reorder it to `؟ = b + a`. See memory `rtl-bidi-isolate-math`.
- [x] **3.4** Juice (RN Animated only) — pop burst per object, `solvePopAnim` spring on correct,
      `triggerShake` on wrong, spring trophy + 3 `Star`s on solve.
- [x] **3.5** Accessibility — `CountObject`/`NumberChoice` carry `accessibilityRole` +
      localized `accessibilityLabel` + `accessibilityState` (`disabled`/`selected`). No enum leak.
- [x] **3.6** Cleanup + verify — removed dead `handlePick` countThisMany branch; tsc clean,
      633 tests green.

**Done when:** game ships — all 4 modes, localized, polished, verified on device EN + AR.
**Critic verdict:** `shipReady = true`, `gameComplete = true`, zero blockers. **Only the
on-device EN+AR smoke test remains (human step).**

**Post-build fixes (critic nits, fixed before commit):**
- Arabic addition instruction wrapped in LTR isolate (Bidi reorder risk).
- `COLORS.text.secondary` → `COLORS.inkSoft` (canonical token).

**Device-test checklist (human):** run EN + AR (AR needs app reload after language switch).
- **countThisMany** (L1,3,5,7): bobbing target chip; pop sound + burst per tap; pips fill;
  `popped/target` Western digits; over-pop blocked; solved overlay.
- **howMany** (L2,4,6,8): correct emoji count; 3–4 NumberChoice buttons fit small phones (SE);
  green+badge+spring on correct, coral+shake on wrong; AR row mirrors but logical answer holds.
- **makeN** (L9,10): `have` tiles + dashed `needed` slots + `+` divider, distinct from howMany.
- **addition** (L11,12): blue group A + orange group B + `+` divider; **verify AR math reads
  `a + b = ؟` (not reversed)**; correct = a+b highlights green.
- **Sound:** pop on every tile; success/wrong; win on L12; rapid taps don't drop audio.
- **Nav:** overlay advances; L12 loops to L1; back to home; ResumePrompt continue/start-over.
- **Small-phone fit (SE 375pt):** choice row, object grid (up to 10), and GroupCount two-group
  row all fit without overflow/clip.

---

## Post-launch — device feedback (endless redesign + polish)

On-device feedback after the first build:
1. choice-button row wasn't centered, 2. Arabic فرقّع was slangy, 3. the game was
~2 min long with constant (memorizable) levels.

**Fixes:**
- **Centered choice row** — `choiceRow` gained `justifyContent:'center'` + `alignItems:'stretch'`.
- **Arabic rename** — اعدد و**فرقّع** → **عُدّ والعب** ("Count & Play"); the slangy فرقّع verb
  replaced with عُدّ/اضغط (count/tap) across instruction + a11y strings. (English **Count & Pop**
  and registry `id: count-and-pop` unchanged — id is the stable key.)
- **ENDLESS + per-session randomized engine** (the big one — play for hours):
  - `makeCountAndPopLevels(sessionSeed)` → `levelsFromGenerator` with **no `count`** → infinite;
    `isLast` permanently false (no "finish" screen).
  - `buildLevel(level, sessionSeed)` is pure/deterministic-by-seed; level seed is
    `level * 7919 XOR sessionSeed`. The host (`index.tsx`) creates the session seed via the
    **only two `Math.random()` calls** in the game (mount + explicit "new game"); builders stay pure.
    → every new game randomizes (kids can't memorize levels); tests pass a fixed seed.
  - **Unbounded difficulty, bounded visuals:** 16-entry `MODE_ROTATION_ENDLESS` cycle (warm-up
    bands intro count→howMany→makeN→addition, then all-mode rotation forever). Counts cap at
    `MAX_OBJECTS=10`, sums at `MAX_SUM=12`, choices at 4 — numbers never grow off-screen;
    variety comes from mode-mix + randomized values. Solvable + valid at any level (swept 1..300).
  - `LevelSolvedOverlay` simplified (always ⭐️ + "Next"); dead `isLast`/finish branch removed
    (the `levelSolved.finish` key kept in locales for a possible future finite mode).
- **setState-in-render fix** (separate device bug): `CountThisMany` deferred its `onPop`/`onSolved`
  side-effects out of the `setPoppedSet` updater into a post-commit effect.

**Verified:** tsc clean; **613 tests** green (fixed-12-level tests replaced by an endless
multi-seed sweep). Verify: 300 levels × 2 seeds all solvable/in-range/one-correct; two seeds
diverge 92%; same seed byte-identical. Critic: `shipReady = true`, zero blockers.

**Mechanic (updated):** all 4 modes (count / how-many / make-N / addition) rotate **endlessly**,
randomized each new game. No fixed ladder.

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

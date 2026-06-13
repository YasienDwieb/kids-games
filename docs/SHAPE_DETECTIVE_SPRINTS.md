# Shape Detective — Sprint & Task Breakdown

Build plan for the **Shape Detective** game (shapes & logic, ages 3–10).
Game spec: see `docs/GAME_IDEAS.md` §1. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/shape-detective/`
**Config:** id `shape-detective`, accent `purple`, layout `shell`, ageRange 3–10.

Three rotating puzzle types: **Pattern** (what comes next?), **Odd one out**,
**Sort** (drag shapes into bins). Difficulty scales 2-item → multi-attribute.

---

## Sprint 0 — Scaffold & registration ✅ DONE

Goal: an empty-but-registered game that appears on the Home grid and launches.

- [x] **0.1** Create folder from `_template/` → `shape-detective/` (config, index, i18n, locales/en, locales/ar).
- [x] **0.2** Fill `config.ts`: id `shape-detective`, accent `purple`, icon `🔺`, ageRange 3–10, layout `shell`, tags.
- [x] **0.3** Register: add `import './shape-detective/config';` to `src/games/index.ts`.
- [x] **0.4** Stub `index.tsx` renders a placeholder via `useGameShell` + `useTranslation`.
- [x] **0.5** Wire `i18n.ts` + `locales/en.ts` + `locales/ar.ts` with `meta.name`/`meta.description`.
- [x] **0.6** Verify: TS compiles clean, game registered. (tsc --noEmit: zero errors.)

**Done when:** `shape-detective` appears on Home and opens a placeholder screen, EN + AR. ✅

---

## Sprint 1 — Domain model & level generation ✅ DONE

Goal: pure, tested data layer — shapes, puzzles, difficulty ramp. No UI.

- [x] **1.1** `types.ts` — `Shape` {kind, color, size}, `PuzzleType`, `Puzzle` discriminated
      union (PatternPuzzle, OddOneOutPuzzle, SortPuzzle), `LevelData`. Tap types use
      `correctIndex`; sort uses parallel `assignments[]` (binIdx per item).
- [x] **1.2** `constants.ts` — shape kinds (circle/square/triangle/star/heart…),
      palette sourced **only** from `ACCENTS`/`COLORS` (no raw hex), size steps.
- [x] **1.3** `utils/generate.ts` — self-contained mulberry32 seeded PRNG + 3
      deterministic builders, each returning a puzzle with exactly one correct answer.
- [x] **1.4** `utils/levels.ts` — `buildLevel(level)` 12-level ramp: L1–4 `kind` only,
      L5–8 add `color`, L9–12 add `size`; options 3→5; types rotate
      pattern→oddOneOut→…→sort (sort from L5). `shapeDetectiveLevels` via `levelsFromGenerator`.
- [x] **1.5** `__tests__/generate.test.ts` + `levels.test.ts` — **98 tests passing**.

**Done when:** tests pass; `buildLevel` produces valid solvable puzzles 1..N. ✅
**Verified:** adversarial pass over 3000+ seeds confirmed exactly-one-correct-answer,
no degenerate puzzles, full determinism. tsc clean.

**Carry-forward notes for Sprint 2:**
- Pattern sequences are 2-rep cycles (ABAB / ABCABC) — unambiguous but easy-side by design.
- A dead pattern-fallback branch exists (harmless); leave as-is.

---

## Sprint 2 — Shape rendering & core UI ✅ DONE

Goal: shapes draw on screen; one puzzle type (Pattern) is fully playable.

- [x] **2.1** `components/ShapeView.tsx` — renders all 6 kinds (circle/square/triangle/
      star/heart/diamond) via plain Views (no SVG dep), SDK tokens only. RTL-safe,
      `accessibilityLabel` localized via `t('shapes.kind.*'/'shapes.size.*')`.
- [x] **2.2** `components/PatternPuzzle.tsx` — sequence + dashed "?" slot + tappable
      option row (`PressableButton`). Sequence row pinned `direction:'ltr'` in RTL.
- [x] **2.3** `index.tsx` — `useLevels`, correct→`addScore`+win overlay, wrong→shake.
- [x] **2.4** Score synced via `useGameShell().setScore`; win overlay on solve.
- [x] **2.5** `ResumePrompt` shown on `status === 'resumable'`.

**Done when:** Pattern puzzles fully playable end-to-end with sound + scoring. ✅
**Verified (2 rounds):** first verify caught 4 bugs (double-advance level-skip, stale
`isLast`, dead timer cleanup, a11y enum leak); all fixed & re-verified. tsc clean,
98 domain tests + 246 i18n tests green.

**Non-pattern levels** currently show a localized "coming soon" + skip button —
Sprint 3 replaces those with real OddOneOut + Sort components.

---

## Sprint 3 — Remaining puzzle types ✅ DONE

Goal: Odd-one-out and Sort playable; types rotate by level.

- [x] **3.1** `components/OddOneOutPuzzle.tsx` — flex-wrap grid of shapes, tap the odd
      one; same prop contract as PatternPuzzle; a11y via `t()` shape keys.
- [x] **3.2** `components/SortPuzzle.tsx` — drag shapes into bins via **PanResponder**
      (mirrors mouse-maze; no GestureDetector → no RootView dep). Surface pinned
      `direction:'ltr'` in RTL. Win = every item in its *correct* bin (`assignments`).
- [x] **3.3** Three-way dispatcher in `index.tsx` by `puzzle.type`; shared solve flow.
- [x] **3.4** Last-level celebration plays `win` intent.

**Done when:** all three types reachable across levels; full run completes. ✅
**Verified:** dispatcher renders all 3 (no stub); once-only advance + live `isLast` +
timer cleanup preserved from Sprint 2; sort win-condition can't be satisfied while
mis-sorted; gestures real + RTL-safe. 358 tests green, tsc clean.

**Carry-forward for Sprint 4:** `sort.colorBin` would interpolate a raw hex *if* color
bins generated (they never do — `sortAttr` is always `kind`). Harden in the i18n pass.

---

## Sprint 4 — i18n, polish & verification ✅ DONE (device run pending)

Goal: production-ready — localized, juicy, tested.

- [x] **4.1** i18n hardened — removed unused `comingSoon`/`placeholder`/`sort.colorBin`;
      added `shapes.color.*` (kid-friendly Arabic); bin labels always render a translated
      word via `HEX_TO_COLOR_KEY` reverse-map (no raw hex can leak). 270 i18n tests green.
- [x] **4.2** RTL pass — separator arrow flips `←`/`→` via `I18nManager.isRTL`; ghost
      anchored `start:0`; sequence/drag surfaces stay pinned `direction:'ltr'`.
- [x] **4.3** Juice — gentle 1.06 scale pop on correct (+ existing wrong-shake);
      `EmojiFrame` (🏆 final / ⭐️) + 3 `Star` row in the level-solved overlay.
- [x] **4.4** Accessibility — `accessibilityRole` + localized `accessibilityLabel` on all
      interactive items (options, tray slots, bins); no raw enum leak.
- [x] **4.5** Verify — tsc clean, 98 domain + 270 i18n tests green. **Device run pending
      (human step).**

**Done when:** game ships — localized, polished, verified on device in both languages.
**Critic verdict:** `productionReady = true`, zero launch blockers, nothing missing.

**One cosmetic follow-up (done):** SortPuzzle flash `setTimeout`s moved to a ref +
unmount cleanup to avoid a "setState on unmounted component" warning on mid-flash level
advance. (No crash; tidied for cleanliness.)

---

## Post-launch fixes

- **RTL pattern direction bug** (found on-device in Arabic). The pattern sequence row
  was pinned `direction:'ltr'`, which kept the "?" slot at the physical-right end. An
  Arabic reader reads right→left, so the slot they perceive as "next" was at the opposite
  end from what the LTR `correctIndex` math assumed → wrong option marked correct
  (e.g. ♥◆♥◆ expected heart, but UI accepted diamond). **Fix:** removed the pin so the
  row reverses naturally in RTL (attribute-cycle patterns are direction-agnostic);
  `correctIndex` now lines up in both locales. Arrow glyph still points toward the "?"
  slot. **Regression test** `__tests__/pattern-rtl.test.ts` source-guards against
  re-pinning + asserts the ♥◆♥◆→heart continuation. SortPuzzle's own drag-surface
  `ltr` pin is unrelated (needed for touch hit-testing) and was left intact.
  Tests: 112 shape-detective + 270 i18n green.

## Notes / decisions

- **Language-light by design:** puzzles use shapes + numerals only; the only translated
  strings are instructions/labels. This is why it's the first build.
- **Difficulty:** finite `TOTAL_LEVELS` (~12) via `levelsFromGenerator` so progress
  persists and there's a real "win" at the end.
- **Reuse:** mirror `balloon-archer`'s structure (`types`/`constants`/`utils/levels`/
  `components`/`__tests__`) — it's the closest existing `shell` + levels game.

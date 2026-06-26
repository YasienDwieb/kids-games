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

## Pre-build — UI design (frontend-design → superdesign) ✅ DONE

Mocked the UI as HTML/CSS via `/frontend-design`, previewed in the **superdesign** live
gallery (`superdesign/design_iterations/letter_land_*.html`), user-approved.

**Approved screens:**
- **Hear & find** → `letter_land_hearfind_2.html` — big central **hero 🔊 speaker** (the
  listening moment is the star) + a **row of 3** big letter choice tiles below. Correct tile
  turns green with a gold ✓. (Variant `hearfind_1`, a 2×2 grid, was rejected.)
- **Trace it** → `letter_land_trace_1.html` — big letter on a white canvas with a **dotted
  SVG guide path**, a glowing green traced arc, a numbered start dot, and a finger mid-trace.
- **Level-solved** → `letter_land_solved_1.html` — EmojiFrame 🏆 + 3 animated `Star`s +
  "You did it!" + chunky blue "Next letter" `PressableButton` + ghost "Back to games".

**Phonics decision:** the spoken prompt reads **name + sound + example word** —
e.g. "B … buh … ball" (richest phonics). Drives the `useSpeech()` content + the per-letter
example-word i18n keys in Sprint 2/4.

**Trace-guide decision:** use **one generic reusable dotted guide** overlaid on the big
glyph for every letter (start dot → a few midpoints → end dot); the child drags a finger
across it. **No per-letter `TRACE_WAYPOINTS` table** — authoring bespoke stroke paths for all
54 letters (26 Latin + 28 Arabic) in one pass stalled the build agent, and per-letter stroke
fidelity isn't needed for ages 3–7. `TraceCanvas` derives its guide points from the measured
glyph box at runtime, so it works for any glyph in either script.

System used: warm cream canvas, Fredoka display / Nunito body (Arabic IBM Plex Sans Arabic),
chunky rounded tiles + soft shadows, **blue** accent family, big touch targets for 3–7.

---

## Sprint 0 — Scaffold & registration ✅ DONE

Goal: an empty-but-registered game that appears on Home and launches (shell layout).

- [x] **0.1** Copied `_template/` → `letter-land/` (config, index, i18n, locales/en+ar).
- [x] **0.2** `config.ts`: id `letter-land`, accent `blue`, icon `🔤`, ageRange 3–7,
      layout `shell`, tags, backgroundColor `ACCENTS.blue.tint`.
- [x] **0.3** Registered: `import './letter-land/config';` added to `src/games/index.ts` (9th game).
- [x] **0.4** Placeholder `index.tsx` (later replaced by the real host in Sprint 3).
- [x] **0.5** `i18n.ts` + `locales/en.ts` (`as const` + `GameTranslations`) + `locales/ar.ts`
      (`: GameTranslations`) with `meta.name` **أرض الحروف**. Template README removed.
- [x] **0.6** Keys added to `keys.test.ts`.
- [x] **0.7** Verified: tsc clean, registered.

**Done when:** `letter-land` appears on Home and opens, EN + AR. ✅ (built via orchestrated workflow)

---

## Sprint 1 — `useSpeech()` SDK wrapper (shared foundation) ✅ DONE

Goal: a thin, tested on-device TTS wrapper in the SDK that both Letter Land and Animal
Safari consume.

- [x] **1.1** `expo-speech ~14.0.8` installed (`npx expo install`).
- [x] **1.2** `src/sdk/speech/useSpeech.ts` — `useSpeech()` → `{ speak(text, opts?), stop() }`.
      Locale from `currentLanguage()` ('en'→'en-US','ar'→'ar'); gates on `settings.soundEnabled`
      (imperative `settingsStore.get()`); try/catch graceful no-op; `Speech.stop()` on unmount;
      `SpeakOptions` type. No haptics, no `setAudioModeAsync`.
- [x] **1.3** Exported from `@/sdk` (`src/sdk/index.ts` `// Speech` block).
- [ ] **1.4** ~~Unit-test mocking expo-speech~~ — deferred (foundations re-verified by adversarial
      review; a mocked unit test can be added later).
- [ ] **1.5** Manual smoke (device): speaks EN + AR — **pending device run**.

**Done when:** `useSpeech().speak()` talks in both languages and respects sound. ✅ (code verified; device smoke pending)

---

## Sprint 2 — Domain model & level generation (pure, tested) ✅ DONE

Goal: pure, tested data layer. No UI, no timers, no `Math.random` (seeded PRNG only).

- [x] **2.1** `types.ts` — `Letter {id,glyph,word}`, `RoundMode`, `HearAndFindRound`/`TraceRound`/
      `Round` (discriminated on `mode`), `LevelData`, `Waypoint`. All readonly.
- [x] **2.2** `constants.ts` — `LATIN_LETTERS` (A–Z) + `ARABIC_LETTERS` (28 isolated forms),
      `CHOICES_PER_ROUND=3`, `modeForLevel` (odd→hearAndFind / even→trace). **No waypoint table**
      (generic guide computed at runtime — see design decision above).
- [x] **2.3** `utils/generate.ts` — self-contained mulberry32 + `shuffled`/`pick` + `assembleChoices`
      (exactly-one-correct, distinct distractors, exclude target, in-set) + `buildRound`.
- [x] **2.4** `utils/levels.ts` — `makeLetterLandLevels(set)` via `levelsFromGenerator(..., {count})`;
      `LATIN_LEVELS`/`ARABIC_LEVELS` module-consts (finite, stable identity, seed `level*7919`).
- [x] **2.5** `__tests__/generate.test.ts` (40) + `levels.test.ts` (27) — one-correct, in-set, distinct,
      determinism, non-mutation, ≥1200-seed sweep, count===set length, wrap behavior.

**Done when:** tests pass; rounds valid 1..N. ✅ **67 tests green; tsc clean (independently verified).**

---

## Sprint 3 — Core UI: trace canvas + both round types playable ✅ DONE (device run pending)

Goal: fully playable — Hear & find scores, and the finger-trace canvas works.

- [x] **3.1** `components/TraceCanvas.tsx` — glyph `<Text>` + **generic** dotted guide derived from
      the measured surface (5 points, no per-letter table) via `GestureDetector` +
      `Gesture.Pan().runOnJS(true)` (RN Animated). Surface pinned `direction:'ltr'` under RTL;
      `pointerEvents:'none'` on non-touch children. Reusable by Doodle Dots.
- [x] **3.2** Letter tile built inline in `HearAndFind` (3D socket/face like `NumberChoice`),
      default/correct/wrong states; RTL-safe (`end` not `right`).
- [x] **3.3** `components/HearAndFind.tsx` — hero speaker `IconButton` (replay via `useSpeech`) +
      row of 3 choices; correct/wrong feedback; landscape guard; choice row **not** direction-pinned.
- [x] **3.4** `index.tsx` host — renders by `round.mode`; speaks on round start; score via
      `useGameShell`; SFX via `useSound`; `LevelSolvedOverlay` (EmojiFrame + 3 `Star` + blue
      `PressableButton`); `ResumePrompt`; advance-once (`solved` guard), live `isLast`, single
      `timerRef` cleanup, overlay hidden on `[level]` change. Letter set switches by language.

**Done when:** both modes play end-to-end. ✅ code complete + adversarial-review pass; **gesture/trace
runtime + render unverified by tests → device run pending.**

---

## Sprint 4 — i18n, polish & verification ✅ DONE (device run pending)

Goal: production-ready — both scripts, localized, juicy, accessible, tested.

- [x] **4.1** en/ar complete — meta, loading, `instructions.trace`, `hearFind.*`, `a11y.*`,
      `levelSolved.{title,next,finish}`, `words.*` (26 Latin + 28 Arabic). Full parity (TS-enforced),
      kid-friendly Arabic, `{{glyph}}` interpolation both langs. All call-site keys resolve.
- [x] **4.2** RTL pass — Arabic isolated forms authored as data; choice row **not** pinned; trace
      canvas pinned `direction:'ltr'`; ✓ badge inset via `end` not `right`. (On-device render TBD.)
- [x] **4.3** Juice (RN Animated, `useNativeDriver`) — press translate, correct-pop, badge scale-in,
      trace pen/trail, overlay spring + trophy/stars.
- [x] **4.4** Accessibility — `accessibilityRole='button'` + localized `accessibilityLabel` +
      `accessibilityState {disabled,selected}` on choices; localized label on trace surface.
- [x] **4.5** Verify — **tsc clean + 1116/1116 jest green (independently re-run: 549 letter-land+i18n).**
      Adversarial review: pass, 0 blockers. **Device run EN + AR (human step) still pending** ↓.

**Done when:** verified on device EN + AR. **Code/tests done; device smoke is the only remaining step.**

**Device-test checklist (human):** run EN + AR (AR needs app reload after language switch).
- **hearAndFind** (odd levels): hero 🔊 speaks letter glyph + example word; replay works; 3 tiles;
  correct → green + ✓ + success sound; wrong → coral + wrong sound then re-enable; AR speaks Arabic.
- **trace** (even levels): generic dotted guide over the big glyph; finger drag advances start→end;
  completing → success + overlay; surface not mirror-broken in Arabic.
- **Overlay/nav:** ⭐️ advances, 🏆 on last letter (Z / ي) → startOver; score HUD; ResumePrompt continue/start-over.
- **Small-phone (SE) + landscape:** hero + choice row fit without clipping.
- **Sound setting off:** TTS + SFX silent (no crash).

---

## Post-build — code review & fixes ✅ DONE

Max-effort `/code-review` (orchestrated, 41 agents: 7 finder angles → per-candidate verify →
sweep) on the full diff. Surfaced 12 confirmed + 14 plausible + 4 sweep findings; the real
bugs (not caught by tsc/jest) were fixed in a repair workflow and re-verified.

**Fixed (7):**
1. **`useSpeech` stacked speech** — `speak()` now calls `Speech.stop()` before `Speech.speak()`
   (expo-speech queues by default), so rapid replay taps / level changes replace, not stack.
2. **`useSpeech` post-unmount race** — `mounted` ref; `speak()` bails after the `settingsStore.get()`
   await if unmounted, so audio can't bleed onto the next screen.
3. **Trace completed by tapping** — `Gesture.Pan().minDistance(8)`; progress driven only by
   `onUpdate` (onBegin just primes the pen); advance at most one point per move sample. Real
   finger travel is now required (was: taps walked the generic guide to completion).
4. **Replay speaker never disabled** — threaded `disabled` onto the hero `IconButton` (and added a
   purely-additive `disabled` prop to the shared `IconButton` primitive — all other callers safe).
5. **`speakTarget` effect over-fired** — level-change effect now keys on `[level]` only (reads
   speakTarget/shell via refs), so react-i18next `t`-identity churn no longer re-speaks mid-level.
6. **`meta.name`/`meta.description` + letter NAMES** — host now speaks the localized letter **name**
   (`names.<id>`) + example word, not the bare glyph (Arabic ع → "عين", not a raw sound). Added
   `names.*` (26 Latin phonetic + 28 Arabic proper names) to en/ar + all keys to `keys.test.ts`.
7. **Dead code removed** — unreachable `'win'` branch in `handlePick`; dead `placeholder` locale key.
   Also added defensive `shell.hideOverlay('win')` to `handleNext`.

**Verified (independently re-run):** `tsc --noEmit` exit 0; `jest` **1224/1224, 36 suites**.
Adversarial re-check: pass, `remaining: []`. **Device run EN + AR still the only open step.**

**Deferred (non-bugs, opportunistic):** `mulberry32`/`shuffled` duplicated across 5 games → could
move to a shared `@/sdk` random util; `LetterTile`≡`NumberChoice` → could extract a shared
`ChoiceTile`. Tracked for a later cross-game refactor, not blocking.

## Post-build — trace redesign (per-letter stroke paths) ✅ DONE

**Device finding:** the generic trace guide scattered dotted points across the whole screen,
unrelated to the letter (e.g. ث showed dots in the corners + a stray dot top-left). The "generic
guide" decision was reversed in favor of **real per-letter stroke paths** (user call).

- **`utils/paths/`** — `TRACE_PATHS: Record<letterId, readonly Waypoint[]>` covering **all 54 letters**
  (26 Latin + 28 Arabic), authored in **10 parallel batches → separate files** (`latin-1..5`,
  `arabic-1..5`) merged in `index.ts` — parallel-safe, no stall. Each path is an ordered, normalized
  `[0,1]`, 5–9-point skeleton stroke in natural writing order (Arabic right→left in physical space;
  e.g. ث = right→left bowl, ا = vertical top→bottom, C = upper-right→left→lower-right arc).
- **`TraceCanvas` alignment fix** (the screenshot bug) — glyph **and** path now map into a **centered
  square box** (`side = min(w,h)`, centered via `offsetX/Y`), `fontSize = side*0.9`, so the dots sit
  **on** the letter instead of spanning the surface. `event.x/y` offset by the same box origin so the
  hit-test aligns. Defensive `FALLBACK_PATH` (never hit — all 54 covered). All prior review fixes kept
  (`minDistance(8)`, `onUpdate`-only progress, one-point-per-sample, one-shot `onComplete`, RTL pin).
- **`__tests__/paths.test.ts`** — every Latin+Arabic id has a path; 3–12 points; all coords in `[0,1]`.

**Verified (independently re-run):** `tsc` exit 0; `jest` **1227/1227, 37 suites** (70 letter-land).
Design-check spot-verified C/L/O/ا/ب/ع follow their glyphs.

> **Superseded** — on device the per-letter dots still read as clumsy connect-the-dots (touch each
> checkpoint in order), not like writing. Replaced by free-draw below (user call).

## Post-build — trace redesign #2 (smooth free-draw, no dots) ✅ DONE

**Device finding:** dot checkpoints (even per-letter ones) feel wrong — a child shouldn't have to
touch ordered points. The right model is **draw freely over the letter with a smooth finger trail**,
like other tracing apps. (User call; the alternative was to drop trace entirely.)

- **`TraceCanvas` rewritten** — big faint glyph in a centered square box; finger drag lays a **smooth
  ink trail** (capped at `TRAIL_MAX=60` recycled round Views — no SVG); completion is **lenient
  coverage**: accumulate in-box finger travel, fire `onComplete()` once (`completedRef`) when it
  exceeds `box.side × COVERAGE_K`. **No dots, no waypoints, no ordered checkpoints.** Kept
  `minDistance(8)` (a tap can't complete), `onUpdate`-driven, RTL `direction:'ltr'` surface pin.
- **Completion logic extracted** to a pure `utils/coverage.ts` (point-in-box + travel accumulation)
  with its own `__tests__/coverage.test.ts`.
- **Deleted** the entire dot model: `utils/paths/` (all 11 files), `__tests__/paths.test.ts`, the
  `Waypoint` type, and all `TRACE_PATHS`/`HIT_RADIUS`/`reached` references — net simpler codebase.

**Verified (independently re-run):** `tsc` exit 0; `jest` **1235/1235, 37 suites**.

> **Superseded — trace removed entirely.** On device the free-draw ink also looked/felt bad. After
> three trace attempts (generic dots → per-letter dots → free-draw) none reached kid-acceptable
> quality, so trace was DROPPED per user call. (A proper masked letter-trace really wants
> `react-native-svg`/skia for a clipped stroke; the no-SVG constraint is what made the attempts ugly.
> Revisit only with a masking layer if tracing is ever wanted again.)

## Final shape — hear-and-find ONLY ✅

Letter Land ships as a single mode: **listen → tap the matching letter** (3 choices), bilingual
EN A–Z + AR isolated forms, phonics via `useSpeech()` reading the localized letter **name** +
example word. The trace mode and all its code are gone.

- Removed: `components/TraceCanvas.tsx`, `utils/coverage.ts` (+ test), `utils/paths/` (earlier),
  `TraceRound`/trace branch in types/generate, `instructions.trace` strings, the render ternary +
  `handleTraceDone` in the host. `modeForLevel` now always `'hearAndFind'`; `buildRound` hardened
  with floored modulo. Descriptions reworded (EN + AR) to drop "trace".
- `handlePick`'s `isLast ? 'win' : 'success'` is now correct (the last level can be hearAndFind).

**Verified (independently re-run):** `tsc` exit 0; full `jest` **1220/1220, 36 suites**; zero "trace"
references remain in `letter-land/`. **Device re-check of hear-and-find pending (listening already
confirmed working on device).**

## Notes / decisions

- **TTS over recorded clips:** on-device `expo-speech` (no asset pipeline); a recorded-clip
  upgrade can come later without changing call sites.
- **Two shared foundations:** `useSpeech()` (→ Animal Safari) and `TraceCanvas` (→ Doodle Dots).
  Keep both generic. Build Letter Land **first** in the slate for this reason.
- **RTL:** pin only the trace *canvas coordinates* (`direction:'ltr'`); never pin the letter
  set ordering or choice row (`rtl-sequence-pinning-trap`). Arabic uses isolated forms.
- **Reuse:** mirror `count-and-pop` / `shape-detective` structure (shell, `useLevels`, seeded
  generators, win overlay, ResumePrompt).

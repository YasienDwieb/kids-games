# Echo — Sprint & Task Breakdown

Build plan for **Echo** (Simon-style sequence memory, ages 5–10).
Game spec: `docs/GAME_IDEAS.md` §2. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/echo/`
**Config:** id `echo`, accent `blue`, layout `bare`, ageRange 5–10, icon 🔵.

**Mechanic.** Colored pads light up + play an SFX tone in a sequence; the kid taps
the pads to repeat it. Each successful round adds one step. Score = longest sequence
reached. Language-light (only instructions/HUD strings translated).

**Difficulty.** Start 3 pads / sequence length 2 → grow sequence each round → 4 pads
later → faster playback. Endless (no fixed end) — persist the best score.

---

## Sprint 0 — Scaffold & registration ✅ DONE

Goal: an empty-but-registered game that appears on Home and launches (bare layout).

- [x] **0.1** Module created from `_template/` (config, index, i18n, locales/en+ar).
- [x] **0.2** `config.ts`: id `echo`, accent `blue`, icon `🔵`, ageRange 5–10, layout `bare`, tags.
- [x] **0.3** Registered in `src/games/index.ts`.
- [x] **0.4** `index.tsx` placeholder wired to `useScreenBack(() => false)`.
- [x] **0.5** `i18n.ts` + en/ar with `meta.name`/`meta.description` + placeholder; parity enforced.
- [x] **0.6** Verify: tsc clean. ✅

**Done when:** `echo` appears on Home and opens a placeholder, EN + AR. ✅

---

## Sprint 1 — Game-state machine & logic (pure, tested) ✅ DONE

Goal: the Simon state machine as pure logic — no UI. Deterministic & tested.

- [x] **1.1** `types.ts` — `Phase` ('idle'|'playback'|'input'|'win'|'gameover'), `PadId`,
      `GameState` (sequence, inputIndex, round, padCount, score, phase); all readonly.
- [x] **1.2** `constants.ts` — `INITIAL_PAD_COUNT=3`, `MAX_PAD_COUNT=4`, playback timing,
      pad colors from `ACCENTS`, `PAD_SOUND_INTENTS=[pop,jump,powerup,laser]` + success/wrong.
- [x] **1.3** `utils/engine.ts` — seeded mulberry32 + pure `startGame`/`appendStep`/
      `checkInput`/`advanceRound`/`difficultyFor`. No timers, no Math.random.
- [x] **1.4** `__tests__/engine.test.ts` — **50 tests**: advance/win/gameover, grow-by-one,
      monotonic difficulty, determinism, non-mutation.

**Done when:** engine tests pass; full loop expressible as pure transitions. ✅
**Verified:** pure + deterministic + correct. 50 + 270 i18n green, tsc clean.

**Carry-forward for Sprint 2 (close in the build):**
- `checkInput` has NO phase guard — after `gameover`/`win`, a correct pad still returns
  'correct'. Add an early-return guard on terminal phases so the engine enforces terminality
  (don't rely on the UI to gate it).

---

## Sprint 2 — Board UI, playback & input ✅ DONE

Goal: fully playable — pads light + sound in sequence, kid repeats, rounds grow.

- [x] **2.1** `components/Pad.tsx` — tappable pad, `Animated` scale/opacity glow, press
      feedback, `disabled` lock. Plus engine hardening: `checkInput` phase guard (+4 tests).
- [x] **2.2** `components/Board.tsx` — pad grid pinned `direction:'ltr'` (positions don't mirror).
- [x] **2.3** `index.tsx` — full loop: playback (light + per-pad tone) → input → grow/gameover.
      **Input triple-locked during playback** (the classic Simon bug — defended at state, touch,
      and handler level). Timers ref-cleaned on unmount/reset/back.
- [x] **2.4** HUD — round + best score (`HudPill`); Start/Play-again (`PressableButton`).
- [x] **2.5** Best score persisted via `createStore('echo', {bestScore})` + serialized write-queue.

**Done when:** full Simon loop plays end-to-end with sound, scoring, game-over. ✅
**Verified:** input lock holds, loop re-enters playback per round, timers clean, no lost-update
race, RTL pinned (taps only — no GestureHandlerRootView). 54 engine + 298 i18n tests green, tsc clean.

---

## Sprint 3 — i18n, polish & verification ✅ DONE (device run pending)

Goal: production-ready — localized, juicy, accessible, tested.

- [x] **3.1** en/ar complete — instructions, HUD, start/again, game-over; full parity,
      20 keys in keys.test.ts, Western digits.
- [x] **3.2** RTL pass — pad grid pinned `direction:'ltr'`, HUD Western digits, shake
      translateX coordinate-pinned. No mirrored pads.
- [x] **3.3** Juice (RN Animated only) — pad glow/scale 1.14× on light-up, 5-step board
      shake on wrong, spring `EmojiFrame` trophy + 3 `Star`s + gold text on new best.
- [x] **3.4** Accessibility — every pad + Start/Play-again has localized `accessibilityLabel`
      + role + state; added optional `accessibilityLabel` to SDK `PressableButton`. No enum leak.
- [x] **3.5** Verify — tsc clean, 54 engine + 310 i18n tests green. **Device run pending (human step).**

**Done when:** game ships — localized, polished, verified on device in both languages.
**Critic verdict:** `productionReady = true`; only remaining item is the on-device EN+AR smoke test.

---

## Post-launch redesign — "Spotlight cards" (after on-device feedback)

On-device, the original playback light-up was **not noticeable** — idle pads at 0.55
opacity vs lit at 1.0 was only a ~1.8× gap, and the other pads never dimmed. Researched
Simon-style UX, designed an HTML mockup (`superdesign/design_iterations/echo_{idle,watch,
yourturn}_1.html`), previewed via superdesign live gallery, then implemented:

- **Dramatic blink** — active pad: scale 1.18 + white ring + colored glow halo, fast
  70ms on / 130ms off (a *blink*, not a fade). Target ~2.5–3× contrast.
- **Board-level dim** during watch — whole board recedes (~0.18 ink veil) so the active
  pad pops; lit pad + hub render above it.
- **Dimmed pads** (watch, non-active) vs **lifted pads** (your-turn/idle: chunky shadow +
  white top-highlight, reads pressable).
- **Per-pad icons** (star·heart·circle·square) so kids track by symbol+position+sound,
  not color alone (colorblind-safe **blue·orange·gold·violet** palette).
- **Phase pills** (👀 Watch / 👆 Your turn), **center hub** status (🔊/🎵/N·M), **sequence dots**.
- Start screen gained a one-line "watch then tap them back" hint (the "how do I play?" gap).

**Visual-only:** engine/loop/input-lock/timers/persistence untouched. RN Animated (no
reanimated). Tokens-only (gold + translucent-white are documented exceptions absent from
ACCENTS/COLORS). 54 engine + 310 i18n tests green, tsc clean. **Device run pending.**

## Post-launch rename — Arabic name صدى → تذكّر وكرّر

صدى was a literal translation of "Echo" that signals nothing as a *game* to Arabic
kids/parents. Researched Arabic naming for Simon-style memory games — toy listings
describe this exact game as "تذكّر التسلسل وكرّره" (watch/remember/repeat). Renamed the
Arabic `meta.name` to **تذكّر وكرّر** (*Tadhakkar wa Karrir* — "Remember & Repeat").
- English name **Echo** and registry `id: 'echo'` unchanged (id is the stable key).
- Avoided قال المعلّم / سايمون / سمسم — those name the *verbal* Simon-Says game, not this one.
- 310 i18n tests still green.

## Notes / decisions

- **Endless, not levelled:** Echo has no fixed end — use `createStore` for best score,
  not `useLevels`. (Unlike Shape Detective.)
- **Audio is the star:** lean on `useSound`'s random-variant playback; map each pad to a
  distinct intent (e.g. `pop`/`jump`/`powerup`/`laser`) so each pad has its own voice.
- **RTL:** the pad grid is spatial — pin `direction:'ltr'` like the SortPuzzle drag surface
  (see memory [[gesture-handler-rootview]] / [[rtl-sequence-pinning-trap]]); do NOT let pads
  mirror. No gestures needed (taps only), so no GestureHandlerRootView dependency.
- **Reuse:** mirror `color-mixer` (bare layout, `useScreenBack`, own HUD) for structure.

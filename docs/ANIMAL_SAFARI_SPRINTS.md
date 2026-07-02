# Animal Safari — Sprint & Task Breakdown

Build plan for **Animal Safari** (vocabulary, world knowledge, listening, ages 3–7).
Game spec: `docs/FOUR_NEW_GAMES_DESIGN.md` §2. SDK contract: `CLAUDE.md`.

**Module path:** `src/games/animal-safari/`
**Config:** id `animal-safari`, accent `orange`, layout `shell`, ageRange 3–7, icon 🐾.

**Mechanic.** An animal appears; its name is spoken via `useSpeech()` + its SFX plays. Then a
round asks the kid to match: pick the animal that makes *this* sound, or tap the animal whose
name they hear (3–4 choices). Correct → cheer + the animal "celebrates."

**Depends on Letter Land's `useSpeech()`** — build this after Letter Land Sprint 1.

**Difficulty.** Familiar animals + 3 choices early → more animals + 4 choices + subtler
distractors later. Finite ladder via `useLevels`; progress persists.

---

## Pre-build — UI design (frontend-design → superdesign) ⬜

Mock the UI as HTML/CSS via `/frontend-design`, preview in **superdesign**, get approval.
Mockups: **Hear the name** state (prompt + replay + 3–4 animal choice tiles), **Which sound?**
state (sound prompt + animal choices), **Level-solved** overlay. System: warm cream, Fredoka/
Nunito (AR IBM Plex Sans Arabic), chunky tiles + soft shadows, **orange** accent, big targets.

---

## ✅ BUILT — status summary (all sprints complete; device test pending)

Built via orchestrated workflows on branch `feature/animal-safari` (off `feature/letter-land`,
so `useSpeech()` is available). **Interaction agreed up front** (the Letter Land lesson): the
proven listen→tap pattern, no novel gesture — two round modes alternate by level:
- **hearName** (odd levels) — animal NAME spoken via `useSpeech()` → tap the matching animal (3 choices).
- **whichSound** (even levels) — real animal SFX played via `useSound()` → tap the animal that makes it.

**Audio:** 11 **CC0/PD** animal clips fetched from Wikimedia Commons (license + content verified,
trimmed to short SFX, provenance in `src/sdk/assets/audio/animals/CREDITS.md`), wired as
`animal.<id>` manifest entries. **Cow has no CC0 moo → it appears only in hearName rounds, never in
a sound round** (enforced in the domain layer + asserted by tests). `.ogg` mocked for jest.

**Final shape:** 12 animals (lion/elephant/cow/dog/cat/frog/horse/sheep/rooster/duck/bird/bee),
finite 12-level ladder, accent `orange`, shell layout, EN + AR.

**Verified (independently re-run):** `tsc` exit 0; full `jest` **1330/1330, 38 suites** (incl. a new
manifest tag-uniqueness guard locking the `play('<id>')`→clip resolution). Adversarial review: **pass,
0 blockers**; post-review cleanup deduped the shared `AnimalTile` (~256 dup lines removed) and added
the tag guard. **Device run EN + AR pending** (the one thing tests can't confirm: real audio playback,
TTS, on-screen feel).

> Build/verify note: the build workflow's final gate aborted on a telemetry (StructuredOutput) error
> *after* the code landed; the gate + adversarial review were re-run separately and passed.

---

## Sprint 0 — Scaffold & registration ✅ (see status summary above)

Goal: an empty-but-registered game that appears on Home and launches (shell layout).

- [ ] **0.1** Copy `_template/` → `animal-safari/` (config, index, i18n, locales/en+ar).
- [ ] **0.2** Fill `config.ts`: id `animal-safari`, accent `orange`, icon `🐾`, ageRange 3–7,
      layout `shell`, tags `['animals','vocabulary','listening','educational']`,
      backgroundColor from `ACCENTS.orange.tint`.
- [ ] **0.3** Register: add `import './animal-safari/config';` to `src/games/index.ts`.
- [ ] **0.4** Stub `index.tsx` placeholder via `useGameShell` + `useTranslation`.
- [ ] **0.5** Wire `i18n.ts` + `locales/en.ts` + `locales/ar.ts` with `meta.name`/`meta.description`.
- [ ] **0.6** Add keys to `src/sdk/i18n/__tests__/keys.test.ts`.
- [ ] **0.7** Verify: tsc clean, registered, appears on Home EN + AR.

**Done when:** `animal-safari` appears on Home and opens a placeholder, EN + AR.

---

## Sprint 1 — Animal data, audio assets & level generation (pure, tested) ⬜

Goal: animal inventory (emoji + name keys + SFX intent), round generation, ramp. Pure +
tested; seeded PRNG only.

- [ ] **1.1** Decide audio: start with existing `sfx.*` family; add a few short animal SFX
      assets to `src/sdk/assets/` + `manifest.ts` only if needed (tagged, with `modules`).
- [ ] **1.2** `types.ts` — `RoundType` (`hearName` | `whichSound`), `Animal`, `Round` union,
      `LevelData`. Readonly.
- [ ] **1.3** `constants.ts` — animal inventory (emoji, name i18n key, sound intent),
      choice-count ramp (3→4), per-level animal-pool sizing.
- [ ] **1.4** `utils/generate.ts` — mulberry32 PRNG + builders; **exactly one** correct
      choice; distractors distinct, in-pool.
- [ ] **1.5** `utils/levels.ts` — `buildLevel(level, sessionSeed)` ramp; `animalSafariLevels`
      via `levelsFromGenerator`.
- [ ] **1.6** `__tests__/generate.test.ts` + `levels.test.ts` — one-correct, distinct,
      in-pool, determinism, non-mutation, multi-seed sweep.

**Done when:** tests pass; `buildLevel` produces valid solvable rounds 1..N.

---

## Sprint 2 — Core UI: both round types playable ⬜

Goal: fully playable — hear-the-name and which-sound rounds score with TTS + SFX feedback.

- [ ] **2.1** `components/AnimalTile.tsx` — chunky animal tile (emoji + optional label),
      default/selected/correct/wrong states; celebrate animation on correct. RTL-safe.
- [ ] **2.2** `components/HearName.tsx` — `useSpeech()` speaks the target name + replay button
      + choice grid; tap the matching animal.
- [ ] **2.3** `components/WhichSound.tsx` — plays the target SFX (`useSound`) + replay +
      choice grid; tap the animal that makes it.
- [ ] **2.4** `index.tsx` — `useLevels` host: renders by `round.type`; speaks/plays on round
      start; score via `useGameShell`; success/wrong SFX; `LevelSolvedOverlay` (EmojiFrame +
      3 `Star` + orange `PressableButton`); `ResumePrompt`. Advance-once, live `isLast`, timer
      cleanup, overlay hidden on level change.

**Done when:** both round types play end-to-end with TTS/SFX, scoring, win overlay.

---

## Sprint 3 — i18n, polish & verification ⬜

Goal: production-ready — localized, juicy, accessible, tested.

- [ ] **3.1** en/ar complete — all animal names + chrome, full parity, kid-friendly Arabic,
      placeholders resolve.
- [ ] **3.2** RTL pass — choice grid mirrors cleanly (equal options, not a sequence — no pin);
      no `left`/`right`; replay/arrow glyphs flip via `I18nManager.isRTL`.
- [ ] **3.3** Juice (RN Animated only) — animal celebrate bounce on correct, wrong-shake,
      trophy + stars on solve.
- [ ] **3.4** Accessibility — `accessibilityRole` + localized `accessibilityLabel` +
      `accessibilityState` on tiles; no enum leak.
- [ ] **3.5** Verify — tsc clean, all tests green. **Device run EN + AR (human step):** names
      spoken in both languages; animal SFX play; correct/wrong feedback; small-phone (SE) fit.

**Done when:** game ships — localized, polished, verified on device EN + AR.

---

## Notes / decisions

- **Reuses `useSpeech()`** from Letter Land — do not re-implement TTS; build after Letter
  Land Sprint 1.
- **Audio:** prefer existing `sfx.*`; add animal clips to `manifest.ts` only if the existing
  set can't represent enough animals distinctly.
- **RTL:** choice grid is equal options → mirrors safely, **no** `direction:'ltr'` pin.
- **Reuse:** mirror `count-and-pop` structure (shell, `useLevels`, seeded generators, win
  overlay, ResumePrompt).

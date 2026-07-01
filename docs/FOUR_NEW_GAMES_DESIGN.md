# Four New Games — Design Spec

Design for the next slate of **4 games** for the Kids Games app. Chosen to fill the
biggest learning-content gaps versus what tops the kids-education market (literacy,
rhythm/timing, vocabulary, fine-motor) while staying fun-first and reusing the `@/sdk`
contract. All four target **ages 3–7** (the catalog's center of gravity), are bilingual
EN + Arabic with full RTL, and lead with learning value.

SDK contract: `CLAUDE.md`. Add-a-game guide: `src/games/HOW_TO_ADD_GAME.md`.
Per-game build plans: the four `*_SPRINTS.md` files in `docs/`.

---

## Why these four

**Current 8 games cover:** memory matching (Simple Pairs), color theory (Color Mixer),
spatial/maze (Mouse Maze), aim/physics (Balloon Archer), reflexes (Turbo Road),
counting (Count & Pop), pattern logic (Shape Detective), associations (Match Up).

**Market research** ([Khan Academy Kids], [ABC Kids], [Endless Alphabet],
[Teach Your Monster to Read], [Starfall]) surfaced these gaps, in priority order:

1. **Literacy / letters** — the single biggest kids-education category; the catalog has
   *none*. → **Letter Land**.
2. **Fine-motor / creativity** — drawing/tracing/dot-to-dot; open-ended top apps win here.
   → **Doodle Dots**.
3. **Vocabulary / world knowledge** — naming + listening comprehension. → **Animal Safari**.
4. **Rhythm / timing** — listening + sequencing + coordination, delivered with
   percussive SFX only (no melody). → **Rhythm Tap**.

[Khan Academy Kids]: https://www.khanacademy.org/kids
[ABC Kids]: https://play.google.com/store/apps/details?id=com.rvappstudios.abc_kids_toddler_tracing_phonics
[Endless Alphabet]: https://www.originatorkids.com/
[Teach Your Monster to Read]: https://www.teachyourmonster.org/
[Starfall]: https://www.starfall.com/

## The slate at a glance

| # | Game | Fills gap | Layout | Accent | New SDK |
|---|------|-----------|--------|--------|---------|
| 1 | 🔤 Letter Land | Literacy / phonics / tracing (EN + AR) | `shell` | `blue` | `useSpeech()` (TTS) |
| 2 | 🐾 Animal Safari | Vocabulary / world knowledge / listening | `shell` | `orange` | reuses `useSpeech()` |
| 3 | ✏️ Doodle Dots | Fine-motor / creativity / number order | `bare` | `coral` | reuses trace foundation |
| 4 | 🥁 Rhythm Tap | Rhythm & timing (percussive, no melody) | `shell` | `pink` | none |

**Engineering compounds:** #1 and #2 share `useSpeech()`; #1 and #3 share a finger-trace
canvas + waypoint-validation foundation. Build #1 first (it creates both shared pieces),
then #2/#3 reuse them, then #4 stands alone.

**Hard content constraint (project-wide):** **no music / melody.** Per user instruction,
melodic or instrumental music (piano, tunes, sustained notes) is forbidden. Only short
**percussive SFX** of the same character the app already ships (`sfx.pop`, `sfx.hit`,
`sfx.success`, claps/taps) are allowed. This constrains Rhythm Tap specifically.

---

## 1. 🔤 Letter Land — Literacy (trace + phonics)

- **Learning area:** Letter recognition, phonics (letter sound), and letter formation
  (tracing) — for **both scripts**: Latin A–Z and Arabic ا–ي, language-aware.
- **Age band:** Preschool → Early (3–7). **Accent:** `blue`. **Layout:** `shell`.

**Mechanic.** A big letter appears. Child hears it spoken via **expo-speech TTS** in the
current language (e.g. "A — apple" / "أ — أرنب"), then traces the letter shape by dragging
a finger along a guided dotted path. Completing the trace → celebration + next letter.
Two round types rotate: **Hear & find** (hear a letter, tap it among 3–4) and
**Trace it** (finger-trace the shown letter along waypoints).

**Difficulty.** Early levels: short uppercase letters / simple Arabic isolated forms,
few waypoints. Later: more letters per choice round, more trace waypoints, lowercase
(Latin). Bounded set so the ladder is finite and progress persists.

**Bilingual / RTL.** Shows the script matching the current app language. Arabic uses
**isolated letter forms** and right-to-left stroke order. The trace *canvas coordinates*
are pinned to a fixed origin (`direction:'ltr'` on the canvas only) — never pin the
letter *ordering* (per `rtl-sequence-pinning-trap`). All chrome via `t()`.

**Sound.** Phonics via a new thin **`useSpeech()`** SDK wrapper over `expo-speech`
(on-device TTS, EN + AR voices). SFX for trace-progress / success via existing `useSound`.

**New SDK:** `useSpeech()` — the only genuinely new platform piece in this slate.

**Why it wins.** Literacy is the #1 educational-app category and the catalog has none;
tracing builds fine-motor + letter memory at once; TTS investment is reused by Animal Safari.

---

## 2. 🐾 Animal Safari — Vocabulary & world knowledge

- **Learning area:** Animal vocabulary, listening comprehension, sound recognition,
  real-world knowledge — bilingual word-building.
- **Age band:** Preschool → Early (3–7). **Accent:** `orange`. **Layout:** `shell`.

**Mechanic.** An animal appears (emoji/illustration). Child hears its **name spoken via
`useSpeech()`** in the current language ("Lion" / "أسد") plus its characteristic SFX. Then
a round asks the child to match: pick the animal that makes *this* sound, or tap the animal
whose name they hear (3–4 choices). Correct → cheer + the animal "celebrates."

**Difficulty.** Few familiar animals + 3 choices early → more animals + 4 choices + less
obvious distractors later. Finite ladder via `useLevels`; score persists.

**Bilingual / RTL.** Names spoken + labeled via `t()` in EN/AR. The choice grid mirrors
cleanly in RTL (it's a grid of equal options, not an ordered sequence). Western digits for score.

**Sound.** Reuses the `useSpeech()` wrapper from Letter Land; animal SFX via `useSound`
(start with existing SFX family, add a few short animal clips as assets if needed).

**New SDK:** none beyond the shared `useSpeech()`.

**Why it wins.** Animals are universally kid-loved; pairs vocabulary with listening; and
it amortizes the TTS investment across two games.

---

## 3. ✏️ Doodle Dots — Fine-motor & creativity

- **Learning area:** Fine-motor control, number/letter order, hand-eye coordination,
  shape discovery — the creativity gap (no drawing/tracing-to-create game exists).
- **Age band:** Preschool → Early (3–7). **Accent:** `coral`. **Layout:** `bare`.

**Mechanic.** Numbered dots scattered on screen. Child drags a finger from dot 1 → 2 →
3… in order; a line follows. Completing the sequence reveals a hidden picture (animal,
star, boat) that then animates + celebrates. Early levels = few dots; later = more.

**Difficulty.** 4–6 dots, large + spread early → more dots, tighter, later. Next-dot-only
validation (the line only advances to the correct next dot). Finite picture set.

**Bilingual / RTL.** Dot labels use **Western digits** (per i18n contract). The connect
*order* is a sequence — must **not** be pinned as an LTR row; but the drawing *canvas
coordinates* are pinned to a fixed origin (per the sequence-vs-coordinate distinction in
`rtl-sequence-pinning-trap`). Chrome via `t()`.

**Sound.** `useSound` for dot-connect ticks + reveal celebration.

**New SDK:** none — shares Letter Land's finger-trace canvas + waypoint foundation (2nd consumer).

**Why it wins.** Fine-motor + number-order learning wrapped in a "what will it become?"
surprise — high replay, and it reuses Letter Land's hardest engineering.

---

## 4. 🥁 Rhythm Tap — Rhythm & timing (no melody)

- **Learning area:** Beat, timing, listening, sequencing, hand-eye coordination — pure
  rhythm, **no music/melody**.
- **Age band:** Preschool → Early (3–7). **Accent:** `pink`. **Layout:** `shell`.

**Mechanic.** A steady beat plays using short **percussive SFX** (claps/taps/pops — the
same family as the current `sfx.pop` / `sfx.hit`). Pads pulse on the beat; child taps in
time. On-beat taps trigger a pop + sparkle. Difficulty = faster / denser beats.

**No melody (hard constraint).** Sounds are single percussive hits only — never sustained
notes, never a tune. Same audio character the app already ships.

**Difficulty.** Slow, sparse beats + 1 pad early → faster, denser, 2–3 pads later. Scored
perfect / good / miss with a combo counter. Endless-friendly (chase your best), or finite
ladder — decided in its sprint.

**Bilingual / RTL.** Near text-free; chrome ("Tap!", score, combo) via `t()`. Pads are
vertical/centered → no left-origin RTL coordinate trap. If lanes ever go horizontal, pin
the lane coordinates `direction:'ltr'`.

**Sound.** Existing `sfx.*` intents only, on a lightweight beat clock. **No** new note assets.

**New SDK:** none.

**Why it wins.** No rhythm game exists; rhythm games are inherently joyful and replayable;
and the learning (timing, listening, pattern) is real — delivered within the no-music rule.

---

## Build order & shared foundations

1. **Letter Land** first — it builds the two reusable pieces: `useSpeech()` (TTS wrapper)
   and the finger-trace canvas + waypoint-validation foundation.
2. **Animal Safari** — reuses `useSpeech()`.
3. **Doodle Dots** — reuses the trace canvas/waypoint foundation.
4. **Rhythm Tap** — standalone (existing SFX + beat clock).

Each game is built **incrementally across its own sprint file** (Sprint 0 scaffold →
domain model → core UI → polish/i18n/verify), mirroring the proven `COUNT_AND_POP_SPRINTS.md`
and `SHAPE_DETECTIVE_SPRINTS.md` flow — never in one shot.

## Cross-cutting requirements (all four)

- **`@/sdk` only** — no hardcoded hex, system fonts, or hand-rolled buttons/headers/shadows.
  Use `ACCENTS`/`COLORS`, `FONTS`, `SHADOWS`, `PressableButton`/`AppBar`/`HudPill`, etc.
- **i18n EN + AR, full RTL** — every user-facing string via `t()`; per-game `locales/en.ts`
  (`as const` + `GameTranslations`) + `locales/ar.ts` (`: GameTranslations`) + `i18n.ts`
  calling `registerTranslations('<id>', { en, ar })`; register `meta.name`/`meta.description`;
  add new keys to `src/sdk/i18n/__tests__/keys.test.ts`. Western digits in both languages.
- **RTL rules** — pin only genuine coordinate/drag/trace *surfaces* with `direction:'ltr'`,
  never ordered sequences; flip directional glyphs via `I18nManager.isRTL`; wrap any LTR
  math/number expression inside Arabic strings in a Bidi isolate (U+2066…U+2069).
- **Gestures** — use `GestureHandlerRootView` (already at app root) + `Gesture.Pan().runOnJS(true)`
  with RN `Animated` (reanimated is **not** installed).
- **Seeded/pure domain layer** — no `Math.random` / `Date.now` in generators; seed from the
  host. Finite level ladders via `useLevels` + progress so checkpoints persist.
- **No music/melody anywhere** — percussive SFX only.

## Out of scope (YAGNI)

- Early arithmetic (Number Train) — considered and dropped; Count & Pop already anchors numbers.
- Simon-style memory (Memory Maestro) — dropped to avoid a 3rd memory-flavored grid tile.
- Recorded voice-over assets — using on-device TTS instead; a recorded-clip upgrade can come later.

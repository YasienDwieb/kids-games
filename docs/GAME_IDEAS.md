# Game Ideas — Educational Slate

Proposed games to fill the app's **learning-content gaps**. The current games cover
memory, creative, spatial, aim, and reflex play — but none teach numbers, letters,
shapes/logic, or sequence memory. This slate fills those four areas across the
preschool→kids age range (3–10).

Each game is a self-contained module under `src/games/`, built on `@/sdk` (sound,
levels/progress, i18n EN+AR with full RTL, design tokens). See `CLAUDE.md` and
`src/games/HOW_TO_ADD_GAME.md`.

## Current coverage

| Game | Skill type | Age lean |
|------|-----------|----------|
| Simple Pairs | Memory / matching | Young |
| Color Mixer | Creative / discovery | Young |
| Mouse Maze | Spatial / swipe nav | Mid |
| Balloon Archer | Aim / timing | Mid |
| Turbo Road | Reflex / steering racer | Older |

**Gaps:** numbers/math, letters/words, shapes/logic, sequence memory.

---

## 1. Shape Detective — Shapes & Logic

- **Learning area:** Shapes & logic (pattern completion, odd-one-out, sorting)
- **Age band:** Preschool → Kids (3–10)
- **Accent:** `purple`
- **Layout:** `shell` (uses score + level overlays)

**Mechanic.** Three puzzle types that rotate by level:
- **What comes next?** — a pattern like 🔺🔵🔺🔵 → tap the shape that continues it.
- **Odd one out** — find the shape that doesn't belong (by color, shape, or size).
- **Sort it** — drag shapes into the correct bins.

**Difficulty scaling.** 2-item patterns → 3-item → multi-attribute logic
(color + shape + size combined).

**Why first.** Fully language-light (shapes + numerals only), so Arabic/RTL is trivial.
Broadest age span and best exercises the `useLevels` / progress SDK. Lowest risk,
highest reuse.

---

## 2. Echo — Memory & Focus

- **Learning area:** Sequence memory, focus, listening
- **Age band:** Early → Kids (5–10)
- **Accent:** `blue`
- **Layout:** `bare` (single full-screen board)

**Mechanic.** Simon-style. Colored pads light up and play SFX tones in a sequence;
the kid repeats the sequence by tapping. Each successful round adds one step.

**Difficulty scaling.** Start at 3 pads / sequence length 2 → 4 pads → faster playback →
longer sequences. Score = longest sequence reached.

**Why second.** Small, self-contained, quick win. Showcases the audio-variant system
(`useSound` picks random variants so repeats don't feel monotonous). Language-light.

---

## 3. Count & Pop — Numbers & Math  ✅ BUILT

> **Status:** built (device run pending) — sprints in `docs/COUNT_AND_POP_SPRINTS.md`.
> Branch `feature/add-count-and-pop`. 4 modes (count / how-many / make-N / addition),
> EN + AR with full RTL. English name **Count & Pop**, Arabic **اعدد وفرقّع**.

- **Learning area:** Counting, number recognition, early arithmetic
- **Age band:** Preschool → Early (3–7)
- **Accent:** `pink`
- **Layout:** `shell`

**Mechanic.** Two modes that rotate:
- **Count this many** — a numeral shows (e.g. `5`); kid taps that many objects.
- **How many?** — a group of objects shows; kid taps the matching numeral.

**Difficulty scaling.** Count 1–5 → 1–10 → "how many more to make N?" →
single-digit addition. Western digits per i18n contract (numbers stay literal).

**Why third.** Numbers localize cleanly (Western digits in both languages). Reuses
the satisfying pop/burst feedback from Balloon Archer.

---

## 4. Letter Hunt — Letters & Words

- **Learning area:** Alphabet recognition, letter→word/picture matching
- **Age band:** Preschool → Early (3–7)
- **Accent:** `orange`
- **Layout:** `shell`

**Mechanic.** Language-aware. Shows a target letter; kid finds and taps it among
distractors. Later levels: match a letter to a word or picture that starts with it.

**Language handling.** Teaches the alphabet of the **currently selected language**:
- EN mode → English letters A–Z
- AR mode → Arabic letters (أبجد), with correct letter forms and RTL layout

**Difficulty scaling.** Find target among 3 → among 6 → letter→picture match →
first-letter-of-word.

**Why last.** Heaviest content + i18n lift (two full alphabets, Arabic letter forms,
RTL). Build once the level/progress and content patterns are proven by the others.

---

## Recommended build order

1. **Shape Detective** — language-light, exercises levels/progress, broadest age span.
2. **Echo** — small, self-contained, showcases audio.
3. ✅ **Count & Pop** — numbers, reuses pop mechanics. *(built — `docs/COUNT_AND_POP_SPRINTS.md`)*
4. **Letter Hunt** — most content/i18n work; do it last.

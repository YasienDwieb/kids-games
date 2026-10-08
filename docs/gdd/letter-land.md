# Letter Land — Game Design Document

| | |
|---|---|
| **id** | `letter-land` |
| **Icon / accent** | 🔤 / `blue` |
| **Ages** | 3–7 |
| **Layout** | `shell` |
| **Win jingle** | `jingle.pizzi-02` |
| **Guided flow** | ✅ `count: 26` (even in Arabic → 2 of 28 Arabic letters skipped per journey) |
| **Persistence** | `useLevels` + per-run order seed (`kg:order:letter-land`) |
| **Engine** | shared `src/games/_shared/listen-find/` (with Numbers Land, Animal Safari) |
| **Code** | ~970 LOC (+ shared engine ~650) · device TTS via `useSpeech` |

## 1. Concept & learning goal
Hear a letter name + example word, see the word's picture, tap the right letter among three. **Letter recognition (name ↔ glyph)** in English (A–Z uppercase) or Arabic (28 isolated forms).

## 2. Core loop
1. TTS: "ay. apple" / "لَامْ. لَيْمُونْ"; hero shows 🍎 (tap hero to replay).
2. Three big letter tiles; tap one.
3. Correct → green pop + ✓, `success` → "You got it!" overlay (3 stars always full) → Next. Wrong → coral, `wrong`, clears after 700 ms, unlimited retries.

## 3. Content & progression
- One level per letter (26 EN / 28 AR), shuffled order per run.
- Flat difficulty: always 3 random choices; no lowercase, no Arabic positional forms, no confusable distractors (b/d, ب/ت/ث).
- Tracing was built three times and removed (needs SVG/Skia masking). Tags still say `phonics`/`tracing` — stale.

## 4. Feedback & juice (current)
Tile pop/✓, overlay spring. Robotic device TTS (rate 0.7, pitch 1.1, default voice; Arabic voice may be missing). No mascot, confetti, or wrong shake.

## 5. Engagement audit
| Gap | Impact |
|---|---|
| Device TTS voice | Robotic; Arabic quality varies by phone; **#1 quality issue** for a listening game |
| Name only, no letter **sound** | Doesn't teach phonics (what reading actually needs) |
| No tracing / writing | Big missing pillar for 4–6 |
| Word never shown; letter never highlighted in the word | No print ↔ sound link |
| Flat difficulty, random distractors | No growth |
| 26–28 identical rounds in a row | Long for 3–4-year-olds |
| No hint after repeated misses; always 3★ | No adaptation; stars meaningless |
| Replay button lacks `accessibilityLabel` | — |

## 6. Improvement plan

### Quick wins (S)
1. After correct: show the word with the letter **highlighted and animated** ("**A**pple"), speak it again.
2. After 2 misses: the correct tile wiggles + re-prompt automatically.
3. **Chapters of 5 letters** with a sticker at the end of each (instead of 26 in a row).
4. Stars reflect first-try accuracy.
5. Fix flow `count` for Arabic (use the active set length); remove stale tags.

### Medium (M)
6. **Recorded voice-over** (EN + AR, warm human voice) for letter names, letter sounds, words, and praise — biggest perceived-quality upgrade in the app. (~300 short clips; keep `useSpeech` as fallback.)
7. **Phonics mode**: "Which letter says /b/?" using recorded phonemes.
8. **Lowercase & Arabic forms** levels; confusable distractors at higher levels.
9. **Tracing with Skia** (`@shopify/react-native-skia` path clipping): trace with a finger, sparkly trail, letter "comes alive" when done.
10. Alphabet **collection book**: each mastered letter becomes an animated letter-character sticker.

### Big bets (L)
11. **Letter world map**: each letter is an island/house with its words (A: apple tree, ant, airplane) — exploration + vocabulary.

## 7. 3D verdict
**No.** Letters must be crisp and flat. Tracing (Skia, 2D) is far more valuable than any 3D.

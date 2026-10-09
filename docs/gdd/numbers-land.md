# Numbers Land — Game Design Document

| | |
|---|---|
| **id** | `numbers-land` |
| **Icon / accent** | 🔢 / `orange` |
| **Ages** | 3–7 |
| **Layout** | `shell` |
| **Win jingle** | `jingle.sax-06` |
| **Guided flow** | ✅ 10 units |
| **Persistence** | `useLevels` + order seed |
| **Engine** | shared `listen-find` |
| **Code** | ~570 LOC |

## 1. Concept & learning goal
Hear a number, see that many objects, tap the matching digit. **Number word ↔ quantity ↔ numeral** (1–10). Audio-first sibling of Count & Pop.

## 2. Core loop
1. TTS: "three" / "ثَلاثة"; hero shows a cluster of N emoji (1 🍎 … 10 🍋).
2. Tap the right digit among three.
3. Same feedback/overlay as Letter Land.

## 3. Content & progression
1–10 only, shuffled, 3 choices, flat. Western digits in both languages.

## 4. Engagement audit
| Gap | Impact |
|---|---|
| Bare number word only | No "Let's count: one, two, three!" scaffold |
| Cluster is static, not tappable | No one-to-one counting |
| Only 1–10, 10 rounds | Very short; nothing for 6–7 |
| Device TTS | Robotic |
| Same overlay/reward gaps as Letter Land | — |

## 5. Improvement plan

### Quick wins (S)
1. After correct: **objects count themselves** (each bounces with "one, two, three!").
2. Tap-to-count: tapping an object numbers it.
3. Arranged clusters (dice/ten-frame patterns) at higher levels → teaches subitizing.

### Medium (M)
4. Range 1–20, then tens (10, 20, 30…) for 6–7.
5. Modes: **number line** (where does 7 go?), **before/after**, **Arabic-Indic digits** option (٣) for Arabic-school kids.
6. Recorded voice (shared with Letter Land plan).
7. Merge with Count & Pop into one "Numbers world" with shared number-friend mascots, or keep separate but share rewards.

## 6. 3D verdict
**No.**

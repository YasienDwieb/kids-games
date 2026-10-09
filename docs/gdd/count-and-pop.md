# Count & Pop — Game Design Document

| | |
|---|---|
| **id** | `count-and-pop` |
| **Icon / accent** | 🧮 / `pink` |
| **Ages** | 3–7 |
| **Layout** | `shell` |
| **Win jingle** | none — intentionally never plays `win` (listed in `NO_WIN_SOUND`) |
| **Guided flow** | ✅ 12 units |
| **Persistence** | `useLevels` level + score (session seed not saved) |
| **Code** | `src/games/count-and-pop/` · ~2,900 LOC + 66 tests · seeded generator (mulberry32) |

## 1. Concept & learning goal
Early numeracy: **one-to-one counting, subitizing, numeral recognition, "how many more", simple addition** (1–10, sums ≤12).

## 2. Core loop — four round modes (tap only)
| Mode | Child sees | Child does |
|---|---|---|
| **countThisMany** | "Pop 4 🍎!" + bobbing numeral chip, pips, grid of up to 10 emoji | Pops exactly N (extras lock) |
| **howMany** | "How many 🍎?" over a group | Picks numeral (3–4 choices) |
| **makeN** | "Add 3 more to make 7 🍎!" have-group + empty slots | Picks how many to add |
| **addition** | "2 + 3 = ?" two tinted groups | Picks the sum |

Correct → `success`, board pops → after 600 ms "Great job!" overlay (tap to continue). Wrong → `wrong`, shake, **correct answer shown in green**, free retry, still +10.

## 3. Content & progression
- **Endless**, 16-step mode rotation: L1–6 count/howMany only, makeN from L7, addition from L12.
- Count cap 5 (L1–4) → 10 forever; 3 → 4 choices.
- Session seed changes emoji/distractors/positions, but **numbers per level are fixed** (`targetFor(level)`): L1 is always "pop 1".
- 8-emoji pool: 🍎⭐🎈🐞🍓🚗🐟🐱. Score = 10 × levels.

## 4. Feedback & juice (current)
Pop burst (scale + sparkle ring), bobbing emoji, pulsing pips, ✓ badges, board shake/pop. No speech, mascot, confetti, or counting voice.

## 5. Screens & HUD
GameShell back + score pill; prompt card; visual; choices; ResumePrompt.

## 6. Engagement audit
| Gap | Impact |
|---|---|
| **All prompts are text, no voice** | 3–5-year-olds can't read "Add 3 more to make 7" |
| No counting voice on pops ("one, two, three…") | Misses the core numeracy moment |
| Wrong answer reveals the answer, full points | No learning signal; no adaptation |
| makeN prompt contains the answer | Mode is just numeral matching |
| howMany objects aren't tappable to count | No touch-counting scaffold |
| Same "Great job!" tap-modal every ~10 s round | Constant interruption |
| 8 emoji, capped at 10, fixed per-level numbers | Repetitive |
| No rewards/goal in an endless game | Score is the only signal |

## 7. Improvement plan

### Quick wins (S)
1. **Speak every prompt** with `useSpeech` (already in SDK) — EN + AR.
2. **Count aloud on each pop** ("one… two… three!") and on tap-to-count in howMany (tapped item gets a number badge).
3. Replace tap-to-continue modal with a **2-second auto celebration** (confetti + mascot cheer), modal only every 5 levels.
4. makeN prompt → "Make 7 🍎!" (don't state the needed amount).
5. Wrong answer: first miss = hint (count the objects with highlight), second = reveal; points only on first try.

### Medium (M)
6. **Adaptive difficulty**: track first-try accuracy per mode; stay/step back/step up.
7. **Bigger emoji pool + themed "stories"**: feed the 🐸 frog 5 flies, put 3 🥚 in the nest — counting with purpose.
8. **Milestone rewards**: every 5 levels a sticker / new number-friend character.
9. New modes: **compare** (which has more?), **number order** (fill the missing 1-2-_-4), **subtraction** for 6–7 (balloons fly away).
10. Seed per-level numbers by session so content truly varies.

### Big bets (L)
11. **Number-friends mascot** set (1 to 10 as characters), used across Count & Pop, Numbers Land and the Journey.

## 8. 3D verdict
**No.** Counting needs clear, flat, separable objects. Add depth with shadows, squash-and-stretch and particles instead.

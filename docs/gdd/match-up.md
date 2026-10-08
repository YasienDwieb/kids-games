# Match Up — Game Design Document

| | |
|---|---|
| **id** | `match-up` |
| **Icon / accent** | 🔗 / `purple` |
| **Ages** | 3–7 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.steel-15` |
| **Guided flow** | ✅ 8 units (renders `MatchBoard` directly, no `useFlowRound`) |
| **Persistence** | `useLevels` level + score |
| **Code** | `src/games/match-up/` · ~1,100 LOC + 15 tests · gesture-handler line drawing, data-driven `content.ts` |

## 1. Concept & learning goal
Draw a line from each item on top to its partner below. **Associations & vocabulary**: animal→food, worker→tool, animal→home, color→fruit, baby→grown-up, number→quantity.

## 2. Core loop
1. Prompt text ("Match each animal to its food") + two rows of 84 px tiles (bottom row shuffled).
2. Drag from a tile → line follows finger → release near a partner (snap radius 1.3× tile). Or tap-tap.
3. Correct → permanent colored line + ✓ (`success`). Wrong → coral line flashes 380 ms (`wrong`).
4. All linked → `success` + `win` together → "You matched them all!" overlay (tap Next).

## 3. Content & progression
- Endless; theme = `THEMES[(level-1) % 6]`; 3 pairs (L1–4) → 4 pairs forever.
- 37 authored pairs; seeded per session.
- No distractors → last pair always free by elimination. +10 per link.

## 4. Feedback & juice (current)
Lines and ✓ appear instantly; no springs/shake/pop/confetti. Success + win overlap.

## 5. Engagement audit
| Gap | Impact |
|---|---|
| Prompt text only, no voice | Pre-readers don't know the rule of each theme |
| **No a11y labels on tiles**; color swatches unnamed | Color-blind kids / screen readers locked out of color→fruit |
| Flat difficulty, no distractors | Last pair automatic |
| 37 pairs, 6 themes | Repeats fast |
| Questionable pairs: 🐶→🦴 and 🐶→🏡; 👮→🚓 (vehicle not tool); 👨‍⚕️→💉; baby pairs are face vs body emoji; all-male workers | Teaching accuracy & inclusivity |
| No animation on match/completion | Flat |
| Tap-modal every round | Interruptive |

## 6. Improvement plan

### Quick wins (S)
1. **Speak the theme** ("Who eats what?") and **name each tile** on touch ("Monkey… banana!").
2. **Match celebration**: both tiles bounce, the line "zips" with sparkle, the animal reacts (eats the food, walks into its home).
3. Add a11y labels; label color swatches.
4. Content pass: fix ambiguous/incorrect pairs, mix genders/skin tones for workers, real baby animals (🐣→🐔, 🐛→🦋, 🐸 tadpole).
5. Separate the `success`/`win` sounds on the final link.

### Medium (M)
6. **Difficulty ladder**: 3 → 4 → 5 pairs, then **one distractor** tile, then two.
7. **More themes** (data-only, no code): shadows (🐘 → black silhouette), opposites (☀️↔🌙), weather→clothes, upper↔lower case letters, Arabic letter↔word, number↔numeral word, sound→animal (audio tile).
8. Sticker reward per completed theme set.
9. Use `useFlowRound` in the flow adapter (consistent 450 ms beat).

## 7. 3D verdict
**No.** Clarity of two rows and lines is the whole game. Invest in reactions/animations of the matched characters instead.

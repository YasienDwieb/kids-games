# Simple Pairs — Game Design Document

| | |
|---|---|
| **id** | `simple-pairs` |
| **Icon / accent** | 🃏 / `green` |
| **Ages** | 2–5 (toddler → preschool) |
| **Layout** | `bare` (own HUD) |
| **Win jingle** | `jingle.pizzi-10` |
| **Guided flow** | ❌ not eligible |
| **Persistence** | none |
| **Code** | `src/games/simple-pairs/` · ~1,160 LOC · RN `Animated` only |

## 1. Concept & learning goal
Classic memory "concentration": flip two cards, keep them if they match. Trains **visual memory, attention and turn-taking patience**. For ages 2–5 it is also a natural **vocabulary** moment (the cards are animals) — currently unused.

## 2. Core loop
1. **Pick difficulty** — 2×2 grid of big buttons: Easy 🐣 / Medium 🐥 / Hard 🦁 / Expert 🏆, each labelled "N pairs · N cards".
2. **Board** — face-down green cards with a white "?".
3. Tap card → `pop` + 3D rotateY flip (300 ms).
4. Second card → board locks →
   - **match**: cards stay up, green tint + border, `success`, ✨ burst (~500 ms)
   - **mismatch**: `wrong`, both flip back after 1 s
5. Every 2-card attempt = 1 move.
6. All matched → `win` jingle → **Win screen** (pulsing 🎉, "You did it!", 1–3 stars by moves, falling emoji confetti, *Play again* / *Pick a level*).

**Input:** tap only. **No fail state**, no timer, no lives.

## 3. Content & progression
| Difficulty | Pairs | Landscape cols |
|---|---|---|
| Easy | 2 | 4 |
| Medium | 3 | 6 |
| Hard | 4 | 4 |
| Expert | 9 | 6 |

- Art pool: 11 animal emoji (🐱🐶🐰🦊🐼🐸🦁🐮🐵🦄🐧), random subset + Fisher–Yates shuffle each round.
- Stars: 3★ if moves ≤ ⌈pairs×1.5⌉, 2★ if ≤ pairs×2+1, else 1★.
- No levels, unlocks or auto-advance — the child re-chooses difficulty every time.

## 4. Feedback & juice (current)
| Moment | Sound | Visual |
|---|---|---|
| Tap card | `pop` + light haptic | flip, press-scale 0.92 |
| Match | `success` | ✨ single glyph burst |
| Mismatch | `wrong` | flip back after 1 s |
| Win | `win` (jingle) | win card, staggered stars, emoji confetti |

No narration, mascot, or card entrance animation.

## 5. Screens & HUD
- HUD row (end edge): `🃏 found/total pairs` · `👆 moves` · ↻ restart.
- Back: board → difficulty picker; win screen → Home.

## 6. Audio-visual style
Noto emoji on rounded white/green cards, cream background, card size ≤ 100 dp.

## 7. Engagement audit — what's missing
| Gap | Why it matters for 2–5 |
|---|---|
| No onboarding; subtitle hidden in landscape | Toddlers don't know to flip two cards |
| Level picker is text ("3 pairs · 6 cards") | Pre-readers can't choose |
| Hard (4) → Expert (9) jump | Big frustration cliff |
| Nothing saved, no progression | No reason to come back |
| One theme (animals), 11 images | Gets repetitive fast |
| Names never spoken | Lost vocabulary learning |
| Mismatch is almost silent; match burst is one glyph | Weak cause→effect |
| Raw `fontWeight`/hex in `Card.tsx` | Design-system drift |

## 8. Improvement plan

### Quick wins (S — hours each)
1. **Speak the animal** on every flip and again on match ("Cat! … Cat!") via `useSpeech` — instant vocabulary game.
2. **Animated hand tutorial** on first play (taps two cards), stored with `createStore`.
3. **Picker becomes pictorial**: show 2 / 3 / 4 / 6 mini face-down cards instead of text.
4. **Juicier match**: cards jump + wiggle, burst of 8–10 particles, the animal emoji "hops" off the card and back.
5. **Card deal-in animation** (staggered fly-in from the deck).
6. Replace raw values with tokens (`FONTS`, `COLORS`).

### Medium (M — days)
7. **Smooth difficulty ladder**: 2 → 3 → 4 → 5 → 6 → 8 pairs as *levels* via `useLevels`, auto-advance after win, keep the picker as "free choice".
8. **Theme decks**: animals, fruit, vehicles, shapes, letters, numbers (reuse emoji/OpenMoji already bundled) — unlocked one per few wins.
9. **Sticker reward**: each win awards the matched animal as a sticker into the app-wide sticker book (see [README → Platform](./README.md#4-platform-level-engagement-systems)).
10. **Mismatch "peek" helper** for ages 2–3: after 3 failed tries, matching card glows briefly.
11. Join **guided flow** (one board of 2–3 pairs = one unit).

### Big bets (L)
12. **Sound pairs mode**: cards play animal sounds (assets already exist from Animal Safari) — match by ear.
13. **Picture ↔ word pairs** for 5-year-olds (🐱 ↔ "CAT" / "قطة").

## 9. 3D verdict
**Not worth full 3D.** The only 3D moment is the card flip, which already exists (rotateY). Upgrade to a *2.5D* look instead: perspective on the flip, card thickness/shadow, slight tilt on press (Reanimated). Cost ≈ 0; impact equal to real 3D for this game.

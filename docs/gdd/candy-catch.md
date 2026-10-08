# Candy Catch — Game Design Document

| | |
|---|---|
| **id** | `candy-catch` |
| **Icon / accent** | 🍭 / `pink` |
| **Ages** | 3–7 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.sax-02` |
| **Guided flow** | ❌ |
| **Persistence** | `useLevels` level only (score always 0) |
| **Code** | `src/games/candy-catch/` · ~1,000 LOC · **reference user of SDK `useGameLoop`** (reanimated UI-thread loop, pooled views), gesture-handler |

## 1. Concept & learning goal
Move a picnic basket to catch falling treats and avoid yucky ones. **Hand–eye coordination, quick categorisation (good vs. bad)**.

## 2. Core loop
1. Start card: "Catch the treats! Good: 🍬🍭🍪 Yucky: 🌶️💣 — Tap to start".
2. Items fall (wobbling tiles); child drags (or taps) anywhere → basket eases to the finger and leans.
3. Good item → `pop` + "+N" float; ⭐ gold → `powerup` +20.
4. Hazard → lose a ❤️ (`hit` for 💣, `wrong` for 🌶️).
5. Reach target points → "Yummy!" → next level. 0 hearts → "Oops!" → retry.

## 3. Content & progression
- Endless, unseeded.
- Target 30 + 15/level; spawn 1050 → 420 ms (floor ~L13); fall speed 140 + 18/level **uncapped**; hazard 6% → 16%; gold 7%.
- 14 good emoji (5–12 pts), ⭐ 20 pts; 3 hearts per level, reset each level; missed treats cost nothing.
- No stars, no timer, no age-band adaptation.

## 4. Feedback & juice (current)
Score pops, wobble, basket lean, overlay cards. No confetti/particles; lose has no own sound; one haptic per catch.

## 5. Screens & HUD
`Level N` · ❤️❤️🤍 · score/target. No pause, no progress bar.

## 6. Audio-visual style
Emoji on glossy tiles, drawn wicker basket (hardcoded wood hex), flat canvas with static dots (positioned for portrait → clustered left in landscape).

## 7. Engagement audit
| Gap | Impact |
|---|---|
| Uncapped speed, no age adaptation | Eventually impossible for 3–7 |
| No stars, score, collection, unlocks | No reason to return |
| Same visuals every level | Repetitive |
| Text legend ("Good:/Yucky:") | Pre-readers can't read rules |
| 💣 bomb for 3-year-olds | Tone |
| Zero a11y props; unused a11y strings | — |
| No tests | Risk when changing |
| Hardcoded hex, duplicated `MAX_LIVES` | Design-system drift |

## 8. Improvement plan

### Quick wins (S)
1. **Cap speed by age band** (`useSettings().ageBand`) and cap overall at a playable max.
2. Replace 💣 with 🥦/🧦/🪨 "yucky" (funny, not violent); **spoken legend** ("Catch the sweets! Not the chilli!").
3. **Progress bar** filling toward target instead of a number.
4. Catch juice: sparkle burst in basket, basket "chomp" squash; combo counter for streaks (×2 after 5 in a row).
5. Fix dots layout for landscape; tokens instead of hex.

### Medium (M)
6. **Stars per level** (hearts left → ★) and visible total; sticker reward per world.
7. **Worlds every 5 levels**: candy shop 🍬, fruit orchard 🍎 (healthy twist), ocean (catch 🐟 dodge 🦀), space (catch ⭐ dodge ☄️) — new background, new items, new basket skin.
8. **Learning variants**: "catch only red", "catch only the number 3", "catch fruits not vegetables" — classification practice with TTS prompts.
9. Power-ups: 🧲 magnet, big basket, slow-mo ⏳.
10. Join **guided flow** (a 20-second catch round as a "brain break" between quiz units).

### Big bets (L)
11. **Tilt control** option (`useTilt`) for 6–7.

## 9. 3D verdict
**No.** The fun is readability and speed of tiny falling items; 3D hurts both. Spend the effort on worlds, particles and a richer basket character in 2D (already on the reanimated loop, so particles are cheap).

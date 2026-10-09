# Balloon Archer — Game Design Document

| | |
|---|---|
| **id** | `balloon-archer` |
| **Icon / accent** | 🏹 / `green` |
| **Ages** | 5–8 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.steel-10` |
| **Guided flow** | ❌ |
| **Persistence** | `useLevels` (level + stars, stars never shown) |
| **Code** | `src/games/balloon-archer/` · ~930 LOC · JS-thread `requestAnimationFrame`, full re-render per frame, PanResponder |

## 1. Concept & learning goal
Shoot arrows at rising balloons. Trains **timing, prediction (leading a moving target), hand–eye coordination**.

## 2. Core loop
1. Touch anywhere → bow jumps to finger's height (scales 1.12×, dashed lane guide).
2. Slide up/down to aim. **Release = fire.** Arrow flies straight right at 1400 px/s (no gravity/angle/power).
3. One arrow in flight at a time; extra taps ignored.
4. Balloon hit → 💥 pop (`balloon` sound).
5. Pop the **quota** before running out of arrows → win card; arrows run out → "Out of arrows!".

## 3. Content & progression
8 levels, `t` = 0→1 across them:

| Knob | L1 → L8 |
|---|---|
| Quota | 4 → 10 |
| Spare arrows | +4 → +2 |
| Spawn interval | 1500 → 750 ms |
| Max on screen | 3 → 6 |
| Rise speed | 45 → 105 px/s |
| Sway | 8 → 28 |
| Radius | 46–60 → 34–46 |

Stars: ≤1 wasted arrow = 3★, ≤3 = 2★, else 1★. After L8 "Play again" resets **level and score to 0**.

## 4. Feedback & juice (current)
| Moment | Sound | Visual |
|---|---|---|
| **Shoot** | **none** (`onShoot` exists but unwired) | arrow appears |
| **Miss** | **none** | arrow leaves screen |
| Pop | `balloon` | 💥 scale 1.5 + fade |
| Clear | `win` | card springs, 🎯/🏆 + stars |
| Fail | `wrong` | "Out of arrows!" card |

## 5. Screens & HUD
`Level N` · 🎈 popped/quota · 🏹 arrows left. No pause.

## 6. Audio-visual style
Drawn balloons (shine, knot, string), drawn arrow, emoji bow, flat sky + green ground strip. No clouds, scenery or parallax.

## 7. Engagement audit
| Gap | Impact |
|---|---|
| No tutorial for hold–slide–release | 5-year-olds tap and nothing happens |
| Silent shoot & miss | Weakest possible cause→effect on the core action |
| Single balloon type | Monotone after 2 levels |
| Only 8 levels, then full reset | Short life, progress erased |
| Out-of-arrows fail ends abruptly | Frustration, no "almost!" encouragement |
| Stars saved but never shown | No meta |
| Rapid taps dropped | Feels unresponsive |
| No a11y labels | — |
| `setFrame` re-render each frame | Won't scale to more balloons/effects |

## 8. Improvement plan

### Quick wins (S)
1. **Wire `onShoot`** → "twang" sound (new `sfx.shoot` or `sfx.transition`), bow recoil animation.
2. **Miss feedback**: arrow thunks into a hay bale/cloud at the edge with `hit`.
3. **Ghost-hand tutorial** on L1: hold → slide → release.
4. **Pop juice**: confetti of the balloon's color, ribbon flutter, combo text ("Double pop!") when one arrow pierces two balloons (allow pierce).
5. On fail: "So close! 7/8" with a free "+3 arrows" retry once.

### Medium (M)
6. **Special balloons**: ⭐ golden (bonus), 🎁 gift (power-up: triple arrow, slow-mo, big arrow), 🐦 bird balloon don't-hit, 🌈 rainbow (pops all of one color).
7. **Learning modes** (fits the educational catalog): "Pop the number 5", "Pop the letter B", "Pop only red" — reuse listen-find TTS.
8. **Endless after L8** with generator; keep a visible star total.
9. **Scenery per world**: fair 🎪, beach, night sky with lanterns; parallax clouds.
10. Migrate loop to SDK `useGameLoop` (reanimated) like Candy Catch — required before adding many particles.

### Big bets (L)
11. **Real bow physics**: pull-back distance = power, arrow arc with gravity, aim angle — appeals to 7–8 and is a big "feel" upgrade.

## 9. 3D verdict
**Good 2.5D candidate, low priority for full 3D.** A 3D archery range (balloons at depth, camera behind the bow) is a strong visual hook, but the same delight can be had in 2D with parallax depth layers + scale-by-distance balloons. Recommend 2.5D first. See [3D analysis](./3d-analysis.md).

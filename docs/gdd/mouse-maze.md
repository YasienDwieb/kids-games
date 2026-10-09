# Mouse Maze — Game Design Document

| | |
|---|---|
| **id** | `mouse-maze` |
| **Icon / accent** | 🐭 / `orange` |
| **Ages** | 3–8 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.pizzi-15` |
| **Guided flow** | ❌ not eligible |
| **Persistence** | `useLevels` `{level, score}` + ResumePrompt |
| **Code** | `src/games/mouse-maze/` · ~930 LOC · PanResponder, randomized-DFS maze + BFS solver |

## 1. Concept & learning goal
Guide the mouse 🐭 through a maze to the cheese 🧀, collecting ⭐ on the way. Teaches **spatial reasoning, planning, fine-motor tracing**.

## 2. Core loop
1. Maze appears; mouse top-left, cheese bottom-right.
2. Child **drags a finger** along corridors — mouse steps one cell at a time if the next cell is adjacent and not walled (`pop` + haptic per step, 90 ms move).
3. Orange breadcrumbs mark visited cells; ⭐ collected on contact (`success`).
4. 💡 hint shows the shortest path for 1.6 s (`powerup`, unlimited).
5. Reach cheese → `win` → overlay (stars collected, "Next maze →", `transition`).

> ⚠️ Description says "Swipe", but input is continuous **tracing**. An unused `slide()` (swipe-to-junction) exists in `utils/maze.ts`.

## 3. Content & progression
- Endless `levelsFromGenerator`; size = 5×5 at level 1, +1 per level, **capped at 9×9 from level 5**.
- Perfect maze (one route), unseeded random.
- 3 stars always placed **on** the solution path.
- No fail, timer, or move limit. Start/goal always the same corners.

## 4. Feedback & juice (current)
| Moment | Sound | Visual |
|---|---|---|
| Step | `pop` + haptic (every cell!) | mouse slides |
| Wall / blocked | **nothing** | nothing |
| Star | `success` | star disappears |
| Hint | `powerup` | green dots 1.6 s |
| Win | `win` | card springs; no confetti |

## 5. Screens & HUD
Side panel: `Level N`, `⭐ x/3`, 💡 hint. Back button. No restart. Total score is saved but **never shown**.

## 6. Audio-visual style
Ink-border walls on cream; emoji mouse/cheese/stars; translucent dots. No theme, no background art.

## 7. Engagement audit
| Gap | Impact |
|---|---|
| No tutorial; "swipe" text wrong | Kids swipe, nothing happens |
| Walls are silent | Feels broken to a 3-year-old |
| Plateau at level 5 | Endless identical mazes |
| Stars always on the route | Collecting is automatic → no choice, no exploration |
| Haptic + pop on every step | Fatigue / noise |
| 9×9 cells ≈ 35–40 dp | Below touch-target guidance for 3-year-olds |
| Weak win | No mouse-eats-cheese moment |
| Score invisible | Progress feels meaningless |

## 8. Improvement plan

### Quick wins (S)
1. **Wall bump**: `sfx.hit` + mouse squash + small shake when blocked.
2. **Demo hand** tracing the first 3 cells on level 1; fix description text to "Draw a path…".
3. Step sound → soft tick every 2nd step; haptic only on stars/win.
4. **Win animation**: mouse runs to cheese, nibbles (scale pulses, crumbs), confetti.
5. Show total ⭐ on a HUD pill / the win card.

### Medium (M)
6. **Age-aware size**: toddler band stays 4×4–6×6; kids band goes up to 12×12 with pan/zoom or bigger screens.
7. **Stars off the route** (dead-ends) → real choice: shortest path vs. collect everything.
8. **Worlds** every 5 levels: garden 🌷, kitchen 🍳, space 🚀 — new background, new hero (bunny→carrot, rocket→planet), new obstacle (doors + keys 🔑, sleeping cat 🐱 to sneak past, one-way arrows).
9. **Hint costs a star** for 5+ (keeps it free for toddlers).
10. Join **guided flow** with small 5×5 mazes.

### Big bets (L)
11. **Tilt mode** (`useTilt` already in SDK): tilt the phone to roll the mouse — ball-maze feel (ages 6+).
12. **Daily maze** with a shared seed.

## 9. 3D verdict
**Candidate for "2.5D", not full 3D.** A tilted isometric maze with raised walls and a bouncing mouse would look great, and the tilt mode (#11) would feel physical. Recommended path: isometric 2D rendering with Skia/Reanimated (weeks, not months). True 3D (rolling-ball physics with `react-three-fiber`) only if tilt mode proves popular. See [3D analysis](./3d-analysis.md).

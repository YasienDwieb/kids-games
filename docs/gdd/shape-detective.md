# Shape Detective — Game Design Document

| | |
|---|---|
| **id** | `shape-detective` |
| **Icon / accent** | 🔺 / `purple` |
| **Ages** | 3–10 |
| **Layout** | `shell` |
| **Win jingle** | `jingle.sax-15` |
| **Guided flow** | ✅ 12 units (ignores flow seed) |
| **Persistence** | `useLevels`; score wiped after L12 |
| **Code** | `src/games/shape-detective/` · ~2,700 LOC + 47 tests · RN-View-drawn shapes, gesture-handler sort |

## 1. Concept & learning goal
Logic puzzles with shapes: **patterns, odd-one-out, sorting by attribute** (kind, color, size). Early-math reasoning and classification.

## 2. Core loop — three puzzle types
| Type | Input | What happens |
|---|---|---|
| **Pattern** | tap | "What comes next?" row + "?" slot, choose from 3–5 |
| **Odd one out** | tap | Grid of identical shapes + one different |
| **Sort** | drag | Two text-labelled bins ("circle"/"square"); drag shapes in; wrong bin snaps back |

Correct → `success`, pop → "Great job!" overlay (tap). Wrong → `wrong`, shake, answer revealed, free retry.

## 3. Content & progression
- **Fixed 12 levels**, seed `level*7919` with **no session salt** → identical puzzles every play and every Journey.
- Attributes: kind (L1–4) → +color (L5–8) → +size (L9–12); options 3 → 5.
- **Pattern answer is always the first shape in the row** (`cycle[sequence.length % cycleLen]` with sequence = 2 full cycles) — trivially learnable.
- Sort always sorts by **kind** (color/size bins never generated).
- After L12: "You did it!" → `startOver()` → **score 0, same puzzles**.

## 4. Feedback & juice (current)
Shake/pop on pattern & odd; lift spring and flash on sort. No speech, mascot, confetti. ⭐ "star" shape renders as an 8-point burst.

## 5. Engagement audit
| Gap | Impact |
|---|---|
| Text-only instructions & **text-only sort bins** | Non-readers can't sort |
| Zero replay variety; pattern answer always = first shape | Memorised in one play |
| 12 levels then wipe | Short, punishing end |
| Too easy for 7–10 (max 3-cycle, 5 options) | Upper half of age range underserved |
| No drag tutorial; a tap plays `wrong` | Confusing |
| Star shape unrecognisable | Wrong learning |

## 6. Improvement plan

### Quick wins (S)
1. **Speak instructions**; sort bins show a **picture of the shape** (and later color swatch / size icon).
2. Add **session seed** to levels + flow; vary sequence length so the answer isn't always the first shape (AB-AB-A_, ABB-ABB-_, start mid-cycle).
3. Keep score/trophy after L12; continue into endless generated levels.
4. Tap-on-tray-shape → wiggle + "drag me!" hint instead of `wrong`.
5. Proper star (and heart) via SVG/Skia path.

### Medium (M)
6. **Detective framing**: a cute detective mascot (🕵️ owl/cat) with a magnifier presents each "case"; solved cases fill a case-file book.
7. **Harder tiers for 7–10**: ABC-cycles with two changing attributes, growing patterns (1-2-3 dots), rotation patterns, 3-bin sorts, Venn-style sort (red AND circle), "what's missing in the grid" (3×3 matrix).
8. Sort by color and size (code for color labels already exists, unreachable).
9. Adaptive difficulty from first-try accuracy.

### Big bets (L)
10. **Tangram / shape-builder** mode: drag shapes to fill a silhouette (house, rocket) — highly engaging, still shape-learning.

## 7. 3D verdict
**Small, targeted 3D only for a future "3D shapes" unit** (cube, sphere, cone, cylinder — spin to inspect). That is genuine curriculum (ages 5–8) and can be one 3D view inside a 2D game. Don't convert the existing puzzles.

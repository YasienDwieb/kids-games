# Color Mixer — Game Design Document

| | |
|---|---|
| **id** | `color-mixer` |
| **Icon / accent** | 🎨 / `blue` |
| **Ages** | 4–8 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.steel-02` |
| **Guided flow** | ❌ not eligible |
| **Persistence** | saved colors, discoveries, completed challenges |
| **Code** | `src/games/color-mixer/` · ~3,900 LOC · PanResponder + RN `Animated` · real pigment model (CIEDE2000) |

## 1. Concept & learning goal
A paint pot sandbox: drag paint blobs into a pot and watch colors mix like real paint (red + yellow = orange, not RGB light). Teaches **color theory, cause → effect, experimentation**. See `almanac/decisions/color-mixer-pigment-mixing.md` for why the mixing is pigment-based.

## 2. Core loop
**Free Play**
1. Drag one of 5 pigments (red, yellow, blue, white, black) from the palette into the pot.
2. Pot shows the live blend (blob springs in).
3. First time a blend is within ΔE<5 of a *famous color* (orange, green, purple, brown, pink, light blue) → "New color!" discovery modal.
4. Optionally **Save** the color (named via keyboard), reuse it from the saved strip.
5. Pot caps at 16 drops (shake + `wrong` + "Pot's full!").

**Challenges**
1. Pick one of 6 targets (Beginner/Intermediate/Advanced).
2. Mix toward the target; a closeness meter shows 0–3★ live ("Keep mixing!" → "Perfect!").
3. At ≥2★ a **Done!** button appears → tap → success modal → back to picker.

**Input:** drag-and-drop, taps, text input. No fail state, no timer.

## 3. Content & progression
- 5 pigments, 6 famous colors, **6 challenges = the same 6 colors** (static list, no generator).
- Stars: ΔE<3 = 3★, <6 = 2★, <12 = 1★; complete at ≥2★.
- No ordering/locks; after 6 → "🏆 All challenges complete!" and nothing more.

## 4. Feedback & juice (current)
| Moment | Sound | Visual |
|---|---|---|
| **Drop pigment (core action)** | **none** | blob spring |
| Discover famous color | **none** | modal + sparkles |
| Pot full | `wrong` | shake, palette dims |
| Add saved color | `pop` | — |
| Challenge done | `win` | modal, stars, sparkles |

## 5. Screens & HUD
Left panel: title, 📚 My Colors, mode chips, challenge strip, pot, action row (Done / ↩️ Undo / 🗑️ Clear / 💾 Save). Right panel: palette + saved strip. Drop counter appears from 12/16. Collection modal: "Famous colors" (x/6) + "My creations" (delete has **no confirm**).

## 6. Audio-visual style
Drawn glossy blobs, cream canvas, white palette panel, sparkle particles. No characters.

## 7. Engagement audit — what's missing
| Gap | Evidence / impact |
|---|---|
| **Core action is silent** | Dropping paint has no sound/haptic — the most-repeated action feels dead |
| Discovery is silent | The free-play reward moment has no audio |
| Reading-heavy for 4–8 | Hints ("Mix fire with water"), meter labels, keyboard naming |
| Thin content | 6 challenges, same 6 colors as discoveries, nothing after |
| No onboarding of drag | Only "Drop colors here!" text |
| No auto-advance | Success → back to picker |
| Accidental-loss risks | Delete without confirm; dropping result blob on palette adds pigment |
| Small text in landscape strip | 11–13 pt labels |

## 8. Improvement plan

### Quick wins (S)
1. **"Bloop" + swirl on every drop** (`sfx.balloon` or new `sfx.splash`) and a short ripple animation in the pot.
2. **Discovery fanfare**: `success` + spoken color name ("Orange!") + confetti in that color.
3. **Speak everything**: target name, hints read aloud, meter state as sound pitch (rising tone as you get closer — "hot/cold" by ear).
4. **Visual hints instead of text**: hint shows the two pigment blobs with a "+" (🔴 + 🟡).
5. Confirm before delete (or undo toast); remove the result-blob-to-palette mechanic.
6. Saved-color naming → pick an emoji/sticker name instead of keyboard (keep keyboard for 7+).

### Medium (M)
7. **Generated challenges**: random targets from the pigment space (tints/shades, 3-pigment mixes), graded by ΔE — infinite content.
8. **Auto-advance** after success, with a level ladder via `useLevels`.
9. **Paint something**: completed colors fill a coloring-page picture (a fish, a house) — a visible "why" for mixing.
10. **"Recipe cards"** collectible: each discovered color becomes a card showing its recipe (🔴🔴🟡) — collect them all (≥20 named colors: peach, lime, navy, teal, mint…).
11. Join **guided flow**: one challenge = one unit.

### Big bets (L)
12. **Paint mode with Skia**: finger-paint on a canvas using mixed colors (needs `@shopify/react-native-skia`).
13. **Customer orders**: a cute character ("I want a purple hat!") — color-matching as a shop game.

## 9. 3D verdict
**No.** The value is color, not depth. Liquid/paint swirl is better done in **2D with Skia shaders** (fluid swirl in the pot) — cheaper, prettier, smaller. A 3D pot would cost weeks and add nothing pedagogically.

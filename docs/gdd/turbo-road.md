# Turbo Road — Game Design Document

| | |
|---|---|
| **id** | `turbo-road` |
| **Icon / accent** | 🏎️ / `coral` |
| **Ages** | 4–12 |
| **Layout** | `bare` |
| **Win jingle** | `jingle.sax-10` |
| **Guided flow** | ❌ |
| **Persistence** | level + stars, garage (coins, cars, trim), missions, steering prefs |
| **Code** | `src/games/turbo-road/` · ~5,400 LOC (largest game) · pure engine module + JS rAF loop with `Animated.setValue`, tilt via `useTilt`, engine-hum loop |

## 1. Concept & learning goal
A sunny top-down road-trip race: steer across 3 lanes, dodge obstacles, grab coins and power-ups, beat two rivals. **Reflexes, anticipation, and an economy/meta loop** (save coins → unlock cars). The most "real game" in the catalog — the benchmark for the others.

## 2. Core loop
**Start screen** → **Race** → **Win** → back to Start (or **Garage**).

- **Start:** road-trip map (5 nodes), 3 missions with Claim, wallet 🪙, total ⭐, selected car on pedestal, steering mode chip (🖐️ finger / 📱 tilt), Race! / Garage.
- **Race:** 3-2-1-GO → steer by finger-follow or tilt (damped spring, car banks) → dodge 🚧🛢️ (and 🚚 oncoming trucks from L6) → collect 🪙, ⚡ boost, 🛡️ shield (L3+), 🧲 magnet (L4+) → checkered finish vs. 🚙🚕 rubber-banded rivals.
- **Win:** place (1st/2nd/3rd → 3/2/1★), confetti, "+N coins", cup banner every 4 levels.

No fail state — races always finish. Hit = slow to 0.45× for 1.4 s + shake, with grace period.

## 3. Content & progression
- Endless, **seeded per level** (same level = same track). Theme rotates: meadow → beach → desert → snow.
- Speed 260 + 14/level (cap 520), length 9000 + 600/level (cap 16000, ~30–45 s), 2-lane-block chance and gaps tighten, trucks from L6/L10.
- **Age-band speed factor** 0.8 / 0.85 / 1.0 / 1.1 — the only game that adapts to age.
- Economy: 8 cars (0 → 1500 coins), 4 free trims, 3 rolling missions (5 types).

## 4. Feedback & juice (current)
Rich: engine hum (rate follows boost/slow), event sounds (`transition` GO, `success` coin, `hit`, `powerup`, `pop` shield block, `win`), lane-change tick, banking, hit shake, finish emoji burst, trophy + stars + confetti overlay. Countdown beats 3-2-1 are **silent**.

## 5. Screens & HUD
Race HUD: 🏁 Level · place badge (+🛡️/🧲 chips) · 🪙 · ⏸. Vertical progress rail. Pause overlay; auto-pause on background. Garage: hero car, trims, trophy shelf, car grid with Speed/Grip bars, prices, unlock.

## 6. Audio-visual style
Emoji cars/props on drawn asphalt; per-theme roadside emoji; sky strip with ☀️/☁️. "Pseudo-3D" only via scroll; decor and road scroll at same rate (no parallax).

## 7. Engagement audit
| Gap | Evidence / impact |
|---|---|
| 🐞 **Garage-from-win skips progression** | `handleGarage` (`index.tsx:206`) never calls `advance(result.stars)` → level repeats, stars lost |
| 🐞 **Grip stat does nothing** | `createWorld(paced)` called without `{grip}` (`useRaceGame.ts:140,155`) — garage shows a stat that has no effect |
| Trim color invisible in race | Cosmetic purchase with no payoff |
| Place barely matters; cup awarded regardless | Low stakes, unearned trophies (derived from level, wiped by Start over) |
| Exit mid-race loses coins, no confirm | Frustration |
| Reading-heavy menus/missions for 4–6 | Non-readers can't use missions/garage |
| Silent countdown | Missed anticipation beat |
| 1500-coin top car at ~20–30 coins/race | Long grind (estimate) |

## 8. Improvement plan

### Quick wins (S)
1. **Fix the two bugs** (advance on Garage; pass `{grip: car.grip}`).
2. Countdown **beeps** (3 low, GO high) + "GO!" voice.
3. Confirm "Exit race?" or bank coins on exit.
4. Missions as **icons + spoken text** (🪙×30, 🏁×3, 💥🚫).
5. Tint the in-race car with the selected trim (colored underglow / shadow plate).

### Medium (M)
6. **Real cup races**: every 4th level is a cup race; trophy only for 1st–3rd, stored in `createStore`.
7. **Parallax**: roadside decor at 1.15× road speed + far layer at 0.5× → instant depth.
8. **New track features**: ramps (jump + 🌟 mid-air coins), puddles (slide), tunnels (dark + headlights), animal crossings (🦆 family — wait!), rain/snow weather.
9. **Driver character / sticker on car** (ties into app-wide avatar).
10. Economy tuning: double-coin "daily first race", cheaper mid-tier cars.

### Big bets (L)
11. **Pseudo-3D (OutRun-style) perspective road** behind the car — see 3D verdict.
12. **Learning hooks**: "drive through the gate with the number 4 / the color red / letter M" lanes — makes it educational for 4–6.

## 9. 3D verdict
**The #1 candidate for 3D in the catalog.** Racing is the genre where kids most expect 3D, and the engine is already a pure, testable module separate from rendering. Two paths:
- **Pseudo-3D (recommended first):** OutRun/Mode-7 style perspective road drawn with Skia, sprites scaled by depth. ~2–3 weeks, keeps emoji art, keeps the engine.
- **True 3D:** react-three-fiber + expo-gl (or Filament), low-poly car/road models, chase camera. ~6–10 weeks incl. art pipeline, +10–25 MB app size, native build required.

See [3D analysis](./3d-analysis.md).

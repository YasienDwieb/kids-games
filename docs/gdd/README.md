# Kids Zone — Game Design Documents

Status snapshot: 2026-10-08 · app v1.2.x · 12 games · English + Arabic (RTL) · landscape-only.

This folder holds one GDD per game plus the cross-game engagement plan and the 3D analysis. Each game GDD follows the same structure: **snapshot → concept → core loop → content & progression → feedback → screens → engagement audit → improvement plan (S/M/L) → 3D verdict.**

## 1. Index

| Game | Ages | Skill | Flow | GDD |
|---|---|---|---|---|
| 🐾 Animal Safari | 3–7 | vocabulary, listening | ✅ | [animal-safari.md](./animal-safari.md) |
| 🃏 Simple Pairs | 2–5 | memory | ✅ | [simple-pairs.md](./simple-pairs.md) |
| 🧮 Count & Pop | 3–7 | counting, early math | ✅ | [count-and-pop.md](./count-and-pop.md) |
| 🔢 Numbers Land | 3–7 | number recognition | ✅ | [numbers-land.md](./numbers-land.md) |
| 🔤 Letter Land | 3–7 | letter recognition | ✅ | [letter-land.md](./letter-land.md) |
| 🔗 Match Up | 3–7 | associations | ✅ | [match-up.md](./match-up.md) |
| 🔺 Shape Detective | 3–10 | patterns, logic | ✅ | [shape-detective.md](./shape-detective.md) |
| 🍭 Candy Catch | 3–7 | coordination | ✅ | [candy-catch.md](./candy-catch.md) |
| 🐭 Mouse Maze | 3–8 | spatial planning | ✅ | [mouse-maze.md](./mouse-maze.md) |
| 🎨 Color Mixer | 4–8 | color theory, creativity | ✅ | [color-mixer.md](./color-mixer.md) |
| 🏹 Balloon Archer | 5–8 | timing, aiming | ❌ | [balloon-archer.md](./balloon-archer.md) |
| 🏎️ Turbo Road | 4–12 | reflexes, meta-progression | ❌ | [turbo-road.md](./turbo-road.md) |

Plus: **[3D analysis](./3d-analysis.md)** — should we convert to 3D?

## 2. Product vision & pillars
A safe, ad-free, bilingual play-and-learn app where a 2–10-year-old can pick up any game **without reading**, feel instantly rewarded for every action, and want to come back tomorrow.

**Design pillars (proposed)**
1. **No reading required** — every instruction is spoken; text is secondary.
2. **Every touch answers back** — sound + motion within 100 ms on every core action.
3. **Teach, then test** — show/say the concept before quizzing it; scaffold after mistakes.
4. **Always progressing** — something is earned and kept every session.
5. **One friendly world** — a mascot and shared rewards connect all games.
6. **Calm & safe** — no ads, no punishing failure, parent-gated settings, short sessions.

## 3. Cross-game findings (current state)

### What's strong
- Clean SDK boundary, shared design system, full EN/AR + RTL, accessible tokens (WCAG AA tests).
- Guided **Journey** (flow) mode across 6 educational games.
- Turbo Road shows the team can build a deep game (economy, garage, missions, tilt, age-adaptive speed).
- Real pigment color model, seeded generators, solid test coverage in most games.

### What holds engagement back (all games)
| # | Gap | Where |
|---|---|---|
| 1 | **Reading required**; spoken prompts only in the 3 listen-find games, and those use robotic device TTS | Count & Pop, Shape Detective, Match Up, Color Mixer, Candy Catch, Turbo Road menus, Simple Pairs picker |
| 2 | **No onboarding / demo hand** | all 12 |
| 3 | **No app-wide rewards** (stars, stickers, collection, streak, avatar); scores never aggregated, some never shown | all except Turbo Road (garage) & Color Mixer (collection) |
| 4 | **No characters / mascot** — nothing reacts emotionally to the child | all 12 |
| 5 | **Silent core actions** (paint drop, arrow shot, wall bump, discovery) | Color Mixer, Balloon Archer, Mouse Maze |
| 6 | **Wrong answers reveal the answer with full credit**; no adaptive difficulty (only Turbo Road adapts to age band) | quiz games |
| 7 | **Thin / fixed content**: Shape Detective identical every play, Animal Safari fixed order, Color Mixer 6 challenges, Archer 8 levels | — |
| 8 | **Same tap-to-continue modal after every short round** | Count & Pop, Shape Detective, Match Up, listen-find |
| 9 | **Difficulty plateaus or runs away** (Maze caps at L5; Candy Catch speed uncapped) | — |
| 10 | **No background music** (explicit rule in `docs/FOUR_NEW_GAMES_DESIGN.md`) | app-wide |

### Bugs found while writing these GDDs
| Game | Bug | Location |
|---|---|---|
| Turbo Road | "Garage" on win overlay skips `advance()` → level repeats, stars lost | `src/games/turbo-road/index.tsx:206` |
| Turbo Road | Car **Grip** stat never applied (`createWorld` called without `{grip}`) | `src/games/turbo-road/hooks/useRaceGame.ts:140,155` |
| Letter Land | Flow `count` = 26 even in Arabic (28 letters) | `src/games/letter-land/flow.tsx:74` |
| Shape Detective | Pattern answer is always the first shape in the row | `src/games/shape-detective/utils/generate.ts:147` |
| Balloon Archer | `onShoot` never wired → silent shot | `src/games/balloon-archer/index.tsx` |
| Match Up | No a11y labels on tiles; hardcoded `#F1ECFB` | `components/Tile.tsx`, `config.ts` |
| Candy Catch | Zero a11y props; background dots laid out for portrait | `index.tsx` |

## 4. Platform-level engagement systems
These are built **once in `src/sdk/`** and every game benefits. They matter more than any single game feature.

| # | System | What | Effort |
|---|---|---|---|
| P1 | **Voice layer** | `useVoice().say(key)` — plays recorded EN/AR clips, falls back to `useSpeech` TTS. Every game prompt, praise ("Great job!", "Try again!"), and number/letter/animal name. | M (code) + recording budget |
| P2 | **Mascot** | One character (e.g. a friendly owl/fox) as a Rive animation with states: idle, talk, cheer, think, sad-but-encouraging. Appears in Home, Journey, celebrations, tutorials. | M–L (art) |
| P3 | **Sticker book & stars** | App-wide `rewardsStore`: every level/round earns stars; milestones award stickers (per-game themed). Home shows a 📒 sticker book. | M |
| P4 | **Tutorial kit** | `<DemoHand path=… />` + `useFirstRun(gameId)` — ghost hand demo on first play of each game, re-triggered after idle 8 s. | S–M |
| P5 | **Celebration kit** | `celebrate('small' \| 'big')` — confetti/particle burst + mascot cheer + varied praise lines; replaces repetitive modals for small wins. | S–M |
| P6 | **Hint/scaffold policy** | Shared rule: miss 1 → re-prompt, miss 2 → highlight, miss 3 → reveal; stars only for first try. | S |
| P7 | **Adaptive difficulty** | `useAdaptive(gameId)` — rolling first-try accuracy → step level knob up/down; seeded by `settings.ageBand`. | M |
| P8 | **Daily goal / streak** (gentle) | "Today: 3 games ⭐⭐⭐" on Home; no punishment for missed days. | S |
| P9 | **Music (optional)** | Revisit the no-music rule: soft ambient loop per world, parent toggle, ducked under voice. | S (if assets) |
| P10 | **Parent corner** | Behind ParentGate: time played, skills progress per game, session limit. Builds trust (store ratings). | M |
| P11 | **Avatar** | Child picks an animal avatar + color; shown on Home, Turbo Road driver, Journey. | M |

## 5. Prioritised roadmap

### Phase 0 — Fix & polish (1 week)
- Fix all bugs in §3.
- Silent core actions → sounds (Color Mixer drop/discovery, Archer shot/miss, Maze wall bump).
- Speech for every text prompt using the existing `useSpeech` (stopgap before recorded voice).
- Session seeds for Shape Detective & Animal Safari; fix pattern-answer generator.

### Phase 1 — Feel alive (2–3 weeks)
- P4 Tutorial kit, P5 Celebration kit, P6 Hint policy across all games.
- Per-game quick wins from each GDD (§8 "Quick wins").

### Phase 2 — Reasons to return (3–5 weeks)
- P3 Sticker book & stars, P8 daily goal, P2 mascot (first version), P1 recorded voice.
- Worlds/themes for Mouse Maze, Candy Catch, Balloon Archer; habitats for Animal Safari.
- Flow adapters for Simple Pairs, Mouse Maze (small), Color Mixer, Candy Catch ("brain break").

### Phase 3 — Depth (ongoing)
- P7 adaptive difficulty, P10 parent corner, P11 avatar.
- Medium/Big items from each GDD: Skia tracing (Letter Land), phonics, tangram, generated color challenges, archer physics.

### Phase 4 — Wow factor (optional)
- Turbo Road pseudo-3D → possibly true 3D pilot. See [3d-analysis.md](./3d-analysis.md).

## 6. New dependencies these plans imply
| Dependency | For | Native build? |
|---|---|---|
| `@shopify/react-native-skia` | tracing, shapes (star/heart), fluid paint, pseudo-3D road, particles | yes |
| `rive-react-native` (or `lottie-react-native`) | mascot & character animation | yes |
| `react-native-svg` (alternative to Skia for simple shapes) | shapes, icons | yes |
| `@react-three/fiber` + `expo-gl` + `three` | 3D pilot only | yes |
| Recorded audio (EN/AR voice actor) | voice layer | no (assets) |

## 7. Delegation notes
Each "Quick win" and Phase 0 item is scoped to one game folder or one SDK module and can be handed to another agent (e.g. Codex) with: the GDD section, files to touch, acceptance criteria, and the repo rules (`@/sdk` only, `t()` for every string in EN+AR, RTL `start/end`, design tokens, keep `keys.test.ts` and `winJingles.test.ts` green, run `npm test` + `npx tsc --noEmit`).

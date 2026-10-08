# Animal Safari — Game Design Document

| | |
|---|---|
| **id** | `animal-safari` |
| **Icon / accent** | 🐾 / `orange` |
| **Ages** | 3–7 |
| **Layout** | `shell` |
| **Win jingle** | `jingle.steel-06` |
| **Guided flow** | ✅ 12 units |
| **Persistence** | `useLevels` |
| **Engine** | shared `listen-find` board (own copy of generator) |
| **Code** | ~940 LOC + 640 test LOC · 11 real animal sound clips (CC0/PD) · 12 OpenMoji PNGs |
| **Home order** | first tile on Home |

## 1. Concept & learning goal
Find the animal by **name** (TTS) or by **sound** (real recording). Vocabulary + auditory discrimination.

## 2. Core loop
Two modes alternate by level parity:
- **hearName** (odd levels): TTS speaks the animal → tap its picture among 3.
- **whichSound** (even levels): real animal sound plays → tap the animal.
Hero is neutral (🗣️/🎵) so it doesn't give away the answer. Same feedback/overlay as other listen-find games.

## 3. Content & progression
12 animals (lion, elephant, cow, dog, cat, frog, horse, sheep, rooster, duck, bird, bee); cow has no sound. Fixed 12-level ladder, **not shuffled** — identical every replay (flow version shuffles layout). 3 choices, flat.

## 4. Engagement audit
| Gap | Impact |
|---|---|
| Test before teach — no intro/exposure | Kids who don't know "rooster" just guess |
| No reveal after correct (name + sound + animation together) | Misses the key vocabulary-pairing moment |
| Fixed order, 12 animals | Memorised quickly |
| "Safari" with no world/habitats | Name promises exploration the game doesn't have |
| Cow has no moo | Obvious gap for toddlers |
| Planned celebrate-bounce & wrong-shake not built | Flat feedback |
| TTS names | Robotic |

## 5. Improvement plan

### Quick wins (S)
1. **Reveal moment**: on correct, animal grows, bounces, plays its sound, name is spoken → "Moo! Cow!".
2. Add a cow clip; shuffle the ladder per run.
3. Build the planned bounce/shake.

### Medium (M)
4. **Explore-then-quiz**: an intro "meet the animals" screen (tap each to hear name + sound) before each set of 4.
5. **Habitats**: farm 🚜, jungle 🌴, ocean 🌊, arctic ❄️, each with 6–8 animals and its own background → 30–40 animals.
6. **Safari photo album**: every found animal becomes a "photo" sticker; complete each habitat page.
7. New modes: **who lives here?** (drag animal to habitat), **baby & parent**, **what does it eat?** (share data with Match Up).
8. Recorded voice-over.

### Big bets (L)
9. **Safari jeep scene**: drive through a scrolling landscape, animals pop from bushes; tap the one that's called (parallax 2D).

## 6. 3D verdict
**Maybe, later — as a "safari ride" scene**, not for the quiz. A low-poly 3D jeep ride with animals is very attractive to 3–7, but it's a new game mode, not a conversion. Do the 2D parallax version (#9) first and measure engagement. See [3D analysis](./3d-analysis.md).

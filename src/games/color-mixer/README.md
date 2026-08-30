# Color Mixer

A color theory game for ages 4-8. Kids drag paint blobs into a mixing zone to discover new colors through continuous RGB blending.

## Features

- **Free Play** — experiment freely; drag any primary color into the mixing zone and watch the blend evolve in real time
- **Challenge Mode** — solve 6 puzzles: "Make this color!" with a closeness meter that fills as you get warmer, and sparkles on success
- **My Colors** — two-shelf sticker-book: **Famous colors** (6 discoverable; shows a hint until found) and **My creations** (colors you named and saved)
- **Discovery Celebrations** — animated reveal with sparkles the first time your blend matches a famous color within the closeness threshold
- **Save a color** — tap 💾 Save to name your current blend; it appears in the palette for reuse

## Color System

### Primary Colors (unlocked from start)

| Color | Hex | Notes |
|-------|-----|-------|
| Red | `#E53935` | |
| Yellow | `#FDD835` | |
| Blue | `#1E88E5` | |
| White | `#FAFAFA` | Use for tint/pastel mixes |
| Black | `#212121` | Use for shade mixes |

### Discoverable Famous Colors

Each color is reachable from a short pot of primaries — the wheel passes through every one of them *exactly*. Discovery fires when the mix falls within `DISCOVERY_DELTA_E` (CIEDE2000) of the target hex.

| Color | Natural hint (shown until found) |
|-------|----------------------------------|
| Orange | Mix red and yellow |
| Green | Mix yellow and blue |
| Purple | Mix red and blue |
| Pink | Mix red and white |
| Light Blue | Mix blue and white |
| Brown | Mix red, yellow, and blue |

### Pigment engine

State is an ordered **drop log** capped at `MIX_CAP` (16); the color is a pure function of its tally, so mixing is order independent and reproducible. Hue comes from a quadratic Bézier triangle over the barycentric coordinates of red/yellow/blue, with edge control points solved so each authored secondary is hit exactly at its edge midpoint — that is what makes yellow+blue a real green rather than whatever the arithmetic happens to produce. White and black are not on the wheel; they are a tint/shade axis.

This replaced a running 50 % sRGB average, which is how *light* mixes: it turned blue+yellow into a 20 %-saturation sage gray and all three primaries into a blue-gray labelled "Brown".

Matching is **CIEDE2000**, pinned explicitly — ΔE76 and ΔE00 differ by roughly 2× across this palette, so the metric alone decides whether a near-miss counts. The previous rule (Euclidean RGB under 60) let a green mix satisfy the *brown* challenge, because those two hexes sat 57.3 apart.

Challenge scoring is graded: 3 stars under ΔE00 3, 2 under 6, 1 under 12. One star is feedback, not completion — completion needs `STARS_TO_COMPLETE` (2) and is always an explicit Done tap, never a timer.

## Extending

### Add a new discoverable color

1. Add the id to `ColorId` union in `types.ts`
2. Add the entry (with `isPrimary: false`) to `COLORS` in `constants.ts`; pick a hex reachable from short blends of primaries
3. Add a hint string to `DISCOVERY_HINTS` in `constants.ts`
4. Run `npx jest` — the reachability guard in `utils/__tests__/match.test.ts` will tell you if the hex is reachable from a short pot, and that it is not close enough to another famous color to satisfy its challenge

### Add a new challenge

Add to `CHALLENGES` in `constants.ts`:

```ts
{ id: 'c7', targetColor: 'newColor', hint: 'A helpful hint', difficulty: 'hard' },
```

## File Structure

```
color-mixer/
├── index.tsx              # Main game: layout, drag-to-mix, mode switching, save dialog
├── config.ts              # Game registration (id, icon, age range, backgroundColor)
├── types.ts               # ColorId, ColorData, DynamicColor, SavedColor, Challenge, GameMode
├── constants.ts           # COLORS, DISCOVERY_HINTS, CHALLENGES, ΔE00 thresholds, DIMENSIONS, TIMING
├── components/
│   ├── ColorBlob.tsx           # Circular paint blob with shine + shadow
│   ├── ColorLabel.tsx          # Text label below blobs (design-system tokens)
│   ├── ColorPalette.tsx        # Draggable palette tray (primaries + saved colors)
│   ├── MixingZone.tsx          # Drop target showing running blend + DraggableResult
│   ├── DraggableResult.tsx     # Draggable result blob (tap-to-mix-back gesture)
│   ├── DiscoveryCelebration.tsx  # Full-screen reveal modal with sparkles
│   ├── Sparkles.tsx            # Particle burst effect (14 animated particles)
│   ├── ColorCollection.tsx     # "My Colors" two-shelf book (Famous + My creations)
│   ├── ChallengeCard.tsx       # Single challenge row in the picker list
│   ├── ChallengeMode.tsx       # Active challenge HUD (target, meter, stars); landscape strip
│   ├── ChallengeSuccess.tsx    # Celebration, rendered at the game root so it covers the screen
│   ├── ChallengePicker.tsx     # Challenge selection screen grouped by difficulty
│   └── ColorNamingDialog.tsx   # Save-color dialog (text input + Save/Cancel)
├── hooks/
│   ├── useColorMixer.ts    # Core state: drop log, persisted discoveries, saved colors + migration
│   └── useChallengeMode.ts # Challenge selection + closeness-based completion + persistence
└── utils/
    ├── wheelMix.ts         # Pigment engine: drop log, Bézier-triangle wheel, tint/shade, fitLog
    ├── deltaE.ts           # CIEDE2000 + Lab conversion
    ├── colorMath.ts        # hexToRgb (throws on malformed), isValidHex, contrast helpers
    ├── match.ts            # colorDistance, nearestFamous, closeness, starsFor, isChallengeMet
    └── __tests__/          # Engine invariants, Sharma ΔE00 vectors, reachability + separation guards
```

## Key Patterns

- **Drag-to-mix:** PanResponder in palette slots; circular hit-test against mixing zone bounds
- **Drop log:** `addDrop`/`removeDrop` on a capped `PigmentId[]`; `mixHex(log)` derives the color
- **Discovery:** `nearestFamous` checks the mix after every drop; first match triggers celebration. **Free play only** — during a challenge a modal for some other color interrupts the one the child is working on
- **Closeness meter:** `closeness(mixHex, targetHex)` → 0–1 displayed as a progress track in ChallengeMode
- **Persistence:** `useColorMixer` persists `savedColors` + `discoveries` under `color-mixer`; `useChallengeMode` persists `completedChallenges` under `color-mixer-challenges`

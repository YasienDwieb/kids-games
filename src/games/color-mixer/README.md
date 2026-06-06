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

Each color is reachable by blending 2–3 drops of primaries. Discovery fires when the running blend falls within `MATCH_THRESHOLD` (Euclidean RGB distance) of the target hex.

| Color | Natural hint (shown until found) |
|-------|----------------------------------|
| Orange | Mix red and yellow |
| Green | Mix yellow and blue |
| Purple | Mix red and blue |
| Pink | Mix red and white |
| Light Blue | Mix blue and white |
| Brown | Mix red, yellow, and blue |

### Continuous RGB engine

Each drop blends into the running mix via a 50 % average (`addColorToMix`). Closeness is computed by `colorDistance` (Euclidean RGB) and normalised to a 0–1 meter for challenges. Famous-color discovery uses `nearestFamous`, which finds the closest famous color within `MATCH_THRESHOLD`.

## Extending

### Add a new discoverable color

1. Add the id to `ColorId` union in `types.ts`
2. Add the entry (with `isPrimary: false`) to `COLORS` in `constants.ts`; pick a hex reachable from short blends of primaries
3. Add a hint string to `DISCOVERY_HINTS` in `constants.ts`
4. Run `npx jest` — the reachability guard in `utils/__tests__/match.test.ts` will tell you if the hex is achievable within `MATCH_THRESHOLD`

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
├── constants.ts           # COLORS, DISCOVERY_HINTS, CHALLENGES, MATCH_THRESHOLD, DIMENSIONS, TIMING
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
│   ├── ChallengeMode.tsx       # Active challenge HUD (target, closeness meter, success)
│   ├── ChallengePicker.tsx     # Challenge selection screen grouped by difficulty
│   └── ColorNamingDialog.tsx   # Save-color dialog (text input + Save/Cancel)
├── hooks/
│   ├── useColorMixer.ts    # Core state: continuous blend, persisted discoveries, saved colors
│   └── useChallengeMode.ts # Challenge selection + closeness-based completion + persistence
└── utils/
    ├── colorMath.ts        # hexToRgb, addColorToMix (continuous 50% average)
    ├── match.ts            # colorDistance, nearestFamous, closeness, isChallengeMet, FAMOUS_IDS
    └── __tests__/
        └── match.test.ts   # Unit tests + famous-color reachability guard
```

## Key Patterns

- **Drag-to-mix:** PanResponder in palette slots; circular hit-test against mixing zone bounds
- **Continuous blend:** each drop averages into the running hex via `addColorToMix(current, new, 0.5)`
- **Discovery:** `nearestFamous` checks the blend after every drop; first match triggers celebration
- **Closeness meter:** `closeness(mixHex, targetHex)` → 0–1 displayed as a progress track in ChallengeMode
- **Persistence:** `useColorMixer` persists `savedColors` + `discoveries` under `color-mixer`; `useChallengeMode` persists `completedChallenges` under `color-mixer-challenges`

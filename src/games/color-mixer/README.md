# Color Mixer

A color theory game for ages 4-8. Kids drag paint blobs into a mixing zone to discover new colors.

## Features

- **Free Play** — experiment freely, drag any primary color into the mixing zone
- **Challenge Mode** — solve 6 puzzles: "Make this color!" with hints
- **Color Collection** — sticker-book view tracking discovered colors (5 primary + 6 discoverable)
- **Discovery Celebrations** — animated reveal with sparkles when a new color is found

## Color System

### Primary Colors (unlocked from start)

| Color | Hex | Notes |
|-------|-----|-------|
| Red | `#E53935` | |
| Yellow | `#FDD835` | |
| Blue | `#1E88E5` | |
| White | `#FAFAFA` | Used for tint mixes |
| Black | `#212121` | Available but no recipes yet |

### Recipes

| Ingredients | Result |
|-------------|--------|
| Red + Yellow | Orange |
| Yellow + Blue | Green |
| Red + Blue | Purple |
| Red + White | Pink |
| Blue + White | Light Blue |
| Red + Yellow + Blue | Brown |

## Extending

### Add a new color

1. Add the id to `ColorId` union in `types.ts`
2. Add the entry to `COLORS` in `constants.ts`
3. Add it to the appropriate group in `COLOR_GROUPS`

### Add a new recipe

Add to `COLOR_RECIPES` in `constants.ts`:

```ts
{ ingredients: ['orange', 'blue'], result: 'newColor' },
```

Ingredient order doesn't matter — lookup sorts alphabetically.

### Add a new challenge

Add to `CHALLENGES` in `constants.ts`:

```ts
{ id: 'c7', targetColor: 'newColor', hint: 'A helpful hint', difficulty: 'hard' },
```

## File Structure

```
color-mixer/
├── index.tsx              # Main game: layout, drag-to-mix, mode switching
├── config.ts              # Game registration (id, icon, age range)
├── types.ts               # ColorId, ColorData, ColorRecipe, GameState, etc.
├── constants.ts           # COLORS, COLOR_RECIPES, CHALLENGES, DIMENSIONS, TIMING
├── components/
│   ├── ColorBlob.tsx       # Circular paint blob with shine + shadow
│   ├── ColorLabel.tsx      # Text label below blobs
│   ├── ColorPalette.tsx    # Draggable color slots at bottom
│   ├── DraggableColorBlob.tsx  # Standalone draggable (absolute positioned)
│   ├── MixingZone.tsx      # Drop target with spin animation + result display
│   ├── DiscoveryCelebration.tsx  # Full-screen reveal modal with sparkles
│   ├── Sparkles.tsx        # Particle burst effect (14 animated particles)
│   ├── ColorCollection.tsx # Sticker-book grid of all colors
│   ├── ChallengeCard.tsx   # Single challenge in picker list
│   ├── ChallengeMode.tsx   # Active challenge HUD (target, hint, success)
│   └── ChallengePicker.tsx # Challenge selection screen grouped by difficulty
├── hooks/
│   ├── useColorMixer.ts    # Core state: unlocked colors, mixing, discovery
│   └── useChallengeMode.ts # Challenge selection + completion tracking
└── utils/
    └── index.ts
```

## Key Patterns

- **Drag-to-mix:** PanResponder in palette slots, circular hit-test against mixing zone bounds
- **Recipe lookup:** ingredients sorted alphabetically for order-independent matching
- **Discovery:** first-time recipe result triggers `newDiscovery` state -> celebration modal
- **Mix feedback:** invalid combos show "Try different colors!" or "That didn't work"

---
title: "Buddy, Mascot, and Wardrobe"
summary: "Every child picks a buddy — Lulu the owl or Zain the lion cub — on first launch; the choice persists in Settings and drives a 2D Mascot everywhere praise or help appears, plus a single rigged 3D model (Lulu3D/Buddy3D) used for the cheering celebration mascot, the level-up card, and the dress-up WardrobeScreen. Outfits in the wardrobe unlock automatically as the child's player level rises from lifetime stars, the same level that fires the level-up card."
topics: [architecture, engagement, buddy, 3d]
sources:
  - id: buddy-index
    type: file
    path: src/sdk/buddy/index.ts
  - id: mascot
    type: file
    path: src/sdk/mascot/Mascot.tsx
  - id: mascot-helper
    type: file
    path: src/sdk/mascot/MascotHelper.tsx
  - id: lulu3d
    type: file
    path: src/sdk/mascot/Lulu3D.tsx
  - id: buddy-picker
    type: file
    path: src/components/pop/BuddyPicker.tsx
  - id: wardrobe-screen
    type: file
    path: src/screens/WardrobeScreen.tsx
  - id: outfits
    type: file
    path: src/sdk/player/outfits.ts
  - id: outfit-store
    type: file
    path: src/sdk/player/outfitStore.ts
  - id: levels
    type: file
    path: src/sdk/player/levels.ts
  - id: rewards-store
    type: file
    path: src/sdk/rewards/store.ts
  - id: level-up
    type: file
    path: src/sdk/feedback/LevelUp.tsx
  - id: celebration
    type: file
    path: src/sdk/feedback/Celebration.tsx
  - id: play-limit-gate
    type: file
    path: src/screens/PlayLimitGate.tsx
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: root-navigator
    type: file
    path: src/app/navigation/RootNavigator.tsx
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: sdk-barrel
    type: file
    path: src/sdk/index.ts
  - id: notice
    type: file
    path: NOTICE
---

Every child picks a buddy — Lulu the owl or Zain the lion cub — the first
time they open the app, and that choice is the one piece of personalization
that follows them everywhere: it decides which character cheers them on after
a win, which one explains a missed answer, and which one gets dressed up in
the wardrobe. `BUDDIES = ['lulu', 'zain']` is deliberately a two-item roster
presented as two characters, never as "boys / girls" — either buddy is shown
to every child [@buddy-index] [@buddy-picker]. The feature spans four layers:
a persisted choice (`src/sdk/buddy/`), a 2D mascot that can render anywhere
cheaply (`src/sdk/mascot/Mascot.tsx`, `MascotHelper.tsx`), a single rigged 3D
model reused for both buddies (`Lulu3D`, aliased `Buddy3D`), and a dress-up
screen whose unlocks are driven by the player-level system built on top of
lifetime stars (`src/sdk/player/`, `WardrobeScreen`). `NOTICE` reserves both
buddies — "their characters, names, and designs," their 2D pose art, and
their rigged 3D models — outside the code license entirely; see
[Licensing and attribution](../reference/licensing-and-attribution) for the
full reserved-asset list this feature belongs to [@notice].

## Picking and persisting a buddy

`settings.buddy: 'lulu' | 'zain' | null` is the one field that stores the
choice, `null` until a child actually picks one [@settings-store]. `src/sdk/buddy/index.ts`
does not read this field directly on every render; instead it keeps a
module-level mirror (`current`, `picked`) that syncs from `settingsStore` once
at module load and again on every `settingsStore.subscribe` update
[@buddy-index]. The file's own comment explains why: a module-level value is
available synchronously on the very first render, before any `async`
`settingsStore.get()` could resolve, "so the 2D poses and the 3D model never
flash the wrong character" [@buddy-index]. `useBuddy()` and `useBuddyPicked()`
subscribe a component to that mirror; `currentBuddy()` reads it without
subscribing, for code that runs once rather than rendering; `chooseBuddy(id)`
patches `settingsStore` directly [@buddy-index].

`HomeScreen` is what actually triggers the first pick: it reads
`useBuddyPicked()`, and renders `<BuddyPicker>` as a full-screen overlay on
top of Home — not a separate navigation route — whenever the value is `false`
(settings have loaded and no buddy has ever been chosen) and the screen is
focused [@home-screen]. `BuddyPicker` shows both buddy cards side by side,
color-coded through the ordinary accent system rather than a buddy-specific
palette, plays a short buddy-specific voice line on tap
(`` `${buddy}.tap.${lang}.1` ``), and calls `chooseBuddy()` on confirm with no
second confirmation step [@buddy-picker]. Switching buddies later is not a
Settings control — it lives inside the wardrobe instead (below), framed as a
toy choice rather than a parental setting, and so it is reachable without the
[parent gate](../decisions/parent-gate-for-settings) [@wardrobe-screen].

## Three escalating ways to draw the buddy

`Mascot.tsx` is the cheap, always-available layer: four poses
(`wave`/`cheer`/`point`/`encourage`) are plain `require()`'d Higgsfield-generated
PNG cutouts per buddy, rendered as an `Animated.Image` with an idle bob and a
squash-pop entrance, and the `point` pose mirrors horizontally under RTL so a
pointing finger still reads toward the reading direction [@mascot]. This is
the mascot `BuddyPicker`'s own cards, the wardrobe's buddy-switch icons, and
most small UI moments use directly. `MascotHelper.tsx` wraps `Mascot` with a
slide-in/out animation, absolute corner positioning, and a speech bubble that
defaults to one of two lines (`mascot.oops` / `mascot.look`) or a caller-
supplied custom line — the shape a game reaches for when it wants the buddy
to pop in and react to something (for example, nudging a struggling child)
without pulling in the full 3D rig [@mascot-helper].

`Lulu3D` (re-exported from the SDK barrel as `Buddy3D`, "because it reads
better at new call sites" [@sdk-barrel]) is the full `@react-three/fiber`
rig, and it is the one place this
feature overlaps with [3D rendering in games](3d-rendering): it reuses the
same shared GLB loader, `useModel3D`, that Animal Safari and Mouse Maze use
for their own models — `lulu`/`zain` are each a `.glb`+`.rgba` pair prepared
the same offline way [@lulu3d]. What makes it different from every component
on that page is that the model is **rigged**, and `Lulu3D` drives it with
code instead of baked animation clips: it walks the loaded `Object3D` for
named bones (`Hips`, `Spine`, `neck`, `Head`, the arm bones), caches each
bone's rest orientation, and every frame composes a small model-space Euler
rotation onto that rest pose through a `pose()` helper [@lulu3d]. That one
mechanism produces idle breathing, the `wave`/`cheer`/`encourage`/`point`
moods, a head that tracks a pointing gesture, and a tap-reaction hop-and-spin
— all without a single baked clip. Equipped wardrobe items (hats, glasses)
are drawn the same procedural way `Bowl3D` draws Color Mixer's pot — cones,
toruses, and spheres, not a model — and attached to the head bone through a
`createPortal` group that undoes the bone's own scale and rotation first, so
hat and glasses art can be authored upright regardless of how the head bone
is currently posed [@lulu3d]. `Lulu3D` also wires its own `PanResponder` for
drag-to-spin and tap-to-react, playing a buddy voice line on tap
[@lulu3d].

### Lulu3D is not behind the lazy-module boundary

Every 3D component on [3D rendering in games](3d-rendering) is reached
through `lazy()`+`Suspense`, specifically so `@react-three/fiber/native`,
`expo-gl`, and `three` are only evaluated for a game that actually shows 3D
content. `Lulu3D` breaks that pattern: `WardrobeScreen`, `PlayLimitGate`,
`Celebration.tsx`, and `LevelUp.tsx` all import it with a plain static
`import`, not a `lazy()` call, and nothing wraps any of them in `Suspense`
[@wardrobe-screen] [@play-limit-gate] [@celebration] [@level-up]. Because
`CelebrationProvider` — which statically imports `Celebration.tsx` — is
itself imported eagerly by both `GamePlayerScreen` and `FlowPlayerScreen`,
the screens that play *any* game, three.js and `expo-gl` are effectively on
the critical path of every single game session now, not confined to the
handful of games that render 3D tile content. A future change that wanted to
undo this (for example, deferring the cheering mascot behind its own
`Suspense` boundary with a 2D `Mascot` fallback) would need to touch all four
call sites above, not just one.

## The wardrobe: level-gated outfits shared by both buddies

`src/sdk/player/outfits.ts` is a static catalog of eight `Outfit` items, each
a `{ id, slot: 'hat' | 'glasses', level, emoji }`, where `level` is the
player level that unlocks it (`isUnlocked(outfit, level)`) and `unlocksAt(level)`
answers "what just became available" for the level-up card [@outfits]. Player
level itself is never stored — `src/sdk/player/levels.ts`'s `levelInfo(stars)`
derives it fresh from lifetime stars every time, on an escalating cost curve
(`costOf(level) = 4 + level`, so each level costs one more star than the
last) specifically so level can never drift from the stars it is computed
from [@levels]. `awardStars()`, the single entry point every game calls to
grant stars, compares `levelInfo` before and after the award and calls every
registered `onLevelUp` listener when the level actually rises
[@rewards-store]. `LevelUp.tsx` is the one subscriber: it renders the
level-up card — including a cheering `Lulu3D` — and lists whatever
`unlocksAt(newLevel)` returns as newly available [@level-up] [@outfits]. This
is the missing link between this page and
[Rewards, stars, and stickers](rewards-and-stickers): the player-level system
that page gestures at as "built on top of the star total" is exactly this
`stars → levelInfo → isUnlocked` chain.

`outfitStore.ts` is one more `createStore` record, namespace `'outfit'`
(`kg:outfit`), holding a `Wearing = { hat: string | null, glasses: string | null }`
— one shared garment state, not one per buddy, so switching from Lulu to Zain
keeps whatever hat or glasses were equipped [@outfit-store]. `wear(slot, id)`
toggles a slot; `useWearing()` subscribes a component to live changes
[@outfit-store].

`WardrobeScreen` is registered as the `'Wardrobe'` route in the root
navigator [@root-navigator], reached from `HomeScreen` two ways: a dedicated
wardrobe affordance, and tapping the stars `LevelPill` badge — neither is
behind the parent gate, so a child can open it freely [@home-screen]
[@wardrobe-screen]. It has three tabs: `hat` and `glasses` (grids of
`OUTFITS` filtered by slot, locked tiles showing the level that unlocks
them), and `stickers` — the sticker collection already documented on
[Rewards, stars, and stickers](rewards-and-stickers), which lives here as a
fourth tab alongside the two outfit grids rather than its own screen
[@wardrobe-screen]. A small radio group in the `AppBar`'s right slot, one
`Mascot` icon per entry in `BUDDIES`, lets the child switch buddies live by
calling `chooseBuddy()` [@wardrobe-screen]. The stage above the tabs renders
an interactive `<Lulu3D key={buddy} ... interactive active={focused} />` —
draggable and tap-reactive, and paused (`active={focused}`) whenever the
screen loses focus so it is not still animating off-screen
[@wardrobe-screen]. Leaving the screen calls `markStickersSeen()`, the same
cleanup `rewards-and-stickers.md` already documents for clearing new-sticker
badges [@wardrobe-screen].

## What this page does not cover

The parent-set daily play limit, `PlayLimitGate`, also renders a (dozing)
`Lulu3D` on its break screen, but it is a separate parental-control feature
with its own storage and its own reuse of the parent gate — see
[Play time limit](play-time-limit) rather than this page for that flow.

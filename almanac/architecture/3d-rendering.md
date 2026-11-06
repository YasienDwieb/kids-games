---
title: "3D Rendering in Games"
summary: "Seven games draw real 3D content inside plain React Native views via react-three-fiber/expo-gl: four display Higgsfield-generated GLB models through the SDK's shared useModel3D loader (Animal Safari, Mouse Maze, Candy Catch), one builds its road scenery from a separate, game-local Kenney-GLB loader because those models need no texture split, and two (Color Mixer, Balloon Archer, Simple Pairs) draw their scenes from hand-built three.js geometry with no model files at all. Every one of them keeps three.js out of the default bundle with the same lazy-module, flat-fallback idiom. The buddy mascot's own 3D rig, Lulu3D, is a fourth, bone-animated pattern documented on its own page."
topics: [architecture, games, 3d]
sources:
  - id: animal3d
    type: file
    path: src/games/animal-safari/components/Animal3D.tsx
  - id: render-animal
    type: file
    path: src/games/animal-safari/components/renderAnimal.tsx
  - id: models-ts
    type: file
    path: src/sdk/three/models.ts
  - id: prep-glb
    type: file
    path: scripts/3d/prep_glb.py
  - id: bowl3d
    type: file
    path: src/games/color-mixer/components/Bowl3D.tsx
  - id: mixing-zone
    type: file
    path: src/games/color-mixer/components/MixingZone.tsx
  - id: maze-view-3d
    type: file
    path: src/games/mouse-maze/components/MazeView3D.tsx
  - id: maze-stage
    type: file
    path: src/games/mouse-maze/components/MazeStage.tsx
  - id: catch-scene-3d
    type: file
    path: src/games/candy-catch/components/CatchScene3D.tsx
  - id: catch-field
    type: file
    path: src/games/candy-catch/components/CatchField.tsx
  - id: turbo-road-models
    type: file
    path: src/games/turbo-road/utils/models3d.ts
  - id: turbo-road-playfield
    type: file
    path: src/games/turbo-road/components/Playfield3D.tsx
  - id: turbo-road-index
    type: file
    path: src/games/turbo-road/index.tsx
  - id: archer-playfield
    type: file
    path: src/games/balloon-archer/components/Playfield3D.tsx
  - id: archer-index
    type: file
    path: src/games/balloon-archer/index.tsx
  - id: pairs-board-3d
    type: file
    path: src/games/simple-pairs/components/GameBoard3D.tsx
  - id: pairs-board
    type: file
    path: src/games/simple-pairs/components/GameBoard.tsx
  - id: credits
    type: file
    path: CREDITS.md
---

Seven [game modules](../concepts/game-module) render actual 3D scenes instead
of flat sprites, every one of them through `@react-three/fiber/native`'s
`<Canvas>` sitting inside an ordinary `View`: Animal Safari, Mouse Maze, and
Candy Catch each display a Higgsfield-generated model; Turbo Road drives its
road scenery from a separate set of Kenney-sourced GLBs; and Color Mixer,
Balloon Archer, and Simple Pairs draw their scenes from hand-built three.js
geometry with no model file at all [@animal3d] [@maze-view-3d]
[@catch-scene-3d] [@turbo-road-models] [@bowl3d] [@archer-playfield]
[@pairs-board-3d]. Each component is still pure presentation: none of them
touch game state directly, and each is handed only the scalar and string
props it needs to draw a frame. The buddy mascot's own 3D model, `Lulu3D`
(exported as `Buddy3D`), is a fourth, meaningfully different pattern — a
single rigged, bone-animated GLB reused for both buddies and driven by
code rather than baked clips — covered in full on
[Buddy, mascot, and wardrobe](buddy-and-wardrobe) rather than here. Unlike
every component on this page, `Lulu3D` is **not** behind a `lazy()`/`Suspense`
boundary anywhere it is used; see that page for why this means three.js is on
the critical path of every game session, not just the games below.

## Model-based, through the SDK's shared loader: `useModel3D`

`src/sdk/three/models.ts` is the SDK's shared loader for bundled `.glb`
models, exported as `useModel3D`/`preloadModels3D` [@models-ts]. React
Native has no DOM `Image`, so three's `GLTFLoader` cannot decode a texture
embedded in a GLB the normal way; these models are Higgsfield-generated and
are prepared offline (`scripts/3d/prep_glb.py`) so the GLB keeps only
geometry and UVs, and its base-colour texture ships beside it as raw RGBA8
bytes in a separate `<name>_tex.rgba` module, uploaded by `models.ts` as a
`DataTexture` [@models-ts] [@credits] [@prep-glb]. The texture file must not
share a basename with its GLB (`lion.glb` + `lion.rgba`, not `lion_tex.rgba`):
an Android release build indexes bundled assets as raw resources keyed by
filename *without* extension, so `lion.glb` and `lion.rgba` would both
resolve to the same `R.raw.lion` entry and one would silently shadow the
other. Every model in the repo was renamed from `<name>.rgba` to
`<name>_tex.rgba` for this reason — `animalModels.ts`, `CatchScene3D`,
`MazeView3D`, and `Lulu3D`'s own `MODELS` map all `require()` the `_tex`
path — and `prep_glb.py` writes that suffix itself, so a newly generated
model never reintroduces the clash [@prep-glb] [@animal3d] [@catch-scene-3d]
[@maze-view-3d]. `load(src)` fetches and parses both
files once per `glb` module identity and caches the resulting
`Promise<Object3D>`, with the cache entry deleted again on failure so a
later call can retry [@models-ts]. `useModel3D(src, size, fit)` hands each
caller its own size-normalised clone — scaled so its longest side, height,
or largest side (`fit: 'length' | 'height' | 'max'`) matches `size`, and
repositioned to stand on `y = 0` centred on `x`/`z` — or `null` while that
clone is still being produced [@models-ts]. Three games call this loader
directly, each preloading its own fixed model set at module or mount scope
so every tile's model starts fetching the moment the game first needs any
one of them rather than only the tile currently on screen:

- **Animal Safari's `Animal3D`** shows the tapped animal as a textured model;
  `preloadModels3D(Object.values(ANIMAL_MODELS))` runs once at module scope
  for all twelve animals [@animal3d] [@credits].
- **Mouse Maze's `MazeView3D`** loads the mouse and the cheese; both are
  preloaded together with `useEffect(() => preloadModels3D([MOUSE, CHEESE]),
  [])` [@maze-view-3d] [@credits].
- **Candy Catch's `CatchScene3D`** loads a wicker basket GLB for the
  catcher [@catch-scene-3d] [@credits].

Because `load()` caches by module identity, a tile or scene that mounts
later reuses the same in-flight or already-resolved promise instead of
starting a second fetch [@animal3d] [@models-ts].

## Model-based, outside the SDK loader: Turbo Road's Kenney kit

Turbo Road's road scenery — cars, roadside trees, rocks, cacti, and the
finish arch — are CC0 models from Kenney's Car Kit, Racing Kit, and Nature
Kit, not Higgsfield generations, and they load through a second, game-local
GLB loader, `src/games/turbo-road/utils/models3d.ts`, instead of the SDK's
`useModel3D` [@turbo-road-models] [@credits]. The reason is in the file's own
header comment: "the car models' palette texture was baked into vertex
colors offline, so loading needs no image decoding" — unlike a
Higgsfield-generated GLB, a Kenney model carries its colour as per-vertex
data inside the mesh itself, so there is no separate texture to split out or
upload as a `DataTexture`, and a plain `GLTFLoader` parse is enough
[@turbo-road-models]. `load(name)` and `useModel(name, size, fit)` mirror
`models.ts`'s cache-by-identity and null-while-loading shape almost exactly
[@turbo-road-models] [@models-ts], down to the same `preloadModels(names)`
entry point for warming the cache ahead of a race [@turbo-road-models]. The
file also patches in a `TextDecoder` polyfill before parsing, since
`GLTFLoader` needs one to decode a GLB's JSON chunk and not every JS engine
this app runs on ships one [@turbo-road-models]. `SCENERY` maps each road
theme (`meadow`, `beach`, `desert`, `snow`) to the roadside props alternated
along its verge, each with its own target `size` and `fit` [@turbo-road-models].
Turbo Road's `Playfield3D` is the consumer that calls `useModel(name, size,
fit)` for each car and prop while the race runs [@turbo-road-playfield].
A future game that bundles a non-Higgsfield, vertex-colour GLB kit should
follow this file as the template rather than forcing the asset through the
SDK's texture-split loader, which assumes a Higgsfield-style `.glb`+`.rgba`
pair.

## Procedural: three games with no model files at all

Three games build their 3D scenes from primitive three.js geometry instead
of any bundled model:

- **Color Mixer's `Bowl3D`** needed something a static GLB can't give: a
  paint surface whose colour blends between two hexes over time, a fill
  level that rises with every drop, and a drop-site swirl and splash that
  trigger on each new drop. It builds the whole scene from a `LatheGeometry`
  wall revolved from a hand-authored radius curve, a hand-built
  Archimedean-spiral `BufferGeometry` for the swirl ribbon, and plain
  `cylinder`/`torus`/`sphere` geometries for the paint disc, splash ring, and
  droplets [@bowl3d]. All of the motion — rising paint level, the colour
  lerp between the pot's previous and current hex, the swirl's spin and
  fade, the splash droplets' arc, and a small bowl "bump" on impact — is
  driven by one `useFrame` callback reading plain numeric props (`hex`,
  `dropCount`, `dropCap`, `lastDrop`) rather than any asset state, so there
  is nothing to wait on [@bowl3d]. The pigment math this surface visualises
  belongs to the mixing engine, not to `Bowl3D` itself — see
  [Mix paint, not light, in Color Mixer](../decisions/color-mixer-pigment-mixing).
- **Balloon Archer's `Playfield3D`** builds every balloon, its knot and
  string, pop shards and ring, and the bow's limbs, grip, string, and arrow
  (shaft, head, fletching) from `SphereGeometry`, `ConeGeometry`,
  `CylinderGeometry`, `PlaneGeometry`, and `TorusGeometry` primitives
  [@archer-playfield]. Nothing in this scene is a loaded asset; the whole
  playfield is assembled procedurally every time it mounts.
- **Simple Pairs' `GameBoard3D`** gives the memory-matching cards a real,
  flippable 3D body: `cardBody()` extrudes a rounded-rectangle `ShapeGeometry`
  through `ExtrudeGeometry` to get a card with visible thickness, then lays
  the card's art and emblem on top as flat `PlaneGeometry` faces
  [@pairs-board-3d]. The card's flip is a 3D rotation rather than a 2D
  cross-fade, which is the whole reason this game has a 3D variant at all.

## The shared idiom: lazy module, flat fallback

Every one of these components is kept out of its caller's own bundle
evaluation and out of the initial render entirely. Each game's top-level
screen or board component `lazy(() => import(...))`s its 3D component and
wraps it in `<Suspense fallback={...}>`, so the transitive cost of
`@react-three/fiber/native`, `expo-gl`, and `three` is only paid the first
time a 3D scene actually needs to be on screen [@render-animal]
[@mixing-zone] [@maze-stage] [@catch-field] [@turbo-road-index]
[@archer-index] [@pairs-board]. The `Suspense` fallback only covers the
module import, though; it says nothing about whether a model has finished
loading once the module *is* available, and the games that depend on
`useModel3D`/`useModel` handle that gap differently:

- `Animal3D` keeps a flat 2D `<Image>` on screen unconditionally until
  `useModel3D` returns a real object and an `onReady` callback flips a local
  `ready` flag, then drops the `<Image>` and lets the `<Canvas>` take over
  [@animal3d].
- `Mouse Maze`'s `MazeStage` falls back to the existing flat `MazeView` for
  the whole module-load gap, and `MazeView3D` itself renders a caller-supplied
  `fallback` shape in place of any model still in flight, rather than leaving
  a gap mid-scene [@maze-stage] [@maze-view-3d].
- `Candy Catch`'s basket stays inside the 3D scene the whole time: before the
  wicker-basket GLB resolves, the same `<group>` renders a plain procedural
  cylinder in the basket's own material color, swapped for the real model the
  moment `useModel3D` resolves — a 3D placeholder instead of a 2D one
  [@catch-scene-3d].

`Bowl3D`, `Playfield3D` (Balloon Archer), and `GameBoard3D` need no inner
fallback at all: procedural geometry has nothing to fetch, so the moment each
module is evaluated it can draw a frame, and the outer `Suspense` fallback
(each game's existing flat UI) is the only gap that exists
[@bowl3d] [@archer-playfield] [@pairs-board-3d]. Any future game adding 3D
content should follow this same shape: a lazy module boundary so three.js is
never part of the default bundle evaluation, and — only if the 3D content
itself depends on an asynchronous asset like a GLB — an inner fallback
(2D image, procedural placeholder, or a caller-supplied shape) so the tile is
never briefly blank between the module loading and the model resolving.

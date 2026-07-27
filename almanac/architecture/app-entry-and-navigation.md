---
title: "App Entry and Navigation Architecture"
summary: "Traces the boot sequence from index.ts through App.tsx's font, side-effect, orientation, and language gates into RootNavigator and its four screens."
topics: [architecture, navigation, boot]
sources:
  - id: index-ts
    type: file
    path: index.ts
  - id: app-tsx
    type: file
    path: App.tsx
  - id: root-navigator
    type: file
    path: src/app/navigation/RootNavigator.tsx
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
  - id: flow-player-screen
    type: file
    path: src/screens/FlowPlayerScreen.tsx
  - id: app-json
    type: file
    path: app.json
  - id: responsive-ts
    type: file
    path: src/utils/responsive.ts
  - id: responsive-test
    type: file
    path: src/utils/__tests__/responsive.test.ts
---

Kids Zone boots through a short, strict chain: `index.ts` hands the process to
`App.tsx`, which will not render anything until fonts are loaded, every game
and flow has registered itself, and the persisted language has been checked
against the device's text direction. Only after that gate opens does
`RootNavigator` mount, exposing four screens — Home, GamePlayer, Settings, and
FlowPlayer — that between them cover the whole app surface. Understanding this
chain matters because two of its steps are easy to get backwards: the
side-effect imports that populate the [game registry](../architecture/game-registry)
must run before `HomeScreen` ever asks for the game list, and the orientation
lock has to be a runtime call, not just a manifest setting, or the app pins to
one landscape direction instead of both.

## `index.ts`: the one-line handoff

`index.ts` does nothing but call `registerRootComponent(App)` from `expo`
[@index-ts]. That call registers `App` as the native root component whether
the app is running inside Expo Go or a standalone build, so there is no
custom native bootstrapping to reason about — every behavior described below
lives in `App.tsx` and the modules it imports.

## `App.tsx`: the gate before first paint

`App.tsx` renders `null` until two independent async conditions both resolve:
`fontsLoaded` and `langReady` — `if (!fontsLoaded || !langReady) return null;`
[@app-tsx]. This is a deliberate blank frame rather than a flash of
unstyled/mistranslated content.

**Fonts.** `useFonts` loads three families: Fredoka (500/600/700) and Nunito
(600/700/800) for Latin script, and IBM Plex Sans Arabic (500/600/700) for
Arabic script [@app-tsx]. All nine weights load before the app renders, since
any screen can switch to Arabic at runtime and the RTL font has to already be
resident.

**Side-effect registration.** Before the component function body runs,
`App.tsx` imports three modules purely for their side effects: `'./src/sdk/i18n'`
initializes i18next, `'./src/games'` registers every game, and `'./src/flow'`
registers every flow unit and topic [@app-tsx]. Because ES module imports run
top-to-bottom at module-load time, this ordering guarantees the
[game registry](../architecture/game-registry) and the flow registry are fully
populated before any component — including `HomeScreen` — has a chance to call
`getAllGames()` or build a flow sequence. A [Game module](../concepts/game-module)
only exists to the rest of the app because its `config.ts` is reachable from
this import chain.

**Orientation lock.** A `useEffect` calls
`ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)`,
skipping the call entirely on web (`if (Platform.OS === 'web') return;`)
[@app-tsx]. This runtime lock is not redundant with `app.json`'s
`"orientation": "landscape"` manifest field [@app-json] — the manifest alone
pins Android to a single fixed landscape direction, while the `LANDSCAPE`
runtime lock allows *sensor* landscape, so rotating the device flips the UI
between left- and right-facing landscape instead of refusing to rotate at
all. The [Landscape orientation lock](../decisions/landscape-orientation-lock)
decision page records why both layers are needed together.

**Language bootstrap.** A second `useEffect` calls `bootstrapLanguage()` and
gates `langReady` on its result [@app-tsx]. If the persisted language
disagrees with the device's native RTL-ness, the app calls `reloadApp()` once
— but only when `Platform.OS !== 'web'`, because `I18nManager.forceRTL` only
takes effect on the next native launch, whereas web's direction is CSS-driven
and reloading there would blank or loop the app on first boot [@app-tsx]. A
failure to read the persisted locale is treated as non-fatal: the `catch`
branch logs and sets `langReady` anyway rather than leaving the app stuck on a
blank screen [@app-tsx]. The [i18n and RTL](../architecture/i18n-and-rtl)
architecture page covers `bootstrapLanguage` and the reload mechanism in full.

**Composition.** Once both gates clear, `App.tsx` renders
`GestureHandlerRootView` → `SafeAreaProvider` → `NavigationContainer` →
`RootNavigator` plus a light-styled `StatusBar` [@app-tsx]. Everything the app
needs at runtime — gesture handling, safe-area insets, and navigation state —
is available to every screen beneath this point.

## `RootNavigator`: four screens, no headers

`RootNavigator` is a `createNativeStackNavigator<RootStackParamList>()` with
`headerShown: false` set globally, and exactly four screens registered:
`Home`, `GamePlayer`, `Settings`, and `FlowPlayer` [@root-navigator]. Turning
off the native header everywhere is intentional — every screen in this app
draws its own chrome (the [game shell](../architecture/game-shell-and-back-navigation)'s
`AppBar`, or a floating back button), so a second, stock header would be
either redundant or wrong for the landscape layout.

### `HomeScreen`

`HomeScreen` is the app's landing screen and branches on device orientation
rather than on a settings toggle: when `width > height` it renders a
landscape two-pane layout — a journey card on one side, a games rail on the
other — and otherwise falls back to a portrait scroll view with a game grid
[@home-screen]. The game list itself comes from the registry:
`settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames()`, so an age
band chosen in Settings filters the Home tile set without touching how games
are registered [@home-screen]. One RTL-specific detail is worth knowing if you
touch this screen: the landscape games rail can be a column-major grid inside
a horizontal `ScrollView`, and because a native horizontal `ScrollView`
always initializes scrolled to `x: 0` regardless of layout direction,
`HomeScreen` manually snaps the scroll position to the content's far edge in
`onContentSizeChange` when `I18nManager.isRTL` is true, so game 0 still lands
flush at the visual start of the rail [@home-screen].

### Tablet-aware sizing, not just orientation

Both the portrait and landscape branches are further sized by
`src/utils/responsive.ts`, a pure, dimension-driven module deliberately keyed
on `width`/`height` alone rather than `Platform.OS`, so an Android tablet and
an iPad of the same size class get the same layout [@responsive-ts].
`isTablet(width, height)` treats any screen whose *short* side is `>= 768`dp
as a tablet [@responsive-ts]. Portrait columns go from a fixed 2 on phones to
3 or 4 on tablets (`width > 900 ? 4 : 3`), so a tablet in portrait doesn't
render two oversized columns [@home-screen]. In landscape, `homeRailWidth`
widens the journey pane from the phone's 244dp to 300dp on tablets, and
`computeHomeGrid` decides how the games rail itself is sized and whether it
scrolls [@responsive-ts].

`computeHomeGrid` has two code paths. The phone path is the original rail
math preserved unchanged — 1 to 3 rows chosen from the available height,
card width and emoji size derived from row height and clamped to phone-sized
bounds — and it always renders inside a horizontal `ScrollView`
[@responsive-ts]. `src/utils/__tests__/responsive.test.ts` locks these exact
phone numbers as a regression guard, so a future layout change that shifts
phone card sizes will fail that test unless the change is deliberate
[@responsive-test]. The tablet path instead searches row counts for the
largest card size (bounded 150–260dp) that fits *every* game in the available
width and height with no scrolling at all — a "fit-to-screen" grid rendered
in a centered, wrapping `View` instead of a `ScrollView`
[@responsive-ts] [@home-screen]. If no row count fits all games even at the
minimum card size, the tablet path falls back to the same horizontal-scroll
rendering as phones, sized with tablet-minimum cards, so an unusually large
game count degrades to scrolling instead of clipping content
[@responsive-ts] [@responsive-test].

### `GamePlayerScreen`

`GamePlayerScreen` reads `route.params.gameId`, looks it up with `getGame(gameId)`,
and renders a not-found fallback (a `BackButton` plus a translated message) if
the id doesn't resolve to a registered game [@game-player-screen]. When the
game exists, the screen wraps it in a `ScreenBackContext.Provider` and wires
Android's hardware back button through `BackHandler.addEventListener('hardwareBackPress', ...)`
— the mechanism a game uses to intercept back presses is a shell-level
concern, covered in full by the
[Game shell and back navigation](../architecture/game-shell-and-back-navigation)
architecture page rather than repeated here. The screen also switches its
whole layout per game: `game.layout?.mode === 'bare'` renders the game inside
a bare `View` with only a floating `BackButton`, while the default `'shell'`
mode wraps it in `GameShell` [@game-player-screen].

### `FlowPlayerScreen`

`FlowPlayerScreen` has no shell/bare branching at all — it is one fixed
layout, a `SceneCanvas` with a cross-fading unit render and a single floating
`BackButton`, regardless of which game contributed the current unit
[@flow-player-screen]. That is a real structural difference from
`GamePlayerScreen`'s per-game layout switch: a [Flow](../concepts/flow) unit
is a scoreless, replayable slice of a game's content played inside a shared
container, not the game's own screen. The
[Flow engine](../architecture/flow-engine) architecture page explains how
`useFlow` selects and advances units; this page only needs to note that
`FlowPlayerScreen` is a single, uniform host for whatever unit that engine
hands it.

## What `app.json` locks in

`app.json` sets the manifest-level defaults that `App.tsx`'s runtime code
then narrows or overrides: `"orientation": "landscape"`, `newArchEnabled: true`,
Android `edgeToEdgeEnabled: true`, bundle identifiers `dev.waybeyond.kidszone`
on both platforms, and the product identity `"name": "Kids Zone"` /
`"slug": "kids-zone"` [@app-json]. The orientation field is the one most
worth remembering when you next touch boot code: it is necessary (Android
needs a manifest-level orientation to allow locking at all) but not
sufficient on its own — the actual sensor-landscape behavior lives in
`App.tsx`'s `ScreenOrientation.lockAsync` call, not in this file.

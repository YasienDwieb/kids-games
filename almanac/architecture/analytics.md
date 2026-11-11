---
title: "Analytics: Anonymous Usage Events"
summary: "src/sdk/analytics is the vendor-neutral facade every game and screen calls through track()/usePlaySession() to report coarse, anonymous usage (which games are played, free vs. journey, how long, how many rounds); a swappable AnalyticsSink picked in init.ts does the actual sending, and a parent opt-out in Settings can turn it off entirely."
topics: [architecture, sdk, analytics]
sources:
  - id: analytics-md
    type: file
    path: docs/ANALYTICS.md
  - id: events-ts
    type: file
    path: src/sdk/analytics/events.ts
  - id: client-ts
    type: file
    path: src/sdk/analytics/client.ts
  - id: types-ts
    type: file
    path: src/sdk/analytics/types.ts
  - id: init-ts
    type: file
    path: src/sdk/analytics/init.ts
  - id: use-play-session
    type: file
    path: src/sdk/analytics/usePlaySession.ts
  - id: posthog-sink
    type: file
    path: src/sdk/analytics/sinks/posthog.ts
  - id: console-sink
    type: file
    path: src/sdk/analytics/sinks/console.ts
  - id: client-test
    type: file
    path: src/sdk/analytics/__tests__/client.test.ts
  - id: vendor-boundary-test
    type: file
    path: src/sdk/analytics/__tests__/vendorBoundary.test.ts
  - id: app-tsx
    type: file
    path: App.tsx
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
  - id: flow-player-screen
    type: file
    path: src/screens/FlowPlayerScreen.tsx
  - id: rewards-store
    type: file
    path: src/sdk/rewards/store.ts
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
---

`src/sdk/analytics/` reports the handful of coarse, anonymous facts the
project wants about real usage — which games get played, free play versus the
guided journey, how long a session lasts, and how many rounds finish — so a
release can be judged by something other than guesswork [@analytics-md]. It
was added by an outside contributor's PR as a self-contained module with its
own tests, and every call site elsewhere in the app goes through one of two
functions, `track(event, props)` or the `usePlaySession(gameId, mode)` hook,
never a vendor SDK directly [@analytics-md].

## Why a facade instead of calling PostHog directly

The module is deliberately split into a typed event catalogue, a
vendor-agnostic client, and swappable backends, because the project expects to
change or add analytics vendors without touching call sites scattered across
every screen and game:

```
src/sdk/analytics/
  events.ts      typed event catalogue — the only contract
  types.ts       AnalyticsSink interface
  client.ts      facade: context props, parent opt-out, queue, fan-out, sessions
  usePlaySession.ts
  init.ts        boot wiring + backend selection (App.tsx only, not the barrel)
  sinks/         the only place a vendor SDK may be imported
```

[@analytics-md]. `events.ts` defines `AnalyticsEvents`, a map from event name
to its exact prop shape — `app_open`, `game_start`/`game_end` (`gameId`,
`mode: 'free' | 'journey'`, plus `durationSec` and `rounds` on `game_end`),
`round_complete` (`gameId`, `mode`, `stars`), and `journey_done` (`total`)
[@events-ts]. `track<N extends EventName>(event: N, props: AnalyticsEvents[N])`
is typed against that map, so a caller cannot send an event name or prop shape
the catalogue does not define [@client-ts]. `AnalyticsSink` is the one
interface a backend must satisfy — `track`, `setEnabled`, and `flush`
[@types-ts] — and `sinks/` is the only folder allowed to import a vendor SDK
at all: `vendorBoundary.test.ts` scans every source file outside
`sdk/analytics/sinks/` for a literal import string from a list of known
analytics vendors (`posthog-react-native`, `@aptabase/`, `@amplitude/`,
`mixpanel`, `@segment/`) and fails if any file outside `sinks/` contains one
[@vendor-boundary-test]. This is the same shape as the broader
[SDK-only import boundary](../decisions/sdk-only-import-boundary) that keeps
games from reaching into each other's internals, narrowed to one vendor
dependency and, unlike that boundary, enforced by an automated test rather
than contributor discipline alone — see
[Analytics sinks stay behind a vendor boundary](../decisions/analytics-vendor-boundary)
for why that distinction matters here.

## The client: queueing, context, fan-out, and sessions

`client.ts` holds all of the facade's state in module-level variables —
`sinks`, `ready`, `enabled`, `base`, `fromSettings`, `pending`, and `session`
— rather than a class instance, matching the module-singleton shape the rest
of `@/sdk` uses for stores [@client-ts]. Four behaviors matter for anyone
calling into this module or adding a new call site:

- **Events tracked before setup queue up.** `App.tsx` calls `track('app_open',
  {})` and then `setupAnalytics(...)` in the same effect, but `setupAnalytics`
  is async (it awaits `settingsStore.get()` first) [@app-tsx] [@init-ts]. Any
  `track()` call before `ready` flips true is pushed onto a `pending` array
  (capped at `MAX_PENDING = 50`, oldest calls dropped silently past that) and
  flushed once setup finishes, so an early `app_open` is never lost just
  because the settings read had not resolved yet [@client-ts].
- **Every event is enriched before it reaches a sink.** `send()` merges
  `base` (the boot context passed into `setupAnalytics` — `appVersion`,
  `build`, `updateId`, `channel`, `platform`), `fromSettings` (`language`,
  `ageBand`, `appMode`, kept in sync by a `settingsStore.subscribe` callback),
  and the event's own props, then runs the merged object through `clean()`,
  which keeps only string/number/boolean/null values and truncates strings to
  100 characters, before fanning it out to every sink [@client-ts]. A caller
  never has to attach app version or language itself.
- **One broken sink cannot take down the others, or the game.** `send()`
  wraps each `sink.track(...)` call in `safely()`, which catches and
  `__DEV__`-only logs any exception, so a PostHog network error cannot throw
  up into a game's win handler [@client-ts] [@client-test].
- **Play sessions track active (foreground) time, not wall-clock time.**
  `startPlaySession(gameId, mode)` fires `game_start` immediately and returns
  an end function that fires `game_end` with `durationSec` and `rounds`
  [@client-ts]. An `AppState` listener registered in `setupAnalytics` pauses
  the session's `activeMs` accumulator when the app backgrounds and resumes it
  on return to `active`, and also calls `flushAnalytics()` on every background
  transition so queued sink events are not lost if the app is killed while
  backgrounded [@client-ts]. `durationSec` is therefore foreground time only
  — a session left open in the background for an hour does not inflate it.

## Where sessions and rounds are reported from

`usePlaySession(gameId, mode)` is a thin hook wrapper: on mount it calls
`startPlaySession` and returns the end function as the effect's cleanup, so
`game_start`/`game_end` fire exactly once per mount regardless of which screen
calls it [@use-play-session]. Two screens call it, and the `mode` argument is
what tells it apart from the other: `GamePlayerScreen` calls
`usePlaySession(game ? gameId : null, 'free')` for ordinary grid play
[@game-player-screen], and `FlowPlayerScreen` calls
`usePlaySession('journey', 'journey')` for the guided journey, treating the
whole journey as one session with the literal id `'journey'` rather than one
session per game inside it [@flow-player-screen]. `FlowPlayerScreen` also
fires `journey_done` itself, once, on the `playing` → `done` status
transition (guarded by a `lastStatus` ref so re-opening an already-finished
journey does not refire it) [@flow-player-screen].

`round_complete` needs no per-game code at all: `trackRound(gameId, stars)` is
called from inside `awardStars` itself — "if (stars > 0) trackRound(gameId,
stars);" runs before the reward queue's read-modify-write even starts
[@rewards-store]. Because every game's win path already goes through
`awardStars` (see
[Rewards, stars, and stickers](rewards-and-stickers)), every game is covered
by `round_complete` automatically, and `trackRound` also increments the
current session's `rounds` counter if one is active, which is what feeds
`game_end`'s `rounds` prop [@client-ts] [@rewards-store].

## Parent opt-out and the settings integration

`Settings` carries one new field, `analyticsEnabled: boolean`, defaulting to
`true` [@settings-store]. `client.ts` subscribes to `settingsStore` and calls
`sink.setEnabled(enabled)` on every sink whenever that field flips, and
`send()` drops every event outright while `enabled` is false — turning
sharing off stops data leaving the device immediately, not just stops new
sessions from starting [@client-ts] [@client-test]. `SettingsScreen` exposes
this as an ordinary toggle ("Share anonymous usage stats") alongside sound and
haptics, unlike the age filter and journey controls it does not sit behind the
[parent gate](../decisions/parent-gate-for-settings) — a parent can reach it
without solving the challenge, the same ungated treatment the Settings schema
page gives sound and language for being "urgent and trivially reversible";
see the [Settings schema](../reference/settings-schema) reference for the
rest of that record.

## Picking a backend at boot

`initAnalytics()`, called once from an `App.tsx` effect, is the only place
`sinks/posthog.ts` can get loaded, and even that load is conditional
[@app-tsx] [@init-ts]. `init.ts` reads `EXPO_PUBLIC_ANALYTICS_PROVIDER`,
`EXPO_PUBLIC_ANALYTICS_KEY`, and `EXPO_PUBLIC_ANALYTICS_HOST` (defaulting to
PostHog's EU ingest host) from EAS env vars at build time; without a key set,
`sinks()` returns `[consoleSink()]` in dev builds (logging every event instead
of sending it) or `[]` in a production build with no key configured
[@init-ts] [@console-sink]. The PostHog sink itself is requested with
`require(...)` rather than a static `import`, specifically so a build without
`EXPO_PUBLIC_ANALYTICS_KEY` never initializes the vendor SDK module at all
[@init-ts]. The sink that is created locks PostHog down for a kids app —
`personProfiles: 'never'` (no person profiles, the cheapest anonymous tier),
`disableGeoip: true`, and lifecycle events, session replay, surveys, and
feature flags all explicitly disabled, so nothing beyond the app's own
`track()` calls is ever captured [@posthog-sink]. `setupAnalytics` is kept out
of the `@/sdk` barrel on purpose — `docs/ANALYTICS.md` notes `init.ts` is
"App.tsx only, not in the barrel" — so that no test importing `@/sdk` can
transitively load a vendor SDK, which is also why `vendorBoundary.test.ts`
only has to scan source files rather than worry about the barrel re-exporting
something it should not [@analytics-md].

Swapping or adding a vendor is meant to stay a one-file change: add
`sinks/<vendor>.ts` implementing `AnalyticsSink`, and select it in `init.ts`;
`docs/ANALYTICS.md` recommends running both the old and new sink for a few
weeks during a migration so trend lines do not break [@analytics-md].

## Consequence for App Store and Play Store declarations

Because the app now collects anonymous product-interaction analytics, the
"no data collected" store declarations the release guides used to state are
no longer accurate. `docs/ANALYTICS.md` records the required replacements —
Play's **Data safety**: App activity → App interactions, collected but not
shared, optional via the parent toggle, purpose Analytics, not linked to
identity; Apple's **App Privacy**: Usage Data → Product Interaction, not
linked to the user, not used for tracking [@analytics-md]. See
[Release an iOS build](../guides/release-an-ios-build) for where that now
appears in the App Store Connect submission checklist.

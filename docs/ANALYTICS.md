# Analytics

Anonymous, coarse usage events: which games are played, journey vs free play,
how long, how many rounds. Used to judge whether a release helped.

## Design

```
src/sdk/analytics/
  events.ts      typed event catalogue (the only contract)
  types.ts       AnalyticsSink interface
  client.ts      facade: context props, parent opt-out, queue, fan-out, play sessions
  usePlaySession.ts
  init.ts        boot wiring + backend selection (App.tsx only, not in the barrel)
  sinks/         the ONLY place a vendor SDK may be imported (guarded by vendorBoundary.test.ts)
```

- Callers use `track(event, props)` / `usePlaySession(gameId, mode)` from `@/sdk`; never a vendor API.
- `round_complete` comes from `awardStars`, so every game that awards stars is covered with no per-game code.
  `misses`/`hint` come from `useHintLadder` (and `useChoiceHints`/`useFlowRound` on top of it), also with no per-game code.
- `game_end.endedBy` is set by the player screens (`markSessionEnd`): the game-exit context (`useRoundEnd().end`) is
  `complete`, the error boundary `error`, the play-limit break `limit`; anything else is `back`. A game the OS killed in
  the background sends no `game_end`, so starts minus ends counts those.
- Swapping vendors = add `sinks/<vendor>.ts` and select it in `init.ts`. To migrate without losing trends,
  return both sinks from `init.ts` for a few weeks, then drop the old one.
- Settings → General → "Share anonymous usage stats" (`settings.analyticsEnabled`, default on) stops all
  sending and opts the vendor SDK out.

## Events

| Event | Props |
|---|---|
| `app_open` | — |
| `game_start` | `gameId`, `mode` (`free` / `journey`) |
| `game_end` | `gameId`, `mode`, `durationSec` (foreground only), `rounds`, `endedBy` (`complete` / `back` / `error` / `limit`), `secondsToFirstRound` (null if none), `backgrounded` |
| `round_complete` | `gameId`, `mode`, `stars`, `misses` + `hint` (`none` / `retry` / `highlight` / `reveal`), both null when the game has no hint ladder |
| `journey_done` | `total` |
| `app_error` | `where` (`app`, `game:<id>`, `flow:<id>`, `3d:<id>`, `global`), `message` (≤100 chars), `fatal` |
| `tutorial_shown` / `tutorial_done` | `id` (the `useFirstRun` id), `mode` |
| `idle_hint` | `id` (game id), `mode` — the idle help came back (`useIdle` / `useGuide`) |
| `moment_shown` / `moment_done` | `type` (`ayah` / `hadith` / `dua` / `howto`), `id` (moment id, `#part` for how-to slices); `moment_done` adds `misses` |
| `occasion_seen` | `id` (`ramadan` / `eid-al-fitr` / `eid-al-adha`) — Home opened on an occasion day, once per day |
| `gl3d_disabled` | — (last launch died starting a GL context; 3D is off on this build for this device) |

Every event also carries `appVersion`, `build`, `updateId`, `channel`, `platform`, `language`, `ageBand`, `appMode`.

Rules: no names, free text, location or device identifiers; keep events per game/round, never per tap.
Add new events to `events.ts` first.

## PostHog setup

Config lives in `sinks/posthog.ts`: `personProfiles: 'never'` (anonymous events, cheapest tier),
`disableGeoip`, no lifecycle events, session replay, surveys or feature flags.

1. Create a PostHog **EU Cloud** project; copy its project API key (`phc_…`, public by design).
   Never put a personal API key (`phx_…`) in the app.
2. Set EAS env vars for the `production` (and optionally `preview`) environment:
   ```bash
   eas env:create --environment production --name EXPO_PUBLIC_ANALYTICS_PROVIDER --value posthog --visibility plaintext
   eas env:create --environment production --name EXPO_PUBLIC_ANALYTICS_KEY --value phc_xxx --visibility plaintext
   ```
   `EXPO_PUBLIC_ANALYTICS_HOST` defaults to `https://eu.i.posthog.com`.
3. Without a key nothing is sent; dev builds log to the console instead
   (`EXPO_PUBLIC_ANALYTICS_IN_DEV=1` in `.env.local` sends from dev too).
4. In PostHog, set a billing limit before adding a card.

The SDK adds native modules (`expo-application`, `expo-device`), so it ships with a **store build**, not OTA.

## Dashboards

The PostHog dashboards are code: `scripts/analytics/posthog-dashboards.mjs`. Edit an insight there and
re-run; dashboards and insights are matched by name and updated in place (links stay), nothing is deleted.

1. In PostHog → Settings → Personal API keys, create a key with scopes `dashboard:write`, `insight:write`,
   `project:read`, limited to this project. It stays on your machine; never put it in the app or EAS env.
2. Add to `.env.local` (git-ignored):
   ```
   POSTHOG_PERSONAL_API_KEY=phx_…
   POSTHOG_PROJECT_ID=12345   # the number in the PostHog URL
   ```
3. `npm run analytics:dashboards` (`-- --dry-run` prints the queries; `-- --channel all` drops the
   default dashboard filter `channel = production`, which keeps preview APKs out).

| Dashboard | Answers |
|---|---|
| Overview | 7-day KPIs vs previous week, minutes per device per day, DAU/WAU, weekly and D1–D14 retention, days played per week, free vs journey, age band / language / platform, hour of day |
| Games | per-game scorecard (plays, reach, plays per device, minutes, rounds, quit-before-first-round %, journey share), popularity, session length, first-play funnel, journeys |
| Releases & stability | crashes 7d, errors per day, errors/crashes per 1k opens by version, top errors, version adoption, OTA update ids, `gl3d_disabled` |

Counts are anonymous devices (`distinct_id`), not children. A shared tablet counts once.

## Store declarations (update before the release ships)

- **Play Data safety**: App activity → App interactions: collected, not shared, processed not ephemerally,
  optional (parent can turn off), purpose Analytics. Not linked to identity.
  App info and performance → Crash logs (`app_error`): same answers.
- **App Store App Privacy**: Usage Data → Product Interaction, not linked to the user, not used for tracking;
  Diagnostics → Crash Data (`app_error`), same answers.
- **Privacy policy** (TermsFeed): describe anonymous usage stats, PostHog EU as processor, the Settings opt-out.

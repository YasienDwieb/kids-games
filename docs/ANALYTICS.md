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
- Swapping vendors = add `sinks/<vendor>.ts` and select it in `init.ts`. To migrate without losing trends,
  return both sinks from `init.ts` for a few weeks, then drop the old one.
- Settings → General → "Share anonymous usage stats" (`settings.analyticsEnabled`, default on) stops all
  sending and opts the vendor SDK out.

## Events

| Event | Props |
|---|---|
| `app_open` | — |
| `game_start` | `gameId`, `mode` (`free` / `journey`) |
| `game_end` | `gameId`, `mode`, `durationSec` (foreground only), `rounds` |
| `round_complete` | `gameId`, `mode`, `stars` |
| `journey_done` | `total` |

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

## Store declarations (update before the release ships)

- **Play Data safety**: App activity → App interactions: collected, not shared, processed not ephemerally,
  optional (parent can turn off), purpose Analytics. Not linked to identity.
- **App Store App Privacy**: Usage Data → Product Interaction, not linked to the user, not used for tracking.
- **Privacy policy** (TermsFeed): describe anonymous usage stats, PostHog EU as processor, the Settings opt-out.

---
title: "Store Review Prompt"
summary: "src/sdk/review/review.ts decides when to show the native App Store/Play Store rating sheet, and only ever fires it from behind the parent gate, because Apple's Kids category and Play's Families policy forbid asking a child to rate the app."
topics: [architecture, engagement, settings]
sources:
  - id: review
    type: file
    path: src/sdk/review/review.ts
  - id: review-test
    type: file
    path: src/sdk/review/__tests__/review.test.ts
  - id: settings-screen
    type: file
    path: src/screens/SettingsScreen.tsx
  - id: sdk-barrel
    type: file
    path: src/sdk/index.ts
---

`src/sdk/review/review.ts` owns the one moment the app is allowed to ask for a
store rating. The module's own header comment states the constraint driving
its whole design: "Apple's Kids category and Play's Families policy keep
rating prompts away from the child, so the native sheet is shown to a
grown-up who just unlocked Settings, and only once the child has clearly
enjoyed the app" [@review]. That single sentence explains both why this
module exists only behind `SettingsScreen`'s access control and why it adds a
usage threshold on top of that: the gate alone proves an adult is present, but
not that the app is worth rating yet.

## Wired to the parent gate's unlock moment, not to a screen

`SettingsScreen` calls `maybeAskForReview()` from a `useEffect` that fires only
when `unlocked` turns `true`, with an 800ms `setTimeout` "so the sheet lands on
top of Settings, not mid-transition" [@settings-screen]. This is a new use of
the [parent gate](../decisions/parent-gate-for-settings)'s unlock event: every
earlier consumer of `unlocked` reveals UI, while this one fires a side effect
with no visible connection to any control the parent just tapped. Because the
effect is keyed on `unlocked` rather than on screen mount, navigating away and
back re-triggers it — `maybeAskForReview()` is written to be "safe to call
often" and is itself the gatekeeper against asking too frequently [@review].

## Two different entry points for two different problems

`maybeAskForReview()` is the automatic path: it reads `rewardsStore`,
`playtimeStore`, and `reviewStore` together, calls `shouldAskForReview()` to
decide, and only then checks `StoreReview.hasAction()` and calls
`StoreReview.requestReview()` from `expo-store-review` — the native OS rating
sheet [@review]. `openStoreReview()` is a second, independent entry point
wired to a "Rate" row and button on `SettingsScreen` itself (gated, inside the
regular Settings content, not the `useEffect`) [@settings-screen]. It never
calls the native sheet; it opens the app's store listing page directly
(`market://details?id=dev.waybeyond.kidszone` on Android,
`itms-apps://apps.apple.com/app/id6793942277?action=write-review` on iOS, each
falling back to the `https://` web URL if the app-scheme `Linking.openURL`
call rejects) [@review]. The code comment explains why the manual row cannot
reuse the native sheet: "the OS silently drops it once its quota is spent,
which would make the button look broken" [@review] — both Apple and Google
rate-limit how often `requestReview()` actually shows anything, with no error
and no callback to tell the caller it was skipped, so a button that relies on
it would appear to do nothing once the quota is spent.

## The threshold that gates the automatic ask

`shouldAskForReview(rewards, playtime, state, now)` is a pure function, kept
separate from the async `maybeAskForReview()` specifically so its rules can be
tested without mocking `expo-store-review` or `AsyncStorage` [@review]
[@review-test]. It requires, in order: lifetime stars at or above
`REVIEW_MIN_STARS` (`15`); play recorded on at least `REVIEW_MIN_DAYS` (`2`)
distinct days in `playtimeStore`'s `days` map, so one long first sitting is
never enough on its own; and either no prior ask (`state.askedAt == null`) or
at least `REVIEW_COOLDOWN_DAYS` (`120`) days since the last one [@review]. The
two-day rule and the 120-day cooldown are both read straight from constants
exported alongside the function, so a future change to any threshold is a
one-line edit with an existing test already pinned to the old values
[@review-test]. `maybeAskForReview()` wraps the whole sequence — including the
`reviewStore.set({ askedAt: Date.now() })` write, done before
`requestReview()` is even awaited — in a `try/catch` that swallows every
error, because "a review prompt is never worth an error in front of a parent"
[@review].

## Storage and exports

The ask timestamp persists as `kg:review`, `{ askedAt: number | null }`,
through the same `createStore` primitive every other persisted value in the
app uses; see [Storage keys](../reference/storage-keys) for the key table
this module adds a row to. `maybeAskForReview`, `openStoreReview`,
`shouldAskForReview`, and the `ReviewState` type are re-exported from the
`@/sdk` barrel [@sdk-barrel] — see the
[SDK public API](../reference/sdk-public-api) reference for where they sit
among the barrel's other exports. The module reads `rewardsStore` and
`playtimeStore` directly rather than through a hook, since it runs once as a
fire-and-forget effect rather than rendering anything itself; see
[Rewards, stars, and stickers](rewards-and-stickers) for what `rewardsStore`
tracks and [Storage keys](../reference/storage-keys) for `kg:playtime`'s
shape.

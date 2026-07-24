---
title: "Settings Schema Reference"
summary: "The exact Settings type, its defaults, and which subsystem reads each field."
topics: [reference, settings]
sources:
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: settings-screen
    type: file
    path: src/screens/SettingsScreen.tsx
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: use-sound
    type: file
    path: src/sdk/audio/useSound.ts
  - id: use-language
    type: file
    path: src/sdk/i18n/useLanguage.ts
  - id: settings-store-test
    type: file
    path: src/sdk/settings/__tests__/store.test.ts
  - id: use-settings-hook
    type: file
    path: src/sdk/settings/useSettings.ts
---

`Settings` is the single record persisted for the whole app — one shared
object, not one row per feature — defined in `src/sdk/settings/store.ts` and
read through the `useSettings` hook everywhere a screen or game needs to know
sound state, the parent-set age filter, language, or guided-journey
configuration [@settings-store]. This page is the exact field list, default
values, and the concrete code that consumes each field, so a change to a
default or a field's meaning can be checked against real call sites instead of
guessed at.

## Field table

| Field | Type | Default | Consumer |
|---|---|---|---|
| `soundEnabled` | `boolean` | `true` | Gates `useSound`, `useLoopSound`, and `useSpeech` — each checks `settings.soundEnabled` before playing anything [@use-sound]. |
| `hapticsEnabled` | `boolean` | `true` | Gates the haptic pulse inside `useSound`, unless a call site passes `{ haptic: false }` [@use-sound]. |
| `ageBand` | `string \| null` | `null` | `HomeScreen` filters the game grid with `gamesForBand(settings.ageBand)` when set; `null` shows every registered game via `getAllGames()` [@home-screen]. Set from Settings' "Show games for" chip row. |
| `language` | `string \| null` | `null` | `bootstrapLanguage()` reads it at boot; `null` means "follow the device language" on first run, after which `useLanguage().changeLanguage()` persists an explicit choice [@use-language]. |
| `mode` | `'free' \| 'guided'` | `'free'` | Declared as "`'free'` = game grid (default); `'guided'` = the learning journey" [@settings-store], and a dedicated test pins the default to `'free'` [@settings-store-test]. No screen currently reads or writes this field — `HomeScreen`'s guided-journey card is shown unconditionally and is driven by `flowGameIds`, not by `mode` [@home-screen]. |
| `flowGameIds` | `string[] \| null` | `null` | `null` means every flow-eligible game participates. `SettingsScreen`'s per-game `Chip` row toggles ids in and out of the array (collapsing back to `null` once every eligible game is re-selected); `HomeScreen` and `FlowPlayerScreen` both call `selectedAdapters(settings.flowGameIds)` to build the actual journey sequence [@settings-screen] [@home-screen]. |

## Reading and writing settings

`DEFAULT_SETTINGS` is the object returned by `settingsStore.get()` the first
time the app runs, before anything has been written to `AsyncStorage`
[@settings-store]. `SettingsScreen` never talks to `settingsStore` directly:
it calls `useSettings()` for the current `settings` object and an `update`
function, and every control on the screen — the sound/haptics `Switch`
toggles, the language `Chip` row, the age-band `Chip` row, and the per-game
flow `Chip` row — calls `update({ <field>: <value> })` with a partial patch
[@settings-screen]. The guided-journey reset control on the same screen,
`HoldToConfirm`, does not touch `Settings` at all; it writes directly to the
separate flow checkpoint store via `createFlowProgressStore().set(...)`,
which is documented on the [Storage keys](../reference/storage-keys)
reference page [@settings-screen].

Because `Settings` is one record, `useSettings`'s `update` function always
re-reads the store, spreads the patch over the last-read value, and writes the
merged object back — `{ ...(await settingsStore.get()), ...patch }` — rather
than replacing individual keys at the storage layer [@use-settings-hook]. See
[Storage and progress](../architecture/storage-and-progress) for the
`createStore` mechanics this and every other persisted value in the app share.
The [Flow engine](../architecture/flow-engine) page explains how `flowGameIds`
and the flow checkpoint together decide what a resumed guided journey looks
like.

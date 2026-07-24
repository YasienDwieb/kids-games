---
title: "Storage Keys Reference"
summary: "Every AsyncStorage key namespace the app writes, its shape, and the module that owns it."
topics: [reference, storage]
sources:
  - id: create-store
    type: file
    path: src/sdk/storage/createStore.ts
  - id: progress-store
    type: file
    path: src/sdk/progress/store.ts
  - id: flow-progress
    type: file
    path: src/sdk/flow/progress.ts
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
---

Every value this app persists across launches goes through one function,
`createStore<T>(namespace, defaultValue)`, which turns a short namespace
string into the literal `AsyncStorage` key `` `kg:${namespace}` `` and hands
back a `Store<T>` with `get`/`set`/`subscribe` [@create-store]. There is no
second persistence path in the codebase — settings, per-game progress, and the
guided-journey checkpoint are all just different namespaces passed into the
same function. This page lists every namespace currently in use, so a reader
can tell at a glance what key an `AsyncStorage.getItem` call in a debugger or
device dump corresponds to.

## Key table

| Key pattern | Shape | Owner module |
|---|---|---|
| `kg:settings` | `Settings` — one shared record (`soundEnabled`, `hapticsEnabled`, `ageBand`, `language`, `mode`, `flowGameIds`) | `src/sdk/settings/store.ts`, via `settingsStore = createStore('settings', DEFAULT_SETTINGS)` [@settings-store] |
| `kg:progress:<gameId>` | `Progress` — `{ level: number, score: number, updatedAt: number }`, one key per game (e.g. `kg:progress:letter-land`) | `src/sdk/progress/store.ts`, via `createProgressStore(gameId)` which calls `createStore(\`progress:${gameId}\`, DEFAULT_PROGRESS)` [@progress-store] |
| `kg:flow:progress` | `FlowProgress` — `{ step: number, seed: number, updatedAt: number }`, one shared checkpoint for the whole guided journey | `src/sdk/flow/progress.ts`, via `createFlowProgressStore()` which calls `createStore('flow:progress', DEFAULT_FLOW_PROGRESS)` [@flow-progress] |

`DEFAULT_PROGRESS` uses `updatedAt: 0` as the sentinel for "never played"
[@progress-store], and `DEFAULT_FLOW_PROGRESS` uses `seed: 0` together with
`updatedAt: 0` as the sentinel for "journey never started" [@flow-progress] —
both defaults double as the value `get()` falls back to, so a fresh
`AsyncStorage` install and an explicitly-reset checkpoint are indistinguishable
by design.

## The get/set contract every key shares

`get()` reads the raw string at the key, returns the store's `defaultValue` if
the key is missing, parses it as JSON, and falls back to `defaultValue` again
if parsing throws — so a corrupted or partially-written value can never crash
a caller, it just behaves like a fresh install [@create-store]. `set(value)`
writes `JSON.stringify(value)` to `AsyncStorage` and then synchronously calls
every subscriber registered through `subscribe(fn)` with the new value
[@create-store]. This is the mechanism that lets `useSettings` and `useLevels`
re-render as soon as another part of the app calls `update()` or `advance()`
without any polling: they subscribe once and get pushed the new value the
moment `set()` resolves.

The [Storage and progress](../architecture/storage-and-progress) architecture
page explains how the per-game `Progress` checkpoint and `Settings` record are
built on top of this shared primitive, the
[Flow engine](../architecture/flow-engine) page explains how
`kg:flow:progress` drives journey resume, and the exact `Settings` fields
persisted at `kg:settings` are listed on the
[Settings schema](../reference/settings-schema) reference page.

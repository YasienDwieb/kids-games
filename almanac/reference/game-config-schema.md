---
title: "Game Config Schema Reference"
summary: "The exact GameConfig field list a game's config.ts must satisfy, the validation rules registerGame enforces before a config reaches the registry, and the layout.mode enum that controls shell vs. bare rendering."
topics: [reference, games]
sources:
  - id: config-types
    type: file
    path: src/sdk/config/types.ts
  - id: validate-ts
    type: file
    path: src/sdk/config/validate.ts
  - id: registry-ts
    type: file
    path: src/sdk/config/registry.ts
  - id: validate-test
    type: file
    path: src/sdk/config/__tests__/validate.test.ts
  - id: registry-test
    type: file
    path: src/sdk/config/__tests__/registry.test.ts
  - id: order-test
    type: file
    path: src/sdk/config/__tests__/order.test.ts
---

This page is the exact field-by-field contract for `GameConfig`, the object
every [game module](../concepts/game-module) passes to `registerGame()`, and
the validation rules `validateGameConfig` enforces on that object before the
[game registry](../architecture/game-registry) will store it [@config-types]
[@validate-ts]. Use it as a lookup when writing or auditing a game's
`config.ts`; for the story of how registration and boot ordering work, see
the game registry architecture page, and for the end-to-end steps of adding a
new game, see [Add a new game](../guides/add-a-new-game).

## `GameConfig` fields

| Field | Type | Required | Constraint |
|---|---|---|---|
| `id` | `string` | yes | Must match `/^[a-z0-9]+(-[a-z0-9]+)*$/` — kebab-case, lowercase letters/digits/hyphens only [@config-types] [@validate-ts] |
| `name` | `string` | yes | Non-empty [@validate-ts] |
| `description` | `string` | yes | Non-empty [@validate-ts] |
| `icon` | `string` | yes | Non-empty (an emoji glyph in every current game) [@config-types] [@validate-ts] |
| `ageRange` | `{ min: number; max: number }` | yes | Both fields must be numbers; `min` must be `<= max` [@config-types] [@validate-ts] |
| `component` | `ComponentType` | yes | Must be a function [@config-types] [@validate-ts] |
| `backgroundColor` | `string` | yes | Non-empty [@config-types] [@validate-ts] |
| `accent` | `AccentName` | no | One of the six accent names from `ACCENTS` (`green`, `orange`, `coral`, `purple`, `blue`, `pink`); falls back to a derived accent when omitted [@config-types] |
| `order` | `number` | no | Ascending Home-screen sort weight; not validated. Omitted games sort after every game that declares one, in registration order — see [Game registry](../architecture/game-registry) for the exact `byOrder()` behavior [@config-types] [@order-test] |
| `tags` | `string[]` | no | Free-form; not validated [@config-types] |
| `layout` | `GameLayoutOptions` | no | See layout fields below [@config-types] |
| `bands` | `string[]` | no | Explicit age-band override, bypassing the derivation from `ageRange` [@config-types] |
| `version` | `string` | no | Free-form; not validated [@config-types] |
| `author` | `string` | no | Free-form; not validated [@config-types] |

## `GameLayoutOptions` fields

| Field | Type | Default | Meaning |
|---|---|---|---|
| `mode` | `'shell' \| 'bare'` | `'shell'` | `'shell'` wraps the game in `GameShell`; `'bare'` gives the game a raw safe-area canvas with no shared chrome [@config-types] |
| `showBack` | `boolean` | `true` (shown) | Set `false` to hide the floating back button `GameShell` renders [@config-types] |

`GameLayoutOptions` no longer has a `title` field — `GameShell` used to render
an `AppBar` with a centered game title, but that chrome was removed along with
the `AppBar` itself once shell-mode games were unified with the bare-mode
floating layout; see [Game shell and back navigation](../architecture/game-shell-and-back-navigation)
for why. A `config.ts` written against an older version of this schema that
still sets `layout: { title: '...' }` fails to type-check against the current
`GameLayoutOptions`.

`layout.mode` is not validated by `validateGameConfig` — an invalid string
would only surface as a TypeScript type error at the `config.ts` call site,
not a runtime throw. The shell-vs-bare rendering split itself, and the
`ScreenBackContext`/`useScreenBack` protocol a `bare` game uses to intercept
back presses, are covered on the
[Game shell and back navigation](../architecture/game-shell-and-back-navigation)
page rather than here.

## Validation order and errors

`validateGameConfig(config)` runs as the first step inside `registerGame()`,
before any duplicate-id check and before the config is written into the
registry [@registry-ts]. Every failure throws `Error("Invalid game config:
<message>")`, where `<message>` names the specific field:

- Missing or non-string `id` throws `"id is required"`; an `id` that fails
  the kebab-case pattern throws `` `id "<id>" must be kebab-case (a-z, 0-9,
  hyphens)` `` — both match `/id/` [@validate-ts] [@validate-test].
- Missing `name`, `description`, `icon`, or `backgroundColor` each throw a
  message naming that field, prefixed with the game's `id` [@validate-ts].
- A non-function `component` throws `` `id "<id>": component is required` ``,
  matching `/component/` [@validate-ts] [@validate-test].
- A missing `ageRange` or non-numeric `min`/`max` throws `` `ageRange {
  min, max } is required` ``; an `ageRange` where `min > max` throws a
  message matching `/ageRange/`, e.g. `` `ageRange.min (8) must be <=
  ageRange.max (3)` `` [@validate-ts] [@validate-test].

After validation passes, `registerGame` separately checks
`if (registry[config.id])` and throws `` `Invalid game config: duplicate id
"<id>"` `` if the id is already taken — this check runs strictly after field
validation, so a colliding id with an otherwise-invalid config still fails on
the field error first [@registry-ts] [@registry-test].

---
title: "Add A Translated String"
summary: "How to add a new user-facing string so it resolves correctly in English and Arabic and is caught by the manual i18n key guard."
topics: [guides, i18n]
sources:
  - id: contract
    type: file
    path: src/games/I18N_CONTRACT.md
  - id: keys-test
    type: file
    path: src/sdk/i18n/__tests__/keys.test.ts
  - id: en-locale
    type: file
    path: src/sdk/i18n/locales/en.ts
  - id: i18n-index
    type: file
    path: src/sdk/i18n/index.ts
---

Adding a string to Kids Zone means more than dropping a literal into JSX. Every
user-facing string has to exist as a matched key in both an English and an
Arabic locale file, resolve through `t()` at runtime, and be listed in
`src/sdk/i18n/__tests__/keys.test.ts` — the one test in the repo that would
actually notice a typo'd or half-registered key [@keys-test]. This guide covers
that full path for both core (shared chrome) strings and per-game strings.

## Decide Where The Key Lives

The i18n instance has one `core` namespace plus one namespace per game, keyed
by the game's own `id` [@i18n-index]. If the string belongs to shared chrome —
Home, Settings, the flow player — it goes in `src/sdk/i18n/locales/en.ts` and
`ar.ts` under the `core` namespace [@en-locale]. If it belongs to one specific
game, it goes in that game's own `src/games/<id>/locales/en.ts` and `ar.ts`,
under that game's own namespace, and the SDK/other games must not be touched
for it [@contract]. Mixing the two — adding a game string to the shared core
file — breaks the whole point of the per-game namespace split described in
[i18n and RTL](../architecture/i18n-and-rtl): games can localize themselves
without editing files another game or the SDK owns.

## Add The English Value

Add the key under the right section of `en.ts` (core or game-local). `en.ts` is
the type source: game locale files derive a `GameTranslations` structural type
from it, so TypeScript enforces that `ar.ts` has every key `en.ts` has, but it
does not check that the Arabic *value* is filled in with anything meaningful,
only that a string is present [@contract].

## Add The Arabic Value

Add the matching key to `ar.ts` with a real Arabic value, not a placeholder and
not a literal machine translation. `src/games/I18N_CONTRACT.md` asks for warm,
kid-friendly Arabic that a child would actually understand, and for Western
digits in any numbers or scores rather than Arabic-Indic digits [@contract].
Because TypeScript only checks key shape, a lazy or copy-pasted Arabic value
will compile cleanly and still ship a broken translation — the human step of
writing a real Arabic value is the only thing that catches that.

## Call It From The Component

Add `const { t } = useTranslation();` in the component and replace the literal
with `t('<namespace>:key')` for a game string, or `t('key')` for a core string
since `core` is the default namespace and does not need a prefix [@i18n-index].
Leave emoji and asset-intent strings (like sound tags) as plain literals —
those are not translated content [@contract].

## Register The Key In The Guard Test

This is the step that is easy to forget and the one this guide exists to
emphasize: add the exact key string (e.g. `'my-game:section.newKey'`) to the
`KEYS` array in `src/sdk/i18n/__tests__/keys.test.ts` [@keys-test]. The test
matters because nothing else in the repo would catch a broken key. `tsc` only
type-checks the locale *files*, not the string arguments passed to `t()`
inside components, and Jest here never renders a screen, so a raw, unresolved
key silently rendered into the UI is otherwise invisible until a human looks
at the running app [@keys-test]. The test itself changes language to `en` and
then `ar` and, for every key in the list, asserts `i18n.exists(key)` is true
and that `i18n.t(key)` returns a real string that is not equal to the full key
itself — the exact failure mode of a key that was referenced but never
registered [@keys-test].

## Verify

Run `npm test` and confirm the `translation keys resolve in en` and
`translation keys resolve in ar` suites pass for your new key. If the string
sits near directional layout — an icon, an arrow, or a row of characters near
an edge of the screen — also check the RTL rules in
[i18n and RTL](../architecture/i18n-and-rtl) before considering the change
done; those rules (start/end instead of left/right, flipping directional
glyphs, pinning left-to-right numeric sequences) are enforced by convention,
not by any test. For the broader process of wiring a brand-new game's
translation bundle from scratch — `locales/en.ts`, `locales/ar.ts`, and the
`i18n.ts` registration side effect — see
[Add a new game](../guides/add-a-new-game).

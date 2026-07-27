---
title: "i18n and RTL Architecture"
summary: "One shared i18next instance holds a 'core' namespace plus one namespace per game, registered at import time; native RTL state (not i18n.language) drives fonts and layout direction, and a hard-coded key list in keys.test.ts is the only guard against a silently-broken translation lookup."
topics: [architecture, i18n, rtl]
sources:
  - id: i18n-index
    type: file
    path: src/sdk/i18n/index.ts
  - id: i18n-types
    type: file
    path: src/sdk/i18n/types.ts
  - id: use-language
    type: file
    path: src/sdk/i18n/useLanguage.ts
  - id: keys-test
    type: file
    path: src/sdk/i18n/__tests__/keys.test.ts
  - id: i18n-contract
    type: file
    path: src/games/I18N_CONTRACT.md
  - id: typography
    type: file
    path: src/constants/typography.ts
  - id: letter-land-en
    type: file
    path: src/games/letter-land/locales/en.ts
  - id: app-bar
    type: file
    path: src/components/common/AppBar.tsx
  - id: back-button
    type: file
    path: src/components/common/BackButton.tsx
  - id: archer
    type: file
    path: src/games/balloon-archer/components/Archer.tsx
  - id: arrow
    type: file
    path: src/games/balloon-archer/components/Arrow.tsx
---

The app runs one shared `i18next` instance, initialized once in
`src/sdk/i18n/index.ts` with a single default namespace, `'core'`
[@i18n-index]. Every [game module](../concepts/game-module) adds its own
namespace to that same instance at runtime, so `t('letter-land:hearFind.which')`
and `t('core:home.title')` are lookups into two different registered bundles
inside one i18next object rather than two separate translation systems. RTL
support is layered on top of this by keying font family and layout direction
off the *native* `I18nManager.isRTL` flag rather than off `i18n.language`,
because the native flag is synchronously correct from the first line of JS on
every boot, before any translation state has loaded [@i18n-index]. A
hard-coded array of every `t()` key the app actually calls, in
`keys.test.ts`, is the only thing in the repo that would catch a typo'd
translation key — neither `tsc` nor a snapshot-free Jest run renders a screen,
so a missing key is otherwise invisible until a human sees the raw key string
on the device [@keys-test].

## One instance, one namespace per game

`i18n.use(initReactI18next).init({...})` registers `resources: { en: { core:
en }, ar: { core: ar } }` up front, with `defaultNS: 'core'` and
`ns: ['core']` [@i18n-index]. Nothing else is preloaded. Each game adds its
own namespace later by calling `registerTranslations(namespace, { en, ar })`,
which calls `i18n.addResourceBundle(lng, namespace, resources, true, true)`
for every language bundle it is given — `deep: true` so nested keys merge
correctly, `overwrite: true` so Fast Refresh can re-register a bundle cleanly
instead of accumulating stale nested keys [@i18n-index]. Because every game
gets its own namespace instead of writing into one shared catalog file, two
games adding strings in parallel never collide on the same file or the same
flat key space — the namespace itself is the collision boundary. `namespace`
must equal the game's own `id` from `config.ts`, so `t('animal-safari:...')`
and the `animal-safari` [game module](../concepts/game-module) are always the
same string.

## The per-game locale contract

`src/games/I18N_CONTRACT.md` is the exact recipe every game follows, written
so an agent working on one game's strings never has to touch the SDK,
`src/games/index.ts`, or another game's files [@i18n-contract]. A game adds
three files: `locales/en.ts` exporting `const en = {...} as const` (every
user-facing string, including dynamic ones like color names or difficulty
labels buried in a `constants.ts`); `locales/ar.ts` exporting `const ar:
GameTranslations = {...}`, where `GameTranslations` is a mapped type derived
from `typeof en` that maps every leaf string type to `string` [@i18n-contract]
[@letter-land-en]. That type trick is what makes the contract enforceable at
compile time: TypeScript rejects an `ar.ts` that is missing a key or has a
mismatched shape, but it does not — and is not meant to — check that the
Arabic *values* mean the same thing as the English ones. Finally, `i18n.ts`
calls `registerTranslations('<gameId>', { en, ar })` as a module-level side
effect, and `config.ts` imports `./i18n` at the top so the bundle registers
at the same moment the game registers itself with the
[game registry](../architecture/game-registry) [@i18n-contract].

## Boot order: native RTL decides before i18n.language exists

`src/sdk/i18n/index.ts` computes its own initial language as `const
initialLng: LanguageCode = I18nManager.isRTL ? 'ar' : 'en'` — not from device
locale, not from persisted settings [@i18n-index]. The comment on that line
explains why: `I18nManager.isRTL` is a native flag that persists across
reloads and is already correct on the very first line of JS, whereas the
actual persisted language preference is only read later, inside an
asynchronous effect in `App.tsx` that calls `bootstrapLanguage()`
[@i18n-index] [@use-language]. `bootstrapLanguage()` reads
`settingsStore.get()`, falls back to the device language via
`expo-localization` if nothing is persisted, and calls `applyLanguage(code)`
to reconcile that choice with the native flag [@use-language]. If the
persisted language and the native RTL flag already agree — the common case —
nothing about layout direction changes on boot. `LANGUAGES` in
`src/sdk/i18n/types.ts` is the two-entry source of truth this all reads from:
`{code: 'en', rtl: false}` and `{code: 'ar', label: 'العربية', rtl: true}`,
and `isRTL(code)` / `languageMeta(code)` are just lookups into that table
[@i18n-types].

## Switching language at runtime

`applyLanguage(code)` is the function both `bootstrapLanguage()` and the
in-app language switcher call [@use-language]. It compares the RTL-ness the
target language wants against `I18nManager.isRTL`; if they already match, it
calls `i18n.changeLanguage(code)` and returns `{needsReload: false}`. If they
differ, it also calls `I18nManager.allowRTL(wantRTL)` and
`I18nManager.forceRTL(wantRTL)`, then returns `{needsReload: true}` — because
`forceRTL` only takes effect after a reload, `applyLanguage` flips the native
flag but explicitly leaves triggering that reload to its caller
[@use-language]. `useLanguage()` is the hook a screen actually calls: its
`changeLanguage(code)` persists the new language to `settingsStore` first,
then calls `applyLanguage`, so the stored setting is always the source of
truth the next time the app boots, and the caller decides how to surface the
reload — this is the mechanism behind the language switcher in Settings.
`applyLanguage` itself never touches `settingsStore` and never reloads
anything; it only mutates the running i18n/RTL state.

## The keys.test.ts guard

`i18next` is configured with `returnNull: false`, and when a requested key
was never registered under any namespace, `i18n.t(key)` silently renders the
full key string back — no throw, no console warning a developer is likely to
notice mid-development [@keys-test]. `tsc` cannot catch this because
translation keys are plain strings passed to `t()`, and a component-level
Jest test does not render far enough to exercise real key lookups. `keys.test.ts`
closes that gap directly: it imports the real `i18n` instance and `'@/games'`
(so every game's `registerTranslations` side effect has run), then holds a
flat, hand-maintained array of every key any component actually requests —
core keys, every game's `meta.name`/`meta.description`, and the harder dynamic
families like `color-mixer:colors.<id>` or `turbo-road:win.title.p<place>`
[@keys-test]. For both `'en'` and `'ar'`, it asserts `i18n.exists(key) ===
true` and `i18n.t(key) !== key` for every key in that list [@keys-test]. The
test comments explain why both checks matter: `i18n.exists()` is checked
separately because i18next strips the namespace prefix before returning a
fallback for a missing `core:`-namespaced key, which would otherwise make a
bare `value !== key` comparison pass by accident [@keys-test]. Adding a new
user-facing string in either language means adding its key to this array, or
the guard simply does not know to check it — this is the contract the
[Add a translated string](../guides/add-a-translated-string) guide walks
through end to end.

## The module-scope trap: read `isRTL` at access time, not import time

`I18nManager.isRTL` is correct early in boot, but not as early as a plain
module-level constant assumes. Several components originally captured it the
same way: `const BACK_GLYPH = I18nManager.isRTL ? '›' : '‹';` evaluated once,
at the top of the module, the moment the file was first imported
[@app-bar]. That pattern is broken in this app, and it was proven broken on a
real device, not just in theory: one Arabic-language screen showed a
component that read `I18nManager.isRTL` during render mirroring correctly,
while `AppBar`'s back chevron — captured at module scope in the same file —
stayed stuck on the LTR glyph for the entire session, on the same screen, in
the same language. `I18nManager.isRTL` is `false` when modules are first
evaluated and only becomes `true` later in the session, after the native
bridge finishes syncing the flag to JS; a module-level constant freezes
whatever the flag was at that earlier, still-`false` moment, while native
layout mirroring (which does not depend on this JS value at all) already
mirrors correctly — so the visual bug looks like a layout-mirroring failure
but is really a stale-constant bug.

The fix, applied in commit `1114d53`, is to defer the read to a function
called at render or access time instead of a captured constant: `AppBar` and
`BackButton` both changed their glyph constant to a `backGlyph()` function
called inside the component body [@app-bar] [@back-button], and
`balloon-archer`'s `Archer` and `Arrow` components applied the same fix to
the sprite-flip transforms that mirror their bow and arrow to face the
correct direction in RTL [@archer] [@arrow]. This is the same pattern
`FONTS` already used for the reason covered on the
[RTL font selection](../decisions/rtl-font-selection) decision page — an
object of getters, so each property resolves `I18nManager.isRTL` at the
moment it is *read*, not at the moment its module was *imported*. The general
rule for any code in this app keyed off `I18nManager.isRTL`: never write
`const x = I18nManager.isRTL ? a : b` at module top level; wrap the read in a
function, a getter, or read it directly inside a component body instead. Web
cannot reproduce this class of bug at all, since RTL there is CSS-driven
rather than a native flag read through the bridge — it only shows up on a
real Android or iOS device.

## Fonts follow the native flag too

Font family selection lives in `src/constants/typography.ts`, not in
`src/sdk/i18n` itself, and it deliberately keys off `I18nManager.isRTL`
rather than `i18n.language` for the same boot-ordering reason the initial
language does: `FONTS.display` and friends are read inside
`StyleSheet.create()` calls that run at module-evaluation time, before
`App`'s effect has set `i18n.language` for the session [@typography]. The
consequence of that choice — that a language switch needing a font change
also needs a full app reload — is recorded on the
[RTL font selection](../decisions/rtl-font-selection) decision page rather
than here; this page only needs the reader to know that both the initial
language and the font family are RTL-flag-driven, keyed the same way, for the
same reason.

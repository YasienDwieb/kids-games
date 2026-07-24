---
title: "Decision: Key Font Selection off I18nManager.isRTL"
summary: "FONTS resolves Latin versus Arabic font families by reading I18nManager.isRTL, not i18n.language, because RTL is synchronously correct at StyleSheet.create() time and a language switch always triggers a full app reload anyway."
topics: [decisions, i18n, rtl, typography]
sources:
  - id: typography
    type: file
    path: src/constants/typography.ts
  - id: reload
    type: file
    path: src/sdk/i18n/reload.ts
  - id: claude-md
    type: file
    path: CLAUDE.md
---

This decision fixes a timing hazard in how the app's design tokens pick a font
family for English versus Arabic, by keying that choice off a native flag that
is available before i18next has finished starting up, rather than off i18next's
own language state. The choice sits inside the app's broader
[i18n and RTL](../architecture/i18n-and-rtl) machinery, and `FONTS` itself is
one of the shared tokens documented in the
[design system](../architecture/design-system).

## Context

React Native's `StyleSheet.create()` runs synchronously at module load time, and
whatever font-family string it captures for a style is fixed at that moment.
`i18n.language`, by contrast, is not settled that early — it only becomes
correct after i18next finishes initializing, which in this app happens inside
an effect in `App.tsx` during boot. If font selection were keyed off
`i18n.language`, the very first render after a cold start — or the render
immediately after a language switch — could capture the wrong font family, or
never pick the right one at all if the read happened before i18next was ready.
`I18nManager.isRTL`, on the other hand, is a native flag set by the platform
itself and is readable synchronously from the first line of JS on every boot,
because the native side already knows the app's layout direction before any
JavaScript runs.

## Decision

`FONTS`, defined in `src/constants/typography.ts`, is an object of getters
rather than a plain object of strings, so that each property resolves its font
family at *access* time instead of at module-load time [@typography]. Each
getter calls `familyFor(role)`, which checks `I18nManager.isRTL` and returns the
Arabic family (`IBMPlexSansArabic_*`) when true, or the Latin family
(`Fredoka_*` for display roles, `Nunito_*` for body roles) when false
[@typography]. The file's own comment states the reasoning directly: "The
family is keyed off `I18nManager.isRTL`, NOT i18n.language: RTL is persisted
natively and is synchronously correct from the first line of JS on every boot,
whereas i18n.language is only set later (in App's effect) — after every
`StyleSheet.create()` has already captured the font family" [@typography].

This choice is only safe because of a second, connected decision: switching the
app's language between English and Arabic also changes native RTL-ness, and
`applyLanguage()` already reports `needsReload: true` whenever the RTL flag
changes as a result. The caller always honors that signal by reloading the
entire JS bundle through `reloadApp()`, which tries `Updates.reloadAsync()` in
production and falls back to `DevSettings.reload()` in development or Expo Go,
where `Updates` is unavailable [@reload]. `CLAUDE.md` documents the same
contract for anyone touching fonts or RTL logic: "Fonts are language-aware via
`FONTS` — ... keyed off `I18nManager.isRTL` (synchronously correct at
`StyleSheet.create()` time; do **not** key UI off `i18n.language`, which isn't
set until App's effect)" [@claude-md].

## Status

Current, and the reload requirement is an accepted, deliberate consequence
rather than an unresolved bug — `reloadApp()`'s own comment states it exists
because "`I18nManager.forceRTL` only takes effect on the next launch," so a
reload is the only way to make the native direction change actually apply
[@reload].

## Consequences

Because a language switch is the only path that ever changes RTL-ness, and
that path always ends in a full reload, the app can safely treat
`I18nManager.isRTL` as stable for the lifetime of any single running session.
That makes it a simple, low-risk key not just for `FONTS` but for any other
RTL-dependent style decision built the same way. The cost is that switching
languages is a heavier operation than a live re-render: the user sees a
"Switching…" notice and the whole JS bundle restarts, rather than the UI
flipping direction in place. This reload-based approach is specific to native
platforms — RTL direction on web is CSS-driven rather than a native flag, so
the same reload path is skipped there.

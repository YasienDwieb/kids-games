---
title: "Decision: Landscape Orientation Lock, Manifest Plus Runtime"
summary: "The app pins itself to landscape with two layered mechanisms — app.json's manifest orientation and a runtime expo-screen-orientation sensor-landscape lock in App.tsx — because the manifest setting alone only allows one fixed landscape direction on Android, and the runtime lock is skipped on web."
topics: [decisions, navigation]
sources:
  - id: app-tsx
    type: file
    path: App.tsx
  - id: app-json
    type: file
    path: app.json
---

This decision fixes how the app enforces landscape-only play: not with a single
setting, but with two layered mechanisms that solve two different problems —
one keeps portrait out entirely, the other lets the child rotate the device
between either landscape direction instead of being locked to just one. Both
mechanisms sit at the very top of the app, next to the boot sequence documented
in [App entry and navigation](../architecture/app-entry-and-navigation).

## Context

Kids Zone is meant to be held like a small handheld console, in landscape, by
young children. `app.json` already declares `"orientation": "landscape"` at the
manifest level [@app-json], which is enough to keep the app out of portrait
mode entirely. But a manifest-level orientation lock on Android pins the app to
a *single* fixed landscape direction — for example, only the orientation where
the home button ends up on the right. A young child holding a device does not
reliably orient it the same way every time; forcing only one of the two
landscape rotations is an awkward, arbitrary physical constraint that a
manifest setting alone cannot lift.

## Decision

The project layers a second, runtime orientation lock on top of the manifest
setting. `App.tsx` calls `ScreenOrientation.lockAsync(ScreenOrientation.
OrientationLock.LANDSCAPE)` inside a `useEffect` that runs once on mount
[@app-tsx]. This is a *sensor* landscape lock: it still rejects portrait, but it
allows the app to rotate freely between both landscape directions as the device
itself is physically turned. The in-code comment states the reasoning directly:
"Lock to *sensor* landscape so the app stays landscape in both directions
(rotating the device flips between left/right). app.json's 'landscape' maps to
a single fixed landscape on Android; this allows both" [@app-tsx]. The effect is
explicitly skipped when `Platform.OS === 'web'`, since a browser tab has no
physical orientation for `expo-screen-orientation` to lock in the first place
[@app-tsx].

## Status

Current, shipping behavior on native platforms (Android and iOS); no orientation
lock is applied on web.

## Consequences

Every screen the app ships — the home rail, `GameShell`, `FlowPlayerScreen`,
every individual game's own layout — is designed for the landscape shape only,
never portrait, because the runtime lock guarantees portrait never reaches
those screens on native. That is a constraint future layout work has to respect
rather than a currently-optional assumption: a screen that assumes it might
render in portrait on native has no way to actually be shown that way. Because
the lock is skipped on web, this guarantee does not extend to that platform —
web users get whatever aspect ratio their browser window happens to be, with no
enforced orientation at all, which is a real platform difference to keep in
mind when adding responsive layout code that is meant to work identically on
both.

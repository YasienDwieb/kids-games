---
title: "Kids Zone Product Name"
summary: "The GitHub repository and package.json still use the older name kids-games, while every store-facing identifier in app.json/eas.json — and NOTICE's own header — now uses Kids Zone; NOTICE reserves both names, plus the buddies Lulu and Zain, as trademarks of the licensor."
topics: [decisions, release]
sources:
  - id: app-json
    type: file
    path: app.json
  - id: eas-json
    type: file
    path: eas.json
  - id: notice
    type: file
    path: NOTICE
---

The open-source repository's GitHub URL and `package.json` `name` field are
still "kids-games" — the project's original name. `NOTICE` has since moved
on: it now opens by calling the project "Kids Zone (formerly \"Kids Games\")"
and reserves both names as trademarks together, alongside the buddies: "'Kids
Zone', 'Kids Games', 'Lulu', 'Zain', and the Kids Zone logo and app icon are
trademarks of the licensor and are not licensed," and "Forks and derivative
works must use a different name and branding" [@notice]. The app the
maintainer actually ships to app stores uses that same "Kids Zone" name, not
the repository's older "Kids Games." This page records that lag — the repo
slug and package name not yet caught up to the rest of the project's naming —
so a future maintainer or forker does not mistake one name for the other.

## Decision (a fact about the current build, not a choice being made here)

Every store-facing identifier uses "Kids Zone" instead of "Kids Games."
`app.json` sets `expo.name` to `"Kids Zone"` and `expo.slug` to `"kids-zone"`
[@app-json]. Both `expo.android.package` and `expo.ios.bundleIdentifier` in
`app.json` are `dev.waybeyond.kidszone` [@app-json], and `eas.json`'s
`submit.production.ios` block carries the matching Apple-side identity (Team
ID, App Store Connect app id) under that same bundle id [@eas-json]. There is
no committed native `ios/` or `android/` project directory in this
repository — the app is an Expo-managed project, built and signed by EAS
rather than by a checked-in Xcode project or Gradle module — so `app.json`
and `eas.json` are the only places these identifiers live; there is no
second, native-side copy of the package name or bundle id to drift out of
sync [@app-json] [@eas-json]. The naming is consistent across every store
metadata location — this is the deliberate, live branding of the shipped
product, not a leftover or a typo.

## Status

Current.

## Consequences

A future maintainer or forker needs to keep two names straight, even though
`NOTICE` now reserves both as trademarks in the same clause [@notice]. "Kids
Games" is the repository's original, still-current GitHub/`package.json`
name; "Kids Zone" is the one `app.json`, `eas.json`, the store listings, and
`NOTICE`'s own header actually use today. Someone forking the *code* is free
to pick any brand for their own app, as long as it is neither "Kids Games"
nor "Kids Zone" — both, along with "Lulu" and "Zain," are reserved regardless
of which one a fork might assume is the safer, less-branded choice.
A maintainer who wanted to rename the shipped app again
would need to change `app.json`'s `expo.name`/`expo.slug`, the Android package
name, and the iOS bundle identifier consistently — and the Android package
name in particular cannot change after a Play Store release without becoming
a new, separate app listing. See
[Licensing and attribution](../reference/licensing-and-attribution) for the
full trademark and license text this decision depends on, and
[Build and release config](../reference/build-and-release-config) for where
these identifiers feed into the build and submit pipeline.

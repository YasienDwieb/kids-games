---
title: "Kids Zone Product Name"
summary: "The repository, license, and trademark notice are named Kids Games, but every native and store-facing identifier in the shipped app uses the different name Kids Zone."
topics: [decisions, branding, release]
sources:
  - id: app-json
    type: file
    path: app.json
  - id: build-gradle
    type: file
    path: android/app/build.gradle
  - id: ios-project
    type: file
    path: ios/KidsZone.xcodeproj/
  - id: notice
    type: file
    path: NOTICE
---

The open-source repository is named and licensed as "Kids Games" — that is
the GitHub repo name, and `NOTICE` explicitly reserves it: "The 'Kids Games'
name, logo, and app icon are trademarks of the author and are NOT licensed
under Apache-2.0 ... Forks and derivative works must use a different name and
branding" [@notice]. The app the maintainer actually ships to app stores,
however, is branded under a different name entirely. This page records that
split so a future maintainer or forker does not mistake one name for the
other.

## Decision (a fact about the current build, not a choice being made here)

Every native and store-facing identifier uses "Kids Zone" instead of "Kids
Games." `app.json` sets `expo.name` to `"Kids Zone"` and `expo.slug` to
`"kids-zone"` [@app-json]. Both `android.package` in `app.json` and
`applicationId` in `android/app/build.gradle` are
`dev.waybeyond.kidszone` [@app-json] [@build-gradle], and `ios.bundleIdentifier`
in `app.json` matches it [@app-json]. The iOS native project directory and
Xcode project are literally named `KidsZone` and `KidsZone.xcodeproj`
[@ios-project]. The naming is consistent across every native config and store
metadata location — this is the deliberate, live branding of the shipped
product, not a leftover or a typo.

## Status

Current.

## Consequences

A future maintainer or forker needs to keep two names straight. "Kids Games"
is the open-source project's own reserved trademark, scoped specifically to
that name per `NOTICE` [@notice] — someone forking the *code* is free to pick
any brand for their own app, as long as it is not "Kids Games" itself. "Kids
Zone" is the specific shipped app's brand under a different name and bundle
identifier, and it carries no special protection of its own beyond being the
live product name. A maintainer who wanted to rename the shipped app again
would need to change `app.json`'s `expo.name`/`expo.slug`, the Android package
name, and the iOS bundle identifier consistently — and the Android package
name in particular cannot change after a Play Store release without becoming
a new, separate app listing. See
[Licensing and attribution](../reference/licensing-and-attribution) for the
full trademark and license text this decision depends on, and
[Build and release config](../reference/build-and-release-config) for where
these identifiers feed into the build and submit pipeline.

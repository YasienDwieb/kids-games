---
title: "Build and Release Config Reference"
summary: "The exact EAS build profiles, app.json manifest fields, and package.json scripts that govern building and releasing the app."
topics: [reference, build, release]
sources:
  - id: eas-json
    type: file
    path: eas.json
  - id: app-json
    type: file
    path: app.json
  - id: package-json
    type: file
    path: package.json
---

Building and shipping this app is governed by three small config files —
`eas.json` (EAS Build/Submit profiles), `app.json` (the Expo app manifest),
and `package.json` (dependencies and local scripts) — rather than a bespoke
build system. This page is an exact field-by-field lookup across all three,
for checking a build profile's settings or an app manifest field without
diffing the files by hand.

## eas.json build profiles

`cli.version` requires `>= 20.1.0`, and `appVersionSource: "remote"` means EAS
itself owns and increments the Android `versionCode` on its servers rather
than the repo tracking it in `app.json` [@eas-json].

| Profile | Key settings |
|---|---|
| `development` | `developmentClient: true`, `distribution: "internal"` — a dev-client build for local iteration. |
| `preview` | `distribution: "internal"` — the profile the APK release workflow builds from. |
| `production` | `autoIncrement: true` — the profile the AAB release workflow builds from, letting EAS bump the version automatically. |

`submit.production.android` submits with `serviceAccountKeyPath:
"./fastlane/play-store-key.json"` as its Google service account credential, to
`track: "internal"`, with `releaseStatus: "draft"` — every automated submit
lands as a draft on the internal track rather than going live automatically
[@eas-json]. This profile only ships the binary; the separate Play Store
listing text, screenshots, and changelog are maintained independently as
fastlane metadata, a split recorded on the
[Play Store listing as code](../decisions/play-store-listing-as-code) decision
page. The [Release an Android build](../guides/release-an-android-build)
guide walks through choosing between the `preview` (APK) and `production`
(AAB) paths.

## app.json manifest fields

| Field | Value |
|---|---|
| `expo.name` | `"Kids Zone"` |
| `expo.slug` | `"kids-zone"` |
| `expo.version` | `"1.1.1"` |
| `expo.orientation` | `"landscape"` |
| `expo.newArchEnabled` | `true` |
| `expo.ios.bundleIdentifier` | `"dev.waybeyond.kidszone"` |
| `expo.android.package` | `"dev.waybeyond.kidszone"` |
| `expo.android.edgeToEdgeEnabled` | `true` |
| `expo.android.predictiveBackGestureEnabled` | `false` |
| `expo.android.blockedPermissions` | `["android.permission.ACTIVITY_RECOGNITION"]` |
| `expo.web.favicon` | `"./assets/favicon.png"` |
| `expo.plugins` | `["expo-localization"]` |

These fields are read directly off `app.json`'s `expo` key [@app-json]. The
repository's own name and package are "kids-games", but the shipped
product name, bundle id, and package are all "Kids Zone" /
`dev.waybeyond.kidszone` — the
[Kids Zone product name](../decisions/kids-zone-product-name) decision page
records why the two names diverge. The `orientation: "landscape"` field is
the manifest half of the app's landscape-only lock; the runtime half is
recorded on the
[landscape orientation lock](../decisions/landscape-orientation-lock) decision
page.

## package.json scripts

| Script | Command | Notes |
|---|---|---|
| `start` | `expo start` | Metro dev server |
| `android` | `expo run:android` | Native Android build + run |
| `ios` | `expo run:ios` | Native iOS build + run |
| `web` | `expo start --web` | Web target, enabled via `react-dom` / `react-native-web` in `dependencies` |
| `test` | `jest` | The only automated check wired as an npm script |

These scripts are the complete `scripts` block in `package.json` [@package-json].
There is no `lint` or `typecheck` script — `npx tsc --noEmit`
is the ad hoc command for a manual type check, run by a developer before
pushing rather than by any script or CI step [@package-json]. `package.json`
pins Expo SDK 54 (`"expo": "~54.0.33"`), React 19 (`"react": "19.1.0"`), and
React Native 0.81 (`"react-native": "0.81.5"`) as the core platform versions
[@package-json].

# Releasing & store listings

Kids Zone ships on **Google Play** and the **Apple App Store**. Both listings are
managed as code; this page is the overview. Lane-level details live in
[PLAY_STORE.md](PLAY_STORE.md) and the `fastlane-release` skill.

## Google Play

The Google Play store listing — title, descriptions, release notes, and graphics
(English + Arabic) — is managed as code with [`fastlane supply`](https://docs.fastlane.tools/actions/supply/)
under [`fastlane/`](../fastlane/). See **[PLAY_STORE.md](PLAY_STORE.md)** for the
layout, character limits, and the `tracks` / `validate` / `metadata` / `changelog` / `promote` /
`rollout` / `pull` lanes. Builds come from EAS via
[`.github/workflows/release-aab.yml`](../.github/workflows/release-aab.yml), which submits to
production as a **draft** — `fastlane rollout version_code:<vc>` is the step that makes a
release live.

## App Store

The App Store listing text (en-US + ar-SA) lives in [`store.config.json`](../store.config.json) and is pushed with
`npx eas metadata:push`; iOS builds go through `eas build` / `eas submit`.

## Screenshots

Store screenshots for both stores are generated, not hand-made: [`screenshots/`](../screenshots/) captures the
release APK on an emulator with seeded demo data and composes the framed galleries (see the
`store-screenshots` skill). The README gallery uses the English Play phone set.

## Sideloading (Android)

The **[Releases page](https://github.com/YasienDwieb/kids-games/releases/latest)**
carries a signed APK — copy it to an Android device and install it (you may need to allow
"install from unknown sources"). The APK there lags the store build; **the stores carry
the current version**.

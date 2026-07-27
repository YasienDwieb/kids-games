---
title: "Release An iOS Build"
summary: "How to build, submit, and list a new iOS version through EAS (build, submit, metadata:push) and finish the submission in App Store Connect — the iOS counterpart to the Android release guides."
topics: [guides, release, ios]
sources:
  - id: skill-md
    type: file
    path: .claude/skills/fastlane-release/SKILL.md
  - id: eas-json
    type: file
    path: eas.json
  - id: app-json
    type: file
    path: app.json
  - id: store-config-json
    type: file
    path: store.config.json
  - id: submit-md
    type: file
    path: fastlane/metadata/ios/SUBMIT.md
  - id: screenshots-readme
    type: file
    path: fastlane/metadata/ios/screenshots/README.md
---

Kids Zone ships iOS through **EAS** — the managed Expo build/submit/metadata
pipeline — rather than fastlane, because there is no native `ios/` project
directory in this repo; EAS handles code signing in the cloud [@skill-md]. This
is a different tool from Android's `fastlane supply` lanes covered in
[Update the Play Store listing](../guides/update-the-play-store-listing), even
though both keep the store listing in version control, a pattern recorded on
[Play Store listing as code](../decisions/play-store-listing-as-code) for
Android. Use this guide to build a new IPA, upload it to App Store Connect
(ASC), push the bilingual listing text, and finish the submission in the ASC
UI.

## Preconditions

Confirm you can act as the `waybeyond` Expo org before doing anything else:
run `npx eas whoami` and check that `Accounts` lists `waybeyond` [@skill-md].
An `Entity not authorized: AppEntity[...]` error from any `eas` command means
the logged-in account is not an org member and needs an invite, not a config
fix [@skill-md]. The Apple-side identity is already wired into the repo and
should not need to change: Apple Team ID `J98M86H34Z`, bundle id
`dev.waybeyond.kidszone`, and ASC app id `6793942277` all live in `eas.json`'s
`submit.production.ios` block, alongside the ASC API key path, key id, and
issuer id [@eas-json]. That key file itself,
`fastlane/metadata/ios/AuthKey_FJS3Y8R9KM.p8`, is gitignored via the repo's
`*.p8` pattern and is downloadable from Apple only once — keep an out-of-repo
backup [@skill-md] [@submit-md]. Field-by-field detail on the `eas.json`
profile and the `app.json` iOS manifest fields it depends on (including
`ios.config.usesNonExemptEncryption: false`) is on
[Build and release config](../reference/build-and-release-config).

## Ship a new version

```bash
npx eas whoami                                # confirm waybeyond org access
npx eas metadata:lint                         # validate store.config.json before every push

npx eas build   -p ios --profile production   # cloud build; signing is already set up
npx eas submit  -p ios --profile production   # upload to ASC -> TestFlight -> "Ready to Submit"
npx eas metadata:push --profile production    # push en-US + ar-SA listing text
```

These four commands are the whole recurring flow [@skill-md]. `eas submit`
only uploads the binary to ASC; it does not submit anything for review
[@submit-md]. `eas metadata:push` pushes text only — name, subtitle,
promoText, description, keywords, releaseNotes, and the support/marketing/
privacy URLs read from `store.config.json` — and does **not** push
screenshots or any of the per-version fields covered below [@skill-md]
[@store-config-json]. Because all three commands are outward, publishing
actions, confirm with the user before running them, and always run
`eas metadata:lint` before a push [@skill-md]. `app.json`'s `expo.version` is
shared with the Android build; do not bump it silently for an iOS-only
release — flag the change and let the user decide the new version number,
the same rule that applies to the Android release flow [@skill-md]. The iOS
build number itself auto-increments remotely, so there is nothing to bump
locally for that [@skill-md].

### The listing text lives in `store.config.json`, not fastlane

Unlike Android's `fastlane/metadata/android/{en-US,ar}/*.txt` files, the iOS
listing is one JSON file: `store.config.json`, with localized fields under
`apple.info.<locale>` [@store-config-json]. **Only two locales exist for
Apple, and the Arabic one is not `ar`** — Apple requires `ar-SA`, and
`eas metadata:lint` rejects the bare `ar` code that Android's fastlane
metadata uses [@skill-md] [@store-config-json]. Field limits differ from
Android too: `title` and `subtitle` ≤30 characters, `promoText` ≤170,
`description` ≤4000, and `keywords` (an array, comma-joined for Apple's
single field) ≤100 characters total — count Arabic by characters, not bytes,
when adapting Play copy [@skill-md]. When editing this file, change **both**
`en-US` and `ar-SA` together, the same discipline the Android listing
requires.

## Finish the submission in App Store Connect

`eas metadata:push` does not submit the app; the rest happens in the ASC
**Distribution / App Store** tab for the new version [@submit-md] [@skill-md]:

- Attach the uploaded build to the version, set "What's New" (release notes),
  and set the version's Copyright field.
- Upload screenshots if they changed — see the sizing rules below.
- Confirm Category (Education), Age Rating (4+), and App Privacy ("Data Not
  Collected") — these normally carry over from the previous version, but App
  Privacy may need an ASC Admin to confirm [@submit-md]. The app uses the
  ordinary Education listing, not Apple's Kids Category [@submit-md].
- Pricing is app-level (Free) and is set once, not per version.
- Select the build and choose Add for Review, then Submit.

### Screenshot sizes

The app is landscape-only, so capture screenshots in landscape
[@screenshots-readme]. The unified iPhone "6.9-inch" slot (2796×1290
landscape) is required and also covers the smaller 6.5"/6.7" iPhone sizes; an
iPad "13-inch" set (2752×2064 landscape) is separately required because
`app.json` declares `ios.supportsTablet: true` [@screenshots-readme]
[@app-json]. `eas metadata:push` does not upload screenshots — they are
dragged into the ASC UI per device-size set when preparing the version
[@screenshots-readme].

## Verify

After `eas metadata:push`, open the ASC version page and confirm the en-US
Description, Keywords, and Support URL fields are actually populated — EAS
metadata pushes can land on one locale and silently skip the other on the
version page, so re-check rather than trusting the push exit code alone
[@skill-md]. If a field is blank, paste it from `store.config.json` directly
in the ASC UI rather than re-running the push [@skill-md]. Both the support
URL and the privacy policy URL in `store.config.json` must be `https` pages —
Apple's support-email field is separate from the support URL, and a missing
privacy policy URL is a hard submission blocker [@skill-md]
[@store-config-json].

## Recovery notes

If the iOS Simulator renders emoji as `?` tofu boxes, that is a simulator
runtime bug, not an app bug — it reproduces even in the simulator's own
Safari. Switch to a different simulator runtime or a real device rather than
changing app code, and never ship screenshots captured from a tofu-affected
runtime [@skill-md].

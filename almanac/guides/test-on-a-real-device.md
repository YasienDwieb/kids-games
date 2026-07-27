---
title: "Test On A Real Device"
summary: "How to verify a UI or behavior change on a physical Android phone via Expo Go and adb, since the repo has no automated e2e or screenshot tests."
topics: [guides, testing]
sources:
  - id: setup-docs
    type: file
    path: docs/SETUP.md
  - id: jest-config
    type: file
    path: jest.config.js
  - id: jest-setup
    type: file
    path: jest.setup.js
---

Jest in this repo, configured in `jest.config.js` and `jest.setup.js`, mocks
`@react-native-async-storage/async-storage`, `expo-audio`, and `expo-haptics`
[@jest-config] [@jest-setup]. That makes it a fast, reliable tool for pure
logic, config validation, and i18n key resolution, but it means Jest never
actually renders a screen, plays a sound, or fires a haptic — those are all
stubbed out. There is no automated end-to-end or screenshot/visual-regression
suite anywhere in the repo. Confirming that a UI or behavior change actually
works correctly, as opposed to type-checking or unit-testing cleanly, means
running the app on a physical device.

## Preconditions

Install Expo Go on the device. The phone and the development machine need to
be on the same Wi-Fi network; if the network is locked down (a restrictive
office or campus network, for instance), use
`npx expo start --tunnel` instead of the default LAN connection
[@setup-docs].

## Steps

1. Run `npm start` (or `npx expo start`) and scan the printed QR code with the
   Expo Go app on Android, or the Camera app on iOS which then opens in Expo
   Go [@setup-docs]. The app loads and hot-reloads as you edit code.
2. For anything that needs precise, repeatable input — a drag gesture at an
   exact coordinate, a rapid sequence of taps, or a scripted screenshot — drive
   the device directly with `adb` instead of tapping by hand. On some Android
   devices, MIUI's security settings block synthetic `adb` input events by
   default, so a security toggle on the device may need to change before
   scripted taps actually register.
3. Exercise the specific change directly on the device: a new game, an i18n
   language switch, an RTL layout. RTL mirroring, font selection, and
   touch-target sizing can all behave differently on a real phone than they
   would in a simulator or in a component test, so this step is not optional
   for anything layout- or language-related. See
   [App entry and navigation](../architecture/app-entry-and-navigation) for
   where these screens sit in the app's navigation flow.
4. For anything sound-related, confirm actual audio playback on the device.
   `expo-audio` is fully mocked in the Jest environment [@jest-setup], so no
   automated test in this repo ever verifies that a sound asset actually
   plays, only that the code that calls it doesn't throw.

## Recovery

If Expo Go can't connect, first double-check the phone and the development
machine are actually on the same Wi-Fi network — this is the most common
cause — before falling back to `npx expo start --tunnel` [@setup-docs].

## Why This Step Exists

See [No CI quality gate](../decisions/no-ci-quality-gate) for why device
testing is a manual habit rather than something CI enforces before merge: the
Jest suite here is deliberately scoped to logic and configuration, not
rendering, so a device check is the only way this repo catches a real
rendering, gesture, or platform-specific regression before it ships.

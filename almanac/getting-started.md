---
title: "Getting Started"
summary: "Front door to the Kids Games wiki: what the repo is, the three clusters worth understanding first, and where to go for common tasks."
topics: [getting-started, architecture]
sources:
  - id: readme
    type: file
    path: README.md
  - id: app-json
    type: file
    path: app.json
---

Kids Games is a multi-game Expo/React Native app for children ages 2–12
[@readme], shipped to app stores under a different product name,
[Kids Zone](decisions/kids-zone-product-name) — `app.json`'s `expo.name` is
`"Kids Zone"`, not "Kids Games" [@app-json]. The repository holds eleven
independent games under `src/games/`,
a shared platform core under `src/sdk/` that every game imports from, and a
second, separate engine, [flow](concepts/flow), that interleaves several
games' content into one guided session. This wiki documents that whole
system: the concepts and architecture pages explain how the pieces work and
why they are shaped the way they are, the guides walk through the tasks
contributors actually repeat, the decisions explain choices that would
otherwise look arbitrary, and the reference pages give exact schemas and
lookup tables.

## Three clusters worth understanding first

Almost everything else in this wiki builds on three ideas. Reading these
first will make every other page faster to place.

**The game module pattern and the SDK boundary.** A "game" is a self-contained
folder that registers itself with one side-effecting import and otherwise
imports only from a single barrel module, `@/sdk`. Read
[Game module](concepts/game-module) for the folder shape every game follows,
and [SDK boundary](concepts/sdk-boundary) for the rule — and its one
sanctioned exception — that keeps eleven games from developing hidden
coupling to each other. [Game registry](architecture/game-registry) and
[App entry and navigation](architecture/app-entry-and-navigation) trace how a
game actually becomes visible to the running app, and
[Game shell and back navigation](architecture/game-shell-and-back-navigation)
covers the shared chrome and back-button interception every game gets for
free.

**The flow engine.** Home's grid is a "you choose" model; flow is the
alternative "the app decides" model, a guided, scoreless sequence that
interleaves rounds pulled from several opted-in games into one continuous
session. Read [Flow](concepts/flow) for what a flow unit is and why it is a
narrower idea than a game, and [Flow engine](architecture/flow-engine) for
the separate adapter registry, sequence builder, and checkpoint store that
implement it. It is deliberately not layered on top of the ordinary game
registry — [Flow as a separate engine](decisions/flow-as-separate-engine)
records why.

**The design system, i18n, and RTL.** Every screen draws colors, spacing, and
components from one token system rather than ad hoc values — see
[Design system](architecture/design-system). Every user-facing string lives
in a matched English/Arabic pair inside a per-game or shared "core"
namespace, and the app supports full right-to-left layout for Arabic; see
[i18n and RTL](architecture/i18n-and-rtl) for how translation, native RTL
state, and font selection interact, and [Age bands](concepts/age-bands) for
the age-grouping model layered on top of the same game metadata. The app is
also landscape-only end to end, which shapes every screen's layout; that lock
is covered in [App entry and navigation](architecture/app-entry-and-navigation)
and its own decision page.

## Common work areas

Most changes to this repo fall into one of these tasks. Each guide states
its own preconditions and verification steps, so start there rather than
re-deriving the workflow from source:

- **Adding a brand-new game** — [Add a new game](guides/add-a-new-game)
  walks through scaffolding from `src/games/_template`, localizing it, and
  registering it so it appears on Home.
- **Making an existing game flow-eligible** —
  [Add a game to flow](guides/add-a-game-to-flow) covers writing a
  `flow.tsx` adapter that replays a game's existing content as scoreless
  rounds.
- **Adding a translated string** —
  [Add a translated string](guides/add-a-translated-string) covers where a
  new key belongs (core versus per-game namespace) and the manual guard test
  that is the only thing that would catch a broken key.
- **Adding a game asset** — [Add a game asset](guides/add-a-game-asset)
  covers tagging a new sound effect in the shared audio manifest and
  bundling a new emoji image.
- **Releasing an Android build** —
  [Release an Android build](guides/release-an-android-build) covers the two
  manual GitHub Actions workflows: a shareable test APK versus a production
  AAB submitted to Google Play.
- **Releasing an iOS build** —
  [Release an iOS build](guides/release-an-ios-build) covers the EAS
  build/submit/metadata commands and finishing the submission in App Store
  Connect — iOS has no GitHub Actions workflow of its own.
- **Updating the Play Store listing** —
  [Update the Play Store listing](guides/update-the-play-store-listing)
  covers the fastlane lanes that push listing text, screenshots, and release
  notes independently of shipping a new binary.
- **Testing on a real device** —
  [Test on a real device](guides/test-on-a-real-device) covers verifying a
  UI or behavior change via Expo Go and `adb`, since the repo has no
  automated end-to-end or screenshot test suite.

## Worth knowing early

A few decisions and reference pages are easy to reach for wrong if you skip
them:

- [SDK-only import boundary](decisions/sdk-only-import-boundary) is the
  decision behind the SDK boundary concept above — read it before adding any
  cross-game dependency, sanctioned or otherwise.
- [Games catalog](reference/games-catalog) is the exact, current lookup
  table of all eleven registered games, their age ranges, and their flow
  eligibility — check it before assuming a game exists or participates in
  flow.
- [Licensing and attribution](reference/licensing-and-attribution) matters
  specifically because of the naming split above: the open-source repository
  and its trademark notice are named "Kids Games," while the shipped app is
  branded "Kids Zone" end to end. Read the licensing page before reusing any
  bundled third-party asset or forking the project under its own name.
- [No CI quality gate](decisions/no-ci-quality-gate) is worth knowing before
  you assume a broken type or failing test would be caught automatically —
  it would not; `npm test` and `tsc --noEmit` are a documented developer
  habit, not an enforced gate.
- [Parent gate for Settings](decisions/parent-gate-for-settings) blocks
  `SettingsScreen` behind a solvable-only-by-an-adult challenge; know which
  controls it protects (and the two, sound and language, that were
  deliberately left ungated on Home) before adding a new Settings control.
- [WCAG AA contrast floor](decisions/wcag-aa-contrast-floor) is enforced by a
  Jest suite — any new color added to `ACCENTS`, or any component that draws
  text on an arbitrary fill, must clear it via `bestTextOn`, covered on the
  [design system](architecture/design-system) page.

<p align="center">
  <img src="docs/logo.png" alt="Kids Games logo" width="160" />
</p>

# Kids Games

A multi-game Expo React Native app for young children (ages 2–12) — 12 bright, ad-free
learning games in English and Arabic (full RTL), built on a shared SDK. Published as
**Kids Zone** on Google Play and the App Store.

<p align="center">
  <a href="https://onesmartlink.app/kids-zone">
    <img src="https://img.shields.io/badge/Get_Kids_Zone-Android_%26_iOS-7B3FE4?style=for-the-badge" alt="Get Kids Zone on Android and iOS" width="360" />
  </a>
  <br />
  <sub>One link — opens the right store for your device: <a href="https://onesmartlink.app/kids-zone">onesmartlink.app/kids-zone</a></sub>
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=dev.waybeyond.kidszone">
    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" width="186" align="middle" />
  </a>
  <a href="https://apps.apple.com/app/id6793942277">
    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" width="144" align="middle" />
  </a>
</p>

## Screenshots

<p align="center">
  <img src="docs/screenshots/home-landscape.jpg" alt="Home — big, bright games for little hands; no ads, no reading needed" width="400" />
  <img src="docs/screenshots/level-up.jpg" alt="Level up — every win earns stars, and new levels unlock outfits for Lulu" width="400" />
</p>
<p align="center">
  <img src="docs/screenshots/letter-land.jpg" alt="Letter Land — hear it, then find the letter, in English and Arabic" width="400" />
  <img src="docs/screenshots/turbo-road.jpg" alt="Turbo Road — steer, race and grab the coins on the 3D road" width="400" />
</p>
<p align="center">
  <img src="docs/screenshots/color-mixer.jpg" alt="Color Mixer — mix paint colors to make new ones" width="400" />
  <img src="docs/screenshots/wardrobe.jpg" alt="Lulu's wardrobe — dress Lulu in the hats and glasses your stars unlock" width="400" />
</p>
<p align="center">
  <img src="docs/screenshots/match-up.jpg" alt="Match Up — connect what belongs together" width="400" />
  <img src="docs/screenshots/parent-corner.jpg" alt="Parent corner — play time and stars by game, plus an optional daily limit" width="400" />
</p>

## Quick start

```bash
npm install   # if peer-dep conflicts appear, use: npm install --legacy-peer-deps
npx expo start
```

Then open in Expo Go on your device, or press `a` for Android emulator / `i` for iOS simulator /
`w` for web (or `npm run web`). The app runs **landscape-only** on Android, iOS and the web.

```bash
npx tsc --noEmit                 # type check (strict)
CI=1 npx jest --watchAll=false   # unit tests
```

**Add a game:** copy `src/games/_template` → `src/games/your-game`, set up `config.ts`
(`registerGame()` from `@/sdk`), build `index.tsx` importing only from `@/sdk`, and add a
side-effect import in `src/games/index.ts`. Full guide: [docs/GAMES.md](docs/GAMES.md).

## Documentation

| Guide | What's in it |
|-------|--------------|
| [Setup & builds](docs/SETUP.md) | Full setup, Expo Go on a phone, local and EAS cloud builds |
| [Architecture](docs/ARCHITECTURE.md) | Tech stack, source layout, the `@/sdk` surface |
| [Design system](docs/DESIGN_SYSTEM.md) | "Pop Quest" tokens and UI primitives |
| [Games](docs/GAMES.md) | Game catalogue and adding a new game |
| [Releasing](docs/RELEASING.md) | Play + App Store listings, screenshots, sideload APK |
| [Contributing](CONTRIBUTING.md) | SDK contract, tests, asset tags, config rules |

All guides: [docs/](docs/README.md).

## License

The **code** is licensed under the [Apache License 2.0](LICENSE). You're welcome
to build your own games on top of it, fork it, and publish — including for your
own kids. Per the [`NOTICE`](NOTICE) file, derivative works must keep the
attribution ("Based on the Kids Games project").

The **"Kids Games" name, logo, and app icon are reserved** and are *not* covered
by the code license (Apache-2.0 §6). Please use a different name and branding for
your own published builds.

Bundled third-party assets keep their own licenses — see [CREDITS.md](CREDITS.md).

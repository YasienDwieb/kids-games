---
title: "Add a New Game"
summary: "Scaffold, localize, and register a brand-new game from src/games/_template so it appears as a playable tile on Home."
topics: [guides, games, i18n]
sources:
  - id: how-to-add
    type: file
    path: src/games/HOW_TO_ADD_GAME.md
  - id: template-dir
    type: file
    path: src/games/_template/
  - id: template-config
    type: file
    path: src/games/_template/config.ts
  - id: template-readme
    type: file
    path: src/games/_template/README.md
  - id: i18n-contract
    type: file
    path: src/games/I18N_CONTRACT.md
  - id: games-index
    type: file
    path: src/games/index.ts
  - id: keys-test
    type: file
    path: src/sdk/i18n/__tests__/keys.test.ts
  - id: skill
    type: file
    path: .claude/skills/kids-games-dev/SKILL.md
---

Use this guide when you are adding a brand-new activity to the app — a game
that does not exist yet in any form — and you want it to end up as a tile on
Home, playable in both English and Arabic. By the end you will have a new
folder under `src/games/`, registered through the one shared wiring file the
whole app depends on, with its own translation bundle passing the app's
key-resolution guard.

## Preconditions

You need a game idea with an `ageRange`, an emoji icon, and a rough sense of
whether the game wants `GameShell` chrome (a title bar, back button, and
overlay slots) or a fully custom canvas. Everything else is created as you
go. No shared file needs to exist ahead of time beyond
`src/games/_template/`, which is the canonical starting point for every new
game [@template-readme].

## Steps

**1. Copy the template.** Copy `src/games/_template` [@template-dir] to
`src/games/<your-kebab-case-id>`. The id must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`
— lowercase letters, digits, and hyphens only [@how-to-add].

**2. Fill in `config.ts`.** Set `id`, `name`, `description`, `icon`,
`ageRange: {min, max}`, `backgroundColor`, and point `component` at your root
component [@template-config]. Pick an `accent` for shared UI theming, and set
an `order` — the ascending sort weight that decides where your game lands on
the Home rail; omit it and the game sorts after every game that declares one
(see [Game config schema](../reference/game-config-schema) for the exact
`order` field, and [Game registry](../architecture/game-registry) for how it
is enforced). Then decide `layout.mode`: omit `layout` or set `{ mode: 'shell' }` to wrap the game
in `GameShell` chrome (title bar, back button, `setScore`/`showOverlay`
overlay slots), or set `{ mode: 'bare' }` for a full-canvas game that only
gets a floating back button and manages its own layout — see
[Game shell and back navigation](../architecture/game-shell-and-back-navigation)
for how that chrome actually works rather than re-deriving it here. Keep the
`import './i18n';` side-effect import at the top of `config.ts`
[@template-config] — it registers the game's translation bundle the moment the
config module loads.

**3. Write the locale files.** Create `locales/en.ts` as
`export const en = {...} as const;` plus a derived `GameTranslations` type,
and `locales/ar.ts` typed as `: GameTranslations` so TypeScript enforces that
both locales define exactly the same keys [@i18n-contract]. Write `i18n.ts`
calling `registerTranslations('<id>', { en, ar })` [@i18n-contract]. Register
`meta.name` and `meta.description` in both locales — the home tile and game
header resolve those keys with the config's English strings as fallback
[@i18n-contract]. If your `name` doesn't fit on the landscape rail's
~116dp-wide tile in one line, also add `meta.shortName` in both locales;
games whose full name already fits (e.g. Match Up, Mouse Maze) simply omit
it, and `gameShortName()` falls back to the full name. In Arabic, a
`shortName` reads as the answer to "which game," so existing games give it
the definite article rather than a bare noun. See
[Add a translated string](../guides/add-a-translated-string) for the exact
workflow of adding one more key later, rather than repeating it here.

**4. Build `index.tsx`.** Import only from `@/sdk` — never from another
game's folder, and never from a deep `src/` path [@how-to-add]. Route every
visible string through `t()` from `useTranslation()`.

**5. Register the game.** Add one side-effect import line to
`src/games/index.ts`: `import './<id>/config';` [@games-index]. This is the
only shared file that changes — everything else about your game lives inside
its own folder.

## Verification

Run `npx tsc --noEmit` and `npm test`. The Jest suite includes
`src/sdk/i18n/__tests__/keys.test.ts`, which imports every registered game's
translation bundle and asserts that each key your UI actually requests
resolves to a real value — not the raw key string — in both English and
Arabic [@keys-test]. If you add a UI string but forget to register its key in
both locale files, or forget to add it to this test's `KEYS` list, that test
fails loudly instead of silently rendering the key string on screen
[@keys-test]. Then start the app and confirm the new tile appears on Home and
opens into a working game.

The `_template` folder also carries its own condensed `README.md` that points
back to this same contract [@template-readme], and the repo ships a
`kids-games-dev` Claude Code skill that covers scaffolding, SDK usage, and the
config schema for AI-assisted contributions [@skill] — useful if you want an
agent to carry out these steps rather than doing them by hand.

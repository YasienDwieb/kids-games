---
title: "Licensing and Attribution Reference"
summary: "Exact Apache-2.0 terms, the Kids Games trademark carve-out, the NOTICE attribution requirement, and the license terms of every bundled third-party asset."
topics: [licensing, reference]
sources:
  - id: license
    type: file
    path: LICENSE
  - id: notice
    type: file
    path: NOTICE
  - id: credits
    type: file
    path: CREDITS.md
---

This page is lookup material for one question: what can you legally do with this
repository's code and its bundled assets, and what must you preserve if you copy,
fork, or redistribute any of it. The repository is licensed as a whole under the
Apache License, Version 2.0, copyright 2026 Yasien Dwieb [@license]. Layered on
top of that grant is a separate `NOTICE` file that both restates an attribution
requirement and reserves the "Kids Games" name and branding outside the license
[@notice]. A third file, `CREDITS.md`, tracks the license terms of individual
third-party assets bundled inside the app, which is where you have to look before
reusing an emoji image or a sound effect on its own [@credits].

## The code license

The project's copyright header (reproduced in `LICENSE`'s appendix) reads
"Copyright 2026 Yasien Dwieb," licensed under Apache-2.0 [@license]. Apache-2.0
grants a perpetual, worldwide, royalty-free copyright and patent license to
reproduce, modify, publicly display and perform, sublicense, and distribute the
work and derivative works, in source or object form (§2–3) [@license]. The
license carries the redistribution conditions in §4: any copy or derivative work
must include the license text, changed files must be marked as changed, and
copyright/patent/trademark/attribution notices from the source must be retained
(§4(a)–(c)) [@license]. §4(d) is the clause that matters most for this
repository specifically: because the project ships a `NOTICE` text file, any
derivative work that is distributed must carry a readable copy of that NOTICE's
attribution content, in the derivative's own NOTICE file, its source or
documentation, or a display where third-party notices normally appear
[@license]. §5 makes this reciprocal for contributions — unless a contributor
states otherwise, anything they submit for inclusion is automatically licensed
back under the same Apache-2.0 terms [@license].

## The NOTICE requirement

`NOTICE` names the concrete attribution string that §4(d) obligates a derivative
work to carry forward: "Based on the Kids Games project —
https://github.com/YasienDwieb/kids-games" [@notice]. It states this plainly:
"You must retain this NOTICE, including the attribution above, in any
distribution or derivative work" [@notice]. This is stricter guidance than the
license's own minimum (which only requires the *content* to appear somewhere
reasonable), but it is the form the project asks downstream users to follow.

## The trademark carve-out

`LICENSE` §6 states that the Apache-2.0 grant does not extend to the licensor's
trade names, trademarks, service marks, or product names, except as needed to
describe the work's origin or to reproduce the NOTICE file's content
[@license]. `NOTICE` applies that clause directly to this project: "The 'Kids
Games' name, logo, and app icon are trademarks of the author and are NOT
licensed under Apache-2.0 (see Section 6 of the LICENSE)," and "Forks and
derivative works must use a different name and branding" [@notice]. In other
words, the code itself is freely reusable under Apache-2.0, but shipping a fork
under the "Kids Games" name or its logo is a trademark question the code license
does not answer — a separate, different name and branding is required. This is
distinct from the app's own shipped market name; see
[Kids Zone product name](../decisions/kids-zone-product-name) for how the
current build already trades under a different, unrelated brand.

## Third-party asset credits

`CREDITS.md` is the running log the project keeps for every third-party asset
bundled into the app, and it is authoritative for what license terms apply to
each one individually — the Apache-2.0 grant on the repository's own code does
not automatically relicense assets the project merely bundled from elsewhere
[@credits].

| Asset | Bundled at | License | Attribution required? |
|---|---|---|---|
| Google Noto Emoji artwork | `src/sdk/assets/emoji/png/`, resolved via `src/sdk/assets/emoji/images.ts` and rendered through the `EmojiImage` SDK primitive | Apache License 2.0 | Yes — commercial use is permitted and there is no share-alike obligation, but the project honors attribution via the `CREDITS.md` entry itself [@credits] |
| "Sound Effects Mini Pack 1.5" by phoenix1291 (Swiss Arcade Game Entertainment) | `src/sdk/assets/audio/`, played through `useSound()` | CC0 1.0 public domain dedication | No — commercial use and redistribution are permitted with no attribution required; the project credits "phoenix1291" / "SwissArcadeGameEntertainment" only as a courtesy [@credits] |

Both entries record the exact source URL and license URL alongside the terms
honored, which is the pattern `CONTRIBUTING.md` asks every new third-party asset
entry to follow before it is imported into the codebase.

If you are changing what the Play Store listing itself says about licensing or
credits, that text lives outside this reference; see
[Update the Play Store listing](../guides/update-the-play-store-listing).

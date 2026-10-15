# CodeAlmanac Integration — Assessment

_Assessment date: 2026-07-25 · Wiki built: 2026-07-24 (`80002e8`) · CLI: `codealmanac 0.4.7`_

An evaluation of whether the CodeAlmanac wiki integrated into this repo (and into
the machine's global Claude config) optimizes coding-agent capability and cost.
Evidence was gathered by running the CLI and cross-checking pages against the
current source.

## Verdict

The integration is **healthy, accurate, and a net capability + cost win for the
task types it's meant for** — with one real caveat (drift) and one small
always-on cost to be aware of.

## 1. Is the integration working? ✅ Yes

| Check | Result |
|---|---|
| CLI installed | `codealmanac 0.4.7` on PATH |
| Wiki registered | `kids-games` resolves at repo root |
| `health` | **0 issues** across all 9 checks (orphans, dead-refs, broken-links, missing-citations, unused-sources, …) |
| `validate` | **ok** — 37 indexed pages |
| Search (text) | Returns ranked, relevant leads |
| Search (`--mentions`) | File → page reverse lookup works |
| Topics | 39 topics, sensibly grouped |

Coverage is broad, not a stub: 8 architecture pages, 7 decisions (the "why"),
7 how-to guides, 9 reference pages, plus concept pages.

## 2. Is it accurate, or stale/hallucinated? ✅ Accurate right now

- `reference/games-catalog` documents exactly the **11 real game folders**
  (`animal-safari` … `turbo-road`), with correct layout modes and
  flow-eligibility.
- `decisions/rtl-font-selection` correctly captures the subtle
  `I18nManager.isRTL`-not-`i18n.language` rationale (matches `CLAUDE.md`).
- No fabricated content found in spot checks.

⚠️ **Caveat — drift.** The wiki was built in a *single commit* and has not been
gardened since. It is fresh only because the repo hasn't moved. The moment a
game is added or the SDK is refactored, catalog/reference pages go stale until a
Garden/Sync pass runs. The "code > Almanac" trust order is the right mitigation,
but the wiki needs periodic maintenance to stay worth reading.

## 3. Capability optimization — ✅ real, for the right tasks

The pages capture **decisions and cross-cutting rationale that do not exist in
the code**: why Flow is a separate engine, why the landscape lock, why the
SDK-only import boundary, why Play-Store-listing-as-code. Reconstructing that
from source requires reading many files plus inference; one `codealmanac show`
returns it distilled. The leverage is the "why," not the "what" (code remains
the truth for the latter).

## 4. Cost optimization — net positive, with a fixed tax

**Always-on cost (every session, every project):**
`~/.claude/codealmanac.md` is `@`-imported into the global Claude config →
**~1,700 tokens loaded into every conversation**, in any repo, whether or not an
`almanac/` exists.

**Per-lookup savings (paid back when the wiki is used):**
The `architecture/i18n-and-rtl` page (~2,000 tokens) pre-digests **751 lines of
TypeScript across 7 files** plus the reasoning connecting them — roughly a
**3–5× compression** on a deep-context lookup, and it supplies the "why" that
would otherwise take inference.

**Net:** For unfamiliar-subsystem / "why is this like this" / cross-cutting work
it pays for itself in a single lookup. For typos and one-file edits it doesn't
help — but the global instructions already say to skip it there, so the only
cost in those cases is the standing ~1,700-token charge.

## Recommendations

1. **Keep it** — the capability gain is real and current accuracy is solid.
2. **Schedule Garden/Sync** whenever a game is added or the SDK changes. Drift is
   the only thing that turns this from asset to liability. (Quick tell: after
   adding game #12 the catalog will still read "The 11 registered games" until
   regenerated.)
3. **Reconsider the always-on tax.** Loading `codealmanac.md` globally taxes every
   project, including those with no `almanac/`. If most work happens in other
   repos, `@`-import it from *this repo's* `CLAUDE.md` instead of the global
   config — same benefit here, zero cost elsewhere.

## Optional follow-ups

- A lightweight staleness check (script/hook) that flags when the `src/games/`
  count diverges from the catalog.
- The scoped-import change described in recommendation 3.

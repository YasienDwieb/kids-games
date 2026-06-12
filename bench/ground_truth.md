# Ground truth (independently verified by reading source)

Established by reading the actual files + exhaustive grep — **not** from sem output.

| Task | Ground-truth set | Source of truth |
|------|------------------|-----------------|
| **T1A** entities in `src/sdk/config/registry.ts` | `registry` (var), `registerGame`, `getGame`, `getAllGames`, `getGamesForAge`, `_resetRegistry` (6) | file read |
| **T1B** def of `bandsForGame` | signature `function bandsForGame(config: GameConfig): string[]` | `src/sdk/age/bands.ts:17` |
| **T2A** dependents of `validateGameConfig` | `registerGame` (caller, registry.ts:7) + `validate.test.ts` | grep + read |
| **T2B** dependents of `bandsForGame` | `ageBandIdForGame` (HomeScreen), `gamesForBand` (bands.ts), `bands.test.ts` | grep + read |
| **T3A** impact of `registerGame` | 4 game configs (`simple-pairs`, `color-mixer`, `mouse-maze`, `balloon-archer`) call it at module load; `registry.test.ts` | `games/index.ts` + configs |
| **T3B** impact of `GameConfig` type | `registry.ts`, `validate.ts`, `bands.ts`, `gameMeta.ts`, `HomeScreen`, `types/index.ts` (+others) | grep -rln |

## Two failure modes surfaced by the benchmark (both real, both verified)

### FM-1 — sem is blind to module-scope / top-level call sites
`registerGame({...})` is invoked at the **top level** of each game's `config.ts`, not
inside a named function. sem's graph only draws edges between **named entities**, so it
has no "from" node for these calls and reports **none of the 4 real production callers**
(T3A: sem recall 20%, native 100%). It surfaced only the test suite + barrel re-exports.
→ **Do not trust `sem impact` alone for "who calls X" when X is called from module scope.**

### FM-2 — native grep cannot name the enclosing entity
For "who depends on `validateGameConfig`", grep returns the call-site **line**
(`registry.ts:7: validateGameConfig(config)`) but never the **caller's name**
(`registerGame`) without an extra read (T2A: native recall 50%). It also cannot see
**transitive** dependents that don't textually mention the symbol (T2B: misses the
`HomeScreen` → `ageBandIdForGame` chain unless followed manually).
→ **Native needs follow-up reads to name dependents; misses indirect/transitive deps.**

These are **complementary** blind spots — see `RESULTS.md`.

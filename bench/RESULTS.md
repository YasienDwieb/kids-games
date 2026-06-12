# Results — sem vs native (Opus 4.8 high)

sem 0.10.1 · repo `kids-games` (~8.9k LOC, 155 TS/TSX files) · medians of 3 runs.
Raw data: `bench/raw/results.csv` + `bench/raw/*.txt`. Reproduce: `bash bench/harness.sh`.

## Per-task results

| Task | Level | Arm | wall_ms | bytes | round-trips | recall |
|------|-------|-----|--------:|------:|------------:|-------:|
| T1A list-entities | L1 | native | 16 | 325 | 1 | **100%** |
| T1A list-entities | L1 | sem | 23 | 227 | 1 | **100%** |
| T1B get-definition | L1 | native | 19 | 363 | 2 | **100%** |
| T1B get-definition | L1 | sem | 100 | 2467 | 1 | **100%** |
| T2A direct-deps | L2 | native | 20 | 1035 | 2 | 50% |
| T2A direct-deps | L2 | sem | 97 | 2783 | 1 | **100%** |
| T2B direct-deps | L2 | native | 20 | 660 | 2 | 66% |
| T2B direct-deps | L2 | sem | 102 | 2115 | 1 | **100%** |
| T3A transitive-impact | L3 | native | 22 | 565 | 3 | **100%** |
| T3A transitive-impact | L3 | sem | 102 | 2007 | 1 | 20% |
| T3B type-impact | L3 | native | 18 | 329 | 1 | **100%** |
| T3B type-impact | L3 | sem | 101 | 5638 | 1 | **100%** |

## Aggregates by complexity level

| Level / arm | avg wall_ms | avg bytes | avg round-trips | recall% |
|-------------|------------:|----------:|----------------:|--------:|
| L1 native | 18 | 344 | 1.5 | **100** |
| L1 sem | 62 | 1347 | **1.0** | **100** |
| L2 native | 20 | 848 | 2.0 | 60 |
| L2 sem | 100 | 2449 | **1.0** | **100** |
| L3 native | 20 | 447 | 2.0 | **100** |
| L3 sem | 102 | 3822 | **1.0** | 64 |

## Dimension-by-dimension verdict

### Speed (tool latency)
**Native wins on raw wall-time** — 16–22 ms vs sem's ~100 ms (sem pays a tree-sitter
parse + graph build). **But both are negligible** next to a model turn (seconds). The
speed metric that matters at the agent level is **round-trips**, where **sem wins**
(always 1; native 1.5–2.0) — fewer model turns = lower real latency on L2/L3.

### Cost (tokens ingested)
**Native wins** — sem returns **3–10× more bytes** (L3: 3822 vs 447 avg; T3B 5638 vs 329).
sem bundles deps + dependents + transitive + tests every call; great for completeness,
expensive per call. The exception is pure entity listing (T1A) where sem is *leaner* (227 vs 325).

### Correctness (recall)
**Splits by task shape — this is the headline:**
- **L1: tie** (100% / 100%). For listing/definition both are exact.
- **L2: sem wins decisively** (100% vs 60%). Native grep shows the call-site line but
  can't **name the enclosing dependent** (T2A `registerGame`) or see **transitive** deps
  (T2B `HomeScreen`) without extra reads. sem names them directly.
- **L3: split** — sem **fails T3A (20%)** by missing the 4 real module-scope callers
  (see FM-1), while native gets 100%; both tie on T3B type-grep. So at the highest
  complexity, **neither is reliable alone.**

### Effectiveness (composite)
Neither dominates. The arms have **complementary blind spots** (`ground_truth.md`):
- **sem** can't see module-scope/top-level calls (FM-1) → misses real callers.
- **native** can't name enclosing/transitive entities without follow-up reads (FM-2).

## Recommendation for an Opus 4.8-high agent in this repo

1. **L1 (list / read a definition):** use **native**. Faster, cheaper, equal correctness.
   Reach for `sem entities`/`sem context` only when you also want the dependency bundle.
2. **L2 (name the callers / direct dependents of a function):** use **sem** (`sem_impact`).
   It names entities + maps affected tests in **one round-trip**; native needs reads and
   still misses transitive deps. Worth the extra tokens.
3. **L3 (refactor blast radius):** **use both, trust neither alone.** Run `sem_impact`
   for entity/test mapping **and** a `grep` for module-scope call sites (configs,
   registrations, side-effect imports) that sem structurally cannot see.
4. **Always** prefix `sem context/impact` with the entity type (`function`/`type`/…) or
   `--file` to dodge this repo's barrel (`src/sdk/index.ts`) re-export ambiguity.

**Bottom line:** sem buys **fewer round-trips and entity-named, test-mapped impact** at a
**3–10× token premium and ~80 ms latency**, and is **most valuable at L2**. It is **not**
a correctness oracle at L3 (module-scope blindness), and is **redundant at L1**. The
native grep/read path remains faster, cheaper, and — for module-level and pure-text
questions — equally or more correct. Best practice is **hybrid**, not replacement.

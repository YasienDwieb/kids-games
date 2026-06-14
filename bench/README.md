# sem vs native (Claude Code) — context-gathering benchmark

Goal: a reproducible, comparable measurement of **effectiveness, cost, speed, and
correctness** between `sem` (entity-level semantic CLI / MCP) and the **native
Claude Code approach** (`grep` + `read`) when an Opus 4.8-high agent gathers code
context, across **three complexity levels**.

## Arms

| Arm | What it is |
|-----|------------|
| **native** | The canonical minimal `grep`/`read`(`sed`) sequence a model would issue with built-in tools. |
| **sem** | The equivalent `sem` CLI command (identical data to the `sem_*` MCP tools now wired in `.mcp.json`). |

## Metrics (per task, per arm)

| Metric | Definition | Proxy for |
|--------|------------|-----------|
| `wall_ms_median` | Median wall-clock of 3 runs of the tool command(s). | **Speed** (tool latency). |
| `bytes` | stdout size. | **Cost** — tokens the model must ingest. |
| `round_trips` | Number of distinct commands needed to answer. | **Speed/cost at the model level** — each is one model turn (dominates real latency). |
| `recall_pct` | `hits/total` of ground-truth tokens present in the output. | **Correctness** — did the arm surface the true answer? |

### Important methodology notes / honesty caveats
- `wall_ms` is **tool-execution time only**. Model "thinking" time is excluded — it is
  roughly equal per turn for both arms, so `round_trips` is the proxy for model-side latency.
- `bytes` is a stand-in for token cost; exact tokenization will differ but ratios hold.
- `recall` is scored against an **independently established ground truth** (see
  `ground_truth.md`) — derived by reading the actual source, **not** by trusting sem.
- Native `round_trips` is the realistic minimal command sequence (locate → classify),
  not a single grep, because naming an enclosing entity usually needs a follow-up read.

## Tasks & complexity levels

| Level | Task | Question |
|-------|------|----------|
| **L1 simple** | T1A | List the code entities defined in `registry.ts`. |
| **L1 simple** | T1B | Retrieve the definition of `bandsForGame`. |
| **L2 medium** | T2A | Direct dependents (callers) of `validateGameConfig`. |
| **L2 medium** | T2B | Direct dependents of `bandsForGame`. |
| **L3 complex** | T3A | Transitive impact + affected tests of `registerGame`. |
| **L3 complex** | T3B | Cross-file impact of the `GameConfig` type. |

## Reproduce

```bash
bash bench/harness.sh        # writes bench/raw/results.csv + bench/raw/*.txt
```

Environment: Opus 4.8 high · sem 0.10.1 · repo `kids-games` (~8.9k LOC TS/TSX, 155 files).
See `RESULTS.md` for analysis and `bench/raw/` for the captured outputs.

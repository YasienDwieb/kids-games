#!/usr/bin/env bash
# sem vs native (grep/read) benchmark harness — Opus 4.8 high context-gathering proxy.
# Measures, per task per arm: median wall-time (3 runs), output bytes (token proxy),
# round-trips (command count), and recall vs a ground-truth token set.
#
# NOTE ON FAIRNESS / METHODOLOGY:
#  - "native" arm = the canonical minimal grep/read sequence a model would issue.
#  - "sem" arm    = the equivalent sem CLI command (same data the MCP tool returns).
#  - wall_ms is TOOL execution time only (model thinking excluded — same for both arms,
#    so round-trips is the proxy for model-side latency/turns).
#  - bytes = stdout size = proxy for tokens the model must ingest.
#  - recall = (# ground-truth tokens present in output) / (# ground-truth tokens).
set -u
cd "$(dirname "$0")/.."
RAW="bench/raw"
OUT="bench/raw/results.csv"
echo "task,level,arm,wall_ms_median,bytes,round_trips,recall_hits,recall_total,recall_pct" > "$OUT"

# median of 3 timed runs of a command string; saves last run's stdout to $2
time_cmd() {
  local cmd="$1" outfile="$2" t1 t2 t3
  for i in 1 2 3; do
    local start end
    start=$(date +%s%N)
    eval "$cmd" >"$outfile" 2>/dev/null
    end=$(date +%s%N)
    local ms=$(( (end - start) / 1000000 ))
    eval "t$i=$ms"
  done
  printf '%s\n' "$t1" "$t2" "$t3" | sort -n | sed -n '2p'
}

# recall: count how many ground-truth tokens (| separated, arg 2) appear in file (arg 1)
score_recall() {
  local file="$1"; shift
  local hits=0 total=0 tok
  for tok in "$@"; do
    total=$((total+1))
    grep -qF -- "$tok" "$file" && hits=$((hits+1))
  done
  echo "$hits $total"
}

# emit one row: task level arm cmd round_trips outfile  GT_TOKENS...
run() {
  local task="$1" level="$2" arm="$3" cmd="$4" rt="$5" outfile="$6"; shift 6
  local ms bytes rec hits total pct
  ms=$(time_cmd "$cmd" "$outfile")
  bytes=$(wc -c <"$outfile" | tr -d ' ')
  read -r hits total <<<"$(score_recall "$outfile" "$@")"
  if [ "$total" -gt 0 ]; then pct=$(( hits * 100 / total )); else pct=0; fi
  echo "$task,$level,$arm,$ms,$bytes,$rt,$hits,$total,$pct" >> "$OUT"
}

############################################################
# L1-A: list code entities defined in registry.ts
# GT entities: registry, registerGame, getGame, getAllGames, getGamesForAge, _resetRegistry
############################################################
GT1A=(registry registerGame getGame getAllGames getGamesForAge _resetRegistry)
run T1A-list-entities L1-simple native \
  "grep -nE '^(export )?(function|const|type|interface) ' src/sdk/config/registry.ts" \
  1 "$RAW/T1A_native.txt" "${GT1A[@]}"
run T1A-list-entities L1-simple sem \
  "sem entities src/sdk/config/registry.ts" \
  1 "$RAW/T1A_sem.txt" "${GT1A[@]}"

############################################################
# L1-B: retrieve the definition/body of bandsForGame
# GT: signature tokens of target
############################################################
GT1B=("function bandsForGame" "config: GameConfig")
run T1B-get-definition L1-simple native \
  "grep -n 'bandsForGame' src/sdk/age/bands.ts && sed -n '17,20p' src/sdk/age/bands.ts" \
  2 "$RAW/T1B_native.txt" "${GT1B[@]}"
run T1B-get-definition L1-simple sem \
  "sem context 'function bandsForGame' --file src/sdk/age/bands.ts --budget 800" \
  1 "$RAW/T1B_sem.txt" "${GT1B[@]}"

############################################################
# L2-A: direct dependents of validateGameConfig
# GT (semantic dependents): registerGame (caller) + validate.test.ts
############################################################
GT2A=(registerGame validate.test)
run T2A-direct-deps L2-medium native \
  "grep -rn 'validateGameConfig' src --include='*.ts' | grep -v 'function validateGameConfig'" \
  2 "$RAW/T2A_native.txt" "${GT2A[@]}"
run T2A-direct-deps L2-medium sem \
  "sem impact 'function validateGameConfig'" \
  1 "$RAW/T2A_sem.txt" "${GT2A[@]}"

############################################################
# L2-B: direct dependents of bandsForGame
# GT: ageBandIdForGame, gamesForBand, bands.test.ts
############################################################
GT2B=(ageBandIdForGame gamesForBand bands.test)
run T2B-direct-deps L2-medium native \
  "grep -rn 'bandsForGame' src --include='*.ts' --include='*.tsx' | grep -v 'function bandsForGame(config'" \
  2 "$RAW/T2B_native.txt" "${GT2B[@]}"
run T2B-direct-deps L2-medium sem \
  "sem impact 'function bandsForGame'" \
  1 "$RAW/T2B_sem.txt" "${GT2B[@]}"

############################################################
# L3-A: transitive impact + affected tests of registerGame
# GT: 4 game configs + registry.test + transitive (games index) ; tests must be surfaced
############################################################
GT3A=("simple-pairs/config" "color-mixer/config" "mouse-maze/config" "balloon-archer/config" "registry.test")
# native: must grep the symbol AND trace each game config import chain -> 3 realistic cmds
run T3A-transitive-impact L3-complex native \
  "grep -rln 'registerGame' src --include='*.ts' && grep -rn 'config' src/games/index.ts" \
  3 "$RAW/T3A_native.txt" "${GT3A[@]}"
run T3A-transitive-impact L3-complex sem \
  "sem impact 'function registerGame'" \
  1 "$RAW/T3A_sem.txt" "${GT3A[@]}"

############################################################
# L3-B: transitive impact of the GameConfig type (wide blast radius)
# GT: the cross-file consumers of the type
############################################################
GT3B=("registry.ts" "validate.ts" "bands.ts" "gameMeta.ts" "HomeScreen" "types/index.ts")
run T3B-type-impact L3-complex native \
  "grep -rln 'GameConfig' src --include='*.ts' --include='*.tsx'" \
  1 "$RAW/T3B_native.txt" "${GT3B[@]}"
run T3B-type-impact L3-complex sem \
  "sem impact 'type GameConfig'" \
  1 "$RAW/T3B_sem.txt" "${GT3B[@]}"

echo "=== done. results: $OUT ==="
cat "$OUT" | column -t -s,

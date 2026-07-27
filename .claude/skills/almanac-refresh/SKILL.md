---
name: almanac-refresh
description: Use when the CodeAlmanac wiki under almanac/ has fallen behind the code — after merging a batch of PRs, after commits from outside contributors whose sessions were never on this machine, or when asked to update, refresh, or re-sync the wiki. Covers codealmanac ingest git ranges, sync, garden, and validate.
---

# Refreshing the CodeAlmanac wiki

The wiki is only as current as the last run. `codealmanac sync` reads *local agent transcripts*, so it cannot see work done by other contributors — an open-source repo needs `ingest git:range:` to fold that history in. Everything here is done through the CLI; do not hand-edit `almanac/` pages (that is the maintenance boundary in `~/.claude/codealmanac.md`).

## Preflight

```bash
codealmanac doctor                 # version, wiki registration, page count, health
codealmanac health                 # orphans, dead refs, broken links, empty topics
codealmanac sync status            # how many local transcripts are eligible/ready
codealmanac config list            # confirm auto_commit and harness.model
git status --short                 # look for leftovers from a cancelled job
git log --oneline <last-wiki-commit>..HEAD
```

Uncommitted `almanac/` changes usually mean a **cancelled job** (check `codealmanac jobs`). Decide with the user whether to commit, keep, or revert them before starting — a half-finished garden pass will confuse the next run.

## Choosing ranges (the two traps)

**Trap 1 — the 60k snapshot cap.** The git source adapter feeds the agent `log --oneline`, `diff --stat` and `diff` for the range, truncated at 60,000 chars. Measure before committing to a range:

```bash
git diff --no-ext-diff <range> | wc -c     # keep under ~55000
```

Split oversized history into thematic ranges rather than letting a diff be silently cut in half.

**Trap 2 — phantom deletions from branch topology.** `git diff A..B` is a *tree* diff. A topic branch cut before another PR merged will appear to delete that PR's files. Check ancestry and pick anchors accordingly:

```bash
git merge-base --is-ancestor A B && echo "A is an ancestor of B"
git log --oneline --topo-order --graph <base>..<tip>
```

When a range is unavoidably a sibling branch, say so in `--guidance` — otherwise the agent records the other PR's work as removed.

## The run sequence

Run these **one at a time**, oldest history first, so each pass sees the previous pass's pages:

| Step | Command | Why |
|---|---|---|
| 1..n | `codealmanac ingest "git:range:A..B" --title ... --guidance ...` | the code history, including other people's commits |
| then | `codealmanac sync` | local transcripts, for reasoning that never reached the diff |
| then | `codealmanac garden --guidance ...` | reconcile the seams the sequential runs left |
| last | `codealmanac validate` and `codealmanac health` | must be `ok` / 0 problems |

Jobs are **asynchronous** — the CLI dispatches and returns a job id immediately. Wait on one before starting the next:

```bash
until ! codealmanac jobs --limit 3 | grep -qE '(running|queued)'; do sleep 20; done
codealmanac jobs logs <job-id>     # why a run no-op'd, or what it verified
```

Runs take 2–12 minutes each. A `sync` no-op is a normal, correct outcome when the eligible transcripts are the ingest agents' own sessions.

## Writing `--guidance`

Guidance is where the run's quality comes from. Include all five:

1. **The themes**, named concretely with commit SHAs — not "recent changes".
2. **Which existing pages should absorb it**, so the run updates instead of spawning near-duplicates.
3. **What earlier runs already recorded**, with "do not revert or contradict it".
4. **Topology notes** when the range is a sibling branch (see Trap 2).
5. **"Verify against current code — this repo takes commits from outside contributors."** Explicit permission to no-op belongs here too.

For the `garden` pass, name the **seams**: pages split across runs that may now overlap, hubs that no longer list what exists, topic tags added without a `topics.yaml` entry, and any inventory-style page that goes stale on every run.

## After the runs

- With `auto_commit=true` the workflow commits **and pushes its own branch** (e.g. `wiki-updates`); `master` is untouched and no PR is opened. Check `git branch --show-current` — a run may have moved you off the branch you started on.
- Runs may add a `Co-Authored-By: Claude ...` trailer, which this repo does not want. Strip it *before* the branch is pushed (`git filter-branch --msg-filter 'grep -v "^Co-Authored-By: Claude"' master..HEAD`); once pushed, drop it via the squash-merge message instead of force-pushing.
- Report what changed as page-level knowledge — new pages, **stale claims corrected**, removals — not as a file list.

## Common mistakes

| Mistake | Consequence |
|---|---|
| One ingest for all the history | diff truncated at 60k; the agent silently misses the tail |
| Running ingests in parallel | later runs cannot see earlier pages; duplicate coverage |
| Skipping `garden` | seams stay: overlapping pages, undefined topics, stale hubs |
| Relying on `sync` alone | outside contributors' work never enters the wiki |
| Hand-editing `almanac/` to "fix" a page | bypasses evidence/`sources:` conventions and the index |
| Trusting the wiki over the code | pages drift; the ingest agent's job is to correct them |

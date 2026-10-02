---
title: CodeAlmanac Wiki
topics: [concepts]
sources: []
---

# CodeAlmanac Wiki

This is the living wiki for this repository. It records the durable knowledge
the code cannot say: decisions, flows, invariants, incidents, gotchas, and
project context that future agents should not rediscover from scratch.

Start at [Getting started](getting-started) — it orients a new agent to the
three clusters worth reading first (the game module pattern and SDK boundary,
the flow engine, and the design system/i18n/RTL layer), routes to guides for
common work, and lists the decisions and reference pages that are easy to get
wrong if skipped.

## Notability Bar

Write a page when it preserves non-obvious knowledge that will help a future
agent work safely in this codebase.

Good pages explain:

- a decision that took research or trial-and-error
- a cross-file flow
- an invariant or gotcha not visible from one file
- an external dependency as this repo uses it
- a product or operational constraint that shapes future work

Do not write pages that restate nearby code.

## Topic Taxonomy

Topics live in `topics.yaml`. Pages are Markdown files directly under
`almanac/`, including nested folders.

## Links

Use normal Markdown links between pages. Put file evidence in `sources:`.

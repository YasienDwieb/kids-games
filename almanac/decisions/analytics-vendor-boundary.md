---
title: "Decision: Analytics Sinks Stay Behind a Tested Vendor Boundary"
summary: "Only files under src/sdk/analytics/sinks/ may import an analytics vendor SDK, so swapping or adding a vendor (PostHog today) is a one-file change; unlike the convention-only SDK-only import boundary, this one is enforced by vendorBoundary.test.ts scanning every source file for a vendor import string."
topics: [decisions, analytics, sdk]
sources:
  - id: vendor-boundary-test
    type: file
    path: src/sdk/analytics/__tests__/vendorBoundary.test.ts
  - id: types-ts
    type: file
    path: src/sdk/analytics/types.ts
  - id: init-ts
    type: file
    path: src/sdk/analytics/init.ts
  - id: analytics-md
    type: file
    path: docs/ANALYTICS.md
---

This decision fixes where a third-party analytics SDK is allowed to be
imported anywhere in the app: nowhere except `src/sdk/analytics/sinks/`, and a
Jest test enforces it rather than leaving it to a `CONTRIBUTING.md` rule a
contributor has to remember. It is the reason
[Analytics: anonymous usage events](../architecture/analytics) can describe
swapping PostHog for another vendor as a one-file change rather than a
repo-wide audit.

## Context

The analytics module was added specifically to answer coarse release-health
questions (which games get played, how long, how many rounds) without
depending permanently on one vendor's SDK or API shape [@analytics-md]. If
call sites across screens and games had imported `posthog-react-native`
directly wherever they wanted to report an event, replacing PostHog later —
for pricing, data-residency, or feature reasons — would mean finding and
rewriting every one of those call sites, with no single place to check that
all of them had been caught. The project already had one precedent for
solving this kind of fan-out problem with a single barrel — the
[SDK-only import boundary](sdk-only-import-boundary) that funnels every
game through `@/sdk` — but that boundary is enforced only by `CONTRIBUTING.md`
and `CLAUDE.md` convention, with no lint rule or test rejecting a violation.
Analytics needed the same shape of boundary, narrower in scope (one vendor
dependency, not a whole cross-game coupling surface), and the PR introducing
it chose to make the narrower boundary machine-checked instead of relying on
convention a second time.

## Decision

Every analytics backend must implement the `AnalyticsSink` interface
(`track`, `setEnabled`, `flush`) and live in `src/sdk/analytics/sinks/`
[@types-ts]. `vendorBoundary.test.ts` walks every `.ts`/`.tsx` file under
`src/` outside that one folder, checks each file's text for an import string
matching a short list of known analytics vendor package names
(`posthog-react-native`, `@aptabase/`, `@amplitude/`, `mixpanel`,
`@segment/`), and fails listing every offending file if any match outside
`sinks/` [@vendor-boundary-test]. `init.ts`, the boot-time wiring that picks
which sink(s) to hand to `setupAnalytics`, loads the PostHog sink with a
runtime `require('./sinks/posthog')` rather than a static `import`
specifically so a build with no `EXPO_PUBLIC_ANALYTICS_KEY` set never
initializes the vendor module at all, and is itself kept out of the `@/sdk`
barrel so no test that imports `@/sdk` can transitively pull in a vendor SDK
[@init-ts].

## Status

Current and enforced. `vendorBoundary.test.ts` runs as part of the ordinary
Jest suite, so (unlike the [SDK-only import boundary](sdk-only-import-boundary))
a violation fails CI-equivalent local test runs rather than depending on a
reviewer noticing it — though see
[No CI quality gate](no-ci-quality-gate) for the separate fact that nothing
automatically runs the test suite on a PR in this repo.

## Consequences

Adding or swapping an analytics vendor is a bounded, auditable change: write
one new file under `sinks/`, implement `AnalyticsSink`, and flip the
selection in `init.ts` — `docs/ANALYTICS.md` recommends returning both the old
and new sink from `init.ts` for a few weeks during a migration so trend lines
do not break at the cutover [@analytics-md]. The test only catches a vendor
*import*; it does not and cannot prevent a sink itself from being configured
to over-collect (that is a code-review concern for changes inside `sinks/`,
not something the boundary test checks), and it only recognizes the vendor
names already listed in the test, so adding a sink for an unlisted vendor
would not trip it if that sink's import somehow leaked outside `sinks/`. The
boundary also does not stop a call site from importing `src/sdk/analytics/client.ts`
directly instead of the `@/sdk` barrel's `track`/`usePlaySession` re-exports —
it protects the vendor dependency specifically, not the internal module
boundary the ordinary [SDK-only import boundary](sdk-only-import-boundary)
protects for games.

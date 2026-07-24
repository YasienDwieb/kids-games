---
title: "No CI Quality Gate"
summary: "The repo has no automated typecheck or test workflow on push or PR; the two GitHub Actions workflows are manual release pipelines, and quality checks are a documented developer responsibility."
topics: [decisions, ci, testing]
sources:
  - id: release-apk-workflow
    type: file
    path: .github/workflows/release-apk.yml
  - id: release-aab-workflow
    type: file
    path: .github/workflows/release-aab.yml
  - id: contributing
    type: file
    path: CONTRIBUTING.md
  - id: setup-doc
    type: file
    path: docs/SETUP.md
---

Kids Games is built and maintained at small scale, and every game in
`src/games/` still has to satisfy a TypeScript contract and pass its pure-logic
tests before it is safe to ship to children. A standard way to enforce that is
a CI matrix that runs typecheck and tests on every push or pull request, but
that carries an ongoing maintenance and CI-minutes cost that a solo or
small-team project may not want to pay for a codebase this size. The project's
choice reflects that tradeoff.

## Decision

The only two workflows under `.github/workflows/` are `release-apk.yml` and
`release-aab.yml`, and both are `workflow_dispatch` triggers — meaning a human
runs them on demand, they never fire on `push` or `pull_request`
[@release-apk-workflow] [@release-aab-workflow]. `release-apk.yml` bumps the
app version, builds a preview APK with `eas build --profile preview`, and
publishes it as a GitHub Release [@release-apk-workflow]. `release-aab.yml`
builds a production AAB, submits it to Google Play's internal track with
`eas submit`, and pushes the fastlane listing metadata for that release
[@release-aab-workflow]. Neither workflow runs `npm test` or
`tsc --noEmit` at any step.

Instead, `CONTRIBUTING.md` states that both commands "must be green before
submitting a PR" — `npm test` for the Jest suite and `npx tsc --noEmit` for
the strict-mode TypeScript check [@contributing]. `docs/SETUP.md` repeats the
same two commands under "Quality checks," and adds a third:
`npx expo export --platform ios`, used as a smoke check that the JS bundle
still resolves before pushing [@setup-doc]. All three checks are documented
developer responsibilities, not automated gates.

## Status

Current. Anyone adding CI-triggered typecheck or test jobs in the future
should treat that as new coverage, not a duplicate of anything already
running — nothing currently runs these checks automatically.

## Consequences

A broken type or a failing pure-logic test can be pushed to `master`, or even
released through `release-apk.yml` or `release-aab.yml`, without any
automated system catching it first. The project instead relies on the
contributor — human or AI agent — actually running `npm test`,
`tsc --noEmit`, and the bundle-export smoke check locally before pushing,
exactly as `CONTRIBUTING.md` and `docs/SETUP.md` describe. That is a real gap
a future maintainer should know about rather than assume CI enforces. See
[Release an Android build](../guides/release-an-android-build) for what the
two release workflows actually do, and
[Test on a real device](../guides/test-on-a-real-device) for the manual
verification step that stands in for automated device testing.

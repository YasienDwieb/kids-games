fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android tracks

```sh
[bundle exec] fastlane android tracks
```

List Play tracks and their releases (version codes) — read-only.

### android validate

```sh
[bundle exec] fastlane android validate
```

Validate listing text + images + changelogs against the Play API (no changes).

Requires version_code: of an existing release on track: (default production).

### android metadata

```sh
[bundle exec] fastlane android metadata
```

Upload listing text + images for an existing release (no binary, no changelogs).

Requires version_code: of an existing release on track: (default production).

### android changelog

```sh
[bundle exec] fastlane android changelog
```

Push only release notes for an existing release.

Requires version_code: of an existing release on track: (default production).

### android promote

```sh
[bundle exec] fastlane android promote
```

Promote an existing release to another track — no rebuild, no new version code.

fastlane promote version_code:<vc> [track:internal] [to:production] [status:draft]

### android rollout

```sh
[bundle exec] fastlane android rollout
```

Start rollout of an existing draft release — this is what makes it live.

fastlane rollout version_code:<vc> [track:production] [percent:0.2]

### android pull

```sh
[bundle exec] fastlane android pull
```

Pull current listing from Play Console into fastlane/metadata.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

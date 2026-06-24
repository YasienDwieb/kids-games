#!/usr/bin/env bash
# Validate the Fastlane Play Store listing before a release commit.
#
# Checks, per locale (en-US, ar):
#   - title.txt              ≤ 30 chars
#   - short_description.txt  ≤ 80 chars
#   - full_description.txt   ≤ 4000 chars
#   - changelogs/default.txt exists and ≤ 500 chars
#   - phoneScreenshots/      2–8 images, no duplicate numeric index
#
# Char counts ignore a single trailing newline. Exits non-zero on any failure.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
META="$ROOT/fastlane/metadata/android"
LOCALES=(en-US ar)
fail=0

# Character count of a file's content, ignoring one trailing newline.
charcount() { printf '%s' "$(cat "$1")" | wc -m | tr -d ' '; }

check_limit() { # <file> <max> <label>
  local file="$1" max="$2" label="$3"
  if [[ ! -f "$file" ]]; then
    echo "  ✗ $label: MISSING ($file)"; fail=1; return
  fi
  local n; n=$(charcount "$file")
  if (( n > max )); then
    echo "  ✗ $label: $n chars (limit $max)"; fail=1
  else
    echo "  ✓ $label: $n/$max chars"
  fi
}

check_screenshots() { # <dir>
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "  ⚠ phoneScreenshots: directory missing"; return
  fi
  # Collect image files and their leading numeric index (e.g. 01.jpg -> 01).
  local files=() indices=() f base idx
  while IFS= read -r f; do files+=("$f"); done < <(
    find "$dir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | sort
  )
  local count=${#files[@]}
  if (( count < 2 || count > 8 )); then
    echo "  ✗ phoneScreenshots: $count images (need 2–8)"; fail=1
  else
    echo "  ✓ phoneScreenshots: $count images"
  fi
  # Duplicate-index detection (same number, different extension).
  for f in "${files[@]}"; do
    base="$(basename "$f")"; idx="${base%%.*}"; indices+=("$idx")
  done
  local dup
  dup=$(printf '%s\n' "${indices[@]}" | sort | uniq -d)
  if [[ -n "$dup" ]]; then
    echo "  ✗ phoneScreenshots: duplicate index(es): $(echo "$dup" | tr '\n' ' ')"; fail=1
  fi
}

for loc in "${LOCALES[@]}"; do
  echo "[$loc]"
  d="$META/$loc"
  check_limit "$d/title.txt"             30   "title"
  check_limit "$d/short_description.txt" 80   "short_description"
  check_limit "$d/full_description.txt"  4000 "full_description"
  check_limit "$d/changelogs/default.txt" 500 "changelog (default)"
  check_screenshots "$d/images/phoneScreenshots"
  echo
done

if (( fail )); then
  echo "Listing check FAILED — fix the ✗ items above before committing."
  exit 1
fi
echo "Listing check passed ✓"

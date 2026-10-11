#!/usr/bin/env bash
# Validate the Fastlane Play Store listing before a release commit.
#
# Checks, per locale (en-US, ar):
#   - title.txt              ≤ 30 chars
#   - short_description.txt  ≤ 80 chars
#   - full_description.txt   ≤ 4000 chars
#   - changelogs/default.txt exists and ≤ 500 chars
#   - phoneScreenshots/      2–8 images, no duplicate numeric index
#   - featureGraphic.<ext>   present, exactly 1024x500
#   - icon.<ext>             present, exactly 512x512
#
# Note on layout: supply globs single images as images/<type>.<ext> — a FILE
# directly in images/, not images/<type>/<type>.<ext> (supply/uploader.rb
# #upload_images). It does `next unless path`, so the subdirectory layout
# uploads NOTHING and still reports success. Only screenshots use a
# subdirectory. This script fails on the subdirectory form for that reason.
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

dimensions() {
  file -b "$1" | grep -oE '[0-9]+ ?x ?[0-9]+' | tail -1 | tr -d ' '
}

check_image() { # <images-dir> <type> <expected-WxH>
  local dir="$1" type="$2" want="$3" path got
  path=$(find "$dir" -maxdepth 1 -type f \( -iname "$type.jpg" -o -iname "$type.jpeg" -o -iname "$type.png" \) | sort | tail -1)
  if [[ -z "$path" ]]; then
    if [[ -d "$dir/$type" ]]; then
      echo "  ✗ $type: found images/$type/ — supply ignores that; move it to images/$type.<ext>"
    else
      echo "  ✗ $type: MISSING (expected $dir/$type.{png,jpg,jpeg})"
    fi
    fail=1; return
  fi
  got=$(dimensions "$path")
  if [[ "$got" != "$want" ]]; then
    echo "  ✗ $type: ${got:-unknown} (Play requires exactly $want)"; fail=1
  else
    echo "  ✓ $type: $got — $(basename "$path")"
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
  check_image "$d/images" featureGraphic 1024x500
  check_image "$d/images" icon           512x512
  echo
done

if (( fail )); then
  echo "Listing check FAILED — fix the ✗ items above before committing."
  exit 1
fi
echo "Listing check passed ✓"

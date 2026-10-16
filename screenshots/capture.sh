#!/usr/bin/env bash
# Store screenshots: boots the KidsZone_Shots AVD, installs the release APK,
# seeds demo state and captures every scene in English and Arabic, for the
# phone, Play tablet and iPad forms.
#
#   bash screenshots/capture.sh [--apk PATH] [--lang en|ar] [--form phone|tablet|ipad] [--scenes "turbo maze"] [--keep]
#
# Writes screenshots/out/raw/<lang>/<form>/<scene>.png (+ .txt UI text).
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME=${ANDROID_HOME:-/media/yasien/mediaHome/Android/Sdk}
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PKG=dev.waybeyond.kidszone
APK=android/app/build/outputs/apk/release/app-release.apk
LANGS="en ar"; FORMS="phone tablet ipad"; ONLY=; KEEP=
while [ $# -gt 0 ]; do
  case $1 in
    --apk) APK=$2; shift ;;
    --lang) LANGS=$2; shift ;;
    --form) FORMS=$2; shift ;;
    --scenes) ONLY=$2; shift ;;
    --keep) KEEP=1 ;;
  esac; shift
done

source screenshots/android.sh
apk_check "$APK"

# Never touch a phone plugged in over USB: everything goes to emulator-5580.
# -no-audio makes API 34's MediaSessionService block until the watchdog kills
# system_server, and a snapshot saved from that state stays broken: keep audio
# on and always cold-boot.
export ANDROID_SERIAL=emulator-5580
if ! adb devices | grep -q "^$ANDROID_SERIAL"; then
  mkdir -p screenshots/out
  "$ANDROID_HOME/emulator/emulator" -avd KidsZone_Shots -no-window -no-snapshot -no-boot-anim \
    -gpu swiftshader_indirect -port 5580 > screenshots/out/emulator.log 2>&1 &
  STARTED=1
fi
timeout 300 adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 3; done
adb root >/dev/null; sleep 4; adb wait-for-device
until adb shell pm path android >/dev/null 2>&1; do sleep 3; done
trap 'form_reset; [ -n "$KEEP" ] || avd_kill' EXIT

adb install --no-streaming -r -g "$APK" >/dev/null
# One local "today" for the device clock and the seed (UTC can be a day behind).
DAY=$(date +%F)
device_prepare "$DAY" 1730

DB=/data/data/$PKG/databases/RKStorage
launch() { adb shell am force-stop "$PKG"; adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 7; }

# Fresh app data + demo state for one language. The app creates RKStorage on
# first launch; the seed then replaces its rows.
seed() {
  adb shell pm clear "$PKG" >/dev/null
  launch
  # A cold first launch can take well past launch's 7s.
  for _ in $(seq 30); do adb shell ls "$DB" >/dev/null 2>&1 && break; sleep 2; done
  adb shell am force-stop "$PKG"
  node screenshots/seed.js --lang "$1" --day "$DAY" > screenshots/out/seed.sql
  adb push screenshots/out/seed.sql /data/local/tmp/seed.sql >/dev/null
  adb shell "sqlite3 $DB < /data/local/tmp/seed.sql"
  adb shell "chown -R \$(stat -c %u:%g /data/data/$PKG) /data/data/$PKG/databases && restorecon -R /data/data/$PKG/databases" >/dev/null
  # Arabic applies RTL with a reload on first start; let it settle once.
  launch; sleep 5
}

# Labels per language (tile accessibility labels are the games' meta.name).
label() {
  case "$LANG_:$1" in
    en:letters) echo 'Letter Land' ;;       ar:letters) echo 'أرض الحروف' ;;
    en:numbers) echo 'Numbers Land' ;;      ar:numbers) echo 'أرض الأرقام' ;;
    en:turbo) echo 'Turbo Road' ;;          ar:turbo) echo 'سباق السيارات' ;;
    en:maze) echo 'Mouse Maze' ;;           ar:maze) echo 'متاهة الفأر' ;;
    en:pairs) echo 'Simple Pairs' ;;        ar:pairs) echo 'الذاكرة الممتعة' ;;
    en:easy) echo 'Easy' ;;                 ar:easy) echo 'سهل' ;;
    en:mixer) echo 'Color Mixer' ;;         ar:mixer) echo 'خلّاط الألوان' ;;
    en:matchup) echo 'Match Up' ;;          ar:matchup) echo 'وصّل الزوج' ;;
    en:drop) echo 'Drop colors here!' ;;    ar:drop) echo 'ضع الألوان هنا!' ;;
    en:startover) echo 'Start over' ;;      ar:startover) echo 'ابدأ من جديد' ;;
    en:grownups) echo 'Grown-ups' ;;        ar:grownups) echo 'للكبار' ;;
    en:parents) echo 'Parents' ;;           ar:parents) echo 'للأهل' ;;
    en:wardrobe) echo '48 stars[^"]*' ;;    ar:wardrobe) echo '48 نجمة[^"]*' ;;
  esac
}

scene_home()     { launch; sleep 3; }
scene_letters()  { launch; open_game "$(label letters)" || return 1; sleep 6; }
scene_numbers()  { launch; open_game "$(label numbers)" || return 1; sleep 6; }
# Race! is the biggest coral (ACCENTS.coral) blob on Turbo Road's start card.
scene_turbo()    { launch; open_game "$(label turbo)" || return 1; sleep 5; tap_color 'srgb(255,107,94)'; sleep 12; }
scene_wardrobe() { launch; tap_text "$(label wardrobe)"; sleep 6; }
scene_maze()     { launch; open_game "$(label maze)" || return 1; sleep 6; }
# Run SQL against the app's AsyncStorage (app must be force-stopped).
sql() { printf '%s\n' "$1" > screenshots/out/.q.sql; adb push screenshots/out/.q.sql /data/local/tmp/q.sql >/dev/null; adb shell "sqlite3 $DB < /data/local/tmp/q.sql"; }
# Win Simple Pairs one star short of level 8, so the full-screen LEVEL UP card
# plays. Rewards roll back to the seed on every try; it's shot last because the
# win keeps its star (Home and the wardrobe read 48).
scene_pairs() {
  adb shell am force-stop "$PKG"
  sql "CREATE TABLE IF NOT EXISTS shot_bak AS SELECT * FROM catalystLocalStorage WHERE key IN ('kg:rewards','kg:playtime');
INSERT OR REPLACE INTO catalystLocalStorage SELECT * FROM shot_bak;
UPDATE catalystLocalStorage SET value = json_set(value, '\$.stars', 55) WHERE key = 'kg:rewards';"
  launch; open_game "$(label pairs)" || return 1; sleep 3; tap_text "$(label easy)" || return 1; sleep 2
  solve_pairs || return 1; sleep 10
}
# Color Mixer free play: yellow already in the pot, blue held mid-drag over its
# rim (finger down while the frame is taken, so it's not timing-dependent).
scene_mixer() {
  local y b w
  launch; open_game "$(label mixer)" || return 1; sleep 5
  set -- $(bounds_of "$(label drop)"); [ $# -eq 4 ] || return 1
  local px=$(( ($1 + $3) / 2 )) py=$(( ($2 + $4) / 2 - 40 )); w=$(( $3 - $1 ))
  y=($(blob_boxes '#FDD835' 3000 3)); b=($(blob_boxes '#1E88E5' 3000 3))
  [ ${#y[@]} -eq 6 ] && [ ${#b[@]} -eq 6 ] || { echo "mixer: paints not found" >&2; return 1; }
  adb shell input swipe "${y[4]}" "${y[5]}" "$px" "$py" 1200; sleep 3
  # Hold blue up and toward the palette side of the pot (mirrors under RTL).
  local hx=$(( px + (b[4] > px ? 1 : -1) * w * 55 / 100 )) hy=$(( py - w * 36 / 100 ))
  adb shell "input motionevent DOWN ${b[4]} ${b[5]}; for s in 1 2 3 4 5 6 7 8; do input motionevent MOVE \$(( ${b[4]} + ($hx - ${b[4]}) * s / 8 )) \$(( ${b[5]} + ($hy - ${b[5]}) * s / 8 )); done"
  sleep 1.5; demo_mode; snap
  adb shell input motionevent UP "$hx" "$hy"
}
# Match Up round 1 is always animal → food (src/games/match-up/content.ts).
MATCHUP_PAIRS='1F436:1F9B4 1F430:1F955 1F42D:1F9C0 1F431:1F41F 1F43B:1F36F 1F435:1F34C 1F43C:1F38B 1F43F:1F330'
# A retry finds round 1's progress saved: skip the resume prompt.
scene_matchup() {
  launch; open_game "$(label matchup)" || return 1; sleep 5
  [ -z "$(bounds_of "$(label startover)")" ] || { tap_text "$(label startover)"; sleep 3; }
  solve_matchup 2 "$MATCHUP_PAIRS" || return 1; sleep 3
}
scene_parents()  { launch; tap_text "$(label grownups)"; sleep 3; solve_gate; sleep 3; tap_text "$(label parents)"; sleep 3; }

SCENES=(
  "home|PLAY|العب"
  "letters|-"
  "turbo|-"
  "numbers|-"
  "wardrobe|-"
  "mixer|@"
  "matchup|-"
  "maze|-"
  "parents|Daily play limit|حدّ|حد"
  "pairs|-"
)

# --scenes re-shoots a subset without wiping the other captures of that form.
if [ -n "$ONLY" ]; then
  keep=(); for e in "${SCENES[@]}"; do [[ " $ONLY " == *" ${e%%|*} "* ]] && keep+=("$e"); done; SCENES=("${keep[@]}")
fi

for LANG_ in $LANGS; do
  RTL=; [ "$LANG_" = ar ] && RTL=1
  for form in $FORMS; do
    case $form in
      phone) form_reset ;;
      tablet) form_tablet 1600x2560 320 ;;   # 2560x1600 landscape, Play 10"
      ipad) form_tablet 1536x2048 288 ;;     # 2048x1536 landscape, 4:3 like iPad 13"
    esac
    seed "$LANG_"
    OUT=screenshots/out/raw/$LANG_ run_scenes "$form" "${SCENES[@]}"
  done
done
echo "done: screenshots/out/raw"

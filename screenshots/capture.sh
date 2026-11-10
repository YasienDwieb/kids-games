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

export ANDROID_HOME=${ANDROID_HOME:-$([ -d ~/Library/Android/sdk ] && echo ~/Library/Android/sdk || echo /media/yasien/mediaHome/Android/Sdk)}
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
    en:easy) echo 'Easy[^"]*' ;;           ar:easy) echo 'سهل[^"]*' ;;
    en:mixer) echo 'Color Mixer' ;;         ar:mixer) echo 'خلّاط الألوان' ;;
    en:matchup) echo 'Match Up' ;;          ar:matchup) echo 'وصّل الزوج' ;;
    en:drop) echo 'Drag a color into the bowl!' ;;  ar:drop) echo 'اِسْحَبْ لَوْنًا إِلى الوِعاء!' ;;
    en:yellow) echo 'Yellow' ;;             ar:yellow) echo 'أصفر' ;;
    en:blue) echo 'Blue' ;;                 ar:blue) echo 'أزرق' ;;
    en:startover) echo 'Start over' ;;      ar:startover) echo 'ابدأ من جديد' ;;
    en:buddy) echo 'Mariam' ;;              ar:buddy) echo 'مريم' ;;
    en:language) echo 'Change language' ;;  ar:language) echo 'تغيير اللغة' ;;
    en:grownups) echo 'Grown-ups' ;;        ar:grownups) echo 'للكبار' ;;
    en:parents) echo 'Parents' ;;           ar:parents) echo 'للأهل' ;;
    en:wardrobe) echo '48 stars[^"]*' ;;    ar:wardrobe) echo '48 نجمة[^"]*' ;;
  esac
}

scene_home()     { launch; sleep 3; }
scene_letters()  { launch; open_game "$(label letters)" || return 1; sleep 6; }
scene_numbers()  { launch; open_game "$(label numbers)" || return 1; sleep 6; }
# Race! is the biggest lime (ACCENTS.green) blob on Turbo Road's start card.
scene_turbo()    { launch; open_game "$(label turbo)" || return 1; sleep 5; tap_color 'srgb(125,219,60)'; sleep 12; }
scene_wardrobe() { launch; tap_text "$(label wardrobe)"; sleep 6; }
scene_maze()     { launch; open_game "$(label maze)" || return 1; sleep 6; }
# Run SQL against the app's AsyncStorage (app must be force-stopped).
sql() { printf '%s\n' "$1" > screenshots/out/.q.sql; adb push screenshots/out/.q.sql /data/local/tmp/q.sql >/dev/null; adb shell "sqlite3 $DB < /data/local/tmp/q.sql"; }
# Set one top-level field of a kg:* JSON row, edited on the host (the device's sqlite3 may lack json1).
jset() {
  local v; v=$(sql "SELECT value FROM catalystLocalStorage WHERE key = '$1';" | tr -d '\r')
  v=$(node -e 'const o=JSON.parse(process.argv[1]); o[process.argv[2]]=JSON.parse(process.argv[3]); process.stdout.write(JSON.stringify(o).replace(/\x27/g, "\x27\x27"))' "$v" "$2" "$3")
  sql "UPDATE catalystLocalStorage SET value = '$v' WHERE key = '$1';"
}
# Win Simple Pairs one star short of level 8, so the full-screen LEVEL UP card
# plays. Rewards roll back to the seed on every try; it's shot last because the
# win keeps its star (Home and the wardrobe read 48).
scene_pairs() {
  adb shell am force-stop "$PKG"
  sql "CREATE TABLE IF NOT EXISTS shot_bak AS SELECT * FROM catalystLocalStorage WHERE key IN ('kg:rewards','kg:playtime');
INSERT OR REPLACE INTO catalystLocalStorage SELECT * FROM shot_bak;"
  jset kg:rewards stars 55
  launch; open_game "$(label pairs)" || return 1; sleep 3; tap_text "$(label easy)" || return 1; sleep 2
  solve_pairs || return 1
  # The Level Up card (grape rays) closes itself after ~2s: burst, keep its middle frame.
  demo_mode
  adb shell 'rm -rf /sdcard/burst; mkdir /sdcard/burst; for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do screencap -p /sdcard/burst/$i.png; sleep 0.5; done'
  rm -rf "$OUT/.burst"; adb pull /sdcard/burst "$OUT/.burst" >/dev/null
  local f hits=()
  for f in "$OUT"/.burst/*.png; do
    [ "$(magick "$f" -alpha off -fuzz 10% -fill black +opaque 'srgb(123,77,255)' -fill white -opaque 'srgb(123,77,255)' -format '%[fx:mean>0.1]' info:)" = 1 ] && hits+=("$f")
  done
  [ ${#hits[@]} -gt 0 ] || { echo "pairs: no Level Up card" >&2; return 1; }
  cp "${hits[$(( ${#hits[@]} / 2 ))]}" "$dir/$name.png"
}
# Color Mixer free play: yellow already in the bowl, blue held mid-drag over its
# rim (finger down while the frame is taken, so it's not timing-dependent).
scene_mixer() {
  local y b w
  launch; open_game "$(label mixer)" || return 1; sleep 2
  # One dump for all three targets: the idle help hand (8s with an empty bowl) stops dumps working.
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb shell cat /sdcard/ui.xml > screenshots/out/.mixer.xml
  at() { grep -oE "content-desc=\"$1\"[^>]*bounds=\"[^\"]*\"" screenshots/out/.mixer.xml | head -1 | grep -oE 'bounds="[^"]*"' | grep -oE '[0-9]+' | tr '\n' ' '; }
  set -- $(at "$(label drop)"); [ $# -eq 4 ] || return 1
  local px=$(( ($1 + $3) / 2 )) py=$(( ($2 + $4) / 2 - 40 )); w=$(( $3 - $1 ))
  local c; c=($(at "$(label yellow)")); [ ${#c[@]} -eq 4 ] || return 1; y=(0 0 0 0 $(( (c[0] + c[2]) / 2 )) $(( (c[1] + c[3]) / 2 )))
  c=($(at "$(label blue)")); [ ${#c[@]} -eq 4 ] || return 1; b=(0 0 0 0 $(( (c[0] + c[2]) / 2 )) $(( (c[1] + c[3]) / 2 )))
  adb shell input swipe "${y[4]}" "${y[5]}" "$px" "$py" 1200; sleep 3
  # Hold blue up and toward the palette side of the bowl (mirrors under RTL).
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
# The buddy picker that greets a first launch: unpick the buddy, shoot, restore.
scene_picker() {
  adb shell am force-stop "$PKG"
  jset kg:settings buddy null
  launch; sleep 4
  # Home's own buddy (behind the picker) shares the label: the picker card is the last match.
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  local b; b=($(adb shell cat /sdcard/ui.xml | grep -oE "content-desc=\"$(label buddy)\"[^>]*bounds=\"[^\"]*\"" | tail -1 | grep -oE '[0-9]+'))
  [ ${#b[@]} -eq 4 ] || return 1
  adb shell input tap $(( (b[0] + b[2]) / 2 )) $(( (b[1] + b[3]) / 2 )); sleep 5; demo_mode; snap
  adb shell am force-stop "$PKG"
  jset kg:settings buddy '"mariam"'
}
# On the iPad form the dump gives the edge-most Grown-ups button empty bounds: it's
# the next button past Change language (mirrored under RTL).
open_grownups() {
  [ -n "$(bounds_of "$(label grownups)")" ] && { tap_text "$(label grownups)"; return; }
  set -- $(bounds_of "$(label language)"); [ $# -eq 4 ] || return 1
  local step=$(( ($3 - $1) * 116 / 100 ))
  [ -n "${RTL:-}" ] && step=$(( -step ))
  adb shell input tap $(( ($1 + $3) / 2 + step )) $(( ($2 + $4) / 2 ))
}
scene_parents()  { launch; open_grownups || return 1; sleep 3; solve_gate; sleep 3; tap_text "$(label parents)"; sleep 3; }

SCENES=(
  "home|PLAY|العب"
  "picker|@"
  "letters|-"
  "turbo|-"
  "numbers|-"
  "wardrobe|-"
  "mixer|@"
  "matchup|-"
  "maze|-"
  "parents|Daily play limit|حدّ|حد"
  "pairs|@"
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

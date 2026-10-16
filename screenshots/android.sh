# adb helpers for scripted screenshots. Source it from bash (not zsh — the
# helpers rely on word splitting). Needs: PKG (application id). Optional:
# ANDROID_SERIAL (set by avd_boot), OUT (raw output dir, default screenshots/out/raw).
#
#   source android.sh
#   avd_ensure Shots && avd_boot Shots 5580 && device_prepare 2026-10-22
#   scene_home() { cold_start spendings://; }
#   run_scenes phone "home|^Today$" ...

SDK=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}
IMAGE=${IMAGE:-"system-images;android-34;google_apis;x86_64"}
OUT=${OUT:-screenshots/out/raw}

# ---------- emulator ----------

# Creates the AVD if missing. google_apis (not playstore) so `adb root` works;
# never aosp_atd — its framebuffer captures black.
avd_ensure() {
  local name=$1 w=${2:-1080} h=${3:-2340} dpi=${4:-440}
  "$SDK/emulator/emulator" -list-avds | grep -x "$name" >/dev/null && return 0
  local dir="$SDK/$(echo "$IMAGE" | tr ';' '/')"
  [ -d "$dir" ] || yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" --install "$IMAGE"
  echo no | "$SDK/cmdline-tools/latest/bin/avdmanager" create avd -n "$name" -k "$IMAGE" -d pixel_6 --force >/dev/null
  local cfg=$HOME/.android/avd/$name.avd/config.ini kv
  # config.ini is written as "key = value", so match the key with optional spaces.
  for kv in hw.lcd.width=$w hw.lcd.height=$h hw.lcd.density=$dpi hw.ramSize=2048 vm.heapSize=256 \
            hw.keyboard=yes hw.audioInput=no hw.camera.back=none hw.camera.front=none \
            showDeviceFrame=no disk.dataPartition.size=4G; do
    sed -i "/^${kv%%=*} *=/d" "$cfg"; echo "${kv%%=*} = ${kv#*=}" >> "$cfg"
  done
}

# Boots headless unless $WINDOW is set. Sets ANDROID_SERIAL and STARTED=1 when
# it started the emulator itself (so the caller knows whether to kill it).
avd_boot() {
  local name=$1 port=${2:-5580}
  export ANDROID_SERIAL=emulator-$port
  mkdir -p "$(dirname "$OUT")"
  if ! adb devices | grep "^$ANDROID_SERIAL" >/dev/null; then
    local win=-no-window; [ -n "${WINDOW:-}" ] && win=
    "$SDK/emulator/emulator" -avd "$name" $win -no-audio -no-boot-anim \
      -gpu swiftshader_indirect -port "$port" > "$(dirname "$OUT")/emulator.log" 2>&1 &
    STARTED=1
  fi
  timeout 180 adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done
  adb root >/dev/null; sleep 3; adb wait-for-device
}

avd_kill() { [ -n "${STARTED:-}" ] && adb emu kill >/dev/null 2>&1 || true; }

# Awake, unlocked, no animations, clock pinned to $1 (YYYY-MM-DD) at $2 (hhmm,
# default 1830) in UTC — the app's "today" must be the day the demo data ends on.
device_prepare() {
  local day=$1 hhmm=${2:-1830} k
  adb shell svc power stayon true
  adb shell input keyevent KEYCODE_WAKEUP
  adb shell wm dismiss-keyguard
  for k in window_animation_scale transition_animation_scale animator_duration_scale; do
    adb shell settings put global $k 0
  done
  adb shell settings put global auto_time 0
  adb shell settings put global auto_time_zone 0
  adb shell service call alarm 3 s16 UTC >/dev/null
  adb shell date "$(date -d "$day" +%m%d)${hhmm}$(date -d "$day" +%Y).00" >/dev/null
}

# Refuses an APK the x86_64 emulator can't run. unzip -Z1 rather than a grep
# pipe: with pipefail, grep -q closing early SIGPIPEs unzip into a false "no".
apk_check() {
  [ -f "$1" ] || { echo "no APK at $1" >&2; return 1; }
  unzip -Z1 "$1" 'lib/x86_64/*' >/dev/null 2>&1 && return 0
  # Pure-Kotlin/Java apps have no native libs at all, which is fine.
  unzip -Z1 "$1" 'lib/*' >/dev/null 2>&1 || return 0
  echo "$1 has native libs but none for x86_64 — the emulator can't run it" >&2; return 1
}

# ---------- UI ----------

# Bounds "x1 y1 x2 y2" of the first node whose text or content-desc is exactly
# $1, from a fresh dump. A dump that fails (UI never idles, e.g. a blinking
# cursor) leaves the previous file behind, so delete it first or taps hit stale
# coordinates.
bounds_of() {
  adb shell rm -f /sdcard/ui.xml
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb shell cat /sdcard/ui.xml 2>/dev/null |
    grep -oE "(text|content-desc)=\"$1\"[^>]*bounds=\"[^\"]*\"" | head -1 |
    grep -oE 'bounds="[^"]*"' | grep -oE '[0-9]+' | tr '\n' ' ' || true
}

tap_text() {
  local b i
  for i in $(seq 10); do
    b=$(bounds_of "$1"); [ -n "$b" ] && break; sleep 1
  done
  [ -z "$b" ] && { echo "tap_text: '$1' not on screen" >&2; return 1; }
  set -- $b
  adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
}

wait_for_text() {
  local i
  for i in $(seq "${2:-20}"); do
    [ -n "$(bounds_of "$1")" ] && return 0; sleep 1
  done
  echo "wait_for_text: '$1' never appeared" >&2; return 1
}

open_link() { adb shell am start -W -a android.intent.action.VIEW -d "$1" "$PKG" >/dev/null; }

# Force-stop, then open $1 — every scene starts from the same state.
cold_start() { adb shell am force-stop "$PKG"; open_link "$1"; [ -z "${2:-}" ] || wait_for_text "$2"; }

screen_size() { adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1 | tr x ' '; }

swipe_up() {
  local w h; read -r w h < <(screen_size)
  adb shell input swipe $((w / 2)) $((h * 80 / 100)) $((w / 2)) $((h * 30 / 100)) 500; sleep 1.2
}

type_text() { adb shell input text "$(printf %s "$1" | sed 's/ /%s/g')"; }

hide_keyboard() {
  if adb shell dumpsys input_method | grep 'mInputShown=true' >/dev/null; then
    adb shell input keyevent KEYCODE_BACK; sleep 0.8
  fi
}

# Every text on screen, one per line — render.js reads captions from these.
save_texts() {
  adb shell rm -f /sdcard/ui.xml
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/ui.xml 2>/dev/null | grep -oE '(text|content-desc)="[^"]+"' |
    sed -E 's/^(text|content-desc)="//; s/"$//' > "$1" || true
}

# A screencap mid-transition is black or half-drawn: take frames until two in
# a row match and the frame isn't empty.
capture() {
  local out=$1 prev="" sum i
  for i in $(seq 15); do
    adb exec-out screencap -p > "$out"
    sum=$(md5sum < "$out")
    if [ "$sum" = "$prev" ] && [ "$(magick "$out" -format '%[fx:mean>0.02]' info:)" = 1 ]; then
      return 0
    fi
    prev=$sum; sleep 0.7
  done
  # Screens with continuous motion (3D Lulu, game loops) never repeat a frame;
  # accept the last one as long as it isn't blank.
  [ "$(magick "$out" -format '%[fx:mean>0.02]' info:)" = 1 ] && return 0
  echo "capture: $out is blank" >&2; return 1
}

# Clean status bar. Re-send before every shot: it resets whenever SystemUI
# restarts (wm size changes do that).
demo_mode() {
  local d="adb shell am broadcast -a com.android.systemui.demo -e command"
  adb shell settings put global sysui_demo_allowed 1
  $d enter >/dev/null
  $d clock -e hhmm 0941 >/dev/null
  $d battery -e level 100 -e plugged false >/dev/null
  # Only 9:41 + battery: reads as native on both Android and iPhone frames.
  $d network -e wifi hide >/dev/null
  $d network -e mobile hide >/dev/null
  $d notifications -e visible false >/dev/null
  $d status -e alarm hide -e sync hide -e bluetooth hide -e location hide -e volume hide -e mute hide -e speakerphone hide -e eri hide -e tty hide -e zen hide >/dev/null
}

# ---------- form factors ----------

# Found by package name, not by resolving HOME: if an earlier killed run left
# the launcher disabled, HOME resolves to the Settings fallback.
launcher_pkg() { adb shell pm list packages | grep -oE 'com\.[a-z0-9_.]*launcher[a-z0-9_]*' | head -1 || true; }

# Tablet on the phone AVD. The launcher pins a taskbar over every app at
# tablet width; disabling it removes the bar. form_reset undoes both — call it
# from an EXIT trap so a crash never leaves the AVD stuck as a tablet.
form_tablet() {
  LAUNCHER=${LAUNCHER:-$(launcher_pkg)}
  adb shell wm size "${1:-1600x2560}"; adb shell wm density "${2:-320}"
  [ -n "$LAUNCHER" ] && adb shell pm disable-user --user 0 "$LAUNCHER" >/dev/null
  sleep 2
}
form_reset() {
  LAUNCHER=${LAUNCHER:-$(launcher_pkg)}
  adb shell wm size reset >/dev/null 2>&1 || true
  adb shell wm density reset >/dev/null 2>&1 || true
  [ -n "$LAUNCHER" ] && adb shell pm enable "$LAUNCHER" >/dev/null 2>&1 || true
}

# ---------- scenes ----------

# run_scenes FORM "name|regex" ... — for each entry calls scene_<name>, then
# shoots only if the dumped UI text matches regex. Retries twice, then exits:
# a wrong screen in a store listing is worse than a failed run.
run_scenes() {
  local form=$1; shift
  local dir=$OUT/$form entry name expect try
  mkdir -p "$dir"; [ -n "${ONLY:-}" ] || rm -f "$dir"/*
  for entry in "$@"; do
    name=${entry%%|*}; expect=${entry#*|}
    for try in 1 2 3; do
      demo_mode
      adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null
      if ! "scene_$name"; then
        echo "  $form/$name: scene failed, retrying" >&2
        [ $try = 3 ] && { echo "giving up on $form/$name" >&2; exit 1; }
        continue
      fi
      # "@" = the scene snapped its own frame (a moment like confetti that's gone
      # by the time the screen settles).
      [ "$expect" = @ ] && { echo "  $form/$name"; break; }
      [ "$expect" = - ] || save_texts "$dir/$name.txt"
      demo_mode
      # "-" = animated screen uiautomator can't dump; verify those visually.
      if [ "$expect" = - ] || grep -E "$expect" "$dir/$name.txt" >/dev/null; then
        capture "$dir/$name.png"; echo "  $form/$name"; break
      fi
      echo "  $form/$name: screen didn't match /$expect/, retrying" >&2
      [ $try = 3 ] && { echo "giving up on $form/$name" >&2; exit 1; }
    done
  done
}

# ---------- kids-zone ----------

# Home's game rail scrolls horizontally; swipe it until the tile (matched by
# its accessibility label) is on screen, then tap it.
open_game() {
  local i b
  for i in $(seq 8); do
    b=$(bounds_of "$1")
    if [ -n "$b" ]; then
      # A tap on a still-coasting rail only stops it: let it settle, re-read, then
      # check Home's Grown-ups button is gone (games reuse their tile's name as a title).
      sleep 1.5; b=$(bounds_of "$1"); [ -n "$b" ] || continue
      local name=$1; set -- $b; adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 )); sleep 3
      [ -z "$(bounds_of "$(label grownups)")" ] && return 0
      echo "open_game: '$name' tapped but didn't open" >&2; return 1
    fi
    local w h; read -r w h < <(screen_size)
    [ "$w" -lt "$h" ] && { local t=$w; w=$h; h=$t; }
    # The rail mirrors under RTL (RTL=1), so swipe the other way.
    if [ -n "${RTL:-}" ]; then
      adb shell input swipe $((w * 15 / 100)) $((h / 2)) $((w * 65 / 100)) $((h / 2)) 400
    else
      adb shell input swipe $((w * 85 / 100)) $((h / 2)) $((w * 35 / 100)) $((h / 2)) 400
    fi; sleep 1
  done
  echo "open_game: '$1' not found" >&2; return 1
}

# Tap at a fraction of the landscape screen (for animated screens uiautomator
# can't dump). tap_frac 0.82 0.78
tap_frac() {
  local w h; read -r w h < <(screen_size)
  [ "$w" -lt "$h" ] && { local t=$w; w=$h; h=$t; }
  adb shell input tap "$(awk "BEGIN{print int($w*$1)}")" "$(awk "BEGIN{print int($h*$2)}")"
}

# Write kg:* keys straight into AsyncStorage (app must be force-stopped).
kv_set() {
  local db=/data/data/$PKG/databases/RKStorage v=${2//\'/\'\'}
  adb shell "sqlite3 $db \"INSERT OR REPLACE INTO catalystLocalStorage (key, value) VALUES ('$1', '$v');\""
}

# Grown-ups gate: read "A × B = ?" off the screen and tap the product.
solve_gate() {
  local tmp=$OUT/.gate.txt a b
  mkdir -p "$OUT"; save_texts "$tmp"
  read -r a b < <(grep -oE '[0-9]+ × [0-9]+' "$tmp" | head -1 | sed 's/ × / /')
  [ -z "${a:-}" ] && { echo "solve_gate: no question on screen" >&2; return 1; }
  tap_text "$((a * b))"
}

# Tap the centre of the largest on-screen blob of colour $1 (e.g. a CTA's fill)
# — for animated screens where uiautomator can't dump and the button moves
# between phone/tablet/RTL layouts.
tap_color() {
  local shot=$OUT/.tap.png xy
  mkdir -p "$OUT"; adb exec-out screencap -p > "$shot"
  xy=$(magick "$shot" -alpha off -fuzz 6% -fill black +opaque "$1" -fill white -opaque "$1" \
        -define connected-components:verbose=true -define connected-components:area-threshold=1500 \
        -connected-components 8 null: 2>/dev/null | grep 'srgb(255,255,255)' | sort -k4 -g | tail -1 | awk '{print $3}')
  [ -z "$xy" ] && { echo "tap_color: no $1 blob on screen" >&2; return 1; }
  adb shell input tap ${xy%%.*,*} $(echo "$xy" | cut -d, -f2 | cut -d. -f1)
}

# Grab the frame as it is right now, for "@" scenes (see run_scenes).
snap() { adb exec-out screencap -p > "$dir/$name.png"; }

# Boxes of every on-screen blob of colour $1 over $2 px², one "w h x y cx cy" per
# line. $4 = an existing frame to read instead of taking one.
blob_boxes() {
  local shot=${4:-$OUT/.blobs.png}
  mkdir -p "$OUT"; [ -n "${4:-}" ] || adb exec-out screencap -p > "$shot"
  magick "$shot" -alpha off -fuzz "${3:-6}%" -fill black +opaque "$1" -fill white -opaque "$1" \
    -define connected-components:verbose=true -define connected-components:area-threshold="$2" \
    -connected-components 8 null: 2>/dev/null | grep 'srgb(255,255,255)' |
    awk '{split($2,a,/[x+]/); split($3,c,","); printf "%d %d %d %d %d %d\n", a[1],a[2],a[3],a[4],c[1],c[2]}'
}

# Pixel difference between two captures (ignores the status bar row).
shot_diff() { magick compare -metric AE -fuzz 8% "$1" "$2" null: 2>&1 | cut -d' ' -f1 | cut -d. -f1; }

# Simple Pairs on Easy (2 pairs) in ≤ 3 moves, so the win card shows 3 stars.
# A lone flipped card stays up until the next tap, so faces are only ever read
# then; a mismatch shows for just 1s, which the emulator's lagging JS + ~1s adb
# round-trips can't catch reliably.
solve_pairs() {
  local back='srgb(125,219,60)' boxes i f=$OUT/.blobs.png
  mapfile -t boxes < <(blob_boxes "$back" 5000 | sort -k6n -k5n)
  [ ${#boxes[@]} -eq 4 ] || { echo "solve_pairs: saw ${#boxes[@]} cards" >&2; return 1; }
  tapc() { local b=(${boxes[$1]}); adb shell input tap "${b[4]}" "${b[5]}"; }
  # Card backs left on screen (also refreshes $f).
  backs() { blob_boxes "$back" 5000 | wc -l; }
  # up CARD BACKS — tap a card, wait until the board shows BACKS backs, save its face.
  up() {
    tapc "$1"
    for i in $(seq 20); do [ "$(backs)" -eq "$2" ] && break; sleep 0.5; done
    [ "$(backs)" -eq "$2" ] || { echo "solve_pairs: card $1 never turned" >&2; return 1; }
    sleep 0.6; adb exec-out screencap -p > "$f"
    local b=(${boxes[$1]}); magick "$f" -crop "${b[0]}x${b[1]}+${b[2]}+${b[3]}" +repage "$OUT/.face$1.png"
  }
  # A match leaves 2 backs for good; a mismatch turns both back over within a few seconds.
  settled() { for i in $(seq 16); do [ "$(backs)" -eq 4 ] && return 1; sleep 0.5; done; return 0; }
  up 0 3 || return 1
  tapc 1
  if settled; then tapc 2; tapc 3; return 0; fi
  up 2 3 || return 1
  local same
  same=$(magick compare -metric RMSE "$OUT/.face2.png" "$OUT/.face0.png" null: 2>&1 | sed -E 's/.*\(([0-9.e-]+)\).*/\1/' | awk '{print ($1 < 0.15)}')
  if [ "$same" = 1 ]; then tapc 0; sleep 3; tapc 1; tapc 3; else tapc 1; sleep 3; tapc 0; tapc 3; fi
}

# Match Up mid-solve: connect $1 pairs and leave the rest loose. $2 is the
# round's "TOP:BOTTOM ..." pairs as emoji codepoints (src/sdk/assets/emoji/png);
# each tile is identified against those PNGs, so no drop ever misses (a miss
# brings up Lulu's "Oops!").
solve_matchup() {
  local want=$1 pairs=$2 tiles top=() bot=() t p code n=0 png=src/sdk/assets/emoji/png
  local -A where=()
  # Emoji only: trimmed to its ink, squashed square, compared at 48px.
  # norm IN OUT [crop ops...]
  norm() { local in=$1 out=$2; shift 2; magick "$in" "$@" -background white -flatten -fuzz 12% -trim +repage -resize '48x48!' -colorspace sRGB "$out"; }
  for p in $pairs; do for code in ${p%%:*} ${p##*:}; do norm "$png/$code.png" "$OUT/.ref$code.png"; done; done
  mapfile -t tiles < <(blob_boxes 'srgb(255,255,255)' 5000 1 | awk '$1 - $2 < 4 && $2 - $1 < 4' |
    sort -k1nr | awk 'NR == 1 { max = $1 } $1 > max * 0.85' | sort -k6n -k5n)
  [ ${#tiles[@]} -ge 4 ] || { echo "solve_matchup: ${#tiles[@]} tiles" >&2; return 1; }
  for t in "${tiles[@]}"; do
    set -- $t
    norm "$OUT/.blobs.png" "$OUT/.tile.png" -crop "$(($1 * 6 / 10))x$(($2 * 6 / 10))+$(($3 + $1 * 2 / 10))+$(($4 + $2 * 2 / 10))" +repage
    local best="" bestd=999999 d
    for p in $pairs; do for code in ${p%%:*} ${p##*:}; do
      d=$(magick compare -metric RMSE "$OUT/.tile.png" "$OUT/.ref$code.png" null: 2>&1 | cut -d' ' -f1 | cut -d. -f1)
      [ "$d" -lt "$bestd" ] && { bestd=$d; best=$code; }
    done; done
    where[$best]="$5 $6"
  done
  for p in $pairs; do
    [ $n -ge "$want" ] && break
    [ -n "${where[${p%%:*}]:-}" ] && [ -n "${where[${p##*:}]:-}" ] || continue
    adb shell input swipe ${where[${p%%:*}]} ${where[${p##*:}]} 900; sleep 2.5
    n=$((n + 1))
  done
  [ $n -ge "$want" ] || { echo "solve_matchup: only $n pairs on the board" >&2; return 1; }
}

#!/usr/bin/env bash
# Digital X — build the hybrid scroll-scrub ladder for the homepage film.
#
#   ./build-cinematic-frames.sh <journey-clip.mp4> [output-root]
#
# The homepage film is one continuous move assembled from two sources:
#
#   A  frames   1–60   live Signal footage (media/frames/lg/signal-engine, 15 fps
#                      AVIF): particles gather, the Digital X mark forms, the
#                      camera flies into it.
#   ·  frames  61–72   cross-dissolve. Both layers keep travelling, so the shot
#                      reads as flying through the X onto the data plane.
#   B  frames  73–280  the journey clip: data plane, portal city, through the
#                      portal, the workflow corridor, the neural core.
#   ·  frames 281–292  cross-dissolve. The neural core lands on the monumental X.
#   C  frames 293–360  live Signal footage again: systems connect into the X and
#                      converge, closing on the X alone with the lower-left third
#                      free for the closing copy.
#
# The ladder is deliberately dense. At roughly 2.9vh of scroll per frame the
# scrub has to advance about 35 frames per viewport, and anything sparser reads
# as stepping rather than motion. Every frame below is a distinct source sample:
# the clip carries 367 usable frames and the live sequence 551, so no segment
# ever samples the same source frame twice.
#
# Output under <output-root> (default media/frames/journey):
#   lg/frame_0001.webp … frame_0176.webp   1600×900 desktop ladder
#   sm/frame_0001.webp … frame_0088.webp    960×540 mobile ladder (every 2nd frame)
# plus media/poster/journey-{open,core}.{jpg,webp} (first and last frame).
#
# The live source is 1280×720; both sources are cropped to a 90% 16:9 window
# anchored left, which pushes the X right of centre and frees the lower left for
# typography. The live segments carry a small grade so they sit in the same
# contrast and saturation range as the clip.
set -euo pipefail

CLIP="${1:?usage: build-cinematic-frames.sh <journey-clip.mp4> [output-root]}"
SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# REVISION exists because frame filenames are stable while their content is
# not, and /media/frames/journey/* is served immutable for a year: a returning
# visitor would otherwise mix cached frames from an old ladder with fresh ones
# and see the film jump. Bump it whenever the ladder is rebuilt, and update the
# src paths in site/index.html to match.
REVISION="${REVISION:-r2}"
OUT="${2:-$SITE/media/frames/journey/$REVISION}"
POSTER="$SITE/media/poster"
LIVE="$SITE/media/frames/lg/signal-engine"

FFMPEG="${FFMPEG:-ffmpeg}"
command -v "$FFMPEG" >/dev/null 2>&1 || { echo "ffmpeg not found; set FFMPEG=/path/to/ffmpeg" >&2; exit 1; }
[ -d "$LIVE" ] || { echo "missing live frames at $LIVE" >&2; exit 1; }

TOTAL=360           # desktop frames
MOBILE=180          # mobile frames (every second desktop frame)
LG_Q=78             # desktop WebP quality
SM_Q=72             # mobile WebP quality

CROP="crop=iw*0.9:ih*0.9:0:ih*0.05"
LIVE_VF="$CROP,scale=1600:900:flags=lanczos,unsharp=3:3:0.35,eq=contrast=1.06:saturation=0.97:gamma=0.96"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/clip" "$WORK/live" "$WORK/master"

# --- segment B: slice the journey clip exactly as the ladder expects ----------
# The clip opens in near-total darkness; START trims the run-up. 172 evenly
# spaced frames give segment B and both dissolves enough material.
START=0.75
CLIP_COUNT=232
DURATION="$("${FFMPEG%ffmpeg}ffprobe" -v error -show_entries format=duration -of csv=p=0 "$CLIP")"
CLIP_FPS="$(awk -v n="$CLIP_COUNT" -v d="$DURATION" -v s="$START" 'BEGIN{printf "%.5f", n / (d - s)}')"
"$FFMPEG" -hide_banner -loglevel error -y -ss "$START" -i "$CLIP" \
  -vf "fps=$CLIP_FPS,$CROP,scale=1600:900:flags=lanczos,unsharp=3:3:0.35" \
  -frames:v "$CLIP_COUNT" "$WORK/clip/%04d.png"

# --- live frames used by segments A and C ------------------------------------
for n in $(seq 0 115) $(seq 450 550); do
  f="$(printf '%04d' "$n")"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$LIVE/$f.avif" -vf "$LIVE_VF" "$WORK/live/$f.png"
done

# linear interpolation: lerp <from> <to> <step> <steps>
lerp() { awk -v a="$1" -v b="$2" -v i="$3" -v n="$4" 'BEGIN{printf "%.0f", a + (b-a)*(n>1 ? i/(n-1) : 0)}'; }
# Same, eased: spends fewer frames on the near-black run-up so the X forms early
# in the hero window instead of halfway down the first chapter.
ease() { awk -v a="$1" -v b="$2" -v i="$3" -v n="$4" 'BEGIN{t = n>1 ? i/(n-1) : 0; printf "%.0f", a + (b-a)*(t^0.7)}'; }
dissolve() { # dissolve <under> <over> <alpha> <out>
  "$FFMPEG" -hide_banner -loglevel error -y -i "$1" -i "$2" \
    -filter_complex "[0][1]blend=all_expr='A*(1-$3)+B*$3'" -frames:v 1 "$4"
}

for i in $(seq 1 "$TOTAL"); do
  out="$WORK/master/$(printf '%04d' "$i").png"
  if [ "$i" -le 60 ]; then
    cp "$WORK/live/$(printf '%04d' "$(ease 0 88 $((i - 1)) 60)").png" "$out"
  elif [ "$i" -le 72 ]; then
    k=$((i - 61)); a="$(awk -v k="$k" 'BEGIN{printf "%.4f", (k+1)/13}')"
    dissolve "$WORK/live/$(printf '%04d' "$(lerp 90 104 "$k" 12)").png" \
             "$WORK/clip/$(printf '%04d' "$(lerp 4 26 "$k" 12)").png" "$a" "$out"
  elif [ "$i" -le 280 ]; then
    cp "$WORK/clip/$(printf '%04d' "$(lerp 28 208 $((i - 73)) 208)").png" "$out"
  elif [ "$i" -le 292 ]; then
    k=$((i - 281)); a="$(awk -v k="$k" 'BEGIN{printf "%.4f", (k+1)/13}')"
    dissolve "$WORK/clip/$(printf '%04d' "$(lerp 210 232 "$k" 12)").png" \
             "$WORK/live/$(printf '%04d' "$(lerp 456 478 "$k" 12)").png" "$a" "$out"
  else
    cp "$WORK/live/$(printf '%04d' "$(lerp 480 550 $((i - 293)) 68)").png" "$out"
  fi
done

# --- encode both ladders ------------------------------------------------------
rm -rf "$OUT/lg" "$OUT/sm"
mkdir -p "$OUT/lg" "$OUT/sm" "$POSTER"
for i in $(seq 1 "$TOTAL"); do
  src="$WORK/master/$(printf '%04d' "$i").png"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$src" \
    -c:v libwebp -quality "$LG_Q" -compression_level 6 -preset picture \
    "$OUT/lg/frame_$(printf '%04d' "$i").webp"
  if [ $((i % 2)) -eq 1 ]; then
    "$FFMPEG" -hide_banner -loglevel error -y -i "$src" -vf "scale=960:540:flags=lanczos" \
      -c:v libwebp -quality "$SM_Q" -compression_level 6 -preset picture \
      "$OUT/sm/frame_$(printf '%04d' $(((i + 1) / 2))).webp"
  fi
done

# --- posters: hero fallback, social card and one still per chapter ---
# The chapter stills back the reduced-motion layout and give crawlers the story
# as six real images with alt text.
for pair in "0001 journey-open" "$(printf '%04d' "$TOTAL") journey-core" \
            "0040 journey-beat-1" "0120 journey-beat-2" "0182 journey-beat-3" \
            "0240 journey-beat-4" "0284 journey-beat-5" "0344 journey-beat-6"; do
  set -- $pair
  "$FFMPEG" -hide_banner -loglevel error -y -i "$WORK/master/$1.png" -q:v 4 "$POSTER/$2.jpg"
  "$FFMPEG" -hide_banner -loglevel error -y -i "$WORK/master/$1.png" \
    -c:v libwebp -quality 86 -compression_level 6 -preset picture "$POSTER/$2.webp"
done

LG_HAVE="$(find "$OUT/lg" -name 'frame_*.webp' | wc -l | tr -d ' ')"
SM_HAVE="$(find "$OUT/sm" -name 'frame_*.webp' | wc -l | tr -d ' ')"
echo "lg $LG_HAVE frames · $(du -sh "$OUT/lg" | cut -f1)"
echo "sm $SM_HAVE frames · $(du -sh "$OUT/sm" | cut -f1)"
[ "$LG_HAVE" = "$TOTAL" ] || { echo "expected $TOTAL desktop frames" >&2; exit 1; }
[ "$SM_HAVE" = "$MOBILE" ] || { echo "expected $MOBILE mobile frames" >&2; exit 1; }

#!/usr/bin/env bash
# Usage: render.sh <project-dir> [output-name]
# Builds the final MP4: timeline -> music -> mix -> muted video render -> mux -> loudness check + contact sheet.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P="$(cd "${1:?project dir required}" && pwd)"
NAME="${2:-presentation}"
PY="${PROMOVIDEO_VENV:-$HOME/.promovideo/venv}/bin/python"
cd "$P"; mkdir -p build out
FREE_GB=$(df -Pk . | awk 'NR==2{printf "%d", $4/1024/1024}')
[ "$FREE_GB" -lt 3 ] && { echo "Only ${FREE_GB} GB free – free at least 3 GB before rendering."; exit 1; }
npx tsc --noEmit -p . 
npm run -s timeline
TOTAL=$(python3 -c "import json;t=json.load(open('build/timeline.json'));print(t['total']/t['fps'])")
echo "Duration: ${TOTAL}s"
"$PY" "$ROOT/scripts/synth.py" build/music-raw.wav "$TOTAL" >/dev/null
ffmpeg -hide_banner -loglevel error -y -i build/music-raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 public/audio/music.wav
"$PY" "$ROOT/scripts/mix.py" "$P"
ffmpeg -hide_banner -loglevel error -y -i build/mix-raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 build/mix.wav
# Single-threaded render keeps memory (and swap on small disks) under control.
npx remotion render PromoVideo build/video-muted.mp4 --muted --concurrency=1 --log=error
ffmpeg -hide_banner -loglevel error -y -i build/video-muted.mp4 -i build/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/$NAME.mp4"
ROWS=$(python3 -c "import math;print(max(1,math.ceil($TOTAL/6/4)))")
ffmpeg -hide_banner -loglevel error -y -i "out/$NAME.mp4" -vf "fps=1/6,scale=480:-1,tile=4x$ROWS" -frames:v 1 build/contact-sheet.jpg
rm -f build/video-muted.mp4 build/mix-raw.wav build/music-raw.wav
ffmpeg -hide_banner -i "out/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "VIDEO: $P/out/$NAME.mp4"
echo "CONTACT SHEET: $P/build/contact-sheet.jpg"

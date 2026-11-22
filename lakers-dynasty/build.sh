#!/bin/sh
# Build both versions: events → score → frames → mix → master (−14 LUFS) → MP4 + SRT + poster.  Usage: sh build.sh [en|ar ...]
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
LANGS=${*:-en ar}
for L in $LANGS; do
  (cd "$LIB" && node core/render/events.mjs "$HERE" --size 1080x1920 --q "lang=$L" --out "$HERE/events_$L.json")
  "$PY" "$HERE/music/score.py" $L
  (cd "$LIB" && node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --q "lang=$L" --out "$HERE/out/video_$L.mp4")
  "$PY" "$HERE/mix.py" $L
  "$PY" "$HERE/tools/master.py" "$HERE/out/mix_$L.wav" "$HERE/out/master_$L.wav"
  ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video_$L.mp4" -i "$HERE/out/master_$L.wav" -map 0:v -map 1:a -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/lakers-dynasty_$L.mp4"
  "$PY" "$HERE/tools/srt.py" $L
  ffmpeg -hide_banner -loglevel error -y -ss 1.9 -i "$HERE/out/video_$L.mp4" -frames:v 1 -q:v 3 "$HERE/poster_$L.jpg"
  echo "done: $HERE/lakers-dynasty_$L.mp4"
done

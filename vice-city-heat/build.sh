#!/bin/sh
# One-command build: voice (edge-tts, online) → text check → events → score → frames → mix → master → MP4 + SRT + poster.
# Clip frames come from assets/*.mp4 (see edit.json); re-extract them with tools/extract.py if the edit changes.
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
[ "$1" = novoice ] || "$PY" "$HERE/tools/tts_ar.py" "$HERE/lines.json" "$HERE/voices"
node core/render/readcheck.mjs "$HERE" --size 1080x1920 --step 0.1
node core/render/events.mjs "$HERE" --size 1080x1920
"$PY" "$HERE/music/score.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/master.py" "$HERE/out/mix.wav" "$HERE/out/master.wav"
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a -c:v libx264 -crf 21 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/vice-city-heat.mp4"
ffmpeg -hide_banner -loglevel error -y -ss 2.5 -i "$HERE/out/video.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
"$PY" "$HERE/tools/srt.py"
echo "done: $HERE/vice-city-heat.mp4"

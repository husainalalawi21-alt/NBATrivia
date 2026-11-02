#!/bin/sh
# One-command build of the reel: voice → check → score → events → readcheck → frames → mix → master → MP4 + SRT + poster.
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
[ "$1" = novoice ] || { "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"; "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"; }
"$PY" "$HERE/music/score.py"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/master.py" "$HERE/out/mix.wav" "$HERE/out/master.wav"   # −14 LUFS / −1.2 dBTP (mux.sh needs ffmpeg 7)
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/tatum-brown-reel.mp4"
node core/render/still.mjs "$HERE" 2.8 --size 1080x1920 --out "$HERE/out" --prefix poster_ >/dev/null && cp "$HERE/out/poster_2.8.jpg" "$HERE/poster.jpg"
"$PY" "$HERE/tools/srt.py"
echo "done: $HERE/tatum-brown-reel.mp4"

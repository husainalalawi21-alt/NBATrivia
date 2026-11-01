#!/bin/sh
# One-command build: voice → check → score → events → frames → mix → master → MP4 + SRT + poster.
# Needs the Lemo-Opuscar library (deps core + voice) at $LIB, Node 20+, ffmpeg, the CC0 sample libraries vcsl, vsco2ce, karoryfer.
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"
cd "$LIB"
[ "$1" = novoice ] || { "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"; "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"; }
"$PY" "$HERE/music/score.py"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
# mux.sh needs ffmpeg 7+; tools/master.py does the same two-pass −14 LUFS / −1.2 dBTP master on ffmpeg 6
"$PY" "$HERE/tools/master.py" "$HERE/out/mix.wav" "$HERE/out/master.wav"
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/nba-19-18.mp4"
node core/render/still.mjs "$HERE" 28.0 --size 1080x1920 --out "$HERE/out" --prefix poster_ >/dev/null
cp "$HERE/out/poster_28.0.jpg" "$HERE/poster.jpg"
"$PY" "$HERE/tools/srt.py"
echo "done: $HERE/nba-19-18.mp4"

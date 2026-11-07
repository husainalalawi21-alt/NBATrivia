#!/bin/sh
# One-command build: voice → check → text check → events → score → frames → mix → master → MP4 + SRT + poster.
# Needs the Lemo-Opuscar library at $LIB (deps core + voice), the CC0 VCSL samples, Node 20+, ffmpeg.
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
[ "$1" = novoice ] || { "$PY" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"; "$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"; }
node core/render/readcheck.mjs "$HERE" --size 1080x1920 --q 'textonly=1'
node core/render/events.mjs "$HERE" --size 1080x1920 --q 'textonly=1'
"$PY" "$HERE/music/score.py"
[ "$2" = noframes ] || node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/master.py" "$HERE/out/mix.wav" "$HERE/out/master.wav"   # −14 LUFS / −1.2 dBTP (mux.sh needs ffmpeg 7)
ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video.mp4" -i "$HERE/out/master.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/sleepwalking.mp4"
ffmpeg -hide_banner -loglevel error -y -ss 20.8 -i "$HERE/out/video.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
"$PY" "$HERE/tools/srt.py"
echo "done: $HERE/sleepwalking.mp4"

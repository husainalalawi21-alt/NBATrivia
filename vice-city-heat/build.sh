#!/bin/sh
# One-command build of both versions: sh build.sh [novoice]
# Arabic: Bahraini voice ar-BH-AliNeural (edge-tts, online, pitch −12 Hz). English: Kokoro am_onyx (offline).
# Clip frames: python3 tools/extract.py (from assets/*.mp4, sized for the longer language).
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); PY="$LIB/.venv/bin/python"
cd "$LIB"
if [ "$1" != novoice ]; then
  "$PY" "$HERE/tools/tts_ar.py" "$HERE/lines_ar.json" "$HERE/voices_ar"
  "$PY" core/tts/tts.py "$HERE/lines_en_tts.json" "$HERE/voices_en" && "$PY" core/tts/asr_check.py "$HERE/lines_en_tts.json" "$HERE/voices_en"
fi
for L in ar en; do
  node core/render/readcheck.mjs "$HERE" --size 1080x1920 --step 0.1 --q "lang=$L"
  node core/render/events.mjs "$HERE" --size 1080x1920 --q "lang=$L" --out "$HERE/events_$L.json"
  "$PY" "$HERE/music/score.py" $L
  node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --q "lang=$L" --out "$HERE/out/video_$L.mp4"
  "$PY" "$HERE/mix.py" $L
  "$PY" "$HERE/tools/master.py" "$HERE/out/mix_$L.wav" "$HERE/out/master_$L.wav"
  ffmpeg -hide_banner -loglevel error -y -i "$HERE/out/video_$L.mp4" -i "$HERE/out/master_$L.wav" -map 0:v -map 1:a -c:v libx264 -crf 21 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/vice-city-heat_$L.mp4"
  "$PY" "$HERE/tools/srt.py" $L
done
ffmpeg -hide_banner -loglevel error -y -ss 2.5 -i "$HERE/out/video_ar.mp4" -frames:v 1 -q:v 3 "$HERE/poster.jpg"
echo "done"

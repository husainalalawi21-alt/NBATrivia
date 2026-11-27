# NBA Trivia: Crossover update (talking head, 9:16)

Husain's update video about the game changes, edited with silences removed, Arabic captions, and on-screen cards for every change he mentions.

- **Source:** `IMG_2258.MOV` (Google Drive), 120.2 s, 2160×3840 HEVC, recorded in a car.
- **Output:** `crossover-update.mp4`, 99.3 s, 1080×1920, 24 fps, voice at −14 LUFS. Also `captions.srt`.

## What the cards show (in the order he says it)

| Time (cut) | Card |
|---|---|
| 0–4 s | NBA TRIVIA, new update |
| 4–19 s | Game stats reviewed: high participation, some games barely used |
| 19–27 s | 20 Questions is cancelled → **CROSSOVER** |
| 27–33 s | Crossover has 3 levels: easy, medium, hard |
| 33–45 s | Easy: well-known players (LeBron James, Michael Jordan) |
| 45–53 s | Medium: "half and half" players (Ja Morant, Bradley Beal) |
| 53–62 s | Hard: players not everyone knows (Rick Barry, Julius Erving, Dikembe Mutombo) |
| 62–70 s | Questions are about the player; a new player every day, refreshed at the end of the day |
| 70–83 s | STREAK is the most-played game and stays the main game |
| 83–87 s | Share your opinions |
| 87–94 s | A new game is in research, plus how to present it in the app |
| 94–99 s | Next step: launch on App Store and Google Play |

No usage numbers are shown: the video only says the stats were reviewed, so none were invented.

## How it was made

1. **Transcription:** faster-whisper `large-v3-turbo`, Arabic, word timestamps (`tools/transcribe.py`). Whisper's final hallucinated line ("ترجمة نانسي قنقر") was dropped.
2. **Silence cut:** loudness envelope in 50 ms windows; every pause of 0.4 s or more below −36 dB was removed, keeping 0.12 s on each side. 31 segments kept, 20.8 s removed. Cut list in `cuts.json`.
3. **Audio:** high-pass 80 Hz, light FFT denoise for road noise, loudnorm to −14 LUFS.
4. **Captions:** re-transcribed on the cut timeline, then corrected by hand for Gulf Arabic and player names (e.g. «جام ورانت» → «جا مورانت», «ريك بيري» → «ريك باري», «أشي» → «ألغي»). Chunk timing follows the whisper word times. Corrected lines live in `tools/build_crossover.py` (`FIX`).
5. **Composition:** OpenMontage + HyperFrames (HTML/GSAP), font Cairo (OFL). `tools/build_crossover.py` writes the HyperFrames `index.html`; rendered with `hyperframes_compose` `render_existing`.

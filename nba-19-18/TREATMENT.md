# The NBA Game That Ended 19–18 — Treatment

Style: **Mid-century Cartoon** (`midcentury-toon`). 30 s, 1080×1920 (9:16), 24 fps, English narration + burned-in captions, −14 LUFS.

## Facts used (on screen / in the voice)

- 22 November 1950, Minneapolis: Fort Wayne Pistons 19, Minneapolis Lakers 18.
- Fort Wayne held the ball to keep it away from George Mikan; there was no shot clock.
- Mikan scored 15 of the Lakers' 18 points.
- Fort Wayne's winning basket (Larry Foust) came in the final seconds.
- The 24-second shot clock arrived in the 1954–55 season.
- Still the lowest-scoring game in NBA history.

No team logos or league marks are drawn: players are geometric stand-ins in palette colours; "Mikan" is a tall egg-head figure with round glasses and the number 99.

## Three candidate structures

1. **A rules card that turns** — "Rule 1: there is no shot clock." Each card is a fact; the last card *adds* the rule that fixed it (the 24-second clock). Fits the style's safety/rules-card grammar.
2. **Countdown of a stall** — a clock face that never runs out, ticking through the whole game, ending as the 24-second clock. One object, strong, but leaves little room for Mikan and the final shot.
3. **Result first, then how** — open on the impossible scoreboard "19–18", then the fox narrator explains the stall, Mikan, the last shot, and the fix.

**Chosen: 3, wearing the clothes of 1.** The scoreboard is the hook (a number nobody believes, in the first second). Then a numbered medallion per beat ("1950", "HOLD", "15 of 18", "0:06", "24") opens each shot — the medallion is the door, as the style likes. The ending echoes the opening: the same scoreboard frame, now with a 24-second clock beside it.

## Logline and arc

A small orange fox in a bow tie shows us a scoreboard that reads 19–18 and explains how a team that refused to shoot beat the game's biggest star — and why the league invented the shot clock.

Setup (scoreboard, no shot clock) → turn (Fort Wayne just holds it; Mikan scores almost everything anyway; the last-second shot) → ending (the 24-second clock arrives; the scoreboard returns, now a record).

## Benchmark

- **1950s classroom sports films** (Coronet-style "basketball fundamentals"): learn direct address, one sentence per picture, numbered cards. Don't take footage, lettering, music.
- **Modern vertical sports explainers**: learn the hook in second one (the strange number on screen first), a beat every 4–5 s, text inside the picture. Don't take their graphics packages or logos.

## The fox (continuity bible — identical in every shot)

- Body: burnt orange `#D9733B` bean, cream chest bib `#F3E3C3`, near-black ink line; head an inverted egg with two tall triangle ears (inner ear cream), muzzle one open spline to a black oval nose.
- Eyes: two black ovals with a paper glint; eyebrows short ink dashes.
- Accent: **turquoise bow tie** `#3E9C9A`; tail a long teardrop with a cream tip, always curling to the fox's left.
- Hands: four-finger white cartoon gloves.
- Always drawn at the same height ratio (head = 0.42 of body height), always facing three-quarter left, always standing on the floor line of the shot. Body is a held drawing: only arms, eyes, mouth and tail tip move.
- One drawing function `drawFox(pose)` is used by every shot; poses are blended keyframes, never swapped inside an `if`.

## Palette

Paper `#F1E6CF`, ink `#2B2320`. Ball (the "product", one colour all film): chestnut `#8C4A2F`. Fort Wayne: mustard `#D9A93B`. Minneapolis: powder blue `#86AECB`. Fox accent: turquoise. Step grounds rotate: plum `#7C4E6B`, lime `#B6BE5A`, sand `#D8B98A`, coral `#E08B6E`, powder blue tint.

## Shot list (6 shots)

| # | Time | Framing / angle | Camera | Why |
|---|---|---|---|---|
| 1 | 0.0–4.5 | Medium: fox beside a big wooden scoreboard, eye level | Slow push (4 %) into "19–18" | Collect the eye on the strange number; title card holds ≥ 4 s |
| 2 | 4.5–9.0 | Full: fox holds an empty clock frame; "1950" medallion | Iris through the "1950" medallion in, then dead still | The year is the door; the missing clock is the idea |
| 3 | 9.0–15.0 | Wide side view of a court: mustard player holds the ball, tall blue Mikan waits; then top view | Round call-out on the ball, then pull-back with counter-rotation to a top-view plan where passes trace a looping pattern | The stall is a pattern; the one breath of the film (longest shot) |
| 4 | 15.0–19.0 | Medium on Mikan figure; split frame | Split frame in two colour blocks: "MIKAN 15" vs "REST OF TEAM 3"; tilt up with the fox's pointing finger | Before/after style comparison makes the stat readable |
| 5 | 19.0–24.5 | Close on hoop from below, then medium scoreboard | Push in on hoop; silence beat at 21.5; ball arc + swish at 22.0; cut on beat to scoreboard 19–18 FINAL | The emotional peak: silence, then the swish |
| 6 | 24.5–30.0 | Medium: fox holds a 24-second clock next to the scoreboard (echo of shot 1) | Colour-block wipe in, then dead still 3 s, iris-out onto the clock | The fix, and the record; the last circle |

## Beat sheet

- 0.0 Scoreboard numbers stamp on: "19" (0.3), "18" (0.8). Fox points (1.0).
- 0.6 VO: "Nineteen to eighteen. A real NBA final score."
- 1.2 Title writes on: kicker "The NBA game that ended" / slab "19–18". Holds to 4.5.
- 4.5 Medallion "1950" stamps, iris in.
- 4.8 VO: "In 1950, there was no shot clock."
- 6.8 Fox's empty clock frame — hands spin freely. VO: "A team could hold the ball… forever."
- 9.0 Court. VO: "Fort Wayne faced George Mikan's Lakers — and just held it."
- 11.0 Call-out on the ball in the guard's hands; tag "NO SHOT".
- 12.2 Pull back to top view: pass route loops into an atomic pattern, clock ticks.
- 15.0 Split frame. VO: "Mikan still scored fifteen of their eighteen."
- 16.0 Tags pop "15" / "3".
- 19.0 Hoop. VO: "Then, in the last seconds…"
- 21.5 Everything cut (silence).
- 22.0 Swish (first sound after silence). 22.5 Scoreboard "FINAL 19–18".
- 23.0 VO: "Fort Wayne won."
- 24.5 Wipe. VO: "Four years later came the 24-second shot clock. It's still the lowest-scoring game in NBA history."
- 27.0–30.0 Dead still; iris-out on clock at 29.3.

## Cue map

120 bpm, 4/4, bar = 2.0 s, 15 bars.

- Bars 1–2 (0–4): vibraphone chord stabs on the stamps (beats 1, 2), brushes, walking pizzicato bass enters bar 2.
- Bars 3–4 (4–9): medallion stamp on 4.5 (beat), half-time feel; flute line.
- Bars 5–7 (9–15): "stall" — bass walks in circles (same 4-note figure), clock tick on every beat, brushes only.
- Bars 8–9 (15–19): double-time feel, bongos; vibe glissando on each stat tag.
- Bar 10–11 (19–22): music thins; full silence 21.5–22.0; swish at 22.0; vibe chord + muted trumpet "win" figure at 22.5.
- Bars 12–15 (24.5–30): new key up a step; celesta; final chord at 29.3 on the iris-out, ring out.

## Sound design

| Section | Ambience | Foley | Music |
|---|---|---|---|
| 1 Scoreboard | warm room tone, distant arena murmur | damped rubber stamp ×2 (numbers), paper swish (title) | vibe stabs, bass enters |
| 2 1950 | room tone | stamp (medallion), iris "shhk", clock spin whirr | flute, half-time |
| 3 Stall | arena murmur rising to bored boos | ball bounces (slow), pen scratch on route, clock ticks | circling bass, brushes |
| 4 Mikan | arena murmur | slide whistle on the tilt, pops on tags | bongos, double-time |
| 5 Last shot | murmur → **silence** | swish of net, crowd burst after | thin → silence → win figure |
| 6 Shot clock | room tone only | paper wipe, clock click "24", iris shhk | celesta, final chord |

## Subtitles and titles

- Kicker in Oleo Script Bold, titles/numbers in Alfa Slab One with offset colour plate, captions in Jost 600 on a paper caption card bottom-centre (raised above the phone UI safe area: centre at y ≈ 1500 of 1920).
- Key subjects stay in the middle band (y 300–1350), clear of the caption card.

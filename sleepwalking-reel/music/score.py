"""Score for "How Sleepwalking Works" — original, event-driven: every arrival in the picture (a column rising, a tile, a pop)
plays its own pitched note from events.json, over a soft night pad. Pitched percussion only (marimba, vibraphone, glockenspiel),
a bowed-vibraphone pad, D major pentatonic. Pad only (thinned) while the brain falls asleep; a dawn chord resolves at the end.
Run: LIB=<library> "$LIB/.venv/bin/python" music/score.py"""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; EV = E['ev']
N = int(DUR * SR) + SR; S.seed(11); rng = np.random.default_rng(11)
st = {k: np.zeros((N, 2), np.float32) for k in ('pad', 'mel', 'pulse')}
cue = {e.get('type'): e['t'] for e in EV}
T_DAWN = next(e['t'] for e in EV if e['type'] == 'amb' and e.get('what') == 'birds')
T_END = [e['t'] for e in EV if e['type'] == 'title'][-1]
def pad(t, ps, d, v=.28):
    for i, p in enumerate(ps): add(st['pad'], S.note('vibraphone_bowed', S.midi(p) if isinstance(p, str) else p, d, vel=v, attack=.8, release=1.5), t + i * .02, .8, -.4 + .27 * i)
def mar(t, n, v=.5, pan=0): add(st['mel'], S.note('marimba', n, .5, vel=v), t, 1.0, pan)
def vib(t, n, v=.45, pan=0): add(st['mel'], S.note('vibraphone', n, 1.6, vel=v), t, .9, pan)
def glk(t, n, v=.35, pan=.2): add(st['mel'], S.note('glockenspiel', n, .5, vel=v, release=1.6), t, .55, pan)
# night pad: Dmaj9 → Bm7 → Gmaj9 → A6sus, 8 s each; thinned during the brain's "whole brain asleep" moment
CH = [['D3', 'A3', 'E4', 'F#4'], ['B2', 'F#3', 'A3', 'D4'], ['G2', 'D3', 'A3', 'B3'], ['A2', 'E3', 'B3', 'D4']]
t = 0.0; i = 0
while t < T_DAWN:
    d = min(8.0, T_DAWN - t + 1.0); ps = CH[i % 4]
    if 14.0 <= t < 22.0: ps = ps[:2]
    pad(t, ps, d, .26); t += 8.0; i += 1
pad(T_DAWN, ['D3', 'A3', 'F#4', 'A4', 'E5'], DUR - T_DAWN, .34)          # dawn resolves
# a slow heartbeat-like pulse: soft marimba low D on beats of 70 BPM, absent in the brain shot's opening and at dawn
b = 60 / 70; t = 0.4
while t < T_DAWN:
    if not (14.25 <= t < 19.9): add(st['pulse'], S.note('marimba', 50 if int(t / b) % 2 == 0 else 57, .4, vel=.32), t, .5, 0)
    t += b
# event-driven melody
for e in EV:
    ty, t = e['type'], e['t']
    if ty == 'rise': (mar if e.get('s') != 3 else vib)(t, e['n'], .5 if e.get('s') != 9 else .55, rng.uniform(-.3, .3))
    elif ty == 'pop': glk(t, e['n'] + 12, .4)
    elif ty == 'note': vib(t, e['n'], .45)
    elif ty == 'wake':   # the motor areas switch on: a bright rising arpeggio
        for k, n in enumerate([62, 66, 69, 74, 78, 81]): glk(t + k * .06, n + 12, .3 + k * .03)
    elif ty == 'wave': vib(t, 50, .3, -.2)   # the frontal "slow wave": a low, soft vibraphone D every ~1.1 s
    elif ty == 'title': [vib(t + k * .09, n, .4) for k, n in enumerate([62, 69, 74, 78])]
mix = st['pad'] * .7 + st['mel'] * .9 + st['pulse'] * .6
mix = mix[:int(DUR * SR)]; mix /= np.abs(mix).max() / .9
sf.write(os.path.join(D, 'music', 'score.wav'), mix, SR)
print('score', mix.shape, S.credits(['vibraphone_bowed', 'vibraphone', 'marimba', 'glockenspiel']))

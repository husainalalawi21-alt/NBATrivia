"""Original sports-promo beat for the Manama Masters 3x3 reel, synthesized in numpy (no samples): 100 BPM,
punchy kick + clap, 16th hats with rolls, an 808 bass in D minor, a bright synth stab hook, a riser into the match
section ("وفي الملعب؟") with a one-beat drop, a big hit on the finals line and a closing hit on the end card.
Run: LIB=<library> "$LIB/.venv/bin/python" music/score.py ar"""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio.sfx import SR, add
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LG = sys.argv[1] if len(sys.argv) > 1 else 'ar'
EVJ = json.load(open(os.path.join(D, f'events_{LG}.json'))); DUR = EVJ['dur']; N = int(DUR * SR) + SR
VO = {e['id']: e['t'] for e in EVJ['ev'] if e.get('type') == 'vo'}
rng = np.random.default_rng(33); B = 60 / 100; BAR = 4 * B
st = {k: np.zeros((N, 2), np.float32) for k in ('dr', 'bass', 'syn', 'fx')}
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def kick(t, g=1.0):
    d = .4; tt = t_(d); f = 42 + 140 * np.exp(-tt / .025)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .18) + hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / .004) * .3
    add(st['dr'], np.tanh(x * 1.5).astype(np.float32) * g, t, .9, 0)
def clap(t, g=.6):
    d = .25; tt = t_(d); n = rng.standard_normal(len(tt)); e = sum(np.exp(-np.maximum(tt - o, 0) / .012) * (tt >= o) for o in (0, .01, .02)) + np.exp(-tt / .08) * .5
    add(st['dr'], (sosfilt(butter(2, [900, 6000], 'band', fs=SR, output='sos'), n) * e * g).astype(np.float32), t, 1, .05)
def hat(t, g=.12): d = .05; tt = t_(d); add(st['dr'], (hp(rng.standard_normal(len(tt)), 8000) * np.exp(-tt / .01) * g).astype(np.float32), t, 1, .25)
def bass808(t, m, d):
    tt = t_(d); f = hz(m) * (1 + .5 * np.exp(-tt / .02)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, (d - tt) / .05)
    add(st['bass'], np.tanh(x * 2.2).astype(np.float32) * .55, t, 1, 0)
def stab(t, ms, g=.12):
    d = .35; tt = t_(d); x = sum(((tt * hz(m) * (1 + dd)) % 1 * 2 - 1) for m in ms for dd in (-.004, .004))
    add(st['syn'], (lp(x, 3200) * np.exp(-tt / .12) * g).astype(np.float32), t, 1, -.2)
def riser(t0, d):
    tt = t_(d); x = sosfilt(butter(2, [400, 9000], 'band', fs=SR, output='sos'), rng.standard_normal(len(tt))) * (tt / d) ** 2
    add(st['fx'], (x * .25).astype(np.float32), t0, 1, 0)
def boom(t, g=1.0):
    d = 2.0; tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-tt / .05)) / SR) * np.exp(-tt / .7) + lp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt / .25) * .4
    add(st['fx'], np.tanh(x * 1.4).astype(np.float32) * g, t, 1, 0)
PROG = [(50, [62, 65, 69]), (46, [62, 65, 70]), (48, [64, 67, 72]), (45, [61, 64, 69])]   # Dm Bb C A
T7 = VO.get('l7', DUR * .55); T8 = VO.get('l8', DUR * .7); T10 = VO.get('l10', DUR - 4)
DROP = (T7 - B, T7)                      # one beat of air, then the match section hits
END = DUR - 1.2
t = 0.0; bar = 0
while t < END:
    root, ch = PROG[bar % 4]
    for s in range(16):
        x = t + s * B / 4
        if x >= END or DROP[0] <= x < DROP[1]: continue
        full = x >= VO.get('l2', 3.5)
        if s in (0, 7, 10) and full: kick(x, .95 if s == 0 else .75)
        if s in (4, 12) and full: clap(x)
        if full: hat(x, .1 if s % 2 else .14)
        if x > T7 and s in (14, 15): hat(x + B / 8, .08)          # rolls in the match section
        if s in (0, 6, 10) and x >= VO.get('l3', 7): bass808(x, root - 12, B * (1.4 if s == 0 else .9))
        if s in (0, 3, 6, 10, 13) and x >= .2: stab(x, ch, .1 if x < T7 else .13)
    t += BAR; bar += 1
riser(DROP[0] - 2 * BAR, 2 * BAR + B); boom(T7, .9); boom(T8, .6); boom(T10, 1.0); boom(END, .8)
mix = st['dr'] + st['bass'] * .9 + st['syn'] + st['fx']
mix = mix[:int(DUR * SR)]; mix /= np.abs(mix).max() / .9
sf.write(os.path.join(D, 'music', f'score_{LG}.wav'), mix, SR); print('score', mix.shape)

"""Original 80s synthwave score for the Vice City reel, synthesized in numpy (no samples):
gated-reverb snare, analog-style kick, 16th-note saw bass arpeggio, detuned saw pad, plucked lead. 112 BPM, A minor (Am-F-C-G).
Drops out on the Giannis reveal and hits back in; a final chord at the end card.
Run: LIB=<library> "$LIB/.venv/bin/python" music/score.py"""
import os, sys, json
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio.sfx import SR, add
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LG = sys.argv[1] if len(sys.argv) > 1 else 'ar'
EVJ = json.load(open(os.path.join(D, f'events_{LG}.json'))); DUR = EVJ['dur']; N = int(DUR * SR) + SR
rng = np.random.default_rng(84)
BPM = 112; B = 60 / BPM; BAR = 4 * B
st = {k: np.zeros((N, 2), np.float32) for k in ('drums', 'bass', 'pad', 'lead')}
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, d, det=0.0):
    tt = t_(d); out = np.zeros(len(tt))
    for k, dd in enumerate([-det, 0, det] if det else [0]): ph = (tt * f * (1 + dd)) % 1; out += 2 * ph - 1
    return out / (3 if det else 1)
def env(d, a=.005, r=.1, s=1.0):
    tt = t_(d); e = np.minimum(1, tt / a) * s; n = int(min(r, d) * SR); e[-n:] *= np.linspace(1, 0, n) if n else 1; return e
def kick(t, g=.9):
    d = .35; tt = t_(d); f = 45 + 120 * np.exp(-tt / .04)
    add(st['drums'], (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .14) * g).astype(np.float32), t, 1, 0)
def snare(t, g=.5):   # gated reverb: noise burst + a dense tail chopped hard at 180 ms
    d = .3; tt = t_(d); n = rng.standard_normal(len(tt))
    body = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .05) * .6 + hp(n, 1200) * np.exp(-tt / .04)
    tail = lp(hp(rng.standard_normal(len(tt)), 600), 6000) * .35 * (tt < .18)
    add(st['drums'], ((body + tail) * g).astype(np.float32), t, 1, 0)
def hat(t, g=.12): d = .05; tt = t_(d); add(st['drums'], (hp(rng.standard_normal(len(tt)), 8000) * np.exp(-tt / .012) * g).astype(np.float32), t, 1, .3)
def bass(t, m, d=B / 4 * .9, g=.5): x = lp(saw(hz(m), d, .003), 900) * env(d, .003, .04); add(st['bass'], (x * g).astype(np.float32), t, 1, 0)
def pad(t, ms, d, g=.12):
    for i, m in enumerate(ms): x = lp(saw(hz(m), d, .006), 1800) * env(d, .5, .8); add(st['pad'], (x * g).astype(np.float32), t, 1, -.5 + i * .33)
def pluck(t, m, g=.18):
    d = .4; tt = t_(d); x = lp(saw(hz(m), d, .004), 3500) * np.exp(-tt / .12); add(st['lead'], (x * g).astype(np.float32), t, 1, .25)
CH = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [62, 67, 71])]   # Am F C G
ARP = [0, 12, 7, 12]
T9 = next(e['t'] for e in EVJ['ev'] if e.get('type') == 'vo' and e.get('id') == 'l9')
DROP = (T9 - .2, T9 + .1)     # silence before Giannis
t = 0.0; bar = 0
while t < DUR - 1.5:
    root, ch = CH[bar % 4]
    pad(t, ch, BAR + .3, .1 if t > 4 else .07)
    for s16 in range(16):
        x = t + s16 * B / 4
        if DROP[0] - .02 <= x < DROP[1] or x >= DUR - 1.5: continue
        if t >= 1.0: bass(x, root - 12 + ARP[s16 % 4], g=.42)
        if s16 % 4 == 0 and t >= 3.9: kick(x)
        if s16 in (4, 12) and t >= 3.9: snare(x)
        if s16 % 2 == 1 and t >= 8.6: hat(x)
        if t >= 11.6 and s16 in (0, 3, 6, 10, 12) and not (DROP[1] < x < DROP[1] + 8): pluck(x, ch[[0, 1, 2, 1, 0][[0, 3, 6, 10, 12].index(s16)]] + 12)
    t += BAR; bar += 1
# hit on the Giannis reveal and the end chord
for m in [45, 57, 64, 69, 72, 76]: add(st['pad'], (lp(saw(hz(m), 2.5, .006), 2400) * env(2.5, .01, 2.0) * .14).astype(np.float32), DROP[1], 1, 0)
kick(DROP[1], 1.0); snare(DROP[1], .7)
for m in [45, 57, 64, 69, 72, 76]: add(st['pad'], (lp(saw(hz(m), 3.0, .006), 2000) * env(3.0, .02, 2.5) * .14).astype(np.float32), DUR - 3.2, 1, 0)
mix = st['drums'] * .8 + st['bass'] + st['pad'] + st['lead']
mix = mix[:int(DUR * SR)]; mix /= np.abs(mix).max() / .9
sf.write(os.path.join(D, 'music', f'score_{LG}.wav'), mix, SR); print('score', mix.shape)

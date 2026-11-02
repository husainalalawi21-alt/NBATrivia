"""Score for the Tatum/Brown reel — original, written in code. A grid you can hear: 120 BPM motorik pulse,
marimba ostinato in eighths, jazz pizzicato bass, synth kick + hats, snare stick on 2 & 4, glockenspiel on the big reveals.
A minor. Drums drop out for "publicly" (15.0–18.0), a near-silent bar before the regret (17.5–18.0), a hard stop at 31.5.
Run: LIB=<library> "$LIB/.venv/bin/python" music/score.py"""
import os, sys
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S
from core.audio.sfx import SR, add
OUT = os.path.dirname(os.path.abspath(__file__))
S.seed(707); rng = np.random.default_rng(707)
B = .5; DUR = 37.5; N = int(DUR * SR) + SR
st = {k: np.zeros((N, 2), np.float32) for k in ('drums', 'bass', 'mar', 'top')}
def t_(d): return np.arange(int(d * SR)) / SR
def M(p): return S.midi(p) if isinstance(p, str) else p
def j(ms=3): return float(rng.uniform(-ms, ms)) / 1000
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def kick(t, g=.9):
    d = .3; tt = t_(d); f = 48 + 110 * np.exp(-tt / .03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .12); x += np.sin(2 * np.pi * 2 * np.cumsum(f) / SR) * np.exp(-tt / .05) * .25
    add(st['drums'], x.astype(np.float32), t, g, 0)
def hat(t, g=.12):
    d = .06; x = hp(rng.standard_normal(len(t_(d))), 7000) * np.exp(-t_(d) / .015); add(st['drums'], x.astype(np.float32), t + j(), g, .25)
def stick(t, v=.5): add(st['drums'], S.hit(S.load('snare2'), 'stick', v), t + j(), .5, -.1)
def mar(t, p, v=.5, pan=-.2): add(st['mar'], S.note('marimba', M(p), .35, vel=v), t + j(2), 1.0, pan)
def bass(t, p, d=.45, v=.75): add(st['bass'], S.note('jazz_bass', M(p), d, vel=v), t + j(2), 1.0, 0)
def glock(t, p, v=.4): add(st['top'], S.note('glockenspiel', M(p), .6, vel=v, release=1.5), t, .6, .3)
def vib(t, ps, d=2.0, v=.35):
    for i, p in enumerate(ps): add(st['top'], S.note('vibraphone', M(p), d, vel=v), t + i * .01, .7, -.3 + .2 * i)
# chord cycle: 2 bars (4 s) each
PROG = [('A2', ['A3', 'C4', 'E4', 'B4']), ('F2', ['F3', 'A3', 'C4', 'E4']), ('C3', ['G3', 'C4', 'E4', 'D4']), ('G2', ['G3', 'B3', 'D4', 'A4'])]
def chord(t): return PROG[int(t // 4) % 4]
quiet = lambda t: 15.0 <= t < 18.0
hush = lambda t: 17.5 <= t < 18.0 or 30.1 <= t < 30.5   # and one beat of nothing as the blade cuts
END = 36.5
t = 0.0
while t < END - 1e-6:
    root, ch = chord(t); beat = int(round(t / B)) % 4
    if not hush(t):
        # marimba ostinato in eighths: 1-3-2-4 pattern of the chord, an octave up on the off-beats
        pat = [ch[0], ch[2], ch[1], ch[3]]
        mar(t, pat[beat], .45 if quiet(t) else .55); mar(t + .25, M(pat[(beat + 2) % 4]) + 12, .3 if quiet(t) else .4, .2)
        if not quiet(t):
            kick(t, .85 if beat in (0, 2) else .55)
            hat(t + .25); hat(t, .07)
            if beat in (1, 3): stick(t, .45)
            bass(t, root if beat in (0, 2) else M(root) + 7, .4, .75)
        elif beat == 0: bass(t, root, 1.6, .5)
    t += B
# reveals
for x, p in [(1.75, 'E6'), (4.5, 'A5'), (5.0, 'C6'), (18.75, 'E6'), (25.0, 'A5'), (25.5, 'C6'), (31.0, 'D6'), (35.0, 'E6')]: glock(x, p, .45)
vib(15.0, ['A3', 'C4', 'E4', 'G4'], 2.4, .3)       # the empty quote marks: one sustained chord, no drums
vib(18.0, ['F3', 'A3', 'C4', 'E4'], 2.0, .4)
vib(24.5, ['C4', 'E4', 'G4', 'B4'], 2.2, .45)    # the title block
vib(30.5, ['D4', 'F4', 'A4', 'C5'], 2.0, .4)      # the 7 leaves
# hard stop on the downbeat: one final hit that rings
kick(END, 1.0); bass(END, 'A1', 1.0, .85); vib(END, ['A3', 'C4', 'E4', 'B4'], 1.0, .45); glock(END, 'A6', .5)
s0 = int((END - .01) * SR)
for k in ('mar', 'drums'):
    keep = st[k][s0:].copy(); st[k][s0 - 200:] *= 0; 
mix = st['drums'] * .9 + st['bass'] + st['mar'] * .8 + st['top'] * .8
# re-add the final kick after zeroing
d = .3; tt = t_(d); f = 48 + 110 * np.exp(-tt / .03); x = (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .12)).astype(np.float32)
add(mix, x, END, .9, 0)
mix = mix[:int(DUR * SR)]; mix /= np.abs(mix).max() / .9
sf.write(os.path.join(OUT, 'score.wav'), mix, SR)
print('score.wav', mix.shape, S.credits(['marimba', 'jazz_bass', 'snare2', 'glockenspiel', 'vibraphone']))

"""Score for "The NBA Game That Ended 19–18" — an original West-Coast cool-jazz combo, written in code.
Vibraphone, flute, muted trumpet, jazz pizzicato bass, brushes + snare taps, synthesized bongos, glockenspiel as celesta.
120 BPM, 4/4, swing eighths, 30.0 s. F major, up a step to G major for the fix (22.5 s).
Run:  "$LIB/.venv/bin/python" music/score.py   (from the project folder, with LIB set)
"""
import os, sys, json
LIB = os.environ['LIB']
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S
from core.audio.sfx import SR, add

OUT = os.path.dirname(os.path.abspath(__file__))
S.seed(1950)
rng = np.random.default_rng(1950)
B = 0.5; DUR = 30.0; N = int(DUR * SR) + SR
SW = 0.62
stems = {k: np.zeros((N, 2), np.float32) for k in ('drums', 'bass', 'vib', 'lead')}

def sw(t):
    """swing an off-beat eighth that falls on x.25 s grid"""
    b = t / B; w = np.floor(b + 1e-9); f = b - w
    return (w + (SW if abs(f - .5) < 1e-6 else f)) * B
def j(ms=5): return float(rng.uniform(-ms, ms)) / 1000
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def M(p): return S.midi(p) if isinstance(p, str) else p
def t_(d): return np.arange(int(d * SR)) / SR

def vib(t, ps, d, vel=.5, pan=-.25, hard=False, trem=0.0):
    for i, p in enumerate(ps):
        x = S.note('vibraphone_hard' if hard else 'vibraphone', M(p), d, vel=vel)
        if trem: tt = np.arange(len(x)) / SR; x = x * (1 - trem * (.5 + .5 * np.sin(2 * np.pi * 5.2 * tt + i))).astype(np.float32)
        add(stems['vib'], x, t + i * .012, 1.0, pan + (i - 1.5) * .08)
def gliss(t0, ps, step, vel=.45):
    for i, p in enumerate(ps): add(stems['vib'], S.note('vibraphone_hard', M(p), .5, vel=vel * (0.7 + .3 * i / len(ps))), t0 + i * step, .9, -.3 + .6 * i / len(ps))
def flute(t, p, d, vel=.55): add(stems['lead'], S.note('flute', M(p), d, vel=vel, attack=.03), t + j(), .8, .2)
def tpt(t, p, d, vel=.6): add(stems['lead'], S.note('trumpet_mute', M(p), d, vel=vel), t + j(), .8, .15)
def cel(t, p, d=.8, vel=.3): add(stems['lead'], S.note('glockenspiel', M(p), d, vel=vel, release=1.2), t, .5, .3)
def bass(t, p, d=.42, vel=.75): add(stems['bass'], S.note('jazz_bass', M(p), d, vel=vel), t + j(4), 1.0, 0)
def taps(t, vel=.35): add(stems['drums'], S.hit(S.load('snare2'), 'taps', vel), t + j(4), .55, .1)
def swish(t, d=.45, g=.1):
    x = bp(rng.standard_normal(len(t_(d))), 2500, 9000) * np.sin(np.pi * t_(d) / d) ** 1.5
    add(stems['drums'], x.astype(np.float32), t, g, -.15)
def ride(t, vel=.3): add(stems['drums'], S.hit(S.load('sus_cymbal'), 'stick', vel), t + j(3), .35, .3)
def bongo(t, hi=True, g=.35):
    d = .18; tt = t_(d); f = (420 if hi else 290) * (1 + .25 * np.exp(-tt / .01))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .06) + bp(rng.standard_normal(len(tt)), 800, 4000) * np.exp(-tt / .005) * .3
    add(stems['drums'], x.astype(np.float32), t + j(3), g, .35 if hi else -.35)

# ---------------- chords per half-bar (start time, name, bass tones, vibe voicing)
CH = {
    'F6':   (['F2', 'A2', 'C3', 'D3'], ['A3', 'C4', 'D4', 'F4']),
    'Dm7':  (['D2', 'F2', 'A2', 'C3'], ['F3', 'A3', 'C4', 'E4']),
    'Gm7':  (['G2', 'Bb2', 'D3', 'F3'], ['F3', 'Bb3', 'D4', 'F4']),
    'C7':   (['C2', 'E2', 'G2', 'Bb2'], ['E3', 'Bb3', 'D4', 'G4']),
    'D7':   (['D2', 'F#2', 'A2', 'C3'], ['F#3', 'C4', 'E4', 'A4']),
    'Bb7':  (['Bb1', 'D2', 'F2', 'Ab2'], ['Ab3', 'D4', 'F4', 'C5']),
    'C7s':  (['C2', 'C2', 'G2', 'Bb2'], ['F3', 'Bb3', 'D4', 'G4']),
    'F69':  (['F2', 'A2', 'C3', 'D3'], ['A3', 'D4', 'G4', 'C5']),
    'G6':   (['G2', 'B2', 'D3', 'E3'], ['B3', 'D4', 'E4', 'G4']),
    'Em7':  (['E2', 'G2', 'B2', 'D3'], ['G3', 'B3', 'D4', 'F#4']),
    'Am7':  (['A2', 'C3', 'E3', 'G3'], ['G3', 'C4', 'E4', 'A4']),
    'D7b':  (['D2', 'F#2', 'A2', 'C3'], ['F#3', 'C4', 'E4', 'B4']),
    'Gmaj9': (['G2', 'B2', 'D3', 'F#3'], ['B3', 'D4', 'F#4', 'A4']),
}
PROG = [(0, 'F6'), (2, 'Dm7'), (4, 'Gm7'), (5, 'C7'), (6, 'F6'), (7, 'D7'), (8, 'Gm7'), (9, 'C7'),
        (10, 'Dm7'), (14.75, 'Bb7'), (16, 'C7'), (17.5, 'C7s'), (20.5, 'F69'), (22.5, 'G6'), (24, 'Em7'), (25, 'Am7'), (26, 'D7b'), (27, 'G6'), (29.3, 'Gmaj9')]
def chord_at(t):
    c = PROG[0][1]
    for s, n in PROG:
        if t >= s - 1e-6: c = n
    return c
def next_root(t):
    for s, n in PROG:
        if s > t + 1e-6: return M(CH[n][0][0])
    return M('G2')

HUSH = (20.0, 20.5)       # everything off: the swish is the first sound after it
def hushed(t): return HUSH[0] - .05 <= t < HUSH[1]

# ---------------- bass
t = 2.0
while t < 29.3:
    c = chord_at(t); tones = [M(p) for p in CH[c][0]]; beat = int(round(t / B)) % 4
    if hushed(t) or 19.0 <= t < 20.5: t += B; continue
    if 10.0 <= t < 14.75:                     # the stall: the bass walks in a circle
        p = [M('D2'), M('F2'), M('G2'), M('A2')][beat]; bass(t, p, .4, .6)
    elif 17.5 <= t < 19.0:                    # pedal under the last seconds
        if beat in (0, 2): bass(t, M('C2'), .8, .6)
    elif 14.75 <= t < 17.5:                   # double-time feel: two notes a beat
        bass(t, tones[beat], .22, .75); bass(sw(t + .25), tones[(beat + 2) % 4], .18, .55)
    else:
        p = tones[0] if beat == 0 else (next_root(t) - 1 if beat == 3 else tones[beat])
        bass(t, p, .42, .78 if beat in (0, 2) else .65)
    t += B
bass(29.3, M('G1'), 1.2, .8)

# ---------------- drums: brushes all through, taps on 2 & 4, bongos in the double-time
t = 0.0
while t < 29.3:
    beat = int(round(t / B)) % 4
    if not hushed(t) and not (19.0 <= t < 20.5):
        if not (10.0 <= t < 14.75) or True: swish(t, .42, .07 if 10 <= t < 14.75 else .09)
        if beat in (1, 3) and not (17.5 <= t < 19.0): taps(t, .32 if 10 <= t < 14.75 else .4)
        if 21.0 <= t < 22.5 or 26.0 <= t < 29.3: ride(t, .25); ride(sw(t + .25), .18)
        if 14.75 <= t < 17.5: bongo(t, beat % 2 == 0); bongo(sw(t + .25), beat % 2 == 1, .22)
    t += B
# a snare roll swell into the hush, cut dead at 20.0
add(stems['drums'], S.hit(S.load('snare2'), 'roll', .35)[:int(1.0 * SR)] * np.linspace(.1, 1, int(1.0 * SR)).astype(np.float32), 19.0, .4, 0)

# ---------------- vibraphone
vib(0.5, CH['F6'][1], .6, .6, hard=True); vib(1.0, ['C4', 'F4', 'A4', 'D5'], .9, .6, hard=True)   # the two stamps
vib(2.0, CH['Dm7'][1], 1.6, .4, trem=.25)
for s, n in [(4.5, 'Gm7'), (5.0, 'C7'), (6.0, 'F6'), (7.0, 'D7'), (8.0, 'Gm7'), (9.0, 'C7')]: vib(s, CH[n][1], .9, .38, trem=.3)
for s in (10.0, 12.0): vib(s, CH['Dm7'][1], 1.8, .3, trem=.35)
vib(12.5, ['A3', 'D4', 'F4', 'C5'], 1.6, .28, trem=.35)
gliss(HUSH[0] - 4.85, ['F4', 'G4', 'A4', 'C5', 'D5', 'F5'], .045, .5)   # on the 15
gliss(15.7 - .25, ['C5', 'A4', 'F4', 'D4', 'C4'], .05, .35)               # on the 3
vib(17.5, CH['C7s'][1], 2.4, .3, trem=.45)
vib(HUSH[1], CH['F69'][1], 1.8, .7, hard=True); vib(21.0, ['C4', 'F4', 'A4', 'D5'], 1.4, .55, hard=True)
for s, n in [(22.5, 'G6'), (24, 'Em7'), (25, 'Am7'), (26, 'D7b'), (27, 'G6')]: vib(s, CH[n][1], .9, .36, trem=.3)
vib(29.3, CH['Gmaj9'][1] + ['E5'], 2.0, .55, trem=.3)

# ---------------- melody: flute (the question), muted trumpet (the answer), celesta (the record)
for st, p, d in [(4.75, 'C5', .45), (5.25, 'D5', .2), (sw(5.75), 'F5', .5), (6.5, 'E5', .4), (7.0, 'C5', 1.0),
                 (8.25, 'Bb4', .4), (8.75, 'A4', .2), (sw(9.25), 'G4', .3), (9.5, 'A4', .5)]:
    flute(st, p, d, .5)
for st, p, d in [(10.5, 'D5', 1.2), (12.0, 'F5', .9), (13.2, 'E5', 1.2)]: flute(st, p, d, .32)   # long patient notes in the stall
for st, p, d in [(HUSH[1] + .02, 'C5', .22), (sw(20.75), 'F5', .22), (21.0, 'A5', .3), (21.5, 'G5', .2), (sw(21.75), 'F5', .6)]: tpt(st, p, d, .65)
for st, p in [(23.0, 'D6'), (23.5, 'B5'), (24.0, 'G5'), (25.0, 'C6'), (25.5, 'E6'), (26.5, 'F#6'), (27.5, 'G6'), (29.3, 'D6'), (29.32, 'G6'), (29.34, 'B6')]: cel(st, p, .8, .28)
for st, p, d in [(24.25, 'B4', .5), (24.75, 'D5', .5), (sw(25.25), 'E5', .3), (25.5, 'G5', .9), (27.0, 'F#5', .5), (27.5, 'E5', .5), (28.0, 'D5', 1.1)]: flute(st, p, d, .42)

# ---------------- hush: hard gate on every stem
s0, s1 = int((HUSH[0] - .02) * SR), int(HUSH[1] * SR)
for k in stems:
    stems[k][s0:s1] = 0
    f = int(.02 * SR); stems[k][s0 - f:s0] *= np.linspace(1, 0, f)[:, None].astype(np.float32)

mix = stems['drums'] * .9 + stems['bass'] * 1.0 + stems['vib'] * .85 + stems['lead'] * .8
mix = mix[:int(DUR * SR)]
mix /= max(1e-6, np.abs(mix).max()) / .9
sf.write(os.path.join(OUT, 'score.wav'), mix, SR)
json.dump({'credits': S.credits(['vibraphone', 'vibraphone_hard', 'flute', 'trumpet_mute', 'jazz_bass', 'snare2', 'sus_cymbal', 'glockenspiel'])}, open(os.path.join(OUT, 'credits.json'), 'w'), indent=1)
print('score.wav', mix.shape)

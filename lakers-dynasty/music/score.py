"""Original score for "The Last Three-Peat", written in code: dark trap at 96 BPM in F minor.
808 sub bass with glides, punchy kick, layered clap, 1/8 hats with 1/16 rolls, a saw pad (Fm–Db–Ab–Eb) and a bell motif.
Arrangement follows the film's section markers (events_<lang>.json, type "sec"):
  intro (pad + bell, hats in) → full beat from the reveal → hourglass: beat drops to pad + clock ticks → full beat again →
  dead stop before "But the road is brutal" → hard drop for the rivals → build into the odds → half-time, warmer ending.
Run: python music/score.py en|ar  →  music/score_<lang>.wav"""
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
lang = sys.argv[1] if len(sys.argv) > 1 else 'en'
E = json.load(open(os.path.join(ROOT, f'events_{lang}.json')))
DUR = E['dur']; N = int(DUR * SR) + SR
sec = {e['name']: e['t'] for e in E['ev'] if e['type'] == 'sec'}
rng = np.random.default_rng(96)
BPM = 96; B = 60 / BPM; BAR = 4 * B

def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
tracks = {k: np.zeros(N) for k in ('kick', 'clap', 'hat', 'bass', 'pad', 'bell', 'fx')}
def put(k, x, t, g=1.0):
    s = int(t * SR); e = min(N, s + len(x))
    if s < 0 or s >= N: return
    tracks[k][s:e] += x[:e - s] * g

def kick(t, g=1.0):
    d = .45; tt = t_(d); f = 46 + 160 * np.exp(-tt / .025)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .16) + .35 * hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / .004)
    put('kick', np.tanh(x * 1.6), t, g)
def clap(t, g=1.0):
    d = .3; tt = t_(d); n = rng.standard_normal(len(tt))
    env = sum(np.exp(-np.clip(tt - o, 0, None) / .01) * (tt >= o) for o in (0, .011, .022)) * .5 + np.exp(-tt / .09) * (tt >= .03)
    put('clap', bp(n, 900, 6000) * env, t, g * .8)
def hat(t, g=.25, open_=False):
    d = .25 if open_ else .05; tt = t_(d); x = hp(rng.standard_normal(len(tt)), 8000) * np.exp(-tt / (.07 if open_ else .012))
    put('hat', x, t, g)
def bass(t, note, d, glide_from=None, g=1.0):
    tt = t_(d); f = np.full(len(tt), mtof(note))
    if glide_from is not None: f = mtof(note) + (mtof(glide_from) - mtof(note)) * np.exp(-tt / .06)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR); env = np.minimum(1, tt / .005) * np.exp(-tt / 1.4) * np.minimum(1, (d - tt) / .03)
    put('bass', np.tanh(x * env * 2.2) * .8, t, g)
def pad(t, notes, d, g=1.0, bright=1800):
    tt = t_(d); x = np.zeros(len(tt))
    for m in notes:
        for det in (-.12, 0, .12):
            ph = 2 * np.pi * mtof(m + det) * tt + rng.uniform(0, 6.28)
            x += 2 * ((ph / (2 * np.pi)) % 1) - 1
    env = np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .5)
    put('pad', lp(x / (len(notes) * 3), bright) * env, t, g)
def bell(t, m, g=1.0):
    d = 1.4; tt = t_(d); f = mtof(m)
    x = (np.sin(2 * np.pi * f * tt) + .45 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / .25) + .2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt / .08)) * np.exp(-tt / .55)
    put('bell', x, t, g)
def tick(t, g=1.0):
    d = .03; tt = t_(d); put('fx', hp(rng.standard_normal(len(tt)), 4000) * np.exp(-tt / .004), t, g * .5)

# F minor: Fm – Db – Ab – Eb (one chord per bar)
PROG = [(41, [53, 56, 60, 63]), (37, [53, 56, 61, 65]), (44, [51, 56, 60, 63]), (39, [51, 55, 58, 63])]
MOTIF = [77, 75, 72, 75, 80, 77, 75, 72]   # bell line in eighths over two bars

s_dr, s_era, s_brutal, s_riv, s_odds, s_cta, s_end = (sec[k] for k in ('drought', 'era', 'brutal', 'rivals', 'odds', 'cta', 'end'))
REVEAL = 3.15 if lang == 'en' else 3.45
def section(t):
    if t < REVEAL: return 'intro'
    if s_dr <= t < s_era: return 'hourglass'
    if s_brutal - .05 <= t < s_riv: return 'stop'
    if s_odds <= t < s_cta: return 'build'
    if t >= s_cta: return 'outro'
    return 'full'

# grid aligned so a downbeat lands on the reveal
t0 = REVEAL - 2 * BAR
bar = 0
t = t0
while t < DUR:
    root, ch = PROG[bar % 4]
    for b16 in range(16):
        tt = t + b16 * B / 4
        if tt < 0 or tt >= DUR: continue
        sc = section(tt)
        if sc == 'stop': continue
        beat, sub = divmod(b16, 4)
        if sc in ('full', 'build', 'outro'):
            half = sc == 'outro'
            if b16 in (0, 10) or (b16 == 7 and bar % 2 == 1 and not half): kick(tt, 1.0 if b16 == 0 else .85)
            if b16 == 8: clap(tt)
            if sub in (0, 2): hat(tt, .2 if sub == 0 else .13)
            if bar % 4 == 3 and b16 >= 12 and not half: hat(tt + B / 8, .1)       # 1/32 roll into the next phrase
            if b16 == 14 and bar % 2 == 0: hat(tt, .16, open_=True)
            if sc == 'build' and sub == 0: clap(tt, .35 + .1 * beat)
        if sc == 'intro' and sub in (0, 2) and tt > REVEAL - BAR: hat(tt, .1)
        if sc == 'hourglass' and sub == 0: tick(tt, 1.0)
    sc = section(t + .01)
    if sc in ('full', 'build', 'outro'):
        bass(t, root, B * 2.5, glide_from=root + 12 if bar % 2 else None)
        bass(t + B * 2.75, root + (7 if bar % 2 else 0), B * 1.2)
    if sc != 'stop':
        pad(max(0, t), ch, BAR + .3, g=(.55 if sc in ('hourglass', 'intro') else .38), bright=(1100 if sc == 'hourglass' else 2200))
    if sc in ('intro', 'outro', 'hourglass') or bar % 4 in (0, 1):
        for i, m in enumerate(MOTIF[(bar % 2) * 4:(bar % 2) * 4 + 4]):
            tb = t + i * B
            if 0 <= tb < DUR and section(tb) != 'stop': bell(tb, m - (12 if sc == 'hourglass' else 0), .5 if sc != 'outro' else .65)
    bar += 1; t += BAR

# risers into the reveal, the rivals drop and the odds
def riser(t_end, d, g=1.0):
    tt = t_(d); x = hp(rng.standard_normal(len(tt)), 600) * (tt / d) ** 2; put('fx', x * .35, t_end - d, g)
riser(REVEAL, 1.6); riser(s_cta, 2.0, .8)
# tape stop: the music bends down and dies before "brutal"
mix = tracks['kick'] * .95 + tracks['clap'] * .55 + tracks['hat'] * .5 + tracks['bass'] * .75 + tracks['pad'] * .5 + tracks['bell'] * .28 + tracks['fx'] * .5
ts = int((s_brutal - .05) * SR); seg = mix[max(0, ts - int(.45 * SR)):ts].copy()
if len(seg):
    idx = np.cumsum(np.linspace(1, .05, len(seg))); idx = (idx / idx[-1] * (len(seg) - 1) * .55).astype(int)
    mix[max(0, ts - len(seg)):ts] = seg[idx] * np.linspace(1, 0, len(seg))
# dead air until the rivals drop (silence as a tool)
te = int(s_riv * SR); mix[ts:te] = 0
# end: let the last chord ring, fade out over the final second
fe = int((DUR - 1.2) * SR); mix[fe:] *= np.linspace(1, 0, len(mix) - fe) ** 1.5
mix = mix[:int(DUR * SR)]
st = np.stack([mix, mix], 1)
# width: a touch of delay on one side for the pad and bell
w = (tracks['pad'] * .5 + tracks['bell'] * .28)[:len(mix)]; d = int(.012 * SR)
st[d:, 1] += w[:-d] * .25; st[:, 0] += w * .1
st /= np.abs(st).max() / .9
sf.write(os.path.join(HERE, f'score_{lang}.wav'), st.astype(np.float32), SR)
print('score', lang, st.shape, {k: round(v, 2) for k, v in sec.items()})

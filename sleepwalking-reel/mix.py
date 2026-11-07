"""Mix: event-driven score + narration + synthesized foley and beds -> out/mix.wav
Beds: night (crickets as FM chirps + low wind), dawn birds (downward-gliding FM chirps). Voice compressed and well above
the music; music ducks ~10 dB under it. Run: LIB=<library> "$LIB/.venv/bin/python" mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, brown, clack, creak, thump, whoosh, pop, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
rng = np.random.default_rng(3)
def nz(d): return rng.standard_normal(len(t_(d)))
def sine(f, d): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, len(t_(d))).astype(float)) / SR)
def M(*xs): n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def rustle(d=.6): return norm(bp(nz(d), 1500, 7000) * (0.4 + .6 * np.abs(np.sin(2 * np.pi * 5 * t_(d))))) * np.sin(np.pi * t_(d) / d)
def step(): d = .18; return norm(lp(nz(d), 700) * env_exp(d, .03) + sine(90, d) * env_exp(d, .04) * .5)
def door(): c = creak(1); return norm(c[:int(.9 * SR)])
def door_close(): return norm(M(thump(.7, 90)[:int(.3 * SR)], clack(.7, 1)[:int(.1 * SR)] * .5))
def whump(d=1.2): tt = t_(d); return norm(sine(55 + 20 * np.exp(-tt * 3), d) * np.exp(-tt * 2) + sine(110, d) * .2 * np.exp(-tt * 1.5) + bp(nz(d), 80, 400) * np.exp(-tt * 6) * .3)
def crack(): d = .35; return norm(hp(nz(d), 1500) * env_exp(d, .02) + bp(nz(d), 300, 1200) * env_exp(d, .06) * .6)
def swell(d=1.0): tt = t_(d); return norm(bp(nz(d), 60, 260)) * np.sin(np.pi * tt / d) ** 2
def bubble(): d = .25; f = 900 * np.exp(-t_(d) * 4); return norm(sine(f, d) * env_exp(d, .05) + hp(nz(d), 3000) * env_exp(d, .01) * .4)
def chirp(f0, f1, d=.12): return sine(np.linspace(f0, f1, len(t_(d))), d) * np.sin(np.pi * t_(d) / d)
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); vo = np.zeros((N, 2)); venv = np.zeros(N)
for e in E['ev']:
    t, ty, g = e['t'], e['type'], e.get('g', 1.0)
    if ty == 'rustle': add(fx, rustle(), t, .3, -.2)
    elif ty == 'creak': add(fx, creak(.6)[:int(.6 * SR)], t, .2, -.3)
    elif ty == 'step': add(fx, step(), t, .5 * g, rng.uniform(-.2, .2))
    elif ty == 'door': add(fx, door(), t, .3, .4)
    elif ty == 'door_close': add(fx, door_close(), t, .35, .3)
    elif ty == 'glow': add(fx, swell(1.2), t, .3, 0)
    elif ty == 'split': add(fx, crack(), t, .45, 0)
    elif ty == 'wake': add(fx, whump(), t, .55, .1)
    elif ty == 'delta': add(fx, swell(1.4), t, .35, -.1)
    elif ty == 'wave': add(fx, swell(.9), t, .18, -.1)
    elif ty == 'bubble': add(fx, bubble(), t, .5, .2)
    elif ty == 'cut': add(fx, whoosh(.4, 1), t - .2, .2, 0)
    elif ty == 'amb' and e.get('what') == 'night':
        d = e['d']; wind = lp(brown(d), 300) * .03; buf = np.stack([wind, np.roll(wind, 517)], 1)
        k = 0.2
        while k < d - .3:   # crickets: short FM chirp trains
            c = np.concatenate([chirp(4300, 4200, .03) for _ in range(3)]) * .02; s = int(k * SR); pan = rng.uniform(-.7, .7)
            buf[s:s + len(c), 0] += c * (1 - pan) / 2; buf[s:s + len(c), 1] += c * (1 + pan) / 2; k += rng.uniform(.35, .8)
        fade = np.ones(len(buf)); f = int(1.5 * SR); fade[-f:] = np.linspace(1, 0, f); buf *= fade[:, None]
        add(amb, buf.astype(np.float32), t, 1.0, 0) if False else None
        s = int(t * SR); n = min(len(buf), N - s); amb[s:s + n] += buf[:n]
    elif ty == 'amb' and e.get('what') == 'birds':
        k = t + .6
        while k < DUR - .4:
            f0 = rng.uniform(2600, 3600); b = chirp(f0, f0 * .7, .14) * .05; add(amb, b.astype(np.float32), k, 1.0, rng.uniform(-.6, .6)); k += rng.uniform(.25, .9)
    elif ty == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, SR); y = compress(norm(y, .9), thr=.25, ratio=3.5)
        add(vo, y, t, 1.0, 0); s = int(t * SR); venv[s:s + len(y)] = 1
mus, msr = sf.read(os.path.join(D, 'music', 'score.wav'))
if msr != SR: mus = soxr.resample(mus, msr, SR)
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.15 * SR); sm = np.convolve(venv, np.ones(k) / k, 'same')
mus = mus * (1 - sm * (1 - 10 ** (-10 / 20)))[:, None]
mix = mus * .5 + fx * .75 + amb + vo
mix = limit(mix, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', mix.shape, 'peak', float(np.abs(mix).max()))

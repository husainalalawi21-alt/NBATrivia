"""Mix: score + Kokoro narration + print-shop foley (dry, close) -> out/mix.wav
Voice compressed and well above the music; music ducks ~10 dB under the voice. Run: LIB=<library> "$LIB/.venv/bin/python" mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, clack, thump, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
rng = np.random.default_rng(7)
def nz(d): return rng.standard_normal(len(t_(d)))
def sine(f, d): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, len(t_(d))).astype(float)) / SR)
def M(*xs): n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def letterpress(): return norm(M(clack(1.2, 1)[:int(.09 * SR)], lp(nz(.09), 2500) * env_exp(.09, .01) * .5))
def numeral_thunk(p=0): d = .28; return norm(sine(95 * 2 ** (p / 12) * (1 - .3 * t_(d)), d) * env_exp(d, .06) + lp(nz(d), 1200) * env_exp(d, .01) * .6)
def paper_slide(d=.32): return norm(bp(nz(d), 1500, 7000)) * np.sin(np.pi * t_(d) / d) ** 1.5
def knife(d=.2): f = np.linspace(5000, 2500, len(t_(d))); return norm(bp(nz(d), 2500, 9000) * env_exp(d, .07) + sine(f, d) * env_exp(d, .04) * .25)
def knife_miss(): return knife(.16) * .7
def collapse(): return norm(lp(nz(.22), 900) * env_exp(.22, .05) + sine(70, .22) * env_exp(.22, .06) * .5)
def typewriter(): return norm(M(clack(1.6, 1)[:int(.05 * SR)], hp(nz(.05), 3000) * env_exp(.05, .006) * .4))
def snap_(): return norm(M(clack(1.0, 1)[:int(.08 * SR)], thump(.4, 200)[:int(.08 * SR)] * .4))
def pen(d=.3): return norm(bp(nz(d), 3000, 8000)) * np.sin(np.pi * t_(d) / d) * .7
def stamp(): d = .25; return norm(sine(150 * (1 - .4 * t_(d)), d) * env_exp(d, .03) + lp(nz(d), 1600) * env_exp(d, .012) * .8)
def wipe(): d = .35; return norm(bp(nz(d), 300, 3000)) * np.sin(np.pi * t_(d) / d) ** 2
fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); venv = np.zeros(N)
for e in E['ev']:
    t, ty, g = e['t'], e['type'], e.get('gain', 1.0)
    if ty == 'clack': add(fx, letterpress(), t, .35 * g, .15)
    elif ty == 'thunk': add(fx, numeral_thunk(e.get('pitch', 0)), t, .55 * g, 0)
    elif ty == 'slide': add(fx, paper_slide(), t, .3, -.2)
    elif ty == 'knife_miss': add(fx, knife_miss(), t, .3, .3)
    elif ty == 'type': add(fx, typewriter(), t, .25 * g, .3)
    elif ty == 'snap': add(fx, snap_(), t, .4, .3)
    elif ty == 'knife': add(fx, knife(), t, .55, 0)
    elif ty == 'collapse': add(fx, collapse(), t, .5, 0)
    elif ty == 'pen': add(fx, pen(), t, .25, -.2)
    elif ty == 'stamp': add(fx, stamp(), t, .45, 0)
    elif ty == 'wipe': add(fx, wipe(), t, .45, 0)
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
mix = mus * .55 + fx * .8 + vo
mix = limit(mix, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', mix.shape)

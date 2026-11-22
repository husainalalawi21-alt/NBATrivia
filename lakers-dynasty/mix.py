"""Mix: score + ElevenLabs voice + sound design → out/mix_<lang>.wav. Voice on top, music ducks ~10 dB under it.
Run: python mix.py en|ar"""
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; D = os.path.dirname(os.path.abspath(__file__)); lang = sys.argv[1] if len(sys.argv) > 1 else 'en'
E = json.load(open(os.path.join(D, f'events_{lang}.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(7)
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def nz(d): return rng.standard_normal(len(t_(d)))
def norm(x, p=1.0): m = np.abs(x).max(); return x / m * p if m > 0 else x
def add(buf, x, t, g=1.0, pan=0.0):
    s = int(t * SR); e = min(len(buf), s + len(x))
    if s < 0 or s >= len(buf): return
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    buf[s:e, 0] += x[:e - s] * g * l * 1.414; buf[s:e, 1] += x[:e - s] * g * r * 1.414
def sweep(f0, f1, d): f = np.geomspace(f0, f1, len(t_(d))); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def boom(d=1.4): tt = t_(d); return norm(np.tanh(2 * sweep(90, 32, d) * np.exp(-tt / .45)) + lp(nz(d), 400) * np.exp(-tt / .05) * .6)
def impact(): d = 1.0; tt = t_(d); return norm(boom(d) * .8 + bp(nz(d), 200, 5000) * np.exp(-tt / .06) * .7)
def whoosh(d=.5):
    tt = t_(d); n = nz(d); lo = bp(n, 300, 1500); hi = bp(n, 1500, 7000); k = tt / d
    return norm((lo * (1 - k) + hi * k) * np.sin(np.pi * k) ** 1.6)
def stamp(): d = .35; tt = t_(d); return norm(np.tanh(3 * sweep(160, 60, d) * np.exp(-tt / .06)) + bp(nz(d), 800, 4000) * np.exp(-tt / .015) * .8)
def slam(): d = .6; tt = t_(d); return norm(np.tanh(3 * sweep(120, 40, d) * np.exp(-tt / .12)) + bp(nz(d), 400, 6000) * np.exp(-tt / .03))
def pop(): d = .12; tt = t_(d); return norm(sweep(500, 1400, d) * np.exp(-tt / .03))
def click(): d = .025; tt = t_(d); return norm(hp(nz(d), 3000) * np.exp(-tt / .004))
def alarm(): d = .32; tt = t_(d); return norm((np.sign(np.sin(2 * np.pi * 880 * tt)) * (tt < .14) + np.sign(np.sin(2 * np.pi * 660 * tt)) * (tt >= .16)) * .5) * np.exp(-tt / .4)
def ring(p=0): d = 1.6; tt = t_(d); f = 1046.5 * 2 ** (p / 12); return norm((np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.4 * tt) * np.exp(-tt / .3)) * np.exp(-tt / .7))
def riser(d): tt = t_(d); return norm(hp(nz(d), 1200) * (tt / d) ** 2.2 + sweep(200, 1600, d) * (tt / d) ** 3 * .3)
def stop(): d = .5; tt = t_(d); return norm(sweep(400, 40, d) * np.exp(-tt / .2)) * .6
fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); venv = np.zeros(N)
for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'boom': add(fx, boom(), t, .8)
    elif ty == 'impact': add(fx, impact(), t, .75)
    elif ty == 'whoosh': add(fx, whoosh(), t, .45, -.2)
    elif ty == 'cut': add(fx, click(), t, .35)
    elif ty == 'stamp': add(fx, stamp(), t, .55)
    elif ty == 'slam': add(fx, slam(), t, .6)
    elif ty == 'pop': add(fx, pop(), t, .3, .2)
    elif ty == 'alarm': add(fx, alarm(), t, .16)
    elif ty == 'ring': add(fx, ring(e.get('pitch', 0)), t, .35, .1)
    elif ty == 'riser': add(fx, riser(e['dur']), t, .3)
    elif ty == 'stop': add(fx, stop(), t - .3, .35)
    elif ty == 'ticks':
        for i in range(e['n']): add(fx, click(), t + i * e['dur'] / e['n'], .3, (-1) ** i * .3)
    elif ty == 'vo':
        y, sr = sf.read(os.path.join(D, f'voices_{lang}', 'vo.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = norm(y, .9)
        add(vo, y, t, 1.0)
        env = np.abs(y); k = int(.05 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); env = np.clip(env / .05, 0, 1)
        s = int(t * SR); venv[s:s + len(env)] = np.maximum(venv[s:s + len(env)], env[:N - s])
mus, msr = sf.read(os.path.join(D, 'music', f'score_{lang}.wav'))
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.25 * SR); sm = np.convolve(venv, np.ones(k) / k, 'same')
mus = mus * (1 - np.clip(sm, 0, 1) * (1 - 10 ** (-10 / 20)))[:, None]
mix = mus * .42 + fx * .55 + vo
pk = np.abs(mix).max(); mix = mix / pk * .95 if pk > .95 else mix
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', f'mix_{lang}.wav'), mix.astype(np.float32), SR)
print('mix', lang, mix.shape)

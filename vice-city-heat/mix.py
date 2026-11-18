"""Mix: synthwave score + Arabic narration + whooshes on cuts -> out/mix.wav. The source clips' own audio is not used.
Voice compressed and well above the music; music ducks ~10 dB under it. Run: LIB=<library> "$LIB/.venv/bin/python" mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, norm, whoosh, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); venv = np.zeros(N)
for e in E['ev']:
    if e['type'] == 'cut': add(fx, whoosh(.3, 1), e['t'] - .15, .12, (-.3, .3)[e['n'] % 2])
    elif e['type'] == 'vo':
        y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, SR); y = compress(norm(y, .9), thr=.25, ratio=3.5)
        add(vo, y, e['t'], 1.0, 0); s = int(e['t'] * SR); venv[s:s + len(y)] = 1
mus, msr = sf.read(os.path.join(D, 'music', 'score.wav'))
if msr != SR: mus = soxr.resample(mus, msr, SR)
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.15 * SR); sm = np.convolve(venv, np.ones(k) / k, 'same')
mus = mus * (1 - sm * (1 - 10 ** (-10 / 20)))[:, None]
mix = limit(mus * .45 + fx + vo, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True); sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix', mix.shape)

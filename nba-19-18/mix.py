"""Mix: score + Kokoro narration + synthesized foley + ambience -> out/mix.wav
Needs events.json (core/render/events.mjs), voices/ (core/tts/tts.py), music/score.wav (music/score.py).
Run:  LIB=<library> "$LIB/.venv/bin/python" mix.py
Three layers: ambience (room tone, arena crowd), foley (stamps, paper, ball, net, clock), music; music ducks ~8 dB under the voice.
Silences: 20.0–20.5 s is truly silent (everything off); the net swish at 20.5 is the first sound after it."""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, norm, brown, clack, whoosh, thump, pop, add, compress, limit
D = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(D, 'events.json')))
DUR = E['dur']; N = int(round(DUR * SR)); EV = E['ev']
rng = np.random.default_rng(1918)
def nz(d): return rng.standard_normal(len(t_(d)))
def sine(f, d): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, len(t_(d))).astype(float)) / SR)
def M(*xs): n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)

# ---------------- foley by material
def stamp(p=0):        # rubber stamp: thick, damped, a little paper smack
    d = .3; tt = t_(d); f = 140 * 2 ** (p / 12)
    return norm(sine(f * (1 - .4 * tt), d) * env_exp(d, .035) + lp(nz(d), 1800) * env_exp(d, .012) * .9)
def paper_swish(d=.3): return norm(bp(nz(d), 1800, 8000)) * np.sin(np.pi * t_(d) / d) ** 2
def pen_write(d=.5): x = bp(nz(d), 2000, 7000) * (0.5 + .5 * np.abs(np.sin(2 * np.pi * 11 * t_(d)))); return norm(x) * np.sin(np.pi * t_(d) / d)
def iris(d): tt = t_(d); return norm(bp(nz(d), 1000, 6000) * np.linspace(1, .2, len(tt))) * np.sin(np.pi * tt / d)
def slide_whistle(d=.34):
    f = np.linspace(700, 1500, len(t_(d)))
    return norm(sine(f * (1 + .01 * np.sin(2 * np.pi * 6 * t_(d))), d) + .1 * bp(nz(d), 1000, 3000)) * np.sin(np.pi * t_(d) / d) ** .6
def whirr(d):          # clock hands spinning: a soft ratchet that speeds up on "forever"
    tt = t_(d); rate = 10 + 30 * np.clip((tt - 3.0) / 1.5, 0, 1)
    tick = (np.sin(2 * np.pi * np.cumsum(rate) / SR) > .97).astype(float)
    x = lp(tick, 5000) * 0.8 + bp(nz(d), 2000, 6000) * .05
    return norm(x) * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .3)
def tick(): return norm(clack(1.6, 1)[:int(.06 * SR)])
def bounce():          # leather ball on a wooden floor
    d = .25; return norm(M(sine(110 * (1 - .3 * t_(d)), d) * env_exp(d, .05), lp(nz(d), 1200) * env_exp(d, .008) * .6))
def grab(): return norm(lp(nz(.12), 1500) * env_exp(.12, .02))
def pass_(): d = .3; return norm(bp(nz(d), 300, 2000) * np.sin(np.pi * t_(d) / d)) * .6
def net_swish():       # the net: a quick airy zip of nylon
    d = .45; tt = t_(d)
    x = bp(nz(d), 2500, 9000) * np.exp(-tt / .12) * (0.6 + .4 * np.sin(2 * np.pi * 38 * tt)) + bp(nz(d), 900, 2500) * np.exp(-tt / .05) * .4
    return norm(x)
def clock_click(): return norm(M(clack(1.0, 1)[:int(.1 * SR)], thump(.5, 160)[:int(.1 * SR)] * .4))
def crowd(d, mood):
    tt = t_(d); x = np.zeros(len(tt))
    for k in range(14):                       # a room of voices: band-limited noise with slow syllabic AM
        f0 = rng.uniform(250, 900) if mood != 'cheer' else rng.uniform(500, 1800)
        am = .5 + .5 * np.sin(2 * np.pi * rng.uniform(1.5, 4) * tt + rng.uniform(0, 6))
        x += bp(nz(d), f0, f0 * 2.2) * am
    if mood == 'boo': x = lp(x, 700) * (0.6 + .4 * np.sin(2 * np.pi * .5 * tt) ** 2); e = np.minimum(1, tt / 1.2) * .8
    elif mood == 'tense': e = np.linspace(.3, 1, len(tt))
    elif mood == 'cheer': e = np.minimum(1, tt / .08) * np.exp(-tt / 1.4) * 1.6
    else: e = np.ones(len(tt)) * .6
    e = e * np.minimum(1, (d - tt) / .3)
    return norm(x) * e

fx = np.zeros((N, 2)); vo = np.zeros((N, 2)); amb = np.zeros((N, 2))
for e in EV:
    t, ty, gn, pan = e['t'], e['type'], e.get('gain', 1.0), e.get('pan', 0.0)
    if ty == 'vo': continue
    if ty == 'stamp': add(fx, stamp(e.get('pitch', 0)), t, .7 * gn, pan)
    elif ty == 'pen_write': add(fx, pen_write(e.get('dur', .5)), t, .18 * gn, -.3)
    elif ty == 'pop': add(fx, pop(1), t, .3 * gn, .3)
    elif ty == 'whoosh': add(fx, whoosh(e.get('dur', .35), 1), t, .3 * gn)
    elif ty == 'iris': add(fx, iris(e.get('dur', .5)), t, .25)
    elif ty == 'slide': add(fx, paper_swish(.25), t, .2, -.4)
    elif ty == 'whirr': add(fx, whirr(e.get('dur', 4)), t, .12, .2)
    elif ty == 'bounce': add(fx, bounce(), t, .6, -.3)
    elif ty == 'grab': add(fx, grab(), t, .4, -.3)
    elif ty == 'tick': add(amb, tick(), t, .06, .5)
    elif ty == 'pass': add(fx, pass_(), t, .25, [-.4, .2, .4, -.2, 0][e.get('n', 0) % 5])
    elif ty == 'paper_swish': add(fx, paper_swish(.3), t, .35 * gn, .3)
    elif ty == 'whistle': add(fx, slide_whistle(), t, .2, -.3)
    elif ty == 'swish': add(fx, net_swish(), t, .9, 0)
    elif ty == 'clock_click': add(fx, clock_click(), t, .6, -.3)
    elif ty == 'crowd': add(amb, crowd(e.get('dur', 2), e.get('mood', 'murmur')), t, {'boo': .09, 'murmur': .05, 'tense': .07, 'cheer': .22}[e.get('mood', 'murmur')])

# ---------------- narration
voice_env = np.zeros(N)
for e in EV:
    if e['type'] != 'vo': continue
    y, sr = sf.read(os.path.join(D, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR)
    y = compress(norm(y, .9), thr=.3, ratio=3.0)
    add(vo, y, e['t'], 1.0, 0)
    s = int(e['t'] * SR); voice_env[s:s + len(y)] = 1

# ---------------- ambience: warm room tone
room = lp(brown(DUR), 900) * .018
amb += np.stack([room, np.roll(room, 311)], 1)[:N]

# ---------------- music + ducking
mus, msr = sf.read(os.path.join(D, 'music', 'score.wav'))
if msr != SR: mus = soxr.resample(mus, msr, SR)
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
k = int(.12 * SR); sm = np.convolve(voice_env, np.ones(k) / k, 'same')
mus = mus * (1 - sm * (1 - 10 ** (-8 / 20)))[:, None]

# ---------------- the silence before the swish
def gate(buf, a, b, keep=0.0, fade=.02):
    s, e = int(a * SR), int(b * SR); f = int(fade * SR)
    m = np.ones(N); m[s:e] = keep
    m[max(0, s - f):s] = np.linspace(1, keep, min(f, s)); m[e:e + f] = np.linspace(keep, 1, len(m[e:e + f]))
    buf *= m[:, None]
for b in (amb, fx): gate(b, 20.0, 20.5)
# a tail of room tone fades out under the iris
tail = np.ones(N); s = int(29.4 * SR); tail[s:] = np.linspace(1, 0.3, N - s); amb *= tail[:, None]

mix = mus * .85 + fx * .9 + vo + amb
mix = limit(mix, .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix.wav', mix.shape, 'peak', float(np.abs(mix).max()))

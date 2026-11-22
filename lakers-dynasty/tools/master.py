"""Loudness master without mux.sh (ffmpeg 6 under-reports audio length through loudnorm):
measure integrated loudness with ffmpeg's ebur128, apply the gain to reach -14 LUFS, true-peak-limit at -1.2 dBTP
(4x oversampled peak), measure again. Usage: python tools/master.py in.wav out.wav"""
import sys, re, subprocess, numpy as np, soundfile as sf, soxr
def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1]); return I, P
src, dst = sys.argv[1], sys.argv[2]
x, sr = sf.read(src)
I0, _ = lufs(src)
y = x * 10 ** ((-14.0 - I0) / 20)
ceil = 10 ** (-1.2 / 20)
for _ in range(3):   # oversampled peak limiter: smooth gain reduction where the 4x peak exceeds the ceiling
    up = soxr.resample(y, sr, sr * 4); pk = np.abs(up).max(1).reshape(-1, 4).max(1)[:len(y)]
    if pk.max() <= ceil: break
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9)); k = int(.004 * sr)
    g = np.minimum.accumulate(np.r_[g, np.ones(k)][::-1])[::-1][:len(g)] if False else g
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    g = uniform_filter1d(minimum_filter1d(g, 2 * k + 1), k)
    y = y * g[:, None]
sf.write(dst, y.astype(np.float32), sr, subtype='FLOAT')
I1, P1 = lufs(dst)
print(f'loudness in {I0:.1f} LUFS -> out {I1:.1f} LUFS, true peak {P1:.1f} dBTP')

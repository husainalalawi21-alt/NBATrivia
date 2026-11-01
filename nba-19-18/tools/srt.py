"""Write nba-19-18.srt from the same cue timing the page burns in (film.js srtCues), via events.mjs' dur.json."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
src = open(os.path.join(HERE, 'film.js')).read()
dur = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
vo = [(m[0], float(m[1]), m[2]) for m in re.findall(r"\{ id: '(l\d)', t: ([\d.]+), sub: (?:'|\")(.*?)(?:'|\") \}", src)]
vo = [(i, t, s.replace("\\'", "'")) for i, t, s in vo]
vo[0] = (vo[0][0], vo[0][1], '19–18. A real NBA final score.')
cues = []
for k, (i, t, s) in enumerate(vo):
    nx = vo[k + 1][1] - 0.05 if k + 1 < len(vo) else 30.0
    cues.append({'t0': t, 't1': min(nx, max(t + dur[i] + 0.6, t + 1.8)), 'text': s})
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'nba-19-18.srt')], check=True)

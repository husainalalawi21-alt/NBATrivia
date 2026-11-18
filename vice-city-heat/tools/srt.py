"""Write vice-city-heat.srt with the same cue rule as the burned-in captions (film.js cues())."""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ.get('LIB', '/root/lemo-opuscar')
lines = {l['id']: l['text'].replace(' ', ' ') for l in json.load(open(os.path.join(HERE, 'lines.json')))}
dur = json.load(open(os.path.join(HERE, 'voices', 'dur.json'))); DUR = json.load(open(os.path.join(HERE, 'edit.json')))['dur']
vo = [(i, float(t)) for i, t in re.findall(r"\{ id: '(l\d+)', t: ([\d.]+) \}", open(os.path.join(HERE, 'film.js')).read())]
cues = [{'t0': t, 't1': min(vo[k + 1][1] - .05 if k + 1 < len(vo) else DUR - .3, max(t + dur[i] + .5, t + 1.8)), 'text': lines[i]} for k, (i, t) in enumerate(vo)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'vice-city-heat.srt')], check=True)

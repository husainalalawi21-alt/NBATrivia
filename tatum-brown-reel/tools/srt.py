"""Write tatum-brown-reel.srt with the same cue rule the page burns in: hold >= max(1.8 s, speech + 0.6 s), until the next line."""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ.get('LIB', '/root/lemo-opuscar')
src = open(os.path.join(HERE, 'film.js')).read(); dur = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
vo = [(i, float(t), s) for i, t, s in re.findall(r"\{ id: '(l\d)', t: ([\d.]+), sub: [\"'](.*?)[\"'] \}", src)]
cues = [{'t0': t, 't1': min(vo[k + 1][1] - .05 if k + 1 < len(vo) else 32.5, max(t + dur[i] + .6, t + 1.8)), 'text': s} for k, (i, t, s) in enumerate(vo)]
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'tatum-brown-reel.srt')], check=True)

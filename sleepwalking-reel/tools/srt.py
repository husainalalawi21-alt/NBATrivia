"""Write sleepwalking.srt with the same hold rule the page burns in: >= max(1.8 s, speech + 0.6 s), until the next line."""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ.get('LIB', '/root/lemo-opuscar')
src = open(os.path.join(HERE, 'story.js')).read(); dur = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
END = float(re.search(r"end: ([\d.]+)", src).group(1))
vo = [(i, float(t), s) for i, t, s in re.findall(r"\{ id: '(v\d)', t: ([\d.]+), text: [\"'](.*?)[\"'] \}", src)]
cues = []
for k, (i, t, s) in enumerate(vo):
    nx = vo[k + 1][1] - .05 if k + 1 < len(vo) else END - .05
    cues.append({'t0': t, 't1': min(nx, max(t + dur[i] + .6, t + 1.8)), 'text': s})
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'sleepwalking.srt')], check=True)

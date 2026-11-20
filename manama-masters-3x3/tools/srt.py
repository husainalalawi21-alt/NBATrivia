"""Write vice-city-heat_<lang>.srt with the same cue rule as the burned-in captions. Usage: srt.py ar|en"""
import json, os, sys, subprocess
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ.get('LIB', '/root/lemo-opuscar'); LG = sys.argv[1]
lines = {l['id']: l['text'].replace(' ', ' ') for l in json.load(open(os.path.join(HERE, f'lines_{LG}.json')))}
E = json.load(open(os.path.join(HERE, f'events_{LG}.json'))); dur = json.load(open(os.path.join(HERE, f'voices_{LG}', 'dur.json')))
vo = [(e['id'], e['t']) for e in E['ev'] if e['type'] == 'vo']
cues = [{'t0': t, 't1': min(vo[k + 1][1] - .05 if k + 1 < len(vo) else E['dur'] - .3, max(t + dur[i] + .5, t + 1.8)), 'text': lines[i]} for k, (i, t) in enumerate(vo)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); json.dump(cues, open(os.path.join(HERE, 'out', f'cues_{LG}.json'), 'w'), ensure_ascii=False)
subprocess.run([os.path.join(LIB, '.venv/bin/python'), os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out', f'cues_{LG}.json'), os.path.join(HERE, f'vice-city-heat_{LG}.srt')], check=True)

"""Extract each video clip in edit.json to assets/frames/<id>/%04d.jpg (30 fps, 1080×1920), long enough for the
longest language version (clip lengths follow each language's narration), and record frame counts."""
import json, os, subprocess, shutil
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); E = json.load(open(os.path.join(HERE, 'edit.json')))
IDS = [f'l{i}' for i in range(1, 12)]
def spans(lang):
    d = json.load(open(os.path.join(HERE, f'voices_{lang}', 'dur.json'))); S = {}; t = .3
    for i, k in enumerate(IDS):
        end = t + d[k] + (.3 if i < len(IDS) - 1 else 1.4); S[k] = (0 if i == 0 else t, end); t = end
    return S
SP = [spans(l) for l in ('ar', 'en') if os.path.exists(os.path.join(HERE, f'voices_{l}', 'dur.json'))]
for c in E['clips']:
    if 'src' not in c: continue
    need = max((S[c['line']][1] - S[c['line']][0]) * (c['f'][1] - c['f'][0]) for S in SP)
    d = min(need * c.get('slow', 1) + .2, 60)
    out = os.path.join(HERE, 'assets/frames', c['id']); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(c['in']), '-t', f'{d:.2f}', '-i', os.path.join(HERE, 'assets', c['src'] + '.mp4'),
                    '-vf', 'fps=30,scale=1080:1920:flags=lanczos', '-q:v', '3', os.path.join(out, '%04d.jpg')], check=True)
    c['frames'] = len(os.listdir(out)); print(c['id'], c['frames'], 'frames for', round(d, 2), 's')
json.dump(E, open(os.path.join(HERE, 'edit.json'), 'w'), indent=1)

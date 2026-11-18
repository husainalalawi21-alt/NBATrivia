"""Extract each video clip in edit.json to assets/frames/<id>/%04d.jpg at 30 fps, 1080×1920, and record frame counts."""
import json, os, subprocess, shutil
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); E = json.load(open(os.path.join(HERE, 'edit.json')))
for c in E['clips']:
    if 'src' not in c: continue
    out = os.path.join(HERE, 'assets/frames', c['id']); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    d = (c['t1'] - c['t0']) * c.get('slow', 1) + .1
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(c['in']), '-t', str(d), '-i', os.path.join(HERE, 'assets', c['src'] + '.mp4'),
                    '-vf', 'fps=30,scale=1080:1920:flags=lanczos', '-q:v', '3', os.path.join(out, '%04d.jpg')], check=True)
    c['frames'] = len(os.listdir(out))
json.dump(E, open(os.path.join(HERE, 'edit.json'), 'w'), indent=1)

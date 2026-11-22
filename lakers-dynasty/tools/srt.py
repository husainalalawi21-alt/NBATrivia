"""Write the .srt from the cue events the page exports (same cues it burns in). Usage: python tools/srt.py en|ar"""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); lang = sys.argv[1]
E = json.load(open(os.path.join(D, f'events_{lang}.json')))
cues = [e for e in E['ev'] if e['type'] == 'cue']
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)):03d}".replace(',1000', ',999')
with open(os.path.join(D, f'lakers-dynasty_{lang}.srt'), 'w', encoding='utf-8') as f:
    for i, c in enumerate(cues, 1): f.write(f"{i}\n{ts(c['t'])} --> {ts(c['t1'])}\n{c['text']}\n\n")
print('srt', lang, len(cues))

// Page contract: window.READY, window.render(t), window.DUR, window.EV, window.TEXTS
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['100px Lalezar', '700 48px Cairo', '600 24px Cairo'].map(f => document.fonts.load(f, 'فايس سيتي ABC')));
const LANG = Q.get('lang') || 'ar';
const [edit, lines, durs] = await Promise.all(['edit.json', `lines_${LANG}.json`, `voices_${LANG}/dur.json`].map(u => fetch(u).then(r => r.json())));
const film = await import('./film.js');
film.setup(edit, lines, durs, LANG);
window.DUR = film.dur();
const cutEv = edit.clips.slice(1).map((c, i) => ({ t: c.t0, type: 'cut', n: i }));
window.EV = [...film.VO.map(v => ({ t: v.t, type: 'vo', id: v.id })), ...cutEv].sort((a, b) => a.t - b.t);
window.CUES = film.cues();
const off = new OffscreenCanvas(1080, 1920), og = off.getContext('2d');
window.render = t => film.render(g, t, { nosubs: Q.has('nosubs') });
window.TEXTS = async t => { const out = []; await film.render(og, t, { nosubs: true, texts: out }); return out; };
window.READY = true;

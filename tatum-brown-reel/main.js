// Page contract: window.READY, window.render(t), window.DUR, window.EV, window.TEXTS
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['400', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 80px Archivo`)));
let durs = {}; try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) {}
const film = await import('./film.js');
film.setup(durs);
window.DUR = film.DUR; window.EV = film.events(); window.CUES = film.cues();
const off = new OffscreenCanvas(1080, 1920), og = off.getContext('2d');
window.render = t => film.renderFilm(g, t, Q);
window.TEXTS = t => { const out = []; film.renderFilm(og, t, new URLSearchParams('nosubs=1'), out); return out; };
window.READY = true;

// Page contract: window.READY, window.render(t), window.DUR, window.EV, window.TEXTS
import { textures } from './engine/toon.js';
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['700 80px Oleo', '80px Slab', '500 40px Jost', '600 40px Jost'].map(f => document.fonts.load(f)));
textures();
let durs = {}; try { durs = await (await fetch('voices/dur.json')).json(); } catch (e) {}
const film = await import('./film.js');
film.setup(durs);
window.DUR = film.DUR; window.EV = film.events(); window.SRT = film.srtCues();
const off = new OffscreenCanvas(1080, 1920), og = off.getContext('2d');
window.render = t => { g.setTransform(1, 0, 0, 1, 0, 0); film.renderFilm(g, t, Q); };
window.TEXTS = t => { const out = []; og.setTransform(1, 0, 0, 1, 0, 0); film.renderFilm(og, t, new URLSearchParams('nosubs=1'), out); return out; };
window.READY = true;

// Page contract for the library renderer: window.READY, window.render(t), window.DUR, window.EV. ?lang=en|ar picks the version.
const Q = new URLSearchParams(location.search), lang = Q.get('lang') === 'ar' ? 'ar' : 'en';
const cv = document.getElementById('c'), g = cv.getContext('2d');
const fonts = ['400 80px Inter', '600 80px Inter', '700 80px Inter', '800 80px Inter', '900 80px Inter', "italic 400 80px 'Instrument Serif'",
  "500 40px 'JetBrains Mono'", "500 80px 'Plex Arabic'", "600 80px 'Plex Arabic'", "700 80px 'Plex Arabic'"];
await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa١ب')));
const names = ['hook_trophy', 'diorama_three_rings', 'diorama_parade2000', 'diorama_confetti', 'retro_hourglass', 'retro_locker', 'diorama_luka77',
  'diorama_reaves_kessler', 'diorama_road', 'retro_slot', 'retro_rings', 'diorama_arena2026'];
const images = {};
await Promise.all(names.map(n => new Promise((ok, bad) => { const im = new Image(); im.onload = () => { images[n] = im; ok(); }; im.onerror = () => bad(new Error('image ' + n)); im.src = `img/${n}.jpg`; })));
const film = await import('./film.js');
film.setup(lang, images);
window.DUR = film.DUR; window.EV = film.events(); window.CUES = film.cues(); window.MARKERS = film.markers();
window.render = t => film.renderFilm(g, t);
window.READY = true;

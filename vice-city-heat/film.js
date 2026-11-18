// "فايس سيتي… بس في الـNBA" — 1080×1920, 30 fps. The user's footage and photos, cut on the narration,
// with neon titles (Lalezar), Arabic captions (Cairo) and flash/glitch cuts. One timeline: edit.json + VO below.
export const W = 1080, H = 1920;
export let VO = [];
const IDS = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11'];
// [line, frac start, line, frac end, Arabic, English, x, y, options]
const TITLES = [
  ['l1', .02, 'l1', 1, 'فايس سيتي', 'VICE CITY', 540, 520, { px: 190, color: '#ff3db8' }],
  ['l1', .35, 'l1', 1, 'مو بس في قراند', 'NOT JUST IN GTA', 540, 700, { px: 92, color: '#3ad7ff', fill: '#fff' }],
  ['l2', .06, 'l2', 1, 'عندهم فريق في الـNBA', 'HAS AN NBA TEAM', 540, 360, { px: 110, color: '#ff3db8' }],
  ['l3', .06, 'l3', 1, 'ونجم من أحسن لاعبين العالم؟', 'AND A WORLD-CLASS STAR?', 540, 520, { px: 104, color: '#3ad7ff' }],
  ['l4', .07, 'l4', .75, 'فايس سيتي = ميامي', 'VICE CITY = MIAMI', 540, 470, { px: 120, color: '#ff3db8' }],
  ['l4', .78, 'l4', 1, 'MIAMI HEAT', 'MIAMI HEAT', 540, 470, { px: 150, color: '#ff5a3c', dir: 'ltr' }],
  ['l5', .02, 'l5', 1, '2017', '2017', 540, 300, { px: 200, color: '#3ad7ff', dir: 'ltr' }],
  ['l5', .1, 'l5', 1, 'جيرسي VICE', 'THE VICE JERSEY', 540, 470, { px: 104, color: '#ff3db8' }],
  ['l5', .35, 'l5', 1, 'مستوحى من Miami Vice', 'INSPIRED BY MIAMI VICE', 540, 1190, { chip: 1, color: '#3ad7ff' }],
  ['l5', .66, 'l5', 1, 'من أكثر الجيرسيات بيعاً', 'A LEAGUE BEST-SELLER', 540, 1340, { chip: 1, color: '#ff3db8' }],
  ['l6', .05, 'l6', 1, 'قبل GTA 6 بيوم', 'ONE DAY BEFORE GTA 6', 540, 250, { px: 96, color: '#ff3db8' }],
  ['l7', .02, 'l7', .46, 'ملعب لليلة وحدة بس', 'ONE NIGHT ONLY', 540, 300, { px: 110, color: '#ff3db8' }],
  ['l7', .48, 'l7', 1, 'Nike × Cactus Jack', 'Nike × Cactus Jack', 540, 1240, { px: 96, color: '#ff3db8', dir: 'ltr' }],
  ['l8', .05, 'l8', 1, 'سطح الأرينا: VICE CITY', 'ON THE ARENA ROOF', 540, 470, { px: 104, color: '#ff3db8' }],
  ['l9', .03, 'l9', 1, 'يانيس', 'GIANNIS', 540, 560, { px: 240, color: '#ff3db8' }],
  ['l9', .12, 'l9', 1, 'أنتيتوكونمبو', 'ANTETOKOUNMPO', 540, 760, { px: 120, color: '#3ad7ff' }],
  ['l9', .45, 'l9', 1, 'MVP مرتين', '2× MVP', 540, 1000, { chip: 1, color: '#ff3db8' }],
  ['l9', .64, 'l9', 1, 'بطل الدوري 2021', '2021 NBA CHAMPION', 540, 1160, { chip: 1, color: '#3ad7ff' }],
  ['l10', .25, 'l10', 1, 'ضد فريقه القديم', 'VS HIS OLD TEAM', 540, 1180, { px: 110, color: '#3ad7ff' }],
  ['l11', .04, 'l11', 1, 'باجر: GTA 6', 'TOMORROW: GTA 6', 540, 600, { px: 140, color: '#ff3db8' }],
  ['l11', .38, 'l11', 1, 'الليلة: باسكت', 'TONIGHT: HOOPS', 540, 800, { px: 140, color: '#3ad7ff' }],
];
const PINK = '#ff3db8', BLUE = '#3ad7ff', WHITE = '#ffffff';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), eo = t => 1 - Math.pow(1 - clamp(t), 3), eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
let E, LINES, DURS, LANG = 'ar', SPAN = {}, DUR = 0;
const GAP = .3;
export function setup(edit, lines, durs, lang = 'ar') {
  E = edit; LINES = Object.fromEntries(lines.map(l => [l.id, l.text])); DURS = durs; LANG = lang;
  let t = .3; VO = [];
  IDS.forEach((id, i) => { const d = durs[id]; VO.push({ id, t }); const end = i < IDS.length - 1 ? t + d + GAP : t + d + 1.4; SPAN[id] = [i === 0 ? 0 : t, end]; t = end; });
  DUR = SPAN[IDS[IDS.length - 1]][1];
  // the cut points are fractions of each line's span; snapped to whole frames
  const snap = x => Math.round(x * E.fps) / E.fps;
  E.clips.forEach(c => { const [a, b] = SPAN[c.line]; c.t0 = snap(a + (b - a) * c.f[0]); c.t1 = snap(a + (b - a) * c.f[1]); });
  E.dur = DUR;
}
export const dur = () => DUR;
// a time anchored to a line: (line, fraction of its span)
const at = (id, f) => { const [a, b] = SPAN[id]; return a + (b - a) * f; };
// —— image cache ——
const cache = new Map();
function img(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('missing ' + src)); i.src = src; });
  cache.set(src, p); if (cache.size > 240) cache.delete(cache.keys().next().value);
  return p;
}
function clipAt(t) { return E.clips.find(c => t >= c.t0 && t < c.t1) || E.clips[E.clips.length - 1]; }
async function frameOf(c, t) {
  if (c.img) return img(`assets/${c.img}.jpg`);
  const n = c.frames, i = clamp(Math.floor((t - c.t0) * (c.slow || 1) * E.fps) + 1, 1, n);
  return img(`assets/frames/${c.id}/${String(i).padStart(4, '0')}.jpg`);
}
// cover-fit with a zoom and a focus point
function cover(ctx, im, z, fx, fy) {
  const s = Math.max(W / im.width, H / im.height) * z, w = im.width * s, h = im.height * s;
  ctx.drawImage(im, clamp(W / 2 - fx * w + (fx - .5) * 0, W - w, 0), clamp(H / 2 - fy * h, H - h, 0), w, h);
}

// —— text ——
function glowText(ctx, str, x, y, o = {}) {
  const px = o.px || 120, font = o.font || `${px}px Lalezar`;
  ctx.save(); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = o.dir || 'rtl';
  let w = ctx.measureText(str).width; const maxW = o.maxW || 960; let sc = w > maxW ? maxW / w : 1;
  ctx.translate(x, y); ctx.scale(sc * (o.scale || 1), sc * (o.scale || 1)); ctx.rotate(o.rot || 0);
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.glow !== false) { ctx.shadowColor = o.glowColor || o.color || PINK; ctx.shadowBlur = o.blur ?? 40; ctx.fillStyle = o.color || PINK; ctx.fillText(str, 0, 0); ctx.shadowBlur = (o.blur ?? 40) / 3; }
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || '#1a0820'; ctx.strokeText(str, 0, 0); }
  ctx.fillStyle = o.fill || o.color || WHITE; ctx.fillText(str, 0, 0);
  ctx.restore();
}
// pops in with overshoot at t0, out at t1
function title(ctx, t, t0, t1, str, x, y, o = {}) {
  if (t < t0 || t >= t1) return;
  const k = back(seg(t, t0, t0 + .28), 2.2), out = 1 - eo(seg(t, t1 - .18, t1));
  glowText(ctx, str, x, y + (1 - clamp(k)) * 40, { ...o, scale: (o.scale || 1) * Math.max(.01, k), alpha: out });
  if (TX && k >= .999 && out >= .999) TX.push({ id: o.id || str, text: str, x0: 60, y0: y - 80, x1: 1020, y1: y + 80 });
}
function chip(ctx, t, t0, t1, str, x, y, color) {
  if (t < t0 || t >= t1) return;
  const k = back(seg(t, t0, t0 + .25), 2), out = 1 - eo(seg(t, t1 - .18, t1));
  ctx.save(); ctx.globalAlpha = out; ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = '74px Lalezar'; ctx.direction = LANG === 'en' ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(str).width + 90;
  ctx.shadowColor = color; ctx.shadowBlur = 36; ctx.fillStyle = 'rgba(16,4,24,.82)';
  ctx.beginPath(); ctx.roundRect(-w / 2, -62, w, 124, 62); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = WHITE; ctx.fillText(str, 0, 6); ctx.restore();
  if (TX && k >= .999 && out >= .999) TX.push({ id: str, text: str, x0: x - w / 2, y0: y - 62, x1: x + w / 2, y1: y + 62 });
}
let TX = null;
function wrap(ctx, text, font, maxW) { ctx.font = font; const out = []; let cur = ''; for (const w of text.split(' ')) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width <= maxW || !cur) cur = tt; else { out.push(cur); cur = w; } } if (cur) out.push(cur); return out; }
export function cues() {
  return VO.map((v, i) => { const nx = VO[i + 1] ? VO[i + 1].t - .05 : DUR - .3; return { t0: v.t, t1: Math.min(nx, Math.max(v.t + (DURS[v.id] ?? 3) + .5, v.t + 1.8)), text: LINES[v.id] }; });
}
function caption(ctx, t) {
  const c = cues().find(q => t >= q.t0 && t < q.t1); if (!c) return;
  const a = Math.min(seg(t, c.t0, c.t0 + .15), 1 - seg(t, c.t1 - .15, c.t1));
  const font = '700 48px Cairo', lines = wrap(ctx, c.text, font, 900).map(l => l.replace(/\u00a0/g, ' ')), lh = 70, y0 = 1560 - (lines.length - 1) * lh / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.font = font; ctx.direction = LANG === 'en' ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    const w = ctx.measureText(l).width + 44, y = y0 + i * lh;
    ctx.fillStyle = 'rgba(12,3,20,.72)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - 34, w, 66, 14); ctx.fill();
    ctx.fillStyle = WHITE; ctx.fillText(l, W / 2, y + 2);
  });
  ctx.restore();
}

// —— the frame ——
export async function render(ctx, t, opt = {}) {
  TX = opt.texts || null;
  const c = clipAt(t), im = await frameOf(c, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // punch-in on every cut, then a slow drift; stills get a Ken Burns move
  const u = seg(t, c.t0, c.t1), punch = 1 + .06 * (1 - eo(seg(t, c.t0, c.t0 + .35)));
  if (c.crop) {   // an exact crop of a photo, fitted to the width over a blurred fill of the same crop
    const [sx, sy, sw, sh] = c.crop, z = lerp(c.zoom[0], c.zoom[1], eio(u)) * punch;
    const fs = Math.max(W / sw, H / sh); ctx.save(); ctx.filter = 'blur(28px) brightness(.55)'; ctx.drawImage(im, sx, sy, sw, sh, W / 2 - sw * fs / 2, H / 2 - sh * fs / 2, sw * fs, sh * fs); ctx.restore();
    const s = Math.min(W / sw, 1500 / sh) * z, dw = sw * s, dh = sh * s; ctx.drawImage(im, sx, sy, sw, sh, W / 2 - dw / 2, 860 - dh / 2, dw, dh);
  } else if (c.kb) { const [z0, z1, fx, fy] = c.kb; cover(ctx, im, lerp(z0, z1, eio(u)) * punch, fx, fy); }
  else cover(ctx, im, (1.0 + .04 * u) * punch, .5, .5);
  if (c.dim) { ctx.fillStyle = `rgba(20,0,30,${c.dim})`; ctx.fillRect(0, 0, W, H); }
  // a neon gradient wash top and bottom so titles and captions read on any shot
  const g1 = ctx.createLinearGradient(0, 0, 0, 560); g1.addColorStop(0, 'rgba(10,0,20,.55)'); g1.addColorStop(1, 'rgba(10,0,20,0)'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, 560);
  const g2 = ctx.createLinearGradient(0, 1300, 0, H); g2.addColorStop(0, 'rgba(10,0,20,0)'); g2.addColorStop(1, 'rgba(10,0,20,.7)'); ctx.fillStyle = g2; ctx.fillRect(0, 1300, W, 620);
  // cut flash (neon) for the first 3 frames of each clip, alternating pink / blue
  const f = t - c.t0, idx = E.clips.indexOf(c);
  if (idx > 0 && f < .1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = idx % 2 ? PINK : BLUE; ctx.globalAlpha = .55 * (1 - f / .1); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // RGB-split glitch on a few cuts
  if ([3, 7, 9, 15, 17].includes(idx) && f < .2) { const d = 18 * (1 - f / .2); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5; ctx.drawImage(ctx.canvas, d, 0); ctx.drawImage(ctx.canvas, -d, 0); ctx.restore(); }
  // —— titles, locked to the narration ——
  for (const [l0, f0, l1, f1, ar, en, x, y, o] of TITLES) {
    const str = LANG === 'en' ? en : ar, o2 = { ...o, dir: o.dir || (LANG === 'en' ? 'ltr' : 'rtl') };
    if (o.chip) chip(ctx, t, at(l0, f0), at(l1, f1), str, x, y, o.color); else title(ctx, t, at(l0, f0), at(l1, f1), str, x, y, o2);
  }
  // credit the fan artist whose graphic appears
  if (['tease', 'night1', 'night2', 'star', 'rival'].includes(c.id)) {
    ctx.save(); ctx.font = '600 24px Cairo'; ctx.textAlign = 'left'; ctx.direction = 'ltr'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8;
    ctx.fillText('Graphic: @aragaogfx', 40, 1880); ctx.restore();
  }
  if (!opt.nosubs) caption(ctx, t);
  TX = null;
}

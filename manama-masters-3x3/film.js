// "فايس سيتي… بس في الـNBA" — 1080×1920, 30 fps. The user's footage and photos, cut on the narration,
// with Ruqaa calligraphy titles (Aref Ruqaa), Arabic captions (Tajawal) and flash/glitch cuts. One timeline: edit.json + VO below.
export const W = 1080, H = 1920;
export let VO = [];
let IDS = [];
// [line, frac start, line, frac end, Arabic, English, x, y, options]
const GOLD = '#F6C34A', RED = '#E5252A';
const TITLES = [
  ['l1', .03, 'l1', 1, 'لا تفوّت!', '', 540, 500, { px: 210, color: GOLD }],
  ['l1', .4, 'l1', 1, 'مُجمّع الأفنيوز', '', 540, 720, { px: 130, color: RED, fill: '#fff' }],
  ['l2', .05, 'l2', 1, 'اليوم وباجر', '', 540, 520, { px: 200, color: GOLD }],
  ['l2', .45, 'l2', 1, 'حدث عالمي في المملكة', '', 540, 720, { px: 96, color: RED, fill: '#fff' }],
  ['l3', .05, 'l3', 1, 'المنامة ماسترز', '', 540, 470, { px: 170, color: GOLD }],
  ['l3', .3, 'l3', 1, '3x3', '', 540, 680, { px: 210, color: RED, fill: '#fff', dir: 'ltr', font: '700 210px ReemKufi' }],
  ['l4', .05, 'l4', 1, 'حدث عائلي', '', 540, 480, { px: 190, color: GOLD }],
  ['l4', .35, 'l4', 1, 'من الطراز الأول', '', 540, 680, { px: 110, color: RED, fill: '#fff' }],
  ['l5', .05, 'l5', 1, 'Fan Zone', '', 540, 470, { px: 160, color: GOLD, dir: 'ltr', font: '700 160px ReemKufi' }],
  ['l5', .35, 'l5', 1, 'للعيال', '', 540, 1000, { chip: 1, color: GOLD }],
  ['l5', .62, 'l5', 1, 'وللشباب بعد', '', 540, 1160, { chip: 1, color: RED }],
  ['l6', .05, 'l6', 1, 'مطاعم تناسب الكل', '', 540, 520, { px: 140, color: GOLD }],
  ['l7', .05, 'l7', 1, 'مباريات استثنائية', '', 540, 500, { px: 140, color: GOLD }],
  ['l8', .02, 'l8', 1, 'مسابقة الدانك', '', 540, 900, { chip: 1, color: GOLD }],
  ['l8', .33, 'l8', 1, 'مسابقة الثلاثيات', '', 540, 1060, { chip: 1, color: RED }],
  ['l8', .66, 'l8', 1, 'المباريات النهائية', '', 540, 1220, { chip: 1, color: GOLD }],
  ['l9', .05, 'l9', 1, 'تعال وعيش الأجواء', '', 540, 520, { px: 140, color: GOLD }],
  ['l10', .02, 'l10', 1, 'مُجمّع الأفنيوز', '', 540, 330, { px: 160, color: GOLD }],
  ['l10', .3, 'l10', 1, 'اليوم وباجر', '', 540, 520, { px: 140, color: RED, fill: '#fff' }],
];
const PINK = '#F6C34A', BLUE = '#E5252A', WHITE = '#ffffff';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), eo = t => 1 - Math.pow(1 - clamp(t), 3), eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
let E, LINES, DURS, LANG = 'ar', IS_EN = false, SPAN = {}, DUR = 0;
const GAP = .3;
export function setup(edit, lines, durs, lang = 'ar') {
  E = edit; LINES = Object.fromEntries(lines.map(l => [l.id, l.text])); DURS = durs; LANG = lang; IS_EN = lang === 'en' || lang === 'elen';
  IDS = lines.map(l => l.id); let t = .3; VO = [];
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
  const px = o.px || 120, font = o.font || `700 ${px}px Ruqaa`;
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
  ctx.font = '800 64px Tajawal'; ctx.direction = IS_EN ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
  return VO.map((v, i) => { const nx = VO[i + 1] ? VO[i + 1].t - .05 : DUR - .3; return { id: v.id, t0: v.t, t1: Math.min(nx, Math.max(v.t + (DURS[v.id] ?? 3) + .5, v.t + 1.8)), text: LINES[v.id] }; });
}
function caption(ctx, t) {
  const c = cues().find(q => t >= q.t0 && t < q.t1); if (!c || c.id === 'l10') return;
  const a = Math.min(seg(t, c.t0, c.t0 + .15), 1 - seg(t, c.t1 - .15, c.t1));
  const font = '800 50px Tajawal', lines = wrap(ctx, c.text, font, 900).map(l => l.replace(/\u00a0/g, ' ')), lh = 70, y0 = 1560 - (lines.length - 1) * lh / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.font = font; ctx.direction = IS_EN ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
    const str = IS_EN ? en : ar, o2 = { ...o, dir: o.dir || (IS_EN ? 'ltr' : 'rtl') };
    if (o.chip) chip(ctx, t, at(l0, f0), at(l1, f1), str, x, y, o.color); else title(ctx, t, at(l0, f0), at(l1, f1), str, x, y, o2);
  }
  if (!opt.nosubs) caption(ctx, t);
  TX = null;
}

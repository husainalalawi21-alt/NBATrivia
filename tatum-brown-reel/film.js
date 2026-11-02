// "Tatum's Regret" — a vertical news reel in Swiss Motion Graphics: 1080×1920, 24 fps, 32.5 s, 120 BPM.
// Paper, ink, greys and ONE signal colour (green). Everything snaps on the beat with one ease; entrances are clip-reveals,
// deletions are knife cuts, transitions are page pans and wipes. One timeline drives picture, captions and sound.
export const W = 1080, H = 1920, DUR = 32.5, BEAT = 0.5;
const C = { page: '#EFEDE6', paper: '#FFFFFF', ink: '#111111', g1: '#D9D6CE', g2: '#BDB9AF', g3: '#8C887E', sig: '#00873E' };
const FONT = (w, px) => `${w} ${px}px Archivo`;
const M = 72, GUT = 24, COLW = (W - 2 * M - 5 * GUT) / 6;
const col = i => M + i * (COLW + GUT);

// ------------------------------------------------------------------ timeline
export const SECS = [
  { id: 'hook', t0: 0.0, t1: 4.0 }, { id: 'trade', t0: 4.0, t1: 8.0 }, { id: 'behind', t0: 8.0, t1: 15.0 },
  { id: 'public', t0: 15.0, t1: 18.0 }, { id: 'regret', t0: 18.0, t1: 24.0 }, { id: 'title', t0: 24.0, t1: 28.75 },
  { id: 'ask', t0: 28.75, t1: 32.5 },
];
export const VO = [
  { id: 'l1', t: 0.3, sub: 'Jayson Tatum has one regret about Jaylen Brown.' },
  { id: 'l2', t: 4.2, sub: "For years, Brown's name kept showing up in trade talks." },
  { id: 'l3', t: 8.2, sub: 'Behind the scenes, people close to Tatum say he told the Celtics this team was better with Brown on it.' },
  { id: 'l4', t: 15.2, sub: "But publicly, he wasn't as vocal." },
  { id: 'l5', t: 18.2, sub: 'And one reporter says Tatum told him he regretted that, back in 2024.' },
  { id: 'l6', t: 24.1, sub: 'The same year they won a title together, with Brown as Finals MVP.' },
  { id: 'l7', t: 28.9, sub: 'So, should Tatum have spoken up sooner?' },
];
let DURS = {};
export function setup(d) { DURS = d || {}; buildEvents(); }
const vd = id => DURS[id] ?? 2.5;
export function cues() {
  return VO.map((v, i) => { const nx = VO[i + 1] ? VO[i + 1].t - 0.05 : DUR; return { t0: v.t, t1: Math.min(nx, Math.max(v.t + vd(v.id) + 0.6, v.t + 1.8)), text: v.sub }; });
}

// ------------------------------------------------------------------ motion: one ease, snaps land on the beat
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
function bez(x) { // cubic-bezier(.7,0,.2,1)
  let lo = 0, hi = 1, u = x;
  for (let i = 0; i < 24; i++) { u = (lo + hi) / 2; const bx = 3 * (1 - u) * (1 - u) * u * .7 + 3 * (1 - u) * u * u * .2 + u * u * u; if (bx < x) lo = u; else hi = u; }
  return 3 * (1 - u) * u * u + u * u * u;
}
const snap = (t, land, dur = 0.25) => bez(clamp((t - (land - dur)) / dur));
const steps = (t, land, n = 4, dur = 0.5) => { const k = clamp((t - (land - dur)) / dur); return Math.floor(k * n + 1e-6) / n; };

// ------------------------------------------------------------------ text registry for readcheck
let TX = null, OFF = [0, 0];
function reg(id, str, x0, y0, x1, y1) { if (TX) TX.push({ id, text: str, x0: x0 + OFF[0], y0: y0 + OFF[1], x1: x1 + OFF[0], y1: y1 + OFF[1] }); }

// clip-reveal: the line rises out of a clip box from below its baseline
function rise(ctx, str, x, y, w, px, color, t, land, o = {}) {
  const k = snap(t, land, o.dur ?? 0.25), out = o.out != null ? snap(t, o.out, 0.25) : 0;
  if (k <= 0 || out >= 1) return;
  const mw = W - x - M; for (let i = 0; i < 20 && measure(ctx, str, w, px) > mw; i++) px *= 0.95;
  ctx.save(); ctx.font = FONT(w, px); if (px >= 90) ctx.letterSpacing = `${-px * 0.025}px`;
  const tw = ctx.measureText(str).width, asc = px * 0.82, desc = px * 0.24;
  ctx.beginPath(); ctx.rect(x - 10, y - asc - 6, tw + 40, asc + desc + 12); ctx.clip();
  ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y + (1 - k) * (asc + desc + 12) - out * (asc + desc + 12));
  ctx.restore();
  if (k >= 1 && out <= 0) reg(o.id || str, str, x, y - asc, x + tw, y + desc);
}
function measure(ctx, str, w, px) { ctx.save(); ctx.font = FONT(w, px); if (px >= 90) ctx.letterSpacing = `${-px * 0.025}px`; const m = ctx.measureText(str).width; ctx.restore(); return m; }
function wrap(ctx, str, w, px, maxW) {
  const words = str.split(' '), lines = []; let cur = '';
  for (const wd of words) { const tt = cur ? cur + ' ' + wd : wd; if (measure(ctx, tt, w, px) <= maxW || !cur) cur = tt; else { lines.push(cur); cur = wd; } }
  if (cur) lines.push(cur); return lines;
}
// a rule that grows along its length (linear), with a small note above
function rule(ctx, x, y, len, t, t0, d = 0.3, color = C.ink, wid = 2) {
  const k = clamp((t - t0) / d); if (k <= 0) return;
  ctx.fillStyle = color; ctx.fillRect(x, y, len * k, wid);
}
function note(ctx, str, x, y, t, t0, color = C.g3, id) {
  const k = snap(t, t0, 0.25); if (k <= 0) return;
  ctx.save(); ctx.font = FONT(600, 24); ctx.letterSpacing = '3px'; ctx.fillStyle = color;
  ctx.beginPath(); ctx.rect(x - 4, y - 26, 900, 36); ctx.clip(); ctx.fillText(str, x, y + (1 - k) * 36); ctx.restore();
  if (k >= 1) reg(id || str, str, x, y - 22, x + measure(ctx, str, 600, 24) + str.length * 3, y + 6);
}
function grid(ctx, t, t0, alpha = 1) {
  const k = clamp((t - t0) / 0.5); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = C.g1;
  for (let i = 0; i <= 6; i++) { const x = i < 6 ? col(i) : W - M; ctx.fillRect(x, 0, 1, H * k); }
  for (let y = 240; y < H; y += 240) ctx.fillRect(0, y, W * k, 1);
  ctx.restore();
}
// giant numeral that climbs into place one module at a time
function numeral(ctx, str, x, base, px, color, t, land, id) {
  const k = steps(t, land, 4, 0.5); if (k <= 0) return;
  ctx.save(); ctx.font = FONT(900, px); ctx.letterSpacing = `${-px * 0.04}px`;
  const tw = ctx.measureText(str).width, asc = px * 0.74;
  ctx.beginPath(); ctx.rect(x - 20, base - asc - 10, tw + 60, asc + 20); ctx.clip();
  ctx.fillStyle = color; ctx.fillText(str, x, base + (1 - k) * (asc + 20)); ctx.restore();
  if (k >= 1) reg(id || str, str, x, base - asc, x + tw, base);
}
// knife cut: a thin line crosses the box, then the box collapses to its midline. returns scaleY (1 → 0)
function knife(ctx, t, t0, x0, x1, y) {
  const a = clamp((t - t0) / 0.18); if (a <= 0) return 1;
  if (a < 1) { ctx.fillStyle = C.sig; ctx.fillRect(x0, y - 2, (x1 - x0) * a, 4); }
  return 1 - bez(clamp((t - t0 - 0.18) / 0.2));
}

// ------------------------------------------------------------------ SHOTS
function sHook(ctx, t) {
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  grid(ctx, t, 0.0, 0.8);
  rule(ctx, M, 236, W - 2 * M, t, 0.0, 0.4);
  note(ctx, 'REPORT · BOSTON', M, 280, t, 0.25);
  note(ctx, '01 / 07', col(5), 280, t, 0.25, C.g3, 'idx1');
  rise(ctx, 'Jayson', M, 560, 900, 200, C.ink, t, 0.25);
  rise(ctx, 'Tatum', M, 760, 900, 200, C.ink, t, 0.5);
  rise(ctx, 'has one', M, 920, 800, 120, C.ink, t, 1.25);
  rise(ctx, 'regret.', M, 1150, 900, 240, C.sig, t, 1.75);
  rise(ctx, 'about Jaylen Brown.', M, 1270, 700, 66, C.ink, t, 2.5);
}
function sTrade(ctx, t) {
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  grid(ctx, t, 4.0, 0.7);
  rule(ctx, M, 236, W - 2 * M, t, 4.0, 0.3);
  note(ctx, 'TRADE TALKS', M, 280, t, 4.25, C.ink);
  note(ctx, '02 / 07', col(5), 280, t, 4.25, C.g3, 'idx2');
  note(ctx, 'TATUM · NO. 0', M, 400, t, 4.25);
  note(ctx, 'BROWN · NO. 7', col(3), 400, t, 4.5);
  // the knife comes for the 7 again and again, and never cuts
  const passes = [5.0, 5.5, 6.0, 6.5, 7.0];
  numeral(ctx, '0', M - 14, 1060, 640, C.ink, t, 4.5, 'n0');
  ctx.save();
  const nudge = passes.reduce((a, p) => a + (t > p && t < p + 0.25 ? Math.sin((t - p) / 0.25 * Math.PI) * 10 : 0), 0);
  ctx.translate(nudge, 0); numeral(ctx, '7', col(3) - 14, 1060, 640, C.sig, t, 5.0, 'n7'); ctx.restore();
  passes.forEach((p, i) => {
    const y = 500 + i * 110, a = clamp((t - p) / 0.22), b = clamp((t - p - 0.22) / 0.25);
    if (a > 0 && b < 1) { ctx.fillStyle = C.ink; const x1 = W - M, x0 = lerp(x1, col(3) - 30, a); ctx.fillRect(lerp(x0, x1, bez(b)), y, x1 - lerp(x0, x1, bez(b)), 3); }
  });
  // the rumour log: one grey row per beat
  passes.forEach((p, i) => rise(ctx, 'TRADE TALK', col(3), 1180 + i * 46, 700, 38, C.g2, t, p + 0.25, { id: 'tt' + i, dur: 0.2 }));
}
function sBehind(ctx, t) {
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  grid(ctx, t, 8.0, 0.5);
  rule(ctx, M, 236, W - 2 * M, t, 8.0, 0.3);
  note(ctx, 'BEHIND THE SCENES', M, 280, t, 8.25, C.sig, 'bts');
  note(ctx, '03 / 07', col(5), 280, t, 8.25, C.g3, 'idx3');
  note(ctx, 'WHAT PEOPLE CLOSE TO TATUM SAY', M, 420, t, 9.0, C.g3, 'who');
  note(ctx, 'HE TOLD THE CELTICS:', M, 456, t, 9.25, C.g3, 'told');
  const sy = OFF_COLLAPSE;   // collapsed by the knife in the next shot
  ctx.save(); ctx.translate(0, 800); ctx.scale(1, sy); ctx.translate(0, -800);
  [['This team', 10.5], ['was better', 11.5], ['with Brown', 12.5], ['on it.', 13.5]].forEach(([s, l], i) =>
    rise(ctx, s, M, 640 + i * 150, 800, 150, i === 2 ? C.sig : C.g3, t, l, { id: 'q' + i }));
  ctx.restore();
  // the two modules, joined
  const k = snap(t, 9.5, 0.3);
  if (k > 0 && sy > 0.5) {
    const Y = 990;
    ctx.fillStyle = C.ink; ctx.fillRect(col(4), Y, COLW, COLW);
    ctx.fillStyle = C.sig; ctx.fillRect(col(5), Y, COLW, COLW);
    ctx.fillStyle = C.ink; ctx.fillRect(col(4) + COLW, Y + COLW / 2 - 2, GUT * k, 4);
    ctx.font = FONT(900, 92); ctx.fillStyle = C.paper; ctx.fillText('0', col(4) + 38, Y + 104); ctx.fillText('7', col(5) + 40, Y + 104);
  }
}
let OFF_COLLAPSE = 1;
function sPublic(ctx, t) {
  // the knife deletes what was said behind the scenes
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  const ka = clamp((t - 15.0) / 0.18), sy = 1 - bez(clamp((t - 15.18) / 0.2));
  if (sy > 0 && t < 15.4) { const T0 = TX; TX = null; OFF_COLLAPSE = sy; sBehind(ctx, 14.99); OFF_COLLAPSE = 1; TX = T0; }
  if (ka > 0 && ka < 1) { ctx.fillStyle = C.sig; ctx.fillRect(M, 798, (W - 2 * M) * ka, 4); }
  if (t < 15.4) return;
  grid(ctx, t, 15.4, 0.5);
  rule(ctx, M, 236, W - 2 * M, t, 15.4, 0.3);
  note(ctx, 'PUBLICLY', M, 280, t, 15.5, C.ink, 'pub');
  note(ctx, '04 / 07', col(5), 280, t, 15.5, C.g3, 'idx4');
  // giant empty quotation marks: nothing said between them; the cursor blinks, the one unsnapped thing
  rise(ctx, '“', M - 10, 980, 900, 520, C.ink, t, 15.75, { id: 'oq' });
  rise(ctx, '”', col(4), 980, 900, 520, C.ink, t, 16.0, { id: 'cq' });
  if (t > 16.1 && Math.floor((t - 16.1) * 2.4) % 2 === 0) { ctx.fillStyle = C.sig; ctx.fillRect(col(2) + 40, 700, 10, 220); }
  rise(ctx, 'not as vocal.', M, 1160, 800, 110, C.ink, t, 16.5, { id: 'vocal' });
}
function sRegret(ctx, t) {
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  grid(ctx, t, 18.0, 0.5);
  rule(ctx, M, 236, W - 2 * M, t, 18.0, 0.3);
  note(ctx, 'THE REGRET', M, 280, t, 18.25, C.sig, 'reg');
  note(ctx, '05 / 07', col(5), 280, t, 18.25, C.g3, 'idx5');
  numeral(ctx, '2024', M - 18, 700, 340, C.ink, t, 18.75, 'y2024');
  // the quote, as the reporter gave it
  rule(ctx, M, 800, W - 2 * M, t, 19.0, 0.3, C.sig, 6);
  const lines = ['“He did tell me', 'he regretted that', 'back in 2024.”'];
  lines.forEach((s, i) => rise(ctx, s, M, 920 + i * 90, 700, 76, C.ink, t, 19.25, { id: 'rq' + i }));
  note(ctx, '— AN NBA REPORTER, ON TATUM', M, 1230, t, 19.75, C.g3, 'attr');
}
function sTitle(ctx, t) {
  // signal block wipes down over the last page, then the paper rises back to the block's edge
  if (t < 24.3) { const T0 = TX; TX = null; sRegret(ctx, 23.99); TX = T0; ctx.fillStyle = C.sig; ctx.fillRect(0, 0, W, H * snap(t, 24.3, 0.3)); }
  else { ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C.sig; ctx.fillRect(0, 0, W, lerp(H, 860, snap(t, 24.6, 0.3))); }
  if (t < 24.3) return;
  note(ctx, '06 / 07', col(5), 280, t, 24.5, C.ink, 'idx6');
  note(ctx, '2024', M, 280, t, 24.5, C.ink, 'yr');
  rise(ctx, 'Champions', M, 620, 900, 190, C.ink, t, 24.75, { id: 'champ' });
  rise(ctx, 'together.', M, 790, 900, 150, C.paper, t, 25.25, { id: 'tog' });
  // the two numerals, side by side on the paper
  numeral(ctx, '0', M - 10, 1290, 380, C.ink, t, 25.75, 'm0');
  numeral(ctx, '7', col(3) - 10, 1290, 380, C.sig, t, 26.0, 'm7');
  note(ctx, 'TATUM', M, 1340, t, 26.0, C.g3, 'lt');
  note(ctx, 'BROWN · FINALS MVP', col(3), 1340, t, 26.5, C.sig, 'lb');
}
function sAsk(ctx, t) {
  ctx.fillStyle = C.page; ctx.fillRect(0, 0, W, H);
  grid(ctx, t, 28.75, 0.5);
  rule(ctx, M, 236, W - 2 * M, t, 28.75, 0.3);
  note(ctx, 'YOUR CALL', M, 280, t, 29.0, C.ink, 'call');
  note(ctx, '07 / 07', col(5), 280, t, 29.0, C.g3, 'idx7');
  rise(ctx, 'Should he', M, 640, 900, 170, C.ink, t, 29.25);
  rise(ctx, 'have spoken', M, 820, 900, 170, C.ink, t, 29.5);
  rise(ctx, 'up sooner?', M, 1000, 900, 170, C.sig, t, 30.0);
  rule(ctx, M, 1090, 400, t, 30.5, 0.3, C.ink, 3);
  note(ctx, 'TELL US IN THE COMMENTS', M, 1140, t, 30.75, C.ink, 'cta');
}

// ------------------------------------------------------------------ captions: part of the layout, flush left on column 1
function caption(ctx, t) {
  const c = cues().find(q => t >= q.t0 && t < q.t1); if (!c) return;
  const px = 56, lines = wrap(ctx, c.text, 700, px, W - 2 * M), lh = px * 1.22;
  const y0 = 1580 - (lines.length - 1) * lh / 2;
  const k = snap(t, c.t0 + 0.2, 0.2), out = snap(t, c.t1, 0.15);
  ctx.save();
  ctx.fillStyle = C.ink; ctx.fillRect(M, y0 - px - 30, (W - 2 * M) * k * (1 - out), 2);
  lines.forEach((s, i) => {
    ctx.save(); ctx.font = FONT(700, px); ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.rect(M - 4, y0 + i * lh - px, W, lh + 4); ctx.clip();
    ctx.fillText(s, M, y0 + i * lh + (1 - k) * lh - out * lh); ctx.restore();
  });
  ctx.restore();
}

// ------------------------------------------------------------------ frame + transitions
const SCN = { hook: sHook, trade: sTrade, behind: sBehind, public: sPublic, regret: sRegret, title: sTitle, ask: sAsk };
const sec = t => SECS.find(s => t >= s.t0 && t < s.t1) || SECS[SECS.length - 1];
function draw(ctx, id, t, dx = 0, dy = 0) { ctx.save(); ctx.translate(dx, dy); OFF = [dx, dy]; SCN[id](ctx, t); ctx.restore(); OFF = [0, 0]; }
// page pans land on each section's first beat: [type, duration]
const TRANS = { trade: ['up', 0.3], behind: ['left', 0.3], regret: ['up', 0.3], ask: ['left', 0.3] };
export function renderFilm(ctx, t, Q, texts) {
  TX = texts || null;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = sec(t), i = SECS.indexOf(s), pv = SECS[i - 1], tr = TRANS[s.id];
  if (tr && pv && t < s.t0 + 0.02) {
    // never reached: pans are drawn in the previous section's last 0.3 s (they land ON the beat)
  }
  const nx = SECS[i + 1], ntr = nx && TRANS[nx.id];
  if (ntr && t >= nx.t0 - ntr[1]) {
    const k = bez(clamp((t - (nx.t0 - ntr[1])) / ntr[1]));
    const T0 = TX; TX = null;
    if (ntr[0] === 'up') { draw(ctx, s.id, t, 0, -H * k); draw(ctx, nx.id, nx.t0, 0, H * (1 - k)); }
    else { draw(ctx, s.id, t, -W * k, 0); draw(ctx, nx.id, nx.t0, W * (1 - k), 0); }
    TX = T0;
  } else draw(ctx, s.id, t);
  if (!(Q && Q.has('nosubs'))) caption(ctx, t);
  TX = null;
}

// ------------------------------------------------------------------ sound events (same times as the picture)
let EVS = [];
export const events = () => EVS;
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(4), type, ...o });
function buildEvents() {
  EVS = [];
  VO.forEach(v => ev(v.t, 'vo', { id: v.id }));
  [0.25, 0.5, 1.25, 2.5].forEach(x => ev(x, 'clack')); ev(1.75, 'thunk');
  ev(3.7, 'slide'); ev(4.5, 'thunk'); ev(5.0, 'thunk', { pitch: 2 });
  [5.0, 5.5, 6.0, 6.5, 7.0].forEach((p, i) => { ev(p, 'knife_miss', { n: i }); ev(p + 0.25, 'type', { gain: 0.5 }); });
  ev(7.7, 'slide'); [10.5, 11.5, 12.5, 13.5].forEach(x => ev(x, 'clack', { gain: 0.7 })); ev(9.5, 'snap');
  ev(15.0, 'knife'); ev(15.2, 'collapse'); ev(15.75, 'thunk', { pitch: -3 }); ev(16.0, 'thunk', { pitch: -3 }); ev(16.5, 'clack');
  ev(17.7, 'slide'); ev(18.75, 'thunk', { pitch: -1 }); ev(19.0, 'pen'); ev(19.25, 'stamp');
  ev(24.25, 'wipe'); ev(24.75, 'clack'); ev(25.25, 'clack'); ev(25.75, 'thunk'); ev(26.0, 'thunk', { pitch: 2 });
  ev(28.45, 'slide'); [29.25, 29.5, 30.0].forEach(x => ev(x, 'clack')); ev(30.5, 'pen');
  EVS.sort((a, b) => a.t - b.t);
}

// "The NBA Game That Ended 19–18" — Mid-century Cartoon, 1080×1920, 24 fps, 30.0 s, 120 BPM.
// One timeline drives picture, subtitles and sound events.
import { PAL, setClock, shape, ink, plane, ellipse, spline, rrect, rect, xform, move, text, measure, fit, star, sparkle, rays, dashed, arrow,
  paperFinish, clamp, lerp, seg, ss, eo, eio, back, twos, hash, TAU, subpath, REG } from './engine/toon.js';
import { COL, drawFox, drawPlayer, drawBall, drawScoreboard, drawClockFace, drawShotClock, foxRest } from './engine/cast.js';

export const W = 1080, H = 1920, DUR = 30.0, BEAT = 0.5;

// ------------------------------------------------------------------ timeline
export const SECS = [
  { id: 'hook', t0: 0.0, t1: 4.5 },
  { id: 'fifty', t0: 4.5, t1: 10.0 },
  { id: 'stall', t0: 10.0, t1: 14.75 },
  { id: 'mikan', t0: 14.75, t1: 17.5 },
  { id: 'shot', t0: 17.5, t1: 21.0 },
  { id: 'final', t0: 21.0, t1: 22.5 },
  { id: 'clock', t0: 22.5, t1: 30.0 },
];
// voice lines: start times (s). Durations come from voices/dur.json.
export const VO = [
  { id: 'l1', t: 0.4, sub: 'Nineteen to eighteen. A real NBA final score.' },
  { id: 'l2', t: 4.6, sub: 'In 1950, there was no shot clock.' },
  { id: 'l3', t: 7.9, sub: 'A team could hold the ball forever.' },
  { id: 'l4', t: 10.4, sub: "Fort Wayne faced George Mikan's Lakers, and just held it." },
  { id: 'l5', t: 14.8, sub: 'Mikan still scored 15 of their 18.' },
  { id: 'l6', t: 17.75, sub: 'Then, in the last seconds…' },
  { id: 'l7', t: 21.0, sub: 'And Fort Wayne won it.' },
  { id: 'l8', t: 22.85, sub: 'Four years later: the 24-second shot clock.' },
  { id: 'l9', t: 26.6, sub: 'Still the lowest-scoring game in NBA history.' },
];
VO[0].sub = '19–18. A real NBA final score.';
export const HIT = {
  n19: 0.5, n18: 1.0, kicker: 0.8, slab: 1.5, point: 1.0, medal: 4.0, iris1: 4.5,
  header: 5.0, noTime: 7.7,
  dribble: 10.0, clutch: 10.35, callout: 10.3, iris2: 12.5, stallTag: 12.4, passes: [12.9, 13.25, 13.6, 13.95, 14.3],
  split: 14.75, n15: 15.15, n3: 15.7,
  wipe5: 17.5, tag5: 17.8, launch: 19.5, hush0: 20.0, swish: 20.5, cut: 21.0,
  wipe6: 22.5, clockUp: 23.0, t1954: 23.25, record: 26.6, iris3: 29.3,
};
let DURS = {};
export function setup(durs) { DURS = durs || {}; buildEvents(); }
const vdur = id => DURS[id] ?? 2.5;
export function srtCues() {
  return VO.map((v, i) => {
    const nx = VO[i + 1] ? VO[i + 1].t - 0.05 : DUR;
    return { t0: v.t, t1: Math.min(nx, Math.max(v.t + vdur(v.id) + 0.6, v.t + 1.8)), text: v.sub };
  });
}
function talking(t) { return VO.some(v => t >= v.t && t < v.t + vdur(v.id)); }
const pop = (t, t0, d = 0.28) => back(seg(t, t0, t0 + d), 1.9);
// keyframes [[t, [x,y]]...] eased between, sampled on twos (limited animation)
function kf(t, K) {
  t = twos(t);
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const u = eio((t - K[i - 1][0]) / (K[i][0] - K[i - 1][0])); return K[i - 1][1].map((v, j) => lerp(v, K[i][1][j], u)); }
  return K[K.length - 1][1];
}
const mouthAt = t => talking(t) ? (hash(Math.floor(t * 12), 3) > 0.35 ? 0.4 + hash(Math.floor(t * 12), 4) * 0.6 : 0) : 0;
const blinkAt = (t, ts) => ts.some(b => t > b && t < b + 0.13) ? 1 : 0;

// ------------------------------------------------------------------ text registry (for readcheck)
let TX = null;
function reg_(id, str, x0, y0, x1, y1) { if (TX) TX.push({ id, text: str, x0, y0, x1, y1 }); }
let CAM = { cx: W / 2, cy: H / 2, z: 1, r: 0 };
function camApply(ctx, c) { CAM = c; ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.rotate(c.r || 0); ctx.translate(-c.cx, -c.cy); }
const w2s = (x, y, c = CAM) => { const dx = x - c.cx, dy = y - c.cy, co = Math.cos(c.r || 0), si = Math.sin(c.r || 0); return [W / 2 + c.z * (co * dx - si * dy), H / 2 + c.z * (si * dx + co * dy)]; };
// register a text by its world box through the camera
function regW(id, str, x0, y0, x1, y1) { const a = w2s(x0, y0), b = w2s(x1, y1); reg_(id, str, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])); }

function bg(ctx, wall, floorCol, fy) {
  ctx.fillStyle = wall; ctx.fillRect(-3000, -3000, 7080, 7920);
  if (floorCol) { plane(ctx, rect(-3000, fy, 7080, 4000), floorCol); ink(ctx, [[-60, fy], [380, fy]], 4, { seed: 801, taper: false }); ink(ctx, [[440, fy + 1], [W + 60, fy]], 4, { seed: 802, taper: false }); }
}
function tag(ctx, t, t0, str, cx, cy, o = {}) {
  const k = pop(t, t0); if (k <= 0) return;
  const px = o.px || 46, font = `600 ${px}px Jost`;
  const w = measure(ctx, str, font, 2) + 104, h = px + 40, X = cx - w / 2, Y = cy - h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
  shape(ctx, rrect(X, Y, w, h, 16), { fill: COL.paper, line: 3.8, seed: 710 + (o.seed || 0), grain: 0.15, off: [6, 5] });
  star(ctx, X + 36, cy, 17, { n: 8, inner: 0.42, fill: o.accent || COL.red, off: [0, 0], rot: t * 0.6 });
  text(ctx, str, X + 66, cy + px * 0.35, { font, fill: COL.ink, track: 2 });
  ctx.restore();
  if (k >= 0.999) regW(o.id || str, str, X, Y, X + w, Y + h);
}

// ------------------------------------------------------------------ fox poses (one rig, every shot)
function foxPoseHook(t) {
  return {
    hB: kf(t, [[0.7, foxRest('B')], [0.9, [70, -150]], [1.1, [150, -390]], [1.3, [138, -372]], [4.5, [138, -372]]]),
    handB: t > 0.95 ? 'point' : 'open',
    hF: [-40, -170], handF: 'flat',
    blink: blinkAt(t, [2.2, 3.9]), mouth: mouthAt(t), tail: twos(t) * 0.5, look: [4, -3],
  };
}
// ------------------------------------------------------------------ SHOT 1 · HOOK: the scoreboard nobody believes
const SB1 = { x: 690, y: 860, s: 0.78 };
const FOX1 = { x: 250, y: 1390, s: 1.08 };
function sceneHook(ctx, t) {
  const c = { cx: 540, cy: 900, z: lerp(1.0, 1.04, ss(t / 4.5)), r: 0 };
  ctx.save(); camApply(ctx, c);
  bg(ctx, COL.plum, COL.plumD, FOX1.y);
  rays(ctx, SB1.x, SB1.y, 30, 1400, COL.plumL, { rot: twos(t) * 0.05, alpha: 0.5 });
  drawScoreboard(ctx, SB1.x, SB1.y, SB1.s, { k1: pop(t, HIT.n19), k2: pop(t, HIT.n18) });
  regW('sb-l', 'FORT WAYNE', SB1.x - 230, SB1.y - 125, SB1.x - 5, SB1.y - 60); regW('sb-r', 'MINNEAPOLIS', SB1.x + 5, SB1.y - 125, SB1.x + 240, SB1.y - 60);
  title(ctx, t);
  drawFox(ctx, FOX1.x, FOX1.y, FOX1.s, foxPoseHook(t), 1);
  if (t > 3.0) medal(ctx, t, HIT.medal, SB1.x, SB1.y + 30, '1950');
  ctx.restore();
}
function title(ctx, t) {
  const u = seg(t, HIT.kicker, HIT.kicker + 0.55);
  if (u > 0) {
    const f = fit(ctx, 'The NBA Game That Ended', '700 {px}px Oleo', 96, 940, 1, 60);
    const wd = measure(ctx, f.lines[0], f.font);
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2 - wd / 2 - 20, 150, (wd + 60) * u, 160); ctx.clip();
    text(ctx, f.lines[0], W / 2, 270, { font: f.font, fill: COL.paper, align: 'center', plate: COL.ink, off: [5, 5] });
    ctx.restore();
    if (u >= 1) regW('kicker', f.lines[0], W / 2 - wd / 2, 190, W / 2 + wd / 2, 290);
  }
  const k = pop(t, HIT.slab, 0.3);
  if (k > 0) {
    ctx.save(); ctx.translate(W / 2, 430); ctx.scale(k, k); ctx.rotate((1 - k) * -0.2);
    text(ctx, '19–18', 0, 80, { font: '230px Slab', fill: COL.fw, align: 'center', plate: COL.ink, off: [8, 7] });
    ctx.restore();
    if (k >= 0.999) regW('slab', '19–18', W / 2 - 330, 340, W / 2 + 330, 520);
  }
}
// the year medallion stamps onto the scoreboard one beat before the cut; the camera goes through it
function medal(ctx, t, t0, x, y, str, r = 150) {
  const k = pop(t, t0, 0.24); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - k) * 0.4);
  star(ctx, 0, 0, r * 1.22, { n: 18, inner: 0.84, fill: COL.paper, off: [0, 0], rot: 0.1 });
  shape(ctx, ellipse(0, 0, r, r, 64), { fill: COL.lime, line: 5, seed: 731, grain: 0.3 });
  text(ctx, str, 0, r * 0.22, { font: `${Math.round(r * 0.62)}px Slab`, fill: COL.ink, plate: COL.paper, off: [5, 5], align: 'center' });
  ctx.restore();
}

// ------------------------------------------------------------------ SHOT 2 · 1950: no shot clock
const FOX2 = { x: 450, y: 1400, s: 1.12 };
function sceneFifty(ctx, t) {
  ctx.save(); camApply(ctx, { cx: 540, cy: 960, z: lerp(1.0, 1.025, ss(seg(t, 5.0, 10))), r: 0 });
  bg(ctx, COL.limeL, COL.limeD, FOX2.y);
  sparkle(ctx, 140, 700, 36, { fill: COL.paper, rot: twos(t) * 0.4 }); sparkle(ctx, 960, 620, 28, { fill: COL.paper, rot: -twos(t) * 0.4 }); sparkle(ctx, 900, 1150, 22, { fill: COL.paper });
  // header: the medallion settles into the corner disc, the title slides in on twos
  const hk = eio(seg(t, 4.75, 5.1));
  const mx = lerp(540, 165, hk), my = lerp(960, 250, hk), mr = lerp(150, 105, hk);
  ctx.save(); ctx.translate(mx, my);
  star(ctx, 0, 0, mr * 1.22, { n: 18, inner: 0.84, fill: COL.paper, off: [0, 0], rot: 0.1 });
  shape(ctx, ellipse(0, 0, mr, mr, 64), { fill: COL.plum, line: 5, seed: 731, grain: 0.3 });
  text(ctx, '1950', 0, mr * 0.22, { font: `${Math.round(mr * 0.62)}px Slab`, fill: COL.paper, plate: COL.ink, off: [5, 5], align: 'center' });
  ctx.restore();
  if (hk >= 1) regW('1950', '1950', mx - mr, my - mr, mx + mr, my + mr);
  const sk = eo(seg(twos(t), HIT.header, HIT.header + 0.35));
  if (sk > 0) {
    ctx.save(); ctx.translate((1 - sk) * 700, 0);
    text(ctx, 'NO SHOT', 300, 238, { font: '96px Slab', fill: COL.ink, plate: COL.paper, off: [5, 5] });
    text(ctx, 'CLOCK', 300, 336, { font: '96px Slab', fill: COL.ink, plate: COL.paper, off: [5, 5] });
    ctx.restore();
    if (sk >= 1) regW('noclock', 'NO SHOT CLOCK', 300, 160, 980, 350);
  }
  // the empty clock: the hands just keep spinning (faster on "forever")
  const sp = t < 7.9 ? (t - 4.5) * 1.6 : (7.9 - 4.5) * 1.6 + (t - 7.9) * 7;
  const ang = twos(sp), bob = Math.sin(twos(t) * 3) * 4;
  const pose = {
    hF: [52, -232 + bob], hB: [200, -262 + bob], handF: 'grip', handB: 'grip',
    blink: blinkAt(t, [6.3, 9.1]), mouth: mouthAt(t), tail: twos(t) * 0.5, look: [3, 2],
    prop: c => drawClockFace(c, 132, -250 + bob, 86, ang, ang / 12),
  };
  drawFox(ctx, FOX2.x, FOX2.y, FOX2.s, pose, 1);
  text(ctx, '?', FOX2.x + 132 * FOX2.s, FOX2.y + (-250 + bob) * FOX2.s + 56, { font: '62px Slab', fill: COL.red, align: 'center', alpha: 0.9 });
  tag(ctx, t, HIT.noTime, 'NO TIME LIMIT', 540, 640, { id: 'notime', accent: COL.bow });
  ctx.restore();
}

// ------------------------------------------------------------------ SHOT 3 · the stall
const GUARD = { x: 300, y: 1370, s: 0.95 }, MIK = { x: 790, y: 1370, s: 1.32 };
function guardPose(t) {
  // one dribble, then the clutch
  const dr = seg(t, HIT.dribble, HIT.clutch), bounce = Math.sin(dr * Math.PI);
  const bx = lerp(80, 72, dr), by = dr < 1 ? lerp(-380, -60, bounce) : -380;
  const hold = t >= HIT.clutch;
  return {
    ball: [bx, by],
    o: {
      col: COL.fw, colD: COL.fwD, skin: COL.skinA, skinD: COL.skinAD, h: 1,
      hF: hold ? [104, by + 4] : [96, -360 + bounce * 40], hB: hold ? [44, by - 6] : [20, -330],
      handF: hold ? 'flat' : 'open', handB: hold ? 'flat' : 'open', blink: blinkAt(t, [11.6, 13.4]), look: [3, 0],
    },
  };
}
function mikanStall(t) {
  return {
    col: COL.mpls, colD: COL.mplsD, skin: COL.skinA, skinD: COL.skinAD, h: 1.04, num: '99', glasses: true,
    hF: [82, -300], hB: [-70, -300], handF: 'grip', handB: 'grip', frown: true,
    footTap: Math.floor(twos(t) * 4) % 2, blink: blinkAt(t, [10.9, 12.6, 14.0]), look: [-2, 1],
  };
}
function sceneStallSide(ctx, t) {
  ctx.save(); camApply(ctx, { cx: 540, cy: 960, z: lerp(1.0, 1.03, ss(seg(t, 10, 12))), r: 0 });
  bg(ctx, COL.sandL, COL.sandD, GUARD.y);
  // the wall clock keeps running
  drawClockFace(ctx, 930, 330, 70, twos(t) * 2.2, twos(t) * 0.18, { rim: COL.woodD });
  drawPlayer(ctx, MIK.x, MIK.y, MIK.s, mikanStall(t), -1);
  const g = guardPose(t);
  drawPlayer(ctx, GUARD.x, GUARD.y, GUARD.s, { ...g.o, prop: c => drawBall(c, g.ball[0], g.ball[1], 46, 0.3) }, 1);
  ctx.restore();
  return { ball: w2s(GUARD.x + g.ball[0] * GUARD.s, GUARD.y + g.ball[1] * GUARD.s) };
}
function callout(ctx, t, t0, cx, cy, r, inner, bgc, leader) {
  const k = back(seg(t, t0, t0 + 0.32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) { const a = Math.atan2(leader[1] - cy, leader[0] - cx); dashed(ctx, [[cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)], leader], 4, 14, 10, -t * 40, COL.ink, clamp(k)); shape(ctx, ellipse(leader[0], leader[1], 9, 9, 12), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 }); }
  shape(ctx, ellipse(cx, cy, R + 16, R + 16, 72), { fill: COL.paper, line: 4.5, seed: 720, grain: 0.15, breaks: 0.05 });
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = bgc; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  ctx.translate(cx, cy); ctx.scale(k, k); inner(ctx); ctx.restore();
  ink(ctx, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 721, breaks: 0.1 });
}
// the plan: five patient passes draw a five-point star, the pattern of the stall
const PP = [[250, 1150], [540, 1255], [830, 1150], [880, 800], [200, 800]];
const ORDER = [0, 2, 4, 1, 3, 0];
const LK = [[540, 470, 46, '99'], [425, 600, 34], [655, 600, 34], [395, 800, 34], [685, 800, 34]];
function scenePlan(ctx, t) {
  const u = ss(seg(t, HIT.iris2, HIT.iris2 + 1.3));
  ctx.save(); camApply(ctx, { cx: 540, cy: 820, z: lerp(1.28, 1.0, u), r: lerp(-0.28, 0, u) });
  bg(ctx, COL.sandL);
  // court (top view): 1950's narrow lane, no three-point line
  shape(ctx, rect(140, 250, 800, 1110), { fill: COL.woodL, line: 5, seed: 820, grain: 0.35, breaks: 0.06 });
  for (let i = 1; i < 10; i++) ink(ctx, [[140 + i * 80, 254], [140 + i * 80, 1356]], 1.6, { seed: 830 + i, color: COL.woodD, alpha: 0.5, taper: false });
  shape(ctx, rect(468, 250, 144, 390), { fill: COL.coralL, line: 4, seed: 821, grain: 0.25 });
  ink(ctx, ellipse(540, 640, 90, 90, 48), 4, { closed: true, seed: 822, breaks: 0.15 });
  ink(ctx, ellipse(540, 1360, 120, 120, 48, Math.PI, TAU), 4, { seed: 823 });
  ink(ctx, [[480, 268], [600, 268]], 7, { seed: 824, taper: false });
  ink(ctx, ellipse(540, 300, 24, 24, 24), 5, { closed: true, seed: 825, color: COL.red });
  // the passes, laid one per beat, accumulate into the star
  const tt = twos(t);
  for (let i = 0; i < 5; i++) {
    const p0 = HIT.passes[i], k = seg(t, p0, p0 + 0.38); if (k <= 0) break;
    const a = PP[ORDER[i]], b = PP[ORDER[i + 1]];
    const L = []; for (let j = 0; j <= 40; j++) L.push([lerp(a[0], b[0], j / 40), lerp(a[1], b[1], j / 40)]);
    dashed(ctx, L, 6, 20, 12, 0, COL.ink, k);
  }
  // Lakers wait in the lane, Pistons pass on the outside
  LK.forEach(([x, y, r, n], i) => {
    const jx = Math.sin(tt * 2 + i) * 4;
    shape(ctx, ellipse(x + jx, y, r, r, 30), { fill: COL.mpls, line: 4, seed: 840 + i, grain: 0.25 });
    if (n) text(ctx, n, x + jx, y + 13, { font: '36px Slab', fill: COL.paper, align: 'center', plate: COL.ink, off: [2, 2] });
  });
  PP.forEach(([x, y], i) => shape(ctx, ellipse(x, y, 34, 34, 30), { fill: COL.fw, line: 4, seed: 850 + i, grain: 0.25 }));
  // the ball follows the passes
  let bp = PP[0];
  for (let i = 0; i < 5; i++) { const p0 = HIT.passes[i]; if (t >= p0) { const k = eio(seg(t, p0, p0 + 0.38)); const a = PP[ORDER[i]], b = PP[ORDER[i + 1]]; bp = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; } }
  drawBall(ctx, bp[0] + 22, bp[1] - 22, 18, 0, 860);
  ctx.restore();
}
function sceneStall(ctx, t) {
  const r = sceneStall_(ctx, t);
  tag(ctx, t, HIT.stallTag, 'THE STALL', 540, 150, { id: 'stall', accent: COL.fw });
  return r;
}
function sceneStall_(ctx, t) {
  if (t < HIT.iris2) {
    const r = sceneStallSide(ctx, t);
    callout(ctx, t, HIT.callout, 290, 430, 180, c => {
      ctx.save(); c.scale(1, 1);
      drawBall(c, 0, 10, 92, 0.3, 870);
      drawHandsOnBall(c);
      c.restore();
    }, COL.fwD, r.ball);
    if (t >= HIT.callout + 0.3) { text(ctx, 'NO SHOT', 290, 690, { font: '64px Slab', fill: COL.ink, plate: COL.paper, off: [4, 4], align: 'center' }); reg_('noshot', 'NO SHOT', 150, 630, 430, 700); }
    return r;
  }
  // iris from the ball into the plan (circle to circle)
  const k = eio(seg(t, HIT.iris2, HIT.iris2 + 0.35));
  if (k < 1) {
    const r = sceneStallSide(ctx, HIT.iris2 - 1e-3);
    callout(ctx, HIT.iris2, HIT.callout, 290, 430, 180, c => { drawBall(c, 0, 10, 92, 0.3, 870); drawHandsOnBall(c); }, COL.fwD, r.ball);
    text(ctx, 'NO SHOT', 290, 690, { font: '64px Slab', fill: COL.ink, plate: COL.paper, off: [4, 4], align: 'center' });
    const [cx, cy] = r.ball, R = lerp(46, 1500, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); scenePlan(ctx, t); ctx.restore();
    ink(ctx, ellipse(cx, cy, R, R, 90), 7, { closed: true, seed: 960 });
    if (R < Math.hypot(cx - 290, cy - 670) - 160) reg_('noshot', 'NO SHOT', 150, 630, 430, 700);
    return {};
  }
  scenePlan(ctx, t);
  return {};
}
import { drawHand } from './engine/cast.js';
function drawHandsOnBall(c) {
  drawHand(c, -150, 30, 0.1, 'flat', 1, 2.0, COL.skinA);
  drawHand(c, 150, 0, Math.PI - 0.1, 'flat', -1, 2.0, COL.skinAD);
}

// ------------------------------------------------------------------ SHOT 4 · Mikan 15, everyone else 3
function sceneMikan(ctx, t) {
  const k = eio(seg(t, HIT.split, HIT.split + 0.3));
  const cy = lerp(1060, 960, ss(seg(t, 14.75, 15.6)));     // tilt up to the numbers
  ctx.save();
  ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, H);
  // left block drops from the top, right block rises from the bottom
  ctx.save(); ctx.beginPath(); ctx.rect(0, -H + H * k, W / 2, H); ctx.clip();
  ctx.save(); camApply(ctx, { cx: 540, cy, z: 1, r: 0 });
  bg(ctx, COL.plumL, COL.plumD, 1340);
  rays(ctx, 270, 380, 22, 900, COL.plum, { rot: twos(t) * 0.06, alpha: 0.55 });
  drawPlayer(ctx, 250, 1340, 0.86, {
    col: COL.mpls, colD: COL.mplsD, h: 1.04, num: '99', glasses: true,
    hF: kf(t, [[14.7, [70, -560]], [15.0, [60, -700]], [16.0, [64, -690]]]), hB: [-70, -420], handF: 'open', handB: 'open',
    blink: blinkAt(t, [16.2]), look: [2, -4],
    prop: c => { const p = kf(t, [[14.7, [80, -610]], [15.0, [70, -760]], [16.0, [74, -750]]]); drawBall(c, p[0], p[1], 46, twos(t) * 2, 880); },
  }, 1);
  text(ctx, 'MIKAN', 270, 220, { font: '600 52px Jost', fill: COL.paper, align: 'center', track: 6 });
  regW('mk', 'MIKAN', 170, 175, 370, 230);
  const n1 = pop(t, HIT.n15, 0.3);
  if (n1 > 0) { ctx.save(); ctx.translate(270, 400); ctx.scale(n1, n1); text(ctx, '15', 0, 80, { font: '250px Slab', fill: COL.fw, align: 'center', plate: COL.ink, off: [7, 6] }); ctx.restore(); if (n1 >= 0.999) regW('n15', '15', 110, 300, 430, 490); }
  ctx.restore(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2, H - H * k, W / 2, H); ctx.clip();
  ctx.save(); camApply(ctx, { cx: 540, cy, z: 1, r: 0 });
  bg(ctx, COL.limeL, COL.limeD, 1340);
  [[640, 0], [790, 1], [940, 2]].forEach(([x, i]) => drawPlayer(ctx, x, 1340, 0.5, { col: COL.mpls, colD: COL.mplsD, h: 1, num: '', blink: blinkAt(t, [15.9 + i * 0.4]), look: [-3, -2], seed: 450 + i * 70, skin: i === 1 ? COL.skinB : COL.skinA, skinD: COL.skinAD }, -1));
  text(ctx, 'THE REST', 810, 220, { font: '600 52px Jost', fill: COL.ink, align: 'center', track: 6 });
  regW('rest', 'THE REST', 680, 175, 940, 230);
  const n2 = pop(t, HIT.n3, 0.3);
  if (n2 > 0) { ctx.save(); ctx.translate(810, 400); ctx.scale(n2, n2); text(ctx, '3', 0, 80, { font: '250px Slab', fill: COL.paper, align: 'center', plate: COL.ink, off: [7, 6] }); ctx.restore(); if (n2 >= 0.999) regW('n3', '3', 720, 300, 900, 490); }
  ctx.restore(); ctx.restore();
  if (k > 0) ink(ctx, [[W / 2, -10], [W / 2, H + 10]], 7, { seed: 970, taper: false });
  ctx.restore();
}

// ------------------------------------------------------------------ SHOT 5 · the last shot
function ballPath(t) {
  return kf(t, [[19.5, [120, 1700]], [20.0, [470, 430]], [20.42, [528, 410]], [20.5, [540, 600]], [20.8, [540, 900]], [21.0, [540, 1100]]]);
}
function sceneShot(ctx, t) {
  const z = lerp(1.0, 1.14, ss(seg(t, 17.5, 20.0)));
  ctx.save(); camApply(ctx, { cx: 540, cy: 700, z, r: 0 });
  bg(ctx, COL.tealL);
  rays(ctx, 540, 420, 30, 1600, COL.teal, { rot: t < HIT.hush0 ? twos(t) * 0.04 : twos(HIT.hush0) * 0.04, alpha: 0.6 });
  // backboard and rim, seen from below
  shape(ctx, rrect(330, 240, 420, 270, 10), { fill: COL.paper, line: 5, seed: 900, grain: 0.2 });
  ink(ctx, rect(470, 360, 140, 110), 5, { closed: true, seed: 901, color: COL.red });
  const ripple = t > HIT.swish ? Math.sin((t - HIT.swish) * 30) * Math.exp(-(t - HIT.swish) * 5) * 22 : 0;
  const bp = ballPath(t);
  const ballBehind = bp[1] < 600;
  // back half of rim
  ink(ctx, ellipse(540, 600, 120, 24, 40, Math.PI, TAU), 9, { seed: 902, color: COL.red, taper: false });
  if (ballBehind && t >= HIT.launch) drawBall(ctx, bp[0], bp[1], 52, twos(t) * 6, 903);
  // net
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * i / 8, x0 = 540 + Math.cos(a) * 120 * (i % 2 ? 1 : -1) * 0 + (i - 4) * 30, x1 = 540 + (i - 4) * 15 + ripple * (i % 2 ? 1 : -1) * 0.5;
    ink(ctx, [[x0, 608], [lerp(x0, x1, 0.5) + ripple * 0.3, 700], [x1, 800 + ripple]], 3.2, { seed: 910 + i, color: COL.paper, taper: false });
  }
  for (let j = 0; j < 3; j++) { const y = 650 + j * 50, sc = 1 - j * 0.16; ink(ctx, [[540 - 120 * sc + 4, y + ripple * 0.4], [540 + 120 * sc - 4, y + ripple * 0.4]], 3, { seed: 920 + j, color: COL.paper, taper: false, alpha: 0.85 }); }
  ink(ctx, ellipse(540, 600, 120, 24, 40, 0, Math.PI), 10, { seed: 904, color: COL.red, taper: false });
  if (!ballBehind && t >= HIT.launch) {
    ctx.save(); ctx.beginPath(); ctx.rect(-500, 600, 2080, 3000); ctx.clip();
    drawBall(ctx, bp[0], bp[1], 52, twos(t) * 6, 903); ctx.restore();
    // the net in front of the falling ball
    for (let i = 0; i <= 8; i++) { const x0 = 540 + (i - 4) * 30, x1 = 540 + (i - 4) * 15; ink(ctx, [[x0, 608], [x1, 800 + ripple]], 2.6, { seed: 930 + i, color: COL.paper, taper: false, alpha: 0.9 }); }
  }
  // the crowd: rows of geometric heads that hold still, then jump on the swish
  const jump = t > HIT.swish ? Math.abs(Math.sin((t - HIT.swish) * 9)) * Math.exp(-(t - HIT.swish) * 2) * 40 : 0;
  for (let row = 0; row < 3; row++) {
    const y = 1150 + row * 110, cols = [COL.tealD, COL.plum, COL.coralD];
    plane(ctx, rect(-300, y + 30, 1680, 700), cols[row]);
    for (let i = -4; i < 16; i++) {
      const x = i * 90 + (row % 2) * 45, hj = twos(t) > HIT.swish ? jump * (0.6 + hash(i, row) * 0.8) : 0;
      shape(ctx, ellipse(x, y - hj, 34, 40, 20), { fill: cols[row], line: 3.5, seed: 940 + row * 30 + i, grain: 0.2, breaks: 0.2 });
    }
  }
  if (t > HIT.swish) for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3, d = 150 + (t - HIT.swish) * 500; sparkle(ctx, 540 + Math.cos(a) * d, 620 + Math.sin(a) * d * 0.6, 30 * clamp(1 - (t - HIT.swish) * 1.6), { fill: COL.paper }); }
  ctx.restore();
  tag(ctx, t, HIT.tag5, 'FINAL SECONDS', 540, 1230, { id: 'final-secs', accent: COL.fw });
}

// ------------------------------------------------------------------ SHOTS 5b/6 · FINAL, and the fix (echo of shot 1)
function foxPoseClock(t) {
  const point = t > HIT.record - 0.2;
  return {
    hF: kf(t, [[22.7, [-30, -150]], [23.0, [70, -230]], [30, [70, -230]]]), handF: 'grip',
    hB: point ? kf(t, [[HIT.record - 0.2, [90, -260]], [HIT.record, [150, -400]], [HIT.record + 0.2, [140, -384]], [30, [140, -384]]]) : kf(t, [[22.7, foxRest('B')], [23.0, [90, -260]], [30, [90, -260]]]),
    handB: point && t > HIT.record ? 'point' : 'grip',
    blink: blinkAt(t, [24.6, 27.9]), mouth: mouthAt(t), tail: twos(Math.min(t, HIT.iris3)) * 0.5, look: [4, -3],
  };
}
function clockPos(t) { const h = kf(t, [[22.7, [-30, -150]], [23.0, [70, -230]], [30, [70, -230]]]); return [FOX1.x + (h[0] + 40) * FOX1.s, FOX1.y + (h[1] + 20) * FOX1.s]; }
function sceneEnd(ctx, t, kind) {
  ctx.save(); camApply(ctx, { cx: 540, cy: 900, z: 1.04, r: 0 });
  if (kind === 'final') { bg(ctx, COL.coral, COL.coralD, FOX1.y); rays(ctx, SB1.x, SB1.y, 30, 1400, COL.coralL, { rot: 0.3 + twos(t) * 0.05, alpha: 0.6 }); }
  else { bg(ctx, COL.plum, COL.plumD, FOX1.y); rays(ctx, SB1.x, SB1.y, 30, 1400, COL.plumL, { rot: 0.1, alpha: 0.5 }); }
  drawScoreboard(ctx, SB1.x, SB1.y, SB1.s, { final: pop(t, HIT.cut, 0.26) });
  regW('sb-l', 'FORT WAYNE', SB1.x - 230, SB1.y - 125, SB1.x - 5, SB1.y - 60); regW('sb-r', 'MINNEAPOLIS', SB1.x + 5, SB1.y - 125, SB1.x + 240, SB1.y - 60);
  if (t >= HIT.cut + 0.26) regW('finalstamp', 'FINAL', SB1.x - 70, SB1.y - 260, SB1.x + 70, SB1.y - 150);
  if (kind === 'clock') {
    const cp = clockPos(t);
    drawFox(ctx, FOX1.x, FOX1.y, FOX1.s, { ...foxPoseClock(t), prop: null }, 1);
    drawShotClock(ctx, cp[0], cp[1], 0.95);
    if (t > 23.2) regW('24', '24', cp[0] - 90, cp[1] - 60, cp[0] + 90, cp[1] + 60);
    const k = pop(t, HIT.t1954, 0.3);
    if (k > 0) {
      ctx.save(); ctx.translate(W / 2, 330); ctx.scale(k, k);
      text(ctx, '1954', 0, 40, { font: '170px Slab', fill: COL.fw, align: 'center', plate: COL.ink, off: [7, 6] });
      ctx.restore();
      text(ctx, 'THE 24-SECOND SHOT CLOCK', W / 2, 470, { font: '600 50px Jost', fill: COL.paper, align: 'center', track: 3, alpha: clamp(k) });
      if (k >= 0.999 && t < HIT.iris3) { regW('1954', '1954', W / 2 - 230, 210, W / 2 + 230, 380); regW('sc', 'THE 24-SECOND SHOT CLOCK', 140, 430, 940, 485); }
    }
    const r = pop(t, HIT.record, 0.3);
    if (r > 0) {
      ctx.save(); ctx.translate(W / 2, 575); ctx.scale(r, r); ctx.rotate(-0.04);
      text(ctx, 'Still the record!', 0, 26, { font: '700 76px Oleo', fill: COL.paper, align: 'center', plate: COL.ink, off: [4, 4] });
      ctx.restore();
      if (r >= 0.999 && t < HIT.iris3) regW('record', 'Still the record!', 260, 515, 820, 605);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ captions
function subtitle(ctx, t) {
  const cue = srtCues().find(s => t >= s.t0 && t < s.t1); if (!cue) return;
  const a = Math.min(ss(seg(t, cue.t0, cue.t0 + 0.16)), 1 - ss(seg(t, cue.t1 - 0.16, cue.t1)));
  let f = fit(ctx, cue.text, '500 {px}px Jost', 46, 900, 1, 40); if (measure(ctx, f.lines[0], f.font) > 900) f = fit(ctx, cue.text, '500 {px}px Jost', 46, 860, 2, 36);
  const lw = Math.max(...f.lines.map(l => measure(ctx, l, f.font)));
  const w = lw + 130, h = 44 + f.lines.length * f.px * 1.22, x = W / 2 - w / 2, y = 1540 - h / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 10);
  shape(ctx, rrect(x, y, w, h, 14), { fill: COL.paper, line: 3.2, seed: 990, grain: 0.15, breaks: 0.08, off: [5, 5] });
  star(ctx, x + 32, y + h / 2, 14, { n: 8, inner: 0.4, fill: COL.bow, off: [0, 0], rot: t * 0.8 });
  star(ctx, x + w - 32, y + h / 2, 14, { n: 8, inner: 0.4, fill: COL.bow, off: [0, 0], rot: -t * 0.8 });
  f.lines.forEach((l, i) => text(ctx, l, W / 2, y + 22 + f.px * 0.95 + i * f.px * 1.22, { font: f.font, fill: COL.ink, align: 'center' }));
  ctx.restore();
}

// ------------------------------------------------------------------ the frame
function sectionAt(t) { return SECS.find(s => t >= s.t0 && t < s.t1) || SECS[SECS.length - 1]; }
function drawSec(ctx, t, id) {
  ctx.save();
  if (id === 'hook') sceneHook(ctx, t);
  else if (id === 'fifty') sceneFifty(ctx, t);
  else if (id === 'stall') sceneStall(ctx, t);
  else if (id === 'mikan') sceneMikan(ctx, t);
  else if (id === 'shot') sceneShot(ctx, t);
  else sceneEnd(ctx, t, id);
  ctx.restore();
}
export function renderFilm(ctx, t, Q, texts) {
  TX = texts || null;
  setClock(t);
  const s = sectionAt(t);
  ctx.save();
  if (s.id === 'fifty' && t < HIT.iris1 + 0.3) {
    // iris through the 1950 medallion
    const k = eio(seg(t, HIT.iris1, HIT.iris1 + 0.3));
    const T0 = TX; TX = null; drawSec(ctx, HIT.iris1 - 1e-3, 'hook'); TX = T0;
    const f = [SB1.x + (SB1.x - 540) * 0.04, 0]; // medallion centre on screen
    const c = { cx: 540, cy: 900, z: 1.04 }; const m = [W / 2 + c.z * (SB1.x - c.cx), H / 2 + c.z * (SB1.y + 30 - c.cy)];
    const cx = lerp(m[0], W / 2, k), cy = lerp(m[1], 960, k), R = lerp(150, 1500, k * k);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip(); drawSec(ctx, Math.max(t, HIT.iris1 + 1e-3), 'fifty'); ctx.restore();
    ink(ctx, ellipse(cx, cy, R, R, 90), 7, { closed: true, seed: 961 });
  } else if (s.id === 'shot' && t < HIT.wipe5 + 0.3) {
    // colour-block wipe from the right: the manual turns its page
    const k = eio(seg(t, HIT.wipe5, HIT.wipe5 + 0.3));
    const T0 = TX; TX = null; drawSec(ctx, HIT.wipe5 - 1e-3, 'mikan'); TX = T0;
    ctx.save(); ctx.beginPath(); ctx.rect(W * (1 - k), 0, W, H); ctx.clip(); drawSec(ctx, t, 'shot'); ctx.restore();
    ink(ctx, [[W * (1 - k), -10], [W * (1 - k), H + 10]], 6, { seed: 962 });
  } else if (s.id === 'clock' && t < HIT.wipe6 + 0.3) {
    // bottom-up wipe back to the first shot's colour
    const k = eio(seg(t, HIT.wipe6, HIT.wipe6 + 0.3));
    drawSec(ctx, HIT.wipe6 - 1e-3, 'final');
    ctx.save(); ctx.beginPath(); ctx.rect(0, H * (1 - k), W, H); ctx.clip(); const T0 = TX; TX = null; drawSec(ctx, t, 'clock'); TX = T0; ctx.restore();
    ink(ctx, [[-10, H * (1 - k)], [W + 10, H * (1 - k)]], 6, { seed: 963 });
  } else drawSec(ctx, t, s.id);
  // the last circle: iris-out onto the 24
  if (t >= HIT.iris3) {
    const k = eio(seg(t, HIT.iris3, HIT.iris3 + 0.55));
    const c = { cx: 540, cy: 900, z: 1.04 }, cp = clockPos(t), m = [W / 2 + c.z * (cp[0] - c.cx), H / 2 + c.z * (cp[1] - c.cy)];
    const R = lerp(1500, 150, k);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(m[0], m[1], R, 0, TAU, true); ctx.fillStyle = COL.ink; ctx.fill('evenodd'); ctx.restore();
    ink(ctx, ellipse(m[0], m[1], R, R, 90), 7, { closed: true, seed: 964, color: COL.paper });
  }
  ctx.restore();
  paperFinish(ctx, W, H, 1);
  if (!(Q && Q.has('nosubs'))) subtitle(ctx, t);
  TX = null;
}

// ------------------------------------------------------------------ sound events (same times drive the picture)
let EVS = [];
export function events() { return EVS; }
const ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(4), type, ...o });
function buildEvents() {
  EVS = [];
  VO.forEach(v => ev(v.t, 'vo', { id: v.id }));
  ev(HIT.n19, 'stamp', { pan: -0.2 }); ev(HIT.n18, 'stamp', { pan: 0.2, pitch: 1 });
  ev(HIT.kicker, 'pen_write', { dur: 0.55 }); ev(HIT.slab, 'pop', {}); ev(HIT.point, 'whoosh', { dur: 0.25, gain: 0.4 });
  ev(HIT.medal, 'stamp', { gain: 1.0 }); ev(HIT.iris1 - 0.05, 'iris', { dur: 0.4 });
  ev(HIT.header, 'slide', {}); ev(4.9, 'whirr', { dur: 5.0 }); ev(HIT.noTime, 'pop', {});
  ev(HIT.dribble + 0.25, 'bounce', {}); ev(HIT.clutch, 'grab', {}); ev(HIT.callout, 'pop', {}); ev(10.0, 'crowd', { dur: 4.75, mood: 'boo' });
  for (let x = 10.0; x < 14.75; x += 0.5) ev(x, 'tick', {});
  ev(HIT.iris2 - 0.05, 'iris', { dur: 0.4 }); ev(HIT.stallTag, 'pop', {});
  HIT.passes.forEach((p, i) => { ev(p, 'pass', { n: i }); ev(p, 'pen_write', { dur: 0.36, gain: 0.6 }); });
  ev(HIT.split, 'paper_swish', {}); ev(HIT.split + 0.1, 'whistle', { up: 1 }); ev(HIT.n15, 'stamp', {}); ev(HIT.n3, 'stamp', { gain: 0.6, pitch: -2 });
  ev(14.75, 'crowd', { dur: 2.75, mood: 'murmur' });
  ev(HIT.wipe5, 'paper_swish', {}); ev(HIT.tag5, 'pop', {}); ev(17.5, 'crowd', { dur: 2.5, mood: 'tense' });
  ev(HIT.launch, 'whoosh', { dur: 0.45, gain: 0.6 });
  ev(HIT.swish, 'swish', {}); ev(HIT.swish + 0.05, 'crowd', { dur: 2.6, mood: 'cheer' });
  ev(HIT.cut, 'stamp', { gain: 1.0 });
  ev(HIT.wipe6, 'paper_swish', {}); ev(HIT.clockUp, 'clock_click', {}); ev(HIT.t1954, 'pop', {}); ev(HIT.record, 'pop', {});
  ev(HIT.iris3, 'iris', { dur: 0.55 });
  EVS.sort((a, b) => a.t - b.t);
}

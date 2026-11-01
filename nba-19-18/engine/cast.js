// Cast for "The NBA Game That Ended 19–18": the fox narrator, the players, the ball, the scoreboard, the clocks.
// Every character is ONE drawing function, so the design is identical in every shot.
// Local units: feet at (0,0), up is negative y, characters drawn facing +x; dir = -1 mirrors them.
import { PAL, shape, ink, ellipse, spline, xform, move, rrect, rect, TAU, clamp, lerp, text, reg, path, star } from './toon.js';

export const COL = {
  paper: '#F1E6CF', ink: '#2B2320',
  fox: '#D9733B', foxD: '#B4562A', cream: '#F3E3C3', sock: '#4A2E25', bow: '#3E9C9A', bowD: '#2A7371',
  glove: '#FBF6EA',
  ball: '#8C4A2F', ballD: '#6E3622',
  fw: '#D9A93B', fwD: '#B3861F',            // Fort Wayne: mustard
  mpls: '#86AECB', mplsD: '#5F87A6',        // Minneapolis: powder blue
  plum: '#7C4E6B', plumL: '#946482', plumD: '#5E3A51',
  lime: '#B6BE5A', limeL: '#C9D07A', limeD: '#8E9638',
  sand: '#D8B98A', sandL: '#E4CBA2', sandD: '#B9966A',
  coral: '#E08B6E', coralL: '#EBA78F', coralD: '#C06A50',
  teal: '#5E9FA8', tealL: '#7DB5BC', tealD: '#3F7D86',
  wood: '#C9955D', woodD: '#A2713F', woodL: '#DDB47F',
  skinA: '#E9B98F', skinAD: '#CF9A70', skinB: '#C98E62', hair: '#3A2621',
  red: '#C8553A',
};

// ---------------------------------------------------------------- 2-bone IK
export function ik(sh, target, L1, L2, bend = 1) {
  const dx = target[0] - sh[0], dy = target[1] - sh[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
  const a = Math.atan2(dy, dx), c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
  const a1 = a + bend * Math.acos(c);
  const el = [sh[0] + Math.cos(a1) * L1, sh[1] + Math.sin(a1) * L1];
  const ha = [sh[0] + Math.cos(a) * d, sh[1] + Math.sin(a) * d];
  return { sh, el, ha, a2: Math.atan2(ha[1] - el[1], ha[0] - el[0]) };
}

// ---------------------------------------------------------------- four-finger cartoon hand
export function drawHand(ctx, x, y, a, kind = 'open', side = 1, k = 1, skin = COL.glove) {
  const parts = [], seps = [];
  const E = (cx, cy, rx, ry, rot = 0) => parts.push(ellipse(cx, cy, rx, ry, 18, 0, TAU, rot));
  E(12, 0, 15, 13.5);
  if (kind === 'open') {
    [-0.62, 0, 0.62].forEach(r => E(12 + Math.cos(r) * 25, Math.sin(r) * 25, 12, 5, r));
    E(4, -15 * side, 10, 5, -1.35 * side);
  } else if (kind === 'flat') {
    [-10, 0, 10].forEach((dy, i) => E(34 + (i === 1 ? 3 : 0), dy, 13, 4.8));
    E(10, -15 * side, 9, 5, -0.9 * side);
    seps.push([[24, -5], [40, -5]], [[24, 5], [40, 5]]);
  } else if (kind === 'point') {
    E(38, -5 * side, 19, 4.8); E(25, 5 * side, 7, 6); E(20, 11 * side, 6, 5.5); E(8, -14 * side, 8.5, 5, -1.0 * side);
  } else { E(26, -8, 6.5, 6.5); E(28, 1, 6.5, 6.5); E(25, 10, 6, 6); E(12, -14 * side, 9, 5.5, -0.4 * side); seps.push([[22, -3.5], [30, -3.5]], [[22, 5.5], [29, 5.5]]); }
  const P = parts.map(p => xform(p, x, y, a, k));
  ctx.save(); ctx.strokeStyle = COL.ink; ctx.lineWidth = 6 * k; ctx.lineJoin = 'round';
  for (const p of P) { path(ctx, p); ctx.stroke(); }
  const o = reg(77, 0.6); ctx.fillStyle = skin;
  for (const p of P) { path(ctx, move(p, o[0] * 0.5, o[1] * 0.5)); ctx.fill(); }
  ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
  for (const s2 of seps) { const q = xform(s2, x, y, a, k); ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.stroke(); }
  ctx.restore();
}
// a limb: thick ink ribbon with a colour ribbon printed off-register on top
function limb(ctx, J, seed, col, wInk = 24, wCol = 15) {
  const P = spline([J.sh, [(J.sh[0] + J.el[0]) / 2, (J.sh[1] + J.el[1]) / 2], J.el, [(J.el[0] + J.ha[0]) / 2, (J.el[1] + J.ha[1]) / 2], J.ha], false, 6);
  ink(ctx, P, wInk, { seed, taper: false, wob: 0.08 });
  const o = reg(seed, 1);
  ink(ctx, move(P, o[0] * 0.6, o[1] * 0.6), wCol, { seed: seed + 1, taper: false, wob: 0.05, color: col });
}

// ---------------------------------------------------------------- the ball (the one "product" colour)
export function drawBall(ctx, x, y, r, rot = 0, seed = 300) {
  shape(ctx, ellipse(x, y, r, r, 40), { fill: COL.ball, line: Math.max(2.5, r * 0.09), seed, grain: 0.3, breaks: 0.12,
    shade: [{ pts: ellipse(x + r * 0.28, y + r * 0.3, r * 0.85, r * 0.85, 30), color: COL.ballD, alpha: 0.55 }] });
  const lw = Math.max(1.6, r * 0.055);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 0.96, 0, TAU); ctx.clip();
  ink(ctx, xform([[-r, 0], [r, 0]], x, y, rot), lw, { seed: seed + 1, taper: false });
  ink(ctx, xform([[0, -r], [0, r]], x, y, rot), lw, { seed: seed + 2, taper: false });
  ink(ctx, xform(ellipse(-r * 1.25, 0, r * 0.75, r * 1.05, 24, -1.2, 1.2), x, y, rot), lw, { seed: seed + 3, taper: false });
  ink(ctx, xform(ellipse(r * 1.25, 0, r * 0.75, r * 1.05, 24, Math.PI - 1.2, Math.PI + 1.2), x, y, rot), lw, { seed: seed + 4, taper: false });
  ctx.restore();
}

// ---------------------------------------------------------------- THE FOX (narrator)
// pose: { hF:[x,y], hB:[x,y] local hand targets, handF, handB, blink 0..1, mouth 0..1, tail phase, look [dx,dy],
//         prop: function(ctx) drawn between back arm and front arm (held objects) }
const FSH = [-34, -262], BSH = [40, -266];   // front (near) and back shoulders, facing +x
export const FOX_ARM = 82;
export function foxRest(which) { return which === 'F' ? [-10, -120] : [64, -124]; }
export function drawFox(ctx, x, y, s, pose = {}, dir = -1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  // contact shadow
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.ellipse(10, 2, 110, 12, 0, 0, TAU); ctx.fill(); ctx.restore();
  // tail (behind): long teardrop curling up behind the body, cream tip
  const ph = Math.sin((pose.tail ?? 0) * TAU) * 0.06;
  const tail = xform(spline([[0, 0], [70, -30], [150, -120], [190, -230], [170, -300], [130, -250], [90, -150], [30, -70]], true, 8), -60, -40, ph);
  const tip = xform(spline([[190, -230], [170, -300], [140, -270], [150, -235]], true, 6), -60, -40, ph);
  shape(ctx, tail, { fill: COL.fox, line: 4, seed: 101, grain: 0.35, breaks: 0.15, shade: [{ pts: xform([[60, -10], [200, -140], [200, 0]], -60, -40, ph), color: COL.foxD, alpha: 0.5 }] });
  shape(ctx, tip, { fill: COL.cream, line: 0, seed: 102, grain: 0.2 });
  // back arm
  const JB = ik(BSH, pose.hB || foxRest('B'), FOX_ARM, FOX_ARM, -1);
  limb(ctx, JB, 110, COL.foxD);
  drawHand(ctx, JB.ha[0], JB.ha[1], JB.a2, pose.handB || 'open', 1);
  // legs + dark socks
  [[-30, -70], [28, -70]].forEach(([lx, ly], i) => {
    shape(ctx, rrect(lx - 22, ly, 44, 66, 16), { fill: COL.sock, line: 3.6, seed: 120 + i, grain: 0.2, breaks: 0.15 });
    shape(ctx, ellipse(lx + 12, -8, 34, 13, 18), { fill: COL.sock, line: 3.6, seed: 122 + i, grain: 0.1 });
  });
  // body: a bean
  const body = spline([[-62, -70], [-78, -170], [-52, -276], [0, -300], [56, -280], [76, -170], [64, -66], [0, -50]], true, 8);
  shape(ctx, body, { fill: COL.fox, line: 4.2, seed: 130, grain: 0.35, breaks: 0.16, shade: [{ pts: [[30, -320], [100, -320], [100, -40], [36, -40]], color: COL.foxD, alpha: 0.45 }] });
  // cream chest bib (toward the face side, +x)
  shape(ctx, spline([[6, -88], [40, -150], [48, -238], [20, -284], [-10, -250], [-12, -150]], true, 6), { fill: COL.cream, line: 0, seed: 131, grain: 0.2 });
  // head
  drawFoxHead(ctx, pose);
  // bow tie
  const bt = [[-34, -298], [-34, -268], [0, -283]], bt2 = [[34, -300], [34, -266], [0, -283]];
  shape(ctx, bt, { fill: COL.bow, line: 3.4, seed: 140, grain: 0.2, breaks: 0.1 });
  shape(ctx, bt2, { fill: COL.bow, line: 3.4, seed: 141, grain: 0.2, breaks: 0.1 });
  shape(ctx, ellipse(0, -283, 10, 9, 14), { fill: COL.bowD, line: 3, seed: 142, grain: 0 });
  // held prop sits between the arms
  if (pose.prop) pose.prop(ctx);
  // front arm
  const JF = ik(FSH, pose.hF || foxRest('F'), FOX_ARM, FOX_ARM, 1);
  limb(ctx, JF, 150, COL.fox);
  drawHand(ctx, JF.ha[0], JF.ha[1], JF.a2, pose.handF || 'open', -1);
  ctx.restore();
}
function drawFoxHead(ctx, pose) {
  const blink = pose.blink ?? 0, look = pose.look || [0, 0], m = pose.mouth ?? 0;
  // ears (back ear first)
  shape(ctx, [[-62, -440], [-58, -548], [-10, -468]], { fill: COL.foxD, line: 4, seed: 160, grain: 0.3, breaks: 0.12 });
  shape(ctx, [[-4, -462], [24, -568], [50, -450]], { fill: COL.fox, line: 4, seed: 161, grain: 0.3, breaks: 0.12 });
  shape(ctx, [[8, -470], [24, -536], [38, -462]], { fill: COL.cream, line: 0, seed: 162, grain: 0.2 });
  // ONE outline: back of the skull → crown → forehead → out to the nose tip → under the jaw
  const head = spline([[-70, -400], [-62, -450], [-20, -478], [40, -470], [80, -440], [128, -406], [156, -392], [146, -378], [100, -364], [40, -346], [-20, -344], [-60, -362]], true, 7);
  shape(ctx, head, { fill: COL.fox, line: 4.4, seed: 163, grain: 0.35, breaks: 0.14 });
  // cream muzzle and cheek (one flat plane)
  shape(ctx, spline([[150, -386], [100, -366], [40, -348], [-6, -350], [10, -380], [70, -392], [120, -396]], true, 6), { fill: COL.cream, line: 0, seed: 164, grain: 0.2 });
  // nose
  shape(ctx, ellipse(154, -392, 14, 11, 16), { fill: COL.ink, line: 0, seed: 165, grain: 0, off: [0, 0] });
  // eyes (3/4: far eye smaller, nearer the nose bridge)
  const eye = (ex, ey, rx, ry) => {
    if (blink > 0.5) { ink(ctx, [[ex - rx * 1.4, ey], [ex + rx * 1.4, ey + 1]], 4, { seed: 170, taper: true }); return; }
    shape(ctx, ellipse(ex + look[0], ey + look[1], rx, ry, 18), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 });
    shape(ctx, ellipse(ex + look[0] + rx * 0.35, ey + look[1] - ry * 0.4, rx * 0.35, rx * 0.35, 10), { fill: COL.glove, line: 0, off: [0, 0], grain: 0 });
  };
  eye(46, -418, 8.5, 13); eye(96, -414, 6.5, 10.5);
  // brows
  ink(ctx, [[34, -446], [58, -450]], 4, { seed: 171 }); ink(ctx, [[88, -440], [104, -440]], 3.4, { seed: 172 });
  // mouth: a smile line that opens on the voice
  if (m > 0.15) shape(ctx, spline([[96, -366], [126, -370], [118, -366 + m * 18], [100, -362 + m * 14]], true, 5), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 });
  ink(ctx, spline([[88, -366], [108, -362], [130, -370]], false, 5), 3.4, { seed: 173 });
}

// ---------------------------------------------------------------- PLAYERS
// o: { col, colD, num, glasses, skin, skinD, h (height scale), hF, hB (hand targets), handF, handB, blink, look,
//      footTap 0..1, prop(ctx) }
export function drawPlayer(ctx, x, y, s, o = {}, dir = 1) {
  const col = o.col, colD = o.colD, skin = o.skin || COL.skinA, skinD = o.skinD || COL.skinAD, H = o.h ?? 1, seed = o.seed ?? 400;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.ellipse(0, 2, 90, 11, 0, 0, TAU); ctx.fill(); ctx.restore();
  const hip = -300 * H, chest = -470 * H, shY = chest + 14;
  const BS = [-44, shY], FS = [50, shY], AL = 112 * H;
  // back arm
  const JB = ik(BS, o.hB || [-50, shY + 210 * H], AL, AL, -1);
  limb(ctx, JB, seed + 1, skinD, 26, 17);
  drawHand(ctx, JB.ha[0], JB.ha[1], JB.a2, o.handB || 'open', 1, 1, skinD);
  // legs
  const tap = o.footTap ?? 0;
  [[-24, -1], [26, 1]].forEach(([lx, k], i) => {
    const fy = i === 1 ? -tap * 16 : 0;
    const P = [[lx, hip + 20], [lx + k * 4, hip * 0.5], [lx + k * 6, fy - 40]];
    ink(ctx, P, 30, { seed: seed + 10 + i, taper: false, wob: 0.05 });
    ink(ctx, move(P, 3, 2), 20, { seed: seed + 12 + i, taper: false, wob: 0.04, color: i ? skin : skinD });
    // white canvas high-tops with an ink sole
    shape(ctx, spline([[lx + k * 6 - 22, fy - 52], [lx + k * 6 + 16, fy - 54], [lx + k * 6 + 44, fy - 12], [lx + k * 6 + 40, fy], [lx + k * 6 - 24, fy]], true, 4), { fill: COL.glove, line: 3.8, seed: seed + 14 + i, grain: 0.1 });
    ink(ctx, [[lx + k * 6 - 24, fy - 2], [lx + k * 6 + 42, fy - 2]], 6, { seed: seed + 16 + i, taper: false });
  });
  // shorts
  shape(ctx, [[-62, hip - 60], [62, hip - 60], [70, hip + 40], [6, hip + 40], [0, hip + 10], [-6, hip + 40], [-70, hip + 40]], { fill: col, line: 4, seed: seed + 20, grain: 0.3, breaks: 0.15 });
  ink(ctx, [[-64, hip + 30], [-8, hip + 30]], 6, { color: COL.glove, seed: seed + 21, taper: false });
  ink(ctx, [[8, hip + 30], [66, hip + 30]], 6, { color: COL.glove, seed: seed + 22, taper: false });
  // tank jersey
  const torso = spline([[-56, chest], [-30, chest - 12], [30, chest - 12], [56, chest], [60, hip - 40], [-60, hip - 40]], true, 6);
  shape(ctx, torso, { fill: col, line: 4.2, seed: seed + 30, grain: 0.35, breaks: 0.15, shade: [{ pts: [[30, chest - 30], [80, chest - 30], [80, hip], [34, hip]], color: colD, alpha: 0.6 }] });
  shape(ctx, spline([[-22, chest - 12], [0, chest + 22], [22, chest - 12]], false, 5), { fill: skin, line: 3, seed: seed + 31, grain: 0 });
  if (o.num) { ctx.save(); ctx.scale(dir, 1); text(ctx, o.num, 2 * dir, chest + 120 * H, { font: `${Math.round(78 * Math.min(1.1, H))}px Slab`, fill: COL.paper, align: 'center', plate: COL.ink, off: [3, 3] }); ctx.restore(); }
  // neck + head (egg; the nose is part of the outline)
  shape(ctx, rect(-14, chest - 40, 28, 34), { fill: skin, line: 0, seed: seed + 40, grain: 0 });
  const hy = chest - 40;
  const head = spline([[-44, hy - 30], [-46, hy - 96], [-10, hy - 136], [36, hy - 124], [52, hy - 84], [70, hy - 62], [52, hy - 52], [48, hy - 20], [10, hy - 4], [-30, hy - 10]], true, 7);
  shape(ctx, head, { fill: skin, line: 4.2, seed: seed + 41, grain: 0.2, breaks: 0.16 });
  shape(ctx, spline([[-48, hy - 70], [-44, hy - 116], [-10, hy - 142], [36, hy - 130], [50, hy - 104], [16, hy - 112], [-20, hy - 100], [-36, hy - 74]], true, 6), { fill: COL.hair, line: 0, seed: seed + 42, grain: 0.3 });
  shape(ctx, ellipse(-30, hy - 62, 9, 14, 14), { fill: skinD, line: 3, seed: seed + 43, grain: 0 });   // ear
  const blink = o.blink ?? 0, lk = o.look || [0, 0];
  if (blink > 0.5) ink(ctx, [[20, hy - 80], [38, hy - 79]], 4, { seed: seed + 44 });
  else shape(ctx, ellipse(30 + lk[0], hy - 80 + lk[1], 6, 9, 12), { fill: COL.ink, line: 0, off: [0, 0], grain: 0 });
  ink(ctx, [[16, hy - 98], [40, hy - (o.frown ? 92 : 100)]], 4, { seed: seed + 45 });
  ink(ctx, spline([[24, hy - 34], [36, hy - 30], [46, hy - 34]], false, 4), 3.4, { seed: seed + 46 });
  if (o.glasses) {
    ink(ctx, ellipse(32, hy - 80, 17, 17, 24), 4, { closed: true, seed: seed + 47 });
    ink(ctx, ellipse(64, hy - 82, 10, 15, 20), 3.4, { closed: true, seed: seed + 48 });
    ink(ctx, [[48, hy - 82], [55, hy - 83]], 3.4, { seed: seed + 49 });
    ink(ctx, [[15, hy - 80], [-28, hy - 74]], 3.4, { seed: seed + 50 });
  }
  if (o.prop) o.prop(ctx);
  // front arm
  const JF = ik(FS, o.hF || [56, shY + 210 * H], AL, AL, 1);
  limb(ctx, JF, seed + 60, skin, 26, 17);
  drawHand(ctx, JF.ha[0], JF.ha[1], JF.a2, o.handF || 'open', -1, 1, skin);
  ctx.restore();
}

// ---------------------------------------------------------------- SCOREBOARD (the same drawing in shots 1, 5 and 6)
// o: { k1, k2 (0..1 pop of each number), final (0..1), seed }
export function drawScoreboard(ctx, cx, cy, s, o = {}) {
  const W = 640, H = 330;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  // hanging rods
  ink(ctx, [[-200, -H / 2 - 120], [-200, -H / 2]], 6, { seed: 501, taper: false });
  ink(ctx, [[200, -H / 2 - 120], [200, -H / 2]], 6, { seed: 502, taper: false });
  shape(ctx, rrect(-W / 2, -H / 2, W, H, 26), { fill: COL.wood, line: 5, seed: 503, grain: 0.4, breaks: 0.1, shade: [{ pts: rect(-W / 2, H / 2 - 40, W, 60), color: COL.woodD, alpha: 0.6 }] });
  // lamps on the crown
  [-240, -180, 180, 240].forEach((lx, i) => shape(ctx, ellipse(lx, -H / 2 + 34, 14, 14, 14), { fill: COL.paper, line: 3, seed: 504 + i, grain: 0 }));
  text(ctx, 'FORT WAYNE', -150, -H / 2 + 76, { font: '600 34px Jost', fill: COL.paper, align: 'center', track: 2 });
  text(ctx, 'MINNEAPOLIS', 150, -H / 2 + 76, { font: '600 34px Jost', fill: COL.paper, align: 'center', track: 2 });
  [[-150, '19', o.k1 ?? 1, COL.fw], [150, '18', o.k2 ?? 1, COL.mpls]].forEach(([tx, n, k, c], i) => {
    shape(ctx, rrect(tx - 120, -50, 240, 170, 14), { fill: COL.ink, line: 0, seed: 510 + i, grain: 0.15, off: [0, 0] });
    if (k > 0) { ctx.save(); ctx.translate(tx, 35); ctx.scale(k, k); text(ctx, n, 0, 56, { font: '160px Slab', fill: c, align: 'center', plate: COL.paper, off: [5, 4], seed: 520 + i }); ctx.restore(); }
  });
  text(ctx, '–', 0, 64, { font: '90px Slab', fill: COL.ink, align: 'center' });
  if ((o.final ?? 0) > 0) {
    const k = o.final;
    ctx.save(); ctx.translate(0, -H / 2 - 50); ctx.rotate(-0.08); ctx.scale(k, k);
    star(ctx, 0, 0, 108, { n: 16, inner: 0.78, fill: COL.red, off: [5, 4] });
    ink(ctx, ellipse(0, 0, 80, 80, 40), 3.5, { closed: true, seed: 530 });
    text(ctx, 'FINAL', 0, 16, { font: '46px Slab', fill: COL.paper, align: 'center' });
    ctx.restore();
  }
  ctx.restore();
}
export const SB = { W: 640, H: 330 };

// round wall clock / held clock face. ang = minute-hand angle (rad), hr = hour-hand angle
export function drawClockFace(ctx, cx, cy, r, ang, hr, o = {}) {
  shape(ctx, ellipse(cx, cy, r + r * 0.14, r + r * 0.14, 48), { fill: o.rim || COL.wood, line: 4.5, seed: 600, grain: 0.3 });
  shape(ctx, ellipse(cx, cy, r, r, 48), { fill: COL.paper, line: 3.5, seed: 601, grain: 0.15 });
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ink(ctx, [[cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92]], i % 3 ? 3 : 5.5, { seed: 610 + i, taper: false }); }
  ink(ctx, [[cx, cy], [cx + Math.cos(hr - Math.PI / 2) * r * 0.5, cy + Math.sin(hr - Math.PI / 2) * r * 0.5]], 7, { seed: 630, taper: false });
  ink(ctx, [[cx, cy], [cx + Math.cos(ang - Math.PI / 2) * r * 0.78, cy + Math.sin(ang - Math.PI / 2) * r * 0.78]], 4.5, { seed: 631, taper: false });
  shape(ctx, ellipse(cx, cy, r * 0.07, r * 0.07, 12), { fill: COL.red, line: 0, off: [0, 0], grain: 0 });
}
// the 24-second shot-clock box
export function drawShotClock(ctx, cx, cy, s = 1, val = '24') {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  shape(ctx, rrect(-120, -90, 240, 180, 18), { fill: COL.wood, line: 4.5, seed: 650, grain: 0.35, shade: [{ pts: rect(-120, 50, 240, 60), color: COL.woodD, alpha: 0.6 }] });
  shape(ctx, rrect(-92, -62, 184, 124, 10), { fill: COL.ink, line: 0, seed: 651, grain: 0.1, off: [0, 0] });
  text(ctx, val, 0, 44, { font: '118px Slab', fill: COL.red, align: 'center', plate: COL.paper, off: [4, 3], seed: 652 });
  text(ctx, 'SECONDS', 0, 82, { font: '600 22px Jost', fill: COL.paper, align: 'center', track: 4 });
  ctx.restore();
}

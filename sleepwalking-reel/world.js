// Five low-poly sets, each on its own floating hex island far apart in world space (only the current one is visible):
// HOUSE (cutaway bedroom + yard), GRAPH (a night of sleep as hex columns), BRAIN, STATS (two 10×10 tile grids), TRIG (five trigger tiles).
// Flat-shaded MeshStandardMaterial, no textures. Arrivals: rise from below with a damped overshoot, pop with ~25 % overshoot.
import * as THREE from 'three';
import { clamp, seg, ss, eo, eio, lerp, hash, TAU } from '/core/lib.js';
import { T } from './story.js';

const SQ3 = Math.sqrt(3);
const MC = new Map();
export function mat(hex, o = {}) {
  const k = hex + JSON.stringify(o);
  if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .88, metalness: 0, ...o }));
  return MC.get(k);
}
const own = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .85, metalness: 0, ...o });
const jit = (hex, a) => { const c = new THREE.Color(hex), h = {}; c.getHSL(h); c.setHSL(h.h, h.s, clamp(h.l * (1 + a))); return '#' + c.getHexString(); };
const M = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
const box = (w, h, d, m) => M(new THREE.BoxGeometry(w, h, d), m);
export const popS = s => s <= 0 ? 0 : s > 1.4 ? 1 : 1 - Math.exp(-s * 9) * Math.cos(s * 17);
export const riseS = s => s <= 0 ? 0 : s < .22 ? eo(s / .22) * 1.12 : 1 + .12 * Math.exp(-(s - .22) * 9) * Math.cos((s - .22) * 22);

export const PAL = {
  grass: '#6f9a6a', grass2: '#7aa673', earth: '#8a6c5a', earthD: '#6e5446', path: '#c9b89a',
  floor: '#c79a72', wall: '#e9e1f2', wallD: '#c9bfe0', bed: '#7c8fd6', sheet: '#f1eefa', pillow: '#fbf7ff',
  door: '#9a6a4a', pj: '#8fc3e8', pjD: '#6ea6d0', skin: '#f2c3a0', hair: '#4a3328', robe: '#e7a96a',
  warm: '#ffc676', asleep: '#6b73c9', awake: '#ffb05a',
  n1: '#c9c3f0', n2: '#9d97e0', n3: '#4b3fa8', rem: '#5fc2b8', tile: '#d8d2ee', tileD: '#b9b1de',
};
export const SET = { house: [0, 0], graph: [200, 0], brain: [400, 0], stats: [600, 0], trig: [800, 0] };

// —— hex island base: pointy-top hex columns, cap over a darker sunk side ——
function hexIsland(parent, cells, top, side, h = .5, gap = .06) {
  const g = new THREE.Group();
  const cap = new THREE.CylinderGeometry(1 - gap, 1 - gap, .08, 6), col = new THREE.CylinderGeometry(1 - gap, .9, h, 6);
  cells.forEach(([q, r], i) => {
    const x = SQ3 * (q + r / 2), z = 1.5 * r, j = (hash(i * 7.3 + q * 3.1 + r) - .5) * .08;
    const c = M(col, mat(side), false); c.position.set(x, -h / 2 - .05, z); g.add(c);
    const k = M(cap, mat(jit(top, j)), false); k.position.set(x, -.04, z); g.add(k);
  });
  parent.add(g); return g;
}
const hexDisc = R => { const out = []; for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.abs(q + r) <= R) out.push([q, r]); return out; };

// —— the person rig: legs, body, arms pivot; a head with eyes that can be open (white + pupil) or closed (a line) ——
export function makePerson(col, colD, o = {}) {
  const g = new THREE.Group(), s = o.s ?? 1;
  const skin = mat(PAL.skin, { emissive: '#7a4a32', emissiveIntensity: .45 }), cm = mat(col), cd = mat(colD);
  const hip = new THREE.Group(); hip.position.y = .42 * s; g.add(hip);
  const leg = side => { const p = new THREE.Group(); p.position.set(0, 0, side * .09 * s); const l = box(.14 * s, .42 * s, .14 * s, cd); l.position.y = -.21 * s; p.add(l);
    const f = box(.2 * s, .06 * s, .14 * s, mat('#3b3550')); f.position.set(.04 * s, -.42 * s, 0); p.add(f); hip.add(p); return p; };
  const LL = leg(1), LR = leg(-1);
  const torso = box(.26 * s, .44 * s, .34 * s, cm); torso.position.y = .22 * s; hip.add(torso);
  const stripe = box(.27 * s, .05 * s, .35 * s, cd); stripe.position.y = .3 * s; hip.add(stripe);
  const arm = side => { const p = new THREE.Group(); p.position.set(0, .4 * s, side * .22 * s); const a = box(.12 * s, .38 * s, .12 * s, cm); a.position.y = -.19 * s; p.add(a);
    const h = box(.11 * s, .1 * s, .11 * s, skin); h.position.y = -.42 * s; p.add(h); hip.add(p); return p; };
  const AL = arm(1), AR = arm(-1);
  const head = new THREE.Group(); head.position.y = .62 * s; hip.add(head);
  const hd = M(new THREE.IcosahedronGeometry(.17 * s, 1), skin); hd.scale.set(1, 1.05, 1); head.add(hd);
  const hair = M(new THREE.IcosahedronGeometry(.175 * s, 1), mat(o.hair || PAL.hair)); hair.scale.set(.85, .55, 1.02); hair.position.set(-.06 * s, .1 * s, 0); head.add(hair);
  // eyes on the +x face
  const eyes = new THREE.Group(); head.add(eyes);
  const open = new THREE.Group(), shut = new THREE.Group(); eyes.add(open, shut);
  [1, -1].forEach(side => {
    const w = box(.02 * s, .07 * s, .06 * s, mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: .25 })); w.position.set(.16 * s, .01 * s, side * .065 * s); open.add(w);
    const p = box(.022 * s, .04 * s, .03 * s, mat('#1d1b2e')); p.position.set(.165 * s, .0, side * .065 * s); open.add(p);
    const l = box(.02 * s, .015 * s, .065 * s, mat('#3b2a24')); l.position.set(.165 * s, -.005 * s, side * .065 * s); shut.add(l);
  });
  g.userData = { hip, LL, LR, AL, AR, head, open, shut, s };
  return g;
}
// pose: walk phase (radians), stride 0..1, arms forward 0..1, eyesOpen bool
export function posePerson(p, o = {}) {
  const u = p.userData, ph = o.phase ?? 0, st = o.stride ?? 0;
  u.LL.rotation.z = Math.sin(ph) * .55 * st; u.LR.rotation.z = -Math.sin(ph) * .55 * st;
  u.AL.rotation.z = -Math.sin(ph) * .35 * st + (o.reach ?? 0); u.AR.rotation.z = Math.sin(ph) * .35 * st + (o.reachR ?? o.reach ?? 0);
  u.hip.position.y = .42 * u.s + Math.abs(Math.cos(ph)) * .02 * st;
  u.head.rotation.z = o.nod ?? 0;
  u.open.visible = o.eyes !== false; u.shut.visible = o.eyes === false;
}

// ================================================================== HOUSE
function buildHouse(scene) {
  const G = new THREE.Group(); G.position.set(...[SET.house[0], 0, SET.house[1]]); scene.add(G);
  hexIsland(G, hexDisc(4).filter(([q, r]) => !(Math.abs(q) + Math.abs(r) + Math.abs(q + r) > 7)), PAL.grass, PAL.earth, .9);
  // floor (house spans x -3..3, z -2..2)
  const fl = box(6, .12, 4, mat(PAL.floor)); fl.position.set(0, .06, 0); G.add(fl);
  const wm = mat(PAL.wall), wd = mat(PAL.wallD);
  const wall = (w, h, d, x, z) => { const b = box(w, h, d, wm); b.position.set(x, .12 + h / 2, z); G.add(b); const c = box(w + .02, .06, d + .02, wd); c.position.set(x, .12 + h + .03, z); G.add(c); return b; };
  wall(6, 2.0, .14, 0, -2);            // back wall (full height)
  wall(.14, 2.0, 4, -3, 0);            // left wall (full height)
  wall(.14, .45, 1.9, 0, -1.05);       // interior wall, low cutaway, doorway at z 0.1..1.0
  wall(.14, .45, .8, 0, 1.6);
  wall(6, .35, .14, 0, 2);             // front wall, low cutaway
  wall(.14, .35, 1.6, 3, -1.2);        // right wall, low, with the front door gap at z 0.1..1.1
  wall(.14, .35, .8, 3, 1.6);
  // window in the back wall of the bedroom: emissive moonlit pane
  const win = box(1.0, .7, .05, own('#cfe0ff', { emissive: '#9fb8ff', emissiveIntensity: .7 })); win.position.set(-1.6, 1.35, -1.92); G.add(win);
  const winF = box(1.1, .08, .08, mat(PAL.wallD)); winF.position.set(-1.6, .98, -1.9); G.add(winF);
  // bed (head at -x), blanket, pillow
  const bed = new THREE.Group(); bed.position.set(-1.95, .12, -1.0); G.add(bed);
  const frame = box(1.7, .3, 1.0, mat(PAL.bed)); frame.position.y = .15; bed.add(frame);
  const head = box(.12, .7, 1.0, mat('#5f6fb8')); head.position.set(-.86, .35, 0); bed.add(head);
  const pillow = box(.34, .12, .6, mat(PAL.pillow)); pillow.position.set(-.6, .36, 0); bed.add(pillow);
  const blanket = box(1.0, .1, 1.04, mat(PAL.sheet)); blanket.position.set(.28, .35, 0); bed.add(blanket);
  // night light + rug + side table
  const lamp = M(new THREE.IcosahedronGeometry(.12, 0), own('#ffd9a0', { emissive: '#ffb860', emissiveIntensity: 1.6 })); lamp.position.set(-2.6, .62, .25); G.add(lamp);
  const tbl = box(.4, .45, .4, mat('#a8764e')); tbl.position.set(-2.6, .34, .25); G.add(tbl);
  const rug = box(1.6, .02, 1.2, mat('#c98fb4')); rug.position.set(1.4, .13, .3); G.add(rug);
  const sofa = box(1.5, .4, .55, mat('#7fb39f')); sofa.position.set(1.4, .32, -1.55); G.add(sofa);
  const sofaB = box(1.5, .5, .15, mat('#6a9c88')); sofaB.position.set(1.4, .6, -1.8); G.add(sofaB);
  // front door: frame posts + lintel at x=3, hinge at z=1.1
  const post = (z) => { const p = box(.16, 1.6, .12, mat(PAL.door)); p.position.set(3, .92, z); G.add(p); };
  post(.06); post(1.14); const lin = box(.16, .12, 1.2, mat(PAL.door)); lin.position.set(3, 1.72, .6); G.add(lin);
  const hinge = new THREE.Group(); hinge.position.set(3, .12, 1.08); G.add(hinge);
  const doorP = box(.08, 1.5, .98, mat('#b07a54')); doorP.position.set(0, .75, -.49); hinge.add(doorP);
  const knob = M(new THREE.IcosahedronGeometry(.05, 0), mat('#f2d27a')); knob.position.set(.06, .72, -.86); hinge.add(knob);
  // porch light
  const porch = M(new THREE.IcosahedronGeometry(.1, 0), own('#ffe1a8', { emissive: '#ffc070', emissiveIntensity: 0 })); porch.position.set(3.08, 1.9, 1.35); G.add(porch);
  // yard: path stones, trees, a fence
  for (let i = 0; i < 6; i++) { const s = M(new THREE.CylinderGeometry(.22, .24, .06, 6), mat(PAL.path), false); s.position.set(3.6 + i * .55, .02, .6 + i * .32); G.add(s); }
  const tree = (x, z, s) => { const tr = box(.14 * s, .6 * s, .14 * s, mat('#7a5236')); tr.position.set(x, .3 * s, z); G.add(tr);
    const c = M(new THREE.ConeGeometry(.55 * s, 1.2 * s, 6), mat('#3f6f63')); c.position.set(x, 1.1 * s, z); G.add(c);
    const c2 = M(new THREE.ConeGeometry(.42 * s, .9 * s, 6), mat('#4a7f70')); c2.position.set(x, 1.6 * s, z); G.add(c2); };
  tree(5.6, -1.6, 1.1); tree(-4.6, 2.3, .9); tree(6.4, 1.2, .8); tree(-1.5, 4.2, .85);
  for (let i = 0; i < 7; i++) { const f = box(.08, .4, .08, mat('#d9cbb0')); f.position.set(-3.6 + i * .55, .22, 3.4); G.add(f); }
  const rail = box(3.4, .06, .06, mat('#d9cbb0')); rail.position.set(-1.95, .36, 3.4); G.add(rail);
  // moon
  const moon = M(new THREE.IcosahedronGeometry(.9, 1), own('#fff6dc', { emissive: '#fff1c8', emissiveIntensity: 1.1 }), false); moon.position.set(-3, 9, -12); G.add(moon);
  // zZz cubes above the sleeper
  const zz = new THREE.Group(); G.add(zz);
  for (let i = 0; i < 3; i++) { const z = box(.16 + i * .05, .03, .03, own('#ffffff', { emissive: '#c8d4ff', emissiveIntensity: .8 })); zz.add(z); }
  // the sleepwalker and the parent
  const walker = makePerson(PAL.pj, PAL.pjD); G.add(walker);
  const parent = makePerson(PAL.robe, '#c98a4e', { s: 1.12, hair: '#6b4a34' }); G.add(parent);
  // memory bubble
  const bub = new THREE.Group(); G.add(bub);
  const bubM = own('#ffffff', { emissive: '#dfe6ff', emissiveIntensity: .5, transparent: true, opacity: .9 });
  const bb = M(new THREE.IcosahedronGeometry(.42, 1), bubM, false); bub.add(bb);
  [[-.38, -.45, .1], [-.55, -.7, .06]].forEach(([x, y, r]) => { const d = M(new THREE.IcosahedronGeometry(r, 0), bubM, false); d.position.set(0, y, x); bub.add(d); });
  const q = new THREE.Group(); bub.add(q);   // a question mark made of blocks
  const qm = mat('#6b73c9'); [[0, .14, .08], [0, .2, 0], [0, .14, -.08], [0, .06, -.08], [0, 0, 0], [0, -.08, 0]].forEach(([x, y, z]) => { const c = box(.06, .06, .06, qm); c.position.set(.4, y, z); q.add(c); });
  const qd = box(.06, .06, .06, qm); qd.position.set(.4, -.2, 0); q.add(qd);
  return { G, hinge, walker, parent, zz, bub, bubM, porch, lamp, win, blanket };
}
// walker path through the house (world-local x,z) and out into the yard
const HOOK_PATH = [[-1.55, -.3], [-.6, .55], [2.2, .55], [2.75, .6]];
const YARD_PATH = [[3.25, .6], [4.3, .95], [5.4, 1.45], [6.1, 1.9]];
function along(P, u) {
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let d = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = clamp(d / L[i]); const a = P[i], b = P[i + 1]; return { x: lerp(a[0], b[0], k), z: lerp(a[1], b[1], k), ang: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), len: tot }; } d -= L[i]; }
}
function updateHouse(H, t, shot) {
  const W = H.walker, P = H.parent;
  P.visible = shot === 'yard' || shot === 'bed';
  H.bub.visible = shot === 'walk2' && t >= T.bubble && t < T.bubblePop + .25;
  H.zz.visible = shot === 'house' && t >= T.zz;
  let eyes = true;
  if (shot === 'house') {
    if (t < T.stand) {   // lying in bed, then sitting up (pivot around the hips)
      const k = eio(seg(t, T.sit, T.stand));
      W.position.set(lerp(-1.25, -1.6, k), .45, lerp(-1.0, -.7, k));
      W.rotation.set(0, lerp(0, -.6, k), lerp(Math.PI / 2, 0, k));
      eyes = k > .5; posePerson(W, { eyes, stride: 0 });
      H.blanket.position.x = .28 + k * .2; H.blanket.rotation.z = k * .12;
    } else {
      const u = seg(t, T.walk0, T.walk1), p = along(HOOK_PATH, ss(u) * .3 + u * .7);
      const st = t < T.walk0 ? seg(t, T.stand, T.walk0) : 1 - seg(t, T.walk1 - .2, T.walk1);
      const sk = ss(seg(t, T.stand, T.walk0));
      W.position.set(t < T.walk0 ? lerp(-1.6, HOOK_PATH[0][0], sk) : p.x, t < T.walk0 ? lerp(.45, .12, sk) : .12, t < T.walk0 ? lerp(-.7, HOOK_PATH[0][1], sk) : p.z);
      W.rotation.set(0, t < T.walk0 ? -.6 : p.ang, 0);
      posePerson(W, { phase: (t - T.walk0) * 9, stride: clamp(st), reach: t > T.door - .35 && t < T.door + .4 ? -1.2 * ss(seg(t, T.door - .35, T.door)) * (1 - ss(seg(t, T.door + .1, T.door + .4))) : 0, reachR: 0, eyes: true });
    }
    const d = eio(seg(t, T.door, T.door + .45)); H.hinge.rotation.y = d * 1.6;
    // zZz rising over the walker's head
    H.zz.children.forEach((z, i) => { const s = t - T.zz - i * .25; z.visible = s > 0; z.position.set(W.position.x + .2 + i * .18, 1.4 + s * .4 + i * .18, W.position.z); z.rotation.y = .8; });
  } else if (shot === 'walk' || shot === 'eyes' || shot === 'walk2') {
    H.hinge.rotation.y = 1.6;
    const u = seg(t, 26.5, 34.75), p = along(YARD_PATH, u);
    W.position.set(p.x, .12, p.z); W.rotation.set(0, p.ang, 0);
    posePerson(W, { phase: (t - 26.5) * 6.2, stride: .8, reach: 0, eyes: true, nod: Math.sin(t * 1.3) * .05 });
    H.bub.position.set(p.x + .1, 2.0, p.z - .2);
    const k = popS((t - T.bubble) * 1.3) * (t > T.bubblePop ? 1 - ss(seg(t, T.bubblePop, T.bubblePop + .2)) : 1);
    H.bub.scale.setScalar(Math.max(.001, k * (t > T.bubblePop ? 1 + seg(t, T.bubblePop, T.bubblePop + .2) * .6 : 1)));
    H.bub.children[3].visible = t < T.bubblePop - .5;   // the question mark fades first: an empty bubble pops
    H.bub.lookAt(H.bub.position.x + 10, H.bub.position.y, H.bub.position.z + 10);
  } else if (shot === 'yard') {
    H.hinge.rotation.y = 1.6;
    const end = YARD_PATH[YARD_PATH.length - 1];
    W.position.set(end[0], .12, end[1]); W.rotation.set(0, Math.atan2(-(end[1] - 1.45), end[0] - 5.4), 0);
    posePerson(W, { stride: .15, phase: t * 2, eyes: true });
    // the parent comes out of the door to the walker, stops, raises a calm hand, then takes the walker's arm
    const pu = ss(seg(t, T.parent, T.parent + 1.5));
    const pp = along([[2.6, .6], [3.4, .7], [4.6, 1.2], [5.45, 1.55]], pu);
    P.position.set(pp.x, .12, pp.z); P.rotation.set(0, pu < 1 ? pp.ang : .2, 0);
    posePerson(P, { phase: (t - T.parent) * 8, stride: pu < 1 ? .9 : 0, reach: t > T.wakeNo ? -1.3 * ss(seg(t, T.wakeNo, T.wakeNo + .4)) : 0, reachR: 0, eyes: true });
  } else if (shot === 'bed') {
    H.hinge.rotation.y = lerp(1.6, 0, ss(seg(t, T.guide, T.guide + .8)));
    // tucked back into bed: lying down, eyes shut, blanket returns
    const k = eio(seg(t, T.guide, T.liedown));
    W.position.set(lerp(-1.6, -1.25, k), lerp(.12, .45, k), lerp(-.3, -1.0, k)); W.rotation.set(0, lerp(-.6, 0, k), lerp(0, Math.PI / 2, k));
    posePerson(W, { eyes: false, stride: 0 });
    H.blanket.position.x = .48 - .2 * k; H.blanket.rotation.z = .12 * (1 - k);
    P.position.set(-1.2, .12, .15); P.rotation.set(0, 2.3, 0);
    posePerson(P, { reach: -.9 * (1 - ss(seg(t, T.liedown + .3, T.liedown + 1.2))), eyes: true });
  }
  H.porch.material.emissiveIntensity = shot === 'house' ? ss(seg(t, T.door, T.door + .3)) * 1.6 : shot === 'bed' ? 1.6 * (1 - ss(seg(t, 55, 56.5))) : 1.6;
  if (shot !== 'house' && shot !== 'bed') { H.blanket.position.x = .48; H.blanket.rotation.z = .12; }
  if (shot !== 'house') H.zz.visible = false;
}

// ================================================================== GRAPH: one night as hex columns, bedtime → morning
// 24 columns × 20 min. Stage per column: 1 = N1, 2 = N2, 3 = N3 (slow-wave), R = REM. Deepest sleep crowds into the first third.
export const NIGHT = [1, 2, 3, 3, 3, 2, 'R', 2, 3, 3, 2, 'R', 2, 2, 3, 2, 'R', 2, 2, 'R', 2, 2, 'R', 1];
function buildGraph(scene) {
  const G = new THREE.Group(); G.position.set(SET.graph[0], 0, SET.graph[1]); scene.add(G);
  const cells = []; for (let q = -3; q <= 3; q++) for (let r = -4; r <= 4; r++) cells.push([q - Math.floor(r / 2), r]);
  hexIsland(G, cells, '#3a3a6a', '#2a2850', .6);
  const cols = [];
  NIGHT.forEach((s, i) => {
    const h = s === 'R' ? .9 : s * .95 + .15, col = s === 'R' ? PAL.rem : [null, PAL.n1, PAL.n2, PAL.n3][s];
    const m = own(col, { emissive: col, emissiveIntensity: 0 });
    const c = M(new THREE.CylinderGeometry(.42, .42, h, 6), m); c.userData = { h, s, m }; c.position.set(((i % 8) - 3.5) * .92, h / 2, (Math.floor(i / 8) - 1) * 4.2); G.add(c); cols.push(c);
  });
  // the "first third" bracket (cols 0-7) and a tiny sleepwalker on the deepest early column
  const br = box(8 * .92, .06, .12, own('#ffd27a', { emissive: '#ffc060', emissiveIntensity: 1.4 })); br.position.set(0, .05, -4.2 + .8); G.add(br);
  const icon = makePerson(PAL.pj, PAL.pjD, { s: .9 }); icon.position.set((3 - 3.5) * .92, 3 * .95 + .15, -4.2); icon.rotation.y = -.6; G.add(icon);
  return { G, cols, br, icon };
}
function updateGraph(Gr, t) {
  Gr.cols.forEach((c, i) => {
    const s = t - (T.cols0 + i * T.colStep), k = riseS(s * 1.4);
    c.scale.y = Math.max(.001, k); c.position.y = c.userData.h * k / 2; c.visible = k > 0.001;
    const deep = c.userData.s === 3;
    c.userData.m.emissiveIntensity = deep ? ss(seg(t, T.n3, T.n3 + .4)) * (.55 + .2 * Math.sin(t * 4 + i)) : 0;
  });
  const b = popS((t - T.third) * 1.2); Gr.br.scale.set(Math.max(.001, b), 1, 1); Gr.br.visible = b > 0;
  const k = popS((t - T.walkerIcon) * 1.4); Gr.icon.scale.setScalar(Math.max(.001, k)); Gr.icon.visible = k > 0;
  posePerson(Gr.icon, { phase: t * 7, stride: .8, eyes: true });
}

// ================================================================== BRAIN (front = +x)
// regions classified on the unit sphere before the ellipsoid scale; two hemispheres with a fissure gap
const REG = {
  frontal: ([x, y]) => x > .3 && y > -.35,
  motor: ([x, y]) => x > .02 && x <= .3 && y > 0,
  parietal: ([x, y]) => x > -.6 && x <= .02 && y > .05,
  occipital: ([x]) => x <= -.6,
  temporal: () => true,
};
function regionOf(c) { for (const k of ['frontal', 'motor', 'parietal', 'occipital']) if (REG[k](c)) return k; return 'temporal'; }
function buildBrain(scene) {
  const G = new THREE.Group(); G.position.set(SET.brain[0], 0, SET.brain[1]); scene.add(G);
  hexIsland(G, hexDisc(3), '#3a3a6a', '#2a2850', .7);
  const ped = M(new THREE.CylinderGeometry(1.2, 1.5, .5, 6), mat('#4a4880')); ped.position.y = .25; G.add(ped);
  const root = new THREE.Group(); root.position.y = 2.15; G.add(root);
  const src = new THREE.IcosahedronGeometry(1, 3).toNonIndexed(), pos = src.attributes.position;
  const buckets = {};
  for (let f = 0; f < pos.count; f += 3) {
    const v = [0, 1, 2].map(k => [pos.getX(f + k), pos.getY(f + k), pos.getZ(f + k)]);
    const c = [0, 1, 2].map(a => (v[0][a] + v[1][a] + v[2][a]) / 3);
    const hemi = c[2] >= 0 ? 'L' : 'R', key = regionOf(c) + hemi;
    (buckets[key] = buckets[key] || []).push(...v.flat().map((x, i) => {
      const a = i % 3; let val = x;
      if (a === 0) val *= 1.55; if (a === 1) val = val * 1.05 + (val < 0 ? val * .15 : 0); if (a === 2) val *= 1.15;
      // gyri: a little deterministic bumpiness
      return val * (1 + (hash(f * 3.1 + i) - .5) * .05);
    }));
  }
  const parts = {};
  for (const [key, arr] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals();
    const reg = key.slice(0, -1), hemi = key.slice(-1);
    const m = own('#a8a3d8', { emissive: PAL.asleep, emissiveIntensity: 0 });
    const mesh = M(g, m); mesh.userData = { reg, hemi, m };
    mesh.position.z = hemi === 'L' ? .05 : -.05; root.add(mesh); (parts[reg] = parts[reg] || []).push(mesh);
  }
  const cb = M(new THREE.IcosahedronGeometry(.62, 1), own('#9a94cc', { emissive: PAL.asleep, emissiveIntensity: 0 })); cb.scale.set(1, .6, 1.25); cb.position.set(-1.05, -.82, 0); root.add(cb);
  const stem = M(new THREE.CylinderGeometry(.22, .28, 1.1, 6), mat('#8e88c0')); stem.position.set(-.45, -1.2, 0); stem.rotation.z = -.25; root.add(stem);
  // slow "delta" rings over the frontal lobe; fast sparks over the motor strip
  const rings = [], ringM = [];
  for (let i = 0; i < 3; i++) { const m = new THREE.MeshBasicMaterial({ color: '#9aa4ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); const r = M(new THREE.TorusGeometry(1, .025, 4, 24), m, false); r.rotation.y = Math.PI / 2; r.position.set(1.5, .25, 0); root.add(r); rings.push(r); ringM.push(m); }
  const sparks = [];
  for (let i = 0; i < 14; i++) { const s = M(new THREE.IcosahedronGeometry(.07, 0), own('#ffe2a8', { emissive: '#ffb050', emissiveIntensity: 2 }), false); root.add(s); sparks.push(s); }
  return { G, root, parts, cb, rings, ringM, sparks };
}
function updateBrain(B, t) {
  B.root.rotation.y = t < 19.5 ? lerp(1.1, -.3, ss(seg(t, 14.25, 19.5))) : t < 21.6 ? -.3 : lerp(-.3, -.55, ss(seg(t, 21.6, 26.5)));
  const sleepAll = ss(seg(t, T.together, T.together + .6));
  const split = seg(t, T.split, T.split + .5), sp = Math.sin(split * Math.PI) * .12;
  const motor = ss(seg(t, T.motor, T.motor + .35)), front = ss(seg(t, T.frontal, T.frontal + .4));
  const delta = .5 + .5 * Math.sin((t - T.frontal) * TAU * .9);       // ~1 Hz slow wave
  for (const [reg, arr] of Object.entries(B.parts)) arr.forEach(m => {
    const u = m.userData;
    let col = '#a8a3d8', em = PAL.asleep, ei = sleepAll * (.35 + .12 * Math.sin(t * 2.2));
    if (reg === 'motor' && t >= T.motor) { col = lerp(0, 1, motor) > .5 ? '#ffc98a' : '#a8a3d8'; em = PAL.awake; ei = lerp(ei, 1.1 + .25 * Math.sin(t * 40), motor); }
    if ((reg === 'frontal' || reg === 'parietal') && t >= T.frontal) { col = front > .5 ? '#5a5fc0' : col; em = '#4a58ff'; ei = lerp(ei, .15 + 1.25 * delta, front); }
    u.m.color.set(col); u.m.emissive.set(em); u.m.emissiveIntensity = ei;
    // the split: the regions part a little, then settle apart by a hair
    const off = sp + (t > T.split + .5 ? .03 : 0);
    m.position.y = reg === 'motor' ? off * .8 : reg === 'frontal' ? off * .3 : 0;
    m.position.x = reg === 'frontal' ? off : reg === 'occipital' ? -off : 0;
  });
  B.cb.material.emissiveIntensity = sleepAll * .3;
  B.rings.forEach((r, i) => {
    const ph = ((t - T.delta) * .9 + i / 3) % 1, on = t > T.delta ? 1 : 0;
    r.scale.setScalar(.6 + ph * 1.1); B.ringM[i].opacity = on * (1 - ph) * .9; r.visible = on && B.ringM[i].opacity > .02;
  });
  B.sparks.forEach((s, i) => {
    const on = t > T.motor + .1, f = Math.floor(t * 12 + i * 3.7);
    const a = hash(f * 1.3 + i) * TAU, x = .1 + hash(f + i * 9) * .25;
    s.position.set(x * 1.55, .95 + hash(f * 2.1 + i) * .1, Math.sin(a) * 1.05); s.visible = on && hash(f * 7.7 + i) > .35;
  });
}

// ================================================================== STATS: two 10×10 grids (children top, adults bottom)
function grid10(G, z0, lit, halfLit, col) {
  const tiles = [];
  for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) {
    const x = SQ3 * (q + (r % 2) / 2) * .5 - 4.1, z = z0 + r * .75;
    const idx = r * 10 + q, isLit = lit.includes(idx), isHalf = idx === halfLit;
    const m = own(PAL.tile, { emissive: col, emissiveIntensity: 0 });
    const t = M(new THREE.CylinderGeometry(.46, .46, .25, 6), m); t.position.set(x, .125, z); G.add(t);
    tiles.push({ t, m, isLit, isHalf, x, z });
    if (isHalf) {   // half a tile: a half-hex prism of the lit colour on top of a pale tile
      const hm = own(col, { emissive: col, emissiveIntensity: 0 });
      const h = M(new THREE.CylinderGeometry(.46, .46, .3, 6, 1, false, 0, Math.PI), hm); h.position.set(x, .125, z); G.add(h); tiles[tiles.length - 1].half = { h, hm };
    }
  }
  return tiles;
}
function buildStats(scene) {
  const G = new THREE.Group(); G.position.set(SET.stats[0], 0, SET.stats[1]); scene.add(G);
  const cells = []; for (let q = -6; q <= 6; q++) for (let r = -10; r <= 10; r++) cells.push([q - Math.floor(r / 2), r]);
  hexIsland(G, cells, '#3a3a6a', '#2a2850', .6);
  const kids = grid10(G, -9.2, [44, 45, 54, 55, 46], -1, '#ffb05a');
  const adults = grid10(G, 2.2, [55], 56, '#ffb05a');
  return { G, kids, adults };
}
function updateStats(S, t) {
  const upd = (tiles, t0) => tiles.forEach((o, i) => {
    const base = popS((t - 34.9 - (i % 10) * .02 - Math.floor(i / 10) * .03) * 1.6);
    const lit = o.isLit ? riseS((t - t0 - tiles.filter(x => x.isLit).indexOf(o) * .12) * 1.3) : 0;
    o.t.scale.set(Math.max(.001, base), 1 + lit * 2.2, Math.max(.001, base)); o.t.position.y = .125 * (1 + lit * 2.2);
    if (o.isLit) { o.m.color.set(lit > .2 ? '#ffd29a' : PAL.tile); o.m.emissiveIntensity = lit * .9; }
    if (o.half) { const k = riseS((t - t0 - .3) * 1.3); o.half.h.scale.set(Math.max(.001, base), 1 + k * 2.2, Math.max(.001, base)); o.half.h.position.y = .15 * (1 + k * 2.2) + .005; o.half.hm.emissiveIntensity = k * .9; o.half.h.visible = k > .01; }
  });
  upd(S.kids, T.kids); upd(S.adults, T.adults);
}

// ================================================================== TRIGGERS: five tiles, each with a little object
export const TSPOTS = [[-1.4, -4.8], [1.4, -2.4], [-1.4, 0], [1.4, 2.4], [-1.4, 4.8]];
function buildTrig(scene) {
  const G = new THREE.Group(); G.position.set(SET.trig[0], 0, SET.trig[1]); scene.add(G);
  const cells = []; for (let q = -4; q <= 4; q++) for (let r = -7; r <= 7; r++) cells.push([q - Math.floor(r / 2), r]);
  hexIsland(G, cells, '#3a3a6a', '#2a2850', .6);
  const spots = TSPOTS;
  const items = spots.map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); G.add(g);
    const ped = M(new THREE.CylinderGeometry(1.1, 1.2, .5, 6), mat('#5a5794')); ped.position.y = .25; g.add(ped); const top = new THREE.Group(); top.position.y = .5; g.add(top); return { g, top }; });
  // family: three people of three sizes
  [[-.45, 1.0, PAL.robe, '#c98a4e'], [.05, .85, '#b9a6e6', '#9a86d0'], [.48, .6, PAL.pj, PAL.pjD]].forEach(([x, s, a, b]) => { const p = makePerson(a, b, { s }); p.position.set(x, 0, .1); p.rotation.y = .9; posePerson(p, { eyes: true }); items[0].top.add(p); });
  // lack of sleep: a clock with hands near 3 a.m.
  { const g = items[1].top; const f = M(new THREE.CylinderGeometry(.6, .6, .18, 12), mat('#f4efe2')); f.rotation.x = Math.PI / 2; f.position.y = .75; g.add(f);
    const rim = M(new THREE.TorusGeometry(.6, .07, 4, 12), mat('#c9504a')); rim.position.y = .75; g.add(rim);
    const h1 = box(.06, .32, .04, mat('#2a2440')); h1.position.set(.1, .75 + .0, .12); h1.rotation.z = -Math.PI / 2 + .0; h1.geometry.translate(0, .14, 0); g.add(h1);
    const h2 = box(.04, .45, .04, mat('#2a2440')); h2.position.set(0, .75, .13); h2.geometry.translate(0, .2, 0); g.add(h2);
    [-1, 1].forEach(s => { const b = M(new THREE.IcosahedronGeometry(.15, 0), mat('#c9504a')); b.position.set(s * .4, 1.42, 0); g.add(b); });
    const leg = box(.08, .3, .08, mat('#2a2440')); leg.position.set(-.3, .1, 0); g.add(leg); const leg2 = leg.clone(); leg2.position.x = .3; g.add(leg2); }
  // stress: a storm cloud with a lightning bolt
  { const g = items[2].top; const cm = mat('#7d7fa8'); [[0, .9, 0, .45], [-.42, .78, .1, .34], [.42, .8, -.05, .36], [.1, 1.12, .05, .32]].forEach(([x, y, z, r]) => { const c = M(new THREE.IcosahedronGeometry(r, 0), cm); c.position.set(x, y, z); g.add(c); });
    const bolt = M(new THREE.ConeGeometry(.14, .55, 3), own('#ffe066', { emissive: '#ffd000', emissiveIntensity: 1.5 })); bolt.position.set(.05, .3, .1); bolt.rotation.z = Math.PI + .3; g.add(bolt); }
  // fever: a thermometer
  { const g = items[3].top; const tube = M(new THREE.CylinderGeometry(.11, .11, 1.3, 6), own('#f4efe2', { transparent: false })); tube.position.y = 1.0; tube.rotation.z = .25; g.add(tube);
    const red = M(new THREE.CylinderGeometry(.06, .06, .95, 6), own('#e0483a', { emissive: '#e0483a', emissiveIntensity: .6 })); red.position.set(.04, .85, 0); red.rotation.z = .25; g.add(red);
    const bulb = M(new THREE.IcosahedronGeometry(.2, 1), own('#e0483a', { emissive: '#e0483a', emissiveIntensity: .6 })); bulb.position.set(.13, .38, 0); g.add(bulb); }
  // some medicines: a two-colour capsule and a round pill
  { const g = items[4].top; const a = M(new THREE.CylinderGeometry(.2, .2, .45, 8), mat('#ffffff')); a.rotation.z = Math.PI / 2; a.position.set(-.22, .45, 0); g.add(a);
    const b = M(new THREE.CylinderGeometry(.2, .2, .45, 8), mat('#4fb5a8')); b.rotation.z = Math.PI / 2; b.position.set(.23, .45, 0); g.add(b);
    [-.45, .46].forEach((x, i) => { const c = M(new THREE.IcosahedronGeometry(.2, 1), mat(i ? '#4fb5a8' : '#ffffff')); c.position.set(x, .45, 0); g.add(c); });
    const p = M(new THREE.CylinderGeometry(.24, .24, .1, 10), mat('#f2d27a')); p.position.set(.1, .06, .55); g.add(p); }
  return { G, items };
}
function updateTrig(R, t) {
  [T.fam, T.lack, T.stress, T.fever, T.meds].forEach((t0, i) => {
    const it = R.items[i], k = popS((t - t0) * 1.3), r = riseS((t - t0 + .12) * 1.5);
    it.g.visible = r > 0; it.g.position.y = (r - 1) * .8; it.top.scale.setScalar(Math.max(.001, k)); it.top.rotation.y = .5 + Math.sin(t * .8 + i) * .15;
  });
}

// ================================================================== API
export function buildWorld(scene) {
  const H = buildHouse(scene), Gr = buildGraph(scene), B = buildBrain(scene), S = buildStats(scene), R = buildTrig(scene);
  const sets = { house: H.G, graph: Gr.G, brain: B.G, stats: S.G, trig: R.G };
  const SETOF = { house: 'house', walk: 'house', eyes: 'house', walk2: 'house', yard: 'house', bed: 'house', graph: 'graph', brain: 'brain', stats: 'stats', trig: 'trig' };
  return {
    H, Gr, B, S, R, sets,
    update(t, shot) {
      const s = SETOF[shot]; for (const [k, g] of Object.entries(sets)) g.visible = k === s;
      if (s === 'house') updateHouse(H, t, shot); else if (s === 'graph') updateGraph(Gr, t); else if (s === 'brain') updateBrain(B, t); else if (s === 'stats') updateStats(S, t); else updateTrig(R, t);
      return s;
    },
  };
}

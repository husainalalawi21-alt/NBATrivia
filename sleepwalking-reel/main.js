// How Sleepwalking Works — renderer, per-shot orthographic cameras, lights, 2D layer (captions, labels, title), event export.
import * as THREE from 'three';
import { clamp, seg, ss, eio, eo, lerp } from '/core/lib.js';
import { DUR, VO, SHOTS, SKY, T, shotAt, SOURCES } from './story.js';
import { makePost } from './post.js';
import { buildWorld, SET, NIGHT, TSPOTS } from './world.js';

const W = 1080, H = 1920, QS = new URLSearchParams(location.search), DEG = Math.PI / 180;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-5, 5, 9, -9, 1, 2000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') ?? 1), aoRadius: .5, aoScale: 1.4, aoThickness: .8 });
post.bloom.threshold = .8; post.bloom.radius = .5;
const world = buildWorld(scene);
const hemi = new THREE.HemisphereLight('#5b6aa8', '#2a2440', .55); scene.add(hemi);
const sun = new THREE.DirectionalLight('#9fb4ff', .9); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 120 }); sun.shadow.camera.updateProjectionMatrix();
scene.add(sun, sun.target);
const fill = new THREE.PointLight('#ffb860', 0, 6, 1.6); scene.add(fill);   // the bedroom night light

const C = h => new THREE.Color(h);
const SK = SKY.map(k => ({ t: k[0], zen: C(k[1]), hor: C(k[2]), sun: C(k[3]), sunI: k[4], hs: C(k[5]), hg: C(k[6]), hI: k[7], el: k[8], az: k[9], night: k[10] }));
function skyAt(t) {
  let i = 0; while (i < SK.length - 2 && t > SK[i + 1].t) i++;
  const a = SK[i], b = SK[i + 1], u = ss(seg(t, a.t, b.t)), o = {};
  for (const k of ['zen', 'hor', 'sun', 'hs', 'hg']) o[k] = a[k].clone().lerp(b[k], u);
  for (const k of ['sunI', 'hI', 'el', 'az', 'night']) o[k] = lerp(a[k], b[k], u);
  return o;
}
const off = name => SET[name] ? [SET[name][0], 0, SET[name][1]] : [0, 0, 0];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const wpos = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return [v.x, v.y, v.z]; };

// —— cameras ——
let CAM = {};
function cam(t) {
  const [t0, t1, name] = shotAt(t), u = seg(t, t0, t1), H_ = world.H;
  let tg = [0, 0, 0], az = 35, el = 32, fh = 10;
  if (name === 'house') {
    const wp = wpos(H_.walker), k = ss(seg(t, 1.0, 4.0));
    tg = add3(off('house'), [0, .9, 0]); tg = [lerp(tg[0], wp[0] + .4, k * .7), lerp(.9, 1.1, k), lerp(tg[2], wp[2], k * .5)];
    az = lerp(52, 44, u); el = lerp(36, 30, u); fh = lerp(13.5, 8.8, ss(seg(t, .5, 4.4)));
  } else if (name === 'graph') {
    // the row runs from bedtime (near, bottom) to morning (far, top): truck along it as it grows, then pull out to the whole night
    // the night reads like three lines of text: first third (top), middle, last third (bottom)
    tg = add3(off('graph'), [0, 1.0, .4]); az = 0; el = 34; fh = lerp(14.2, 15.2, u);
  } else if (name === 'brain') {
    const root = world.B.root; let p = [0, 0, 0];
    const z1 = ss(seg(t, 19.3, 20.2)), z2 = ss(seg(t, 21.6, 22.6));
    const pm = new THREE.Vector3(.25, .9, .0), pf = new THREE.Vector3(.75, .55, .2);
    root.updateMatrixWorld(); const m = root.localToWorld(pm.clone()), f = root.localToWorld(pf.clone()), c = root.localToWorld(new THREE.Vector3(0, 0, 0));
    p = [lerp(lerp(c.x, m.x, z1), f.x, z2), lerp(lerp(c.y, m.y, z1), f.y, z2), lerp(lerp(c.z, m.z, z1), f.z, z2)];
    tg = p; az = lerp(10, 18, u); el = lerp(16, 24, z1); fh = lerp(lerp(6.6, 4.6, z1), 5.6, z2);
  } else if (name === 'walk' || name === 'walk2') {
    const wp = wpos(H_.walker); tg = [wp[0] + .3, wp[1] + 1.0, wp[2]]; az = name === 'walk' ? lerp(150, 160, u) : lerp(160, 172, u); el = 22; fh = name === 'walk' ? 4.6 : lerp(5.2, 6.2, u);
  } else if (name === 'eyes') {
    const hd = wpos(H_.walker.userData.head), th = H_.walker.rotation.y;
    tg = [hd[0], hd[1] + .02, hd[2]]; az = Math.atan2(Math.cos(th), -Math.sin(th)) / DEG + 28; el = 10; fh = lerp(1.25, 1.1, u);
  } else if (name === 'stats') {
    tg = add3(off('stats'), [0, 0, 1.6]); az = 0; el = 62; fh = lerp(29.5, 29, u);
  } else if (name === 'trig') {
    tg = add3(off('trig'), [0, .8, 1.5]); az = 0; el = 42; fh = lerp(14, 13.5, u);
  } else if (name === 'yard') {
    tg = add3(off('house'), [4.6, .9, 1.2]); az = lerp(40, 46, u); el = 28; fh = lerp(6.4, 6.0, u);
  } else {   // bed: tucked in, then pull back as dawn floods the island
    const k = ss(seg(t, T.dawn0, T.dawn1 + .4));
    tg = add3(off('house'), [lerp(-1.6, .4, k), lerp(.8, .6, k), lerp(-.7, .6, k)]); az = lerp(38, 46, k); el = lerp(34, 38, k); fh = lerp(5.6, 15.5, k);
  }
  const D = Math.max(300, fh * 3), ce = Math.cos(el * DEG);
  camera.position.set(tg[0] + D * ce * Math.sin(az * DEG), tg[1] + D * Math.sin(el * DEG), tg[2] + D * ce * Math.cos(az * DEG));
  camera.up.set(0, 1, 0); camera.lookAt(tg[0], tg[1], tg[2]);
  const fw = fh * W / H; camera.left = -fw / 2; camera.right = fw / 2; camera.top = fh / 2; camera.bottom = -fh / 2; camera.near = 1; camera.far = D + fh * 5 + 800; camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const cot = 1 / Math.tan(el * DEG);
  post.comp.camDist.value = D; post.comp.hz0.value = .25 * fh * cot; post.comp.hz1.value = .7 * fh * cot;
  post.tilt.fy.value = .5; post.tilt.band.value = .34;
  CAM = { tg, az, el, fh, name };
}
const proj = p => { const v = new THREE.Vector3(...p).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };

// —— 2D layer ——
const ov = document.getElementById('ov'), g = ov.getContext('2d');
let DURS = {}; try { const r = await fetch('voices/dur.json'); if (r.ok) DURS = await r.json(); } catch (e) { }
const voDur = v => DURS[v.id] ?? v.text.length * .065;
export const subSpan = v => { const i = VO.indexOf(v), nx = VO[i + 1]; let b = v.t + Math.max(1.8, voDur(v) + .6); if (nx) b = Math.min(b, nx.t - .05); else b = Math.min(b, T.end - .05); return [v.t - .05, b]; };
let TX = null;
function hexIcon(x, y, s, top) {
  const P = a => [x + Math.cos(a) * s, y + Math.sin(a) * s * .58], pts = [0, 1, 2, 3, 4, 5].map(i => P(i * Math.PI / 3)), dy = s * .55;
  g.save(); g.fillStyle = '#4a4880'; g.beginPath(); g.moveTo(...pts[0]); [0, 1, 2, 3].forEach(i => g.lineTo(pts[i][0], pts[i][1] + dy)); g.lineTo(...pts[3]); g.closePath(); g.fill();
  g.fillStyle = top; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill(); g.restore();
}
function wrap(text, font, maxW) { g.font = font; const out = []; let cur = ''; for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } } if (cur) out.push(cur); return out; }
function tracked(text, x, y, track, align = 'center') {
  const ws = [...text].map(ch => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + track * (text.length - 1);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; const x0 = cx;
  [...text].forEach((ch, i) => { g.fillText(ch, cx, y); cx += ws[i] + track; }); return [x0, x0 + tot];
}
// a label: letters rise from under a short waterline, then hold; anchored to a projected world point
function label(t, t0, t1, text, x, y, o = {}) {
  if (t < t0 || t >= t1) return;
  const a = ss(seg(t, t0, t0 + .25)) * (1 - ss(seg(t, t1 - .2, t1)));
  const px = o.px || 40;
  g.save(); g.globalAlpha = a; g.font = `700 ${px}px "Josefin Sans"`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.shadowColor = 'rgba(10,12,40,.65)'; g.shadowBlur = 16; g.shadowOffsetY = 3; g.fillStyle = o.color || '#ffffff';
  const rise = (1 - eo(seg(t, t0, t0 + .3))) * px;
  g.beginPath(); g.rect(0, y - px * 1.2, W, px * 1.5); g.clip();
  const [x0, x1] = tracked(text, x, y + rise, o.track ?? 5, o.align || 'center');
  g.restore();
  if (o.sub) { g.save(); g.globalAlpha = a; g.font = `500 ${o.subPx || 26}px Quicksand`; g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = o.align === 'left' ? 'left' : 'center'; g.shadowColor = 'rgba(10,12,40,.6)'; g.shadowBlur = 10; g.fillText(o.sub, o.align === 'left' ? x : x, y + (o.subPx || 26) * 1.5); g.restore(); }
  if (TX && a >= .999) TX.push({ id: o.id || text, text, x0: Math.max(0, x0), y0: y - px, x1: Math.min(W, x1), y1: y + 8 });
}
function title(t, t0, y, alpha) {
  const TXT = ['HOW SLEEPWALKING', 'WORKS'];
  g.save(); g.globalAlpha = alpha; g.font = '700 74px "Josefin Sans"'; g.textBaseline = 'alphabetic'; g.fillStyle = '#ffffff';
  g.shadowColor = 'rgba(10,12,40,.6)'; g.shadowBlur = 20; g.shadowOffsetY = 4;
  TXT.forEach((line, li) => {
    const ly = y + li * 92, ws = [...line].map(c => g.measureText(c).width), tr = 12, tot = ws.reduce((a, b) => a + b, 0) + tr * (line.length - 1);
    let cx = W / 2 - tot / 2;
    g.save(); g.beginPath(); g.rect(0, ly - 90, W, 104); g.clip();
    [...line].forEach((ch, i) => { const s = t - (t0 + (li * 16 + i) * .03); if (s >= 0) { const off = s < .25 ? 90 * Math.pow(1 - s / .25, 2) : -Math.sin((s - .25) * 14) * Math.exp(-(s - .25) * 8) * 8; g.fillText(ch, cx, ly + off); } cx += ws[i] + tr; });
    g.restore();
  });
  g.restore();
  if (TX && t > t0 + .8 && alpha >= .999) TX.push({ id: 'title', text: TXT.join(' '), x0: 140, y0: y - 74, x1: 940, y1: y + 100 });
}
function hud(t) {
  g.clearRect(0, 0, W, H);
  const [, , name] = shotAt(t), wb = world;
  // —— labels, anchored to the world ——
  if (name === 'house' && t >= T.title[0]) title(t, T.title[0], 300, 1 - ss(seg(t, T.title[1] - .3, T.title[1])));
  if (name === 'graph') {
    const rowY = r => proj(add3(off('graph'), [-3.9, .2, (r - 1) * 4.2]))[1];
    const rows = [['FIRST THIRD', 'of the night'], ['MIDDLE', ''], ['LAST THIRD', '']];
    rows.forEach(([a, b], r) => label(t, T.cols0 + r * 8 * T.colStep + .2, 14.2, a, 70, rowY(r) + 60, { px: 28, align: 'left', id: 'row' + r, color: r === 0 && t >= T.third ? '#ffd27a' : '#ffffff', track: 3 }));
    const d = proj(add3(off('graph'), [1.4, 3.3, -4.2]));
    label(t, T.n3, 14.2, 'DEEP SLEEP · N3', W / 2, d[1] - 70, { color: '#c8c2ff', id: 'n3', sub: 'slow-wave sleep: where sleepwalking starts' });
    label(t, T.cols0, 14.2, 'ONE NIGHT OF SLEEP', W / 2, 150, { px: 30, id: 'night', sub: 'taller = deeper sleep', subPx: 26 });
  }
  if (name === 'brain') {
    label(t, T.together, 19.2, 'THE WHOLE BRAIN ASLEEP', W / 2, 330, { color: '#c8c2ff', id: 'all' });
    label(t, T.motor, 26.5, 'MOVEMENT', W / 2, 300, { color: '#ffc98a', px: 46, id: 'mv', sub: 'motor areas · AWAKE', subPx: 30 });
    label(t, T.frontal, 26.5, 'JUDGMENT & AWARENESS', W / 2, 1300, { color: '#aab3ff', px: 40, id: 'ja', sub: 'frontal and parietal areas · DEEP SLEEP', subPx: 28 });
  }
  if (name === 'eyes') label(t, T.eyes, 30.75, 'EYES OPEN', W / 2, 360, { px: 50, id: 'eyes' });
  if (name === 'walk2') label(t, T.bubble, 34.75, 'LITTLE OR NO MEMORY', W / 2, 330, { color: '#c8c2ff', id: 'mem' });
  if (name === 'stats') {
    const k = proj(add3(off('stats'), [0, 0, -9.8])), a = proj(add3(off('stats'), [0, 0, 1.6]));
    label(t, 35.4, 42.9, 'SLEEPWALKED IN THE PAST YEAR', W / 2, 140, { px: 30, id: 'hdr', sub: 'each tile = 1 in 100 people', subPx: 26 });
    label(t, T.kids, 42.9, 'CHILDREN  5%', W / 2, k[1] - 22, { color: '#ffd29a', px: 46, id: 'kids' });
    label(t, T.adults - .2, 42.9, 'ADULTS  1.5%', W / 2, a[1] - 22, { color: '#ffd29a', px: 46, id: 'adults' });
    label(t, 36.0, 42.9, 'Meta-analysis of 51 studies · Stallman & Kohler, 2016', W / 2, 1720, { px: 22, track: 1, id: 'src' });
  }
  if (name === 'trig') {
    const spots = TSPOTS, names = ['RUNS IN FAMILIES', 'LACK OF SLEEP', 'STRESS', 'FEVER', 'SOME MEDICINES'];
    [T.fam, T.lack, T.stress, T.fever, T.meds].forEach((t0, i) => { const p = proj(add3(off('trig'), [spots[i][0], 1.1, spots[i][1]])); const left = spots[i][0] < 0;
      label(t, t0 + .1, 50.0, names[i], left ? p[0] + 150 : p[0] - 150, p[1] + 12, { px: 34, align: left ? 'left' : 'right', id: 'tr' + i, color: i ? '#ffffff' : '#ffd29a' }); });
    label(t, 43.2, 50.0, 'WHAT RAISES THE ODDS', W / 2, 140, { px: 30, id: 'odds' });
  }
  if ((name === 'yard' || name === 'bed') && t < T.end) label(t, T.wakeNo, T.end, "DON'T WAKE · GUIDE BACK TO BED", W / 2, 330, { px: 38, track: 3, id: 'nowake' });
  if (t >= T.end) {
    title(t, T.end, 360, 1);
    g.save(); g.globalAlpha = ss(seg(t, T.end + .6, T.end + 1.2)); g.font = '500 22px Quicksand'; g.fillStyle = 'rgba(40,40,70,.9)'; g.textAlign = 'center';
    g.fillText('Sources', W / 2, 1640); SOURCES.forEach((s, i) => { wrap(s, g.font, 900).forEach((l, j) => g.fillText(l, W / 2, 1676 + (i + j) * 30)); }); g.restore();
  }
  // —— captions ——
  if (!QS.get('nosubs') && t < T.end) {
    const v = VO.find(v => { const [a, b] = subSpan(v); return t >= a && t < b; });
    if (v) {
      const [a, b] = subSpan(v), al = ss(seg(t, a, a + .18)) * (1 - ss(seg(t, b - .2, b)));
      const font = '700 50px Quicksand', lines = wrap(v.text, font, 900), lh = 62, y0 = 1560 - (lines.length - 1) * lh / 2;
      g.save(); g.globalAlpha = al; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(8,10,35,.85)'; g.shadowBlur = 18; g.shadowOffsetY = 3; g.fillStyle = '#fffdf8';
      lines.forEach((l, i) => g.fillText(l, W / 2, y0 + i * lh));
      g.restore();
    }
  }
}

// —— render ——
function render(t) {
  if (QS.get('textonly')) return;   // readcheck: TEXTS does its own light pass
  const [, , name] = shotAt(t);
  const setName = world.update(t, name);
  cam(t);
  const sk = skyAt(t), night = sk.night;
  hemi.color.copy(sk.hs); hemi.groundColor.copy(sk.hg); hemi.intensity = sk.hI * (setName === 'house' ? (name === 'eyes' ? 2.2 : 1.35) : 1.45);
  const se = sk.el * DEG, sa = sk.az * DEG, tg = CAM.tg;
  sun.color.copy(sk.sun); sun.intensity = sk.sunI * (setName === 'house' ? 1 : 1.3);
  sun.target.position.set(tg[0], 0, tg[2]); sun.position.set(tg[0] + Math.cos(se) * Math.sin(sa) * 60, Math.sin(se) * 60, tg[2] + Math.cos(se) * Math.cos(sa) * 60);
  fill.position.copy(new THREE.Vector3(...wpos(world.H.lamp))).add(new THREE.Vector3(0, .3, 0)); fill.intensity = setName === 'house' ? 2.2 * (1 - (1 - night)) : 0;
  world.H.lamp.material.emissiveIntensity = 1.6 * night;
  world.H.win.material.emissiveIntensity = lerp(1.6, .7, night);
  post.comp.zen.value.copy(sk.zen); post.comp.hor.value.copy(sk.hor);
  post.comp.stars.value = ss(seg(night, .3, 1)); post.comp.starOff.value = CAM.az / 60; post.comp.time.value = t;
  const gd = post.grade; gd.sat.value = lerp(1.05, 1.12, night); gd.contrast.value = lerp(.06, .1, night); gd.lift.value.setRGB(.012, .014, lerp(.02, .05, night)); gd.vig.value = lerp(.16, .3, night);
  post.bloom.strength = lerp(.25, .55, night);
  post.composer.render();
  hud(t);
}

// —— sound events ——
function events() {
  const ev = [];
  VO.forEach(v => ev.push({ t: v.t, type: 'vo', id: v.id }));
  ev.push({ t: 0, type: 'amb', what: 'night', d: T.dawn0 + 1 }, { t: T.dawn0, type: 'amb', what: 'birds', d: DUR - T.dawn0 });
  ev.push({ t: T.sit, type: 'rustle' }, { t: T.stand, type: 'creak' });
  for (let x = T.walk0 + .15; x < T.walk1; x += 0.35) ev.push({ t: +x.toFixed(3), type: 'step', g: .5 });
  ev.push({ t: T.door, type: 'door' }, { t: T.zz, type: 'note', n: 79, g: .5 }, { t: T.title[0], type: 'title' });
  NIGHT.forEach((s, i) => ev.push({ t: +(T.cols0 + i * T.colStep).toFixed(3), type: 'rise', n: s === 'R' ? 74 : [0, 79, 76, 72][s], s }));
  ev.push({ t: T.n3, type: 'glow' }, { t: T.third, type: 'pop', n: 84 }, { t: T.walkerIcon, type: 'pop', n: 79 });
  ev.push({ t: 14.25, type: 'cut' }, { t: T.together, type: 'hush' }, { t: T.split, type: 'split' }, { t: T.motor, type: 'wake' }, { t: T.frontal, type: 'delta' });
  for (let x = T.delta; x < 26.5; x += 1 / .9) ev.push({ t: +x.toFixed(3), type: 'wave' });
  for (let x = 26.6; x < 34.75; x += .48) ev.push({ t: +x.toFixed(3), type: 'step', g: .3 });
  ev.push({ t: T.eyes, type: 'note', n: 81, g: .6 }, { t: T.bubble, type: 'pop', n: 76 }, { t: T.bubblePop, type: 'bubble' });
  [44, 45, 54, 55, 46].forEach((_, i) => ev.push({ t: +(T.kids + i * .12).toFixed(3), type: 'rise', n: [72, 74, 76, 79, 81][i], s: 9 }));
  ev.push({ t: T.adults, type: 'rise', n: 72, s: 9 }, { t: T.adults + .3, type: 'rise', n: 76, s: 9, half: 1 });
  [T.fam, T.lack, T.stress, T.fever, T.meds].forEach((x, i) => ev.push({ t: x, type: 'pop', n: [72, 74, 76, 79, 81][i] }));
  for (let x = T.parent; x < T.parent + 1.5; x += .32) ev.push({ t: +x.toFixed(3), type: 'step', g: .45 });
  ev.push({ t: T.wakeNo, type: 'note', n: 76, g: .5 }, { t: T.guide, type: 'door_close' }, { t: T.liedown, type: 'rustle' }, { t: T.end, type: 'title' });
  return ev.sort((a, b) => a.t - b.t);
}
window.render = render; window.DUR = DUR; window.EV = events();
window.TEXTS = t => { TX = []; const [, , name] = shotAt(t); world.update(t, name); cam(t); hud(t); const o = TX; TX = null; return o; };
await Promise.all(['700 74px "Josefin Sans"', '700 40px "Josefin Sans"', '700 50px Quicksand', '500 26px Quicksand'].map(f => document.fonts.load(f)));
window.READY = true;

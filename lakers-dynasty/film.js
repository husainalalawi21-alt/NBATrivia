// "The Last Three-Peat" — vertical 1080×1920 reel, English + Arabic (?lang=en|ar).
// Look borrowed from the channel's two reference reels:
//   A) image card over a blurred copy of itself, typed card label, year stamp + colour tag, caps headline, caption pill, blur dissolves, slam stamps;
//   B) charcoal screens with word-by-word headline reveal (grey → white, key word gold), a growing gold underline, gold glowing node diagrams
//      and charts, hard cuts, one white flash card.
// One clock drives picture, captions and sound events. Times come from Whisper word timings of the ElevenLabs takes.
export const W = 1080, H = 1920;
const C = { ink: '#0d0c10', char: '#141317', white: '#ffffff', grey: '#8d8a95', dim: '#55525c', gold: '#f2b632', goldHi: '#ffd978', purple: '#8b5cf6', purpleDeep: '#552583', red: '#ff3b3b', pill: 'rgba(16,14,20,.78)' };
let LANG = 'en', AR = false, IMG = {}, BLUR = {};
const SANS = () => AR ? "'Plex Arabic', 'Inter', sans-serif" : "'Inter', sans-serif";
const SERIF = () => AR ? "'Plex Arabic', serif" : "'Instrument Serif', serif";
const MONO = () => AR ? "'Plex Arabic', 'JetBrains Mono', monospace" : "'JetBrains Mono', monospace";

// ------------------------------------------------------------------ language data
// Each language: shot start times (from word timings), headline words with their spoken times, card text, captions.
const D = {
  en: {
    dur: 61.0,
    shots: { hook: 0, threepeat: 3.15, record: 11.3, drought: 17.5, era: 21.8, working: 27.75, help: 34.05, brutal: 37.7, rivals: 39.45, problems: 46.45, odds: 50.4, cta: 52.7, end: 58.05 },
    t: { y2000: 5.38, y2001: 5.86, y2002: 7.0, shaq: 8.64, three: 9.88, g15: 12.74, g1: 13.64, oneLoss: 15.1, y24: 18.58, nobody: 20.16, since2018: 23.3, lebron: 24.98, luka: 26.2, w14: 28.72, w3: 29.84, west: 30.66, p37: 32.4, reaves: 34.26, kessler: 35.6, brutal: 38.5, spurs: 39.64, knicks: 41.72, lebron2: 43.76, plus: 46.6, thin: 48.04, center: 49.04, vegas: 50.56, odds25: 51.48, ring1: 55.82, ring2: 56.78, ring3: 57.68 },
    head: {
      hook: [[['The', 0], ['last', .2], ['team', .46], ['to', .72], ['win', .86]], [['three', .98, 1], ['in', 2.02, 1], ['a', 2.24, 1], ['row?', 2.38, 1]]],
      record: [[['In', 11.44], ['2001,', 11.54], ['they', 12.52], ['went', 12.6]], [['15', 12.74, 1], ['and', 13.42, 1], ['1.', 13.64, 1]]],
      drought: [[['Since', 17.66], ['then?', 17.8]], [['24', 18.58, 1], ['years.', 18.94, 1]]],
      working: [[['And', 27.88], ["it's", 28.08], ['working.', 28.26, 2]]],
      brutal: [[['But', 37.8], ['the', 37.88], ['road', 38.0], ['is', 38.28]], [['brutal.', 38.56, 3]]],
      problems: [[['Plus', 46.6], ['their', 46.8], ['own', 47.02]], [['problems.', 47.2, 1]]],
      odds: [[['Vegas?', 50.56]], [['About', 51.3, 1], ['25', 51.48, 1], ['to', 52.0, 1], ['1.', 52.18, 1]]],
      cta: [[['Can', 53.36], ['Luka', 53.5], ['start', 53.88]], [['the', 54.12, 1], ['next', 54.3, 1], ['dynasty?', 54.94, 1]]],
    },
    s: {
      k1: 'PART 1 // THE LAST THREE-PEAT', k2: 'PART 2 // LUKA’S LAKERS', k3: 'PART 3 // THE ROAD', k4: 'PART 4 // YOUR CALL',
      laLabel: 'LOS ANGELES LAKERS', laSub: '2000 · 2001 · 2002', hLA: 'LOS ANGELES LAKERS', hThree: 'THREE STRAIGHT TITLES', tagChamp: 'NBA CHAMPIONS', tag3: 'SHAQ + KOBE',
      rounds: ['1ST ROUND · POR', 'WEST SEMIS · SAC', 'WEST FINALS · SAS', 'NBA FINALS · PHI'], oneLoss: 'ONE LOSS', finalsG1: 'FINALS G1',
      noThree: 'NO THREE-PEAT SINCE', eraLabel: '2026–27 SEASON', hNoLebron: 'NO LEBRON IN LA', tag2018: 'FIRST TIME SINCE', hLuka: 'LUKA’S TEAM', tag77: 'DONČIĆ',
      record: 'RECORD', west: '1ST IN THE WEST', ppg: 'POINTS PER GAME · DONČIĆ', asOf: 'AS OF NOV. 21, 2026',
      helpLabel: 'THE SUPPORTING CAST', hHelp: 'THE HELP', reaves: 'REAVES · BACK', kessler: 'KESSLER · 14.3 PTS · 10.7 REB',
      roadLabel: 'THE ROAD TO A TITLE', hRoad: 'THE OBSTACLES', bus: 'LAKERS', spurs: 'SPURS', spursT: 'FAVORITES · +300', knicks: 'KNICKS', knicksT: 'DEFENDING CHAMPS', sixers: '76ERS', sixersT: 'LEBRON · +900',
      lakers: 'LAKERS', luka: 'DONČIĆ 37.2', reavesN: 'REAVES', kesslerN: 'KESSLER', thin: 'THIN AT FORWARD', center: 'NO BACKUP CENTER',
      oddsTitle: 'TITLE ODDS · MID-NOV. 2026', oddsTeams: ['SPURS', 'THUNDER', '76ERS', 'LAKERS'], oddsSrc: 'Implied chance from sportsbook odds; books vary.',
      endLabel: 'LOS ANGELES · 2026–27', hEnd: 'THE NEXT DYNASTY?', tagEnd: '14–3 · 1ST IN THE WEST',
    },
    cap: [[0, 'The last team to win three NBA titles in a row?'], [3.2, 'The Los Angeles Lakers.'], [5.38, '2000. 2001. 2002.'], [8.64, 'Shaq and Kobe. Three straight rings.'],
      [11.44, 'In 2001, they went 15 and 1 in the playoffs.'], [15.1, 'One loss — the whole postseason.'], [17.66, 'Since then? 24 years…'], [19.96, 'and nobody has done it again.'],
      [21.94, 'Now, for the first time since 2018,'], [24.46, 'there’s no LeBron in LA.'], [26.2, 'This is Luka’s team.'], [27.88, 'And it’s working. 14 and 3.'],
      [30.66, 'First in the West.'], [31.88, 'Luka is dropping 37 a night.'], [34.26, 'Austin Reaves is back.'], [35.6, 'Walker Kessler is owning the paint.'],
      [37.8, 'But the road is brutal.'], [39.64, 'Wemby’s Spurs — the title favorites.'], [41.72, 'The Knicks — the defending champs.'], [43.76, 'And LeBron, now in Philly, standing in the way.'],
      [46.6, 'Plus their own problems:'], [48.04, 'thin at forward, and no real backup center.'], [50.56, 'Vegas? About 25 to 1.'], [52.82, 'So… can Luka start the next Lakers dynasty?'],
      [55.82, 'One ring. Then two. Then three.'], [58.16, 'Drop your pick in the comments.'], [60.0, '']],
  },
  ar: {
    dur: 65.0,
    shots: { hook: 0, threepeat: 3.45, record: 10.4, drought: 17.2, era: 22.15, working: 28.15, help: 36.4, brutal: 39.75, rivals: 41.15, problems: 49.8, odds: 54.25, cta: 57.5, end: 62.0 },
    t: { y2000: 4.86, y2001: 5.58, y2002: 6.62, shaq: 7.6, three: 8.88, g15: 12.2, g1: 13.4, oneLoss: 14.74, y24: 18.76, nobody: 20.8, since2018: 24.06, lebron: 25.6, luka: 26.86, w14: 29.4, w3: 30.78, west: 32.0, p37: 34.44, reaves: 36.56, kessler: 37.62, brutal: 40.82, spurs: 41.3, knicks: 44.28, lebron2: 46.36, plus: 49.92, thin: 51.1, center: 52.36, vegas: 54.36, odds25: 55.88, ring1: 60.66, ring2: 62.12, ring3: 63.18 },
    head: {
      hook: [[['آخر', 0], ['فريق', .32], ['فاز', .66]], [['بثلاث', .92, 1], ['ورا', 2.1, 1], ['بعض؟', 2.4, 1]]],
      record: [[['في', 10.54], ['٢٠٠١', 10.94]], [['فازوا', 11.68, 1], ['١٥', 12.2, 1], ['وخسروا', 12.62], ['وحدة', 13.4, 3]]],
      drought: [[['ومن', 17.38], ['ذاك', 17.9], ['الوقت؟', 18.16]], [['٢٤', 18.76, 1], ['سنة', 20.16, 1]]],
      working: [[['والشغل', 28.3], ['ماشي', 28.96, 2]]],
      brutal: [[['بس', 39.9], ['الطريق', 40.46]], [['صعب', 40.82, 3]]],
      problems: [[['وعندهم', 49.92]], [['مشاكلهم', 50.44, 1]]],
      odds: [[['وفيغاس؟', 54.36]], [['تقريباً', 55.12, 1], ['٢٥', 55.88, 1], ['إلى', 56.96, 1], ['١', 57.16, 1]]],
      cta: [[['فهل', 57.62], ['يقدر', 58.34], ['لوكا', 58.64], ['يبدأ', 58.98]], [['سلالة', 59.28, 1], ['ليكرز', 59.72, 1], ['الجاية؟', 60.18, 1]]],
    },
    s: {
      k1: 'الجزء ١ // آخر ثلاثية', k2: 'الجزء ٢ // ليكرز لوكا', k3: 'الجزء ٣ // الطريق', k4: 'الجزء ٤ // رأيك',
      laLabel: 'لوس أنجلوس ليكرز', laSub: '2000 · 2001 · 2002', hLA: 'لوس أنجلوس ليكرز', hThree: 'ثلاث بطولات ورا بعض', tagChamp: 'أبطال الدوري', tag3: 'شاك + كوبي',
      rounds: ['الدور الأول · بورتلاند', 'نصف نهائي الغرب · ساكرامنتو', 'نهائي الغرب · سان أنطونيو', 'النهائي · فيلادلفيا'], oneLoss: 'خسارة وحدة', finalsG1: 'النهائي م١',
      noThree: 'ولا ثلاثية من بعدها', eraLabel: 'موسم 2026–27', hNoLebron: 'ما في ليبرون', tag2018: 'لأول مرة من', hLuka: 'فريق لوكا', tag77: 'دونتشيتش',
      record: 'السجل', west: 'الأول في الغرب', ppg: 'نقطة في المباراة · دونتشيتش', asOf: 'حتى ٢١ نوفمبر ٢٠٢٦',
      helpLabel: 'المساندين', hHelp: 'ريفز وكيسلر', reaves: 'ريفز · رجع', kessler: 'كيسلر · 14.3 نقطة · 10.7 ريباوند',
      roadLabel: 'الطريق للقب', hRoad: 'العقبات', bus: 'ليكرز', spurs: 'سبيرز', spursT: 'المرشح الأول · +300', knicks: 'نيكس', knicksT: 'حامل اللقب', sixers: 'سيكسرز', sixersT: 'ليبرون · +900',
      lakers: 'ليكرز', luka: 'دونتشيتش 37.2', reavesN: 'ريفز', kesslerN: 'كيسلر', thin: 'نقص في الفورورد', center: 'ما في سنتر بديل',
      oddsTitle: 'حظوظ اللقب · منتصف نوفمبر ٢٠٢٦', oddsTeams: ['سبيرز', 'ثاندر', 'سيكسرز', 'ليكرز'], oddsSrc: 'النسب محسوبة من احتمالات المراهنات، وتختلف من مكان لمكان.',
      endLabel: 'لوس أنجلوس · 2026–27', hEnd: 'السلالة الجاية؟', tagEnd: '14–3 · الأول في الغرب',
    },
    cap: [[0, 'آخر فريق فاز بثلاث بطولات NBA ورا بعض؟'], [3.5, 'لوس أنجلوس ليكرز.'], [4.86, '٢٠٠٠، ٢٠٠١، ٢٠٠٢.'], [7.6, 'شاك وكوبي. ثلاث خواتم ورا بعض.'],
      [10.54, 'في ٢٠٠١ فازوا ١٥ وخسروا وحدة بس في البلاي أوف.'], [14.74, 'خسارة وحدة في كل الأدوار الإقصائية.'], [17.38, 'ومن ذاك الوقت؟ ٢٤ سنة…'], [20.8, 'ومحد سواها.'],
      [22.3, 'والحين، لأول مرة من ٢٠١٨،'], [24.98, 'ما في ليبرون في لوس أنجلوس.'], [26.86, 'هذا فريق لوكا.'], [28.3, 'والشغل ماشي: ١٤ فوز و٣ خسارات،'],
      [32.0, 'الأول في الغرب،'], [33.1, 'ولوكا يسجل ٣٧ نقطة كل ليلة.'], [36.56, 'أوستن ريفز رجع،'], [37.62, 'ووكر كيسلر مسيطر تحت السلة.'],
      [39.9, 'بس الطريق صعب.'], [41.3, 'سبيرز ويمبي، المرشحين الأوائل.'], [44.28, 'النيكس، أبطال الموسم اللي طاف.'], [46.36, 'وليبرون، الحين في فيلادلفيا، واقف في الطريق.'],
      [49.92, 'وعندهم مشاكلهم:'], [51.1, 'نقص في الفورورد، وما عندهم سنتر بديل حقيقي.'], [54.36, 'وفيغاس؟ تقريباً ٢٥ إلى ١.'], [57.62, 'فهل يقدر لوكا يبدأ سلالة ليكرز الجاية؟'],
      [60.66, 'خاتم… بعدين ثاني… بعدين ثالث؟'], [63.9, '']],
  },
};
let L = D.en;
export let DUR = 61;
export function setup(lang, images) {
  LANG = lang === 'ar' ? 'ar' : 'en'; AR = LANG === 'ar'; L = D[LANG]; DUR = L.dur; IMG = images;
  for (const k in IMG) BLUR[k] = makeBlur(IMG[k]);
  buildShots(); buildEvents();
}
export const cues = () => L.cap.slice(0, -1).map(([t, s], i) => ({ t0: t, t1: L.cap[i + 1][0] - .05, text: s })).filter(c => c.text);

// ------------------------------------------------------------------ easing + helpers
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = x => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const k_ = (t, t0, d = .35) => clamp((t - t0) / d);
function makeBlur(img) {
  // a blurred, darkened, cover-cropped copy of the image for the backdrop (computed once)
  const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d');
  cover(g, img, 0, 0, 270, 480, 1.15); const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g2 = c2.getContext('2d');
  g2.filter = 'blur(28px) saturate(1.15)'; g2.drawImage(c, -60, -60, W + 120, H + 120); g2.filter = 'none';
  g2.fillStyle = 'rgba(8,6,12,.52)'; g2.fillRect(0, 0, W, H);
  const v = g2.createRadialGradient(W / 2, H * .45, 200, W / 2, H * .45, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)');
  g2.fillStyle = v; g2.fillRect(0, 0, W, H); return c2;
}
function cover(g, img, x, y, w, h, z = 1, fx = .5, fy = .5) {
  const s = Math.max(w / img.width, h / img.height) * z, iw = img.width * s, ih = img.height * s;
  g.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih);
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function font(g, w, px, fam) { g.font = `${w} ${px}px ${fam}`; g.direction = AR ? 'rtl' : 'ltr'; }
function fitFont(g, str, w, px, fam, max) { font(g, w, px, fam); while (g.measureText(str).width > max && px > 12) { px *= .95; font(g, w, px, fam); } return px; }
function txt(g, str, x, y, o = {}) {
  g.save(); fitFont(g, str, o.w || 700, o.px || 40, o.fam || SANS(), o.max || 2000);
  g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic'; if (o.ls) g.letterSpacing = o.ls + 'px';
  g.globalAlpha = o.a ?? 1; if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 24; }
  g.fillStyle = o.color || C.white; g.fillText(str, x, y); g.restore();
}
const START = () => AR ? W - 64 : 64;          // reading-start edge
const SIDE = () => AR ? 'right' : 'left';

// ------------------------------------------------------------------ building blocks
// headline revealed word by word: each word goes from dim grey to white (or gold) as it is spoken (reference B)
function headline(g, lines, t, y0, o = {}) {
  const px = o.px || 76, lh = px * 1.14, ax = o.center ? W / 2 : START();
  let lastX = null, lastW = 0, lastK = 0;
  lines.forEach((line, li) => {
    const serif = li > 0 && !AR && o.serifSecond !== false, fam = serif ? SERIF() : SANS(), wt = serif ? 400 : 700, size = serif ? px * 1.18 : px;
    g.save(); font(g, wt, size, fam); if (serif) g.font = `italic ${wt} ${size}px ${fam}`;
    const sp = g.measureText(' ').width, widths = line.map(([w]) => g.measureText(w).width), total = widths.reduce((a, b) => a + b, 0) + sp * (line.length - 1);
    let x = o.center ? (AR ? ax + total / 2 : ax - total / 2) : ax; const y = y0 + li * lh;
    line.forEach(([w, tw, kind], i) => {
      const k = k_(t, tw, .22), ww = widths[i]; if (k <= 0 && !o.ghost) { x += (AR ? -1 : 1) * (ww + sp); return; }
      const col = kind === 1 ? (serif ? '#c9b8ff' : C.gold) : kind === 2 ? C.gold : kind === 3 ? C.red : (o.dark ? C.ink : C.white);
      g.globalAlpha = k > 0 ? 1 : .12; g.fillStyle = k > 0 ? mix(o.dark ? '#c8c6cc' : '#5c5966', col, k) : (o.dark ? '#d8d6dc' : '#3a3842');
      g.textAlign = AR ? 'right' : 'left'; g.fillText(w, x, y + (1 - eo(k)) * 10);
      if (k > 0) { lastX = x; lastW = ww; lastK = k; }
      x += (AR ? -1 : 1) * (ww + sp);
    });
    g.restore();
  });
  // gold underline grows under the last line as the words arrive (reference B)
  if (o.underline && lastX != null) {
    const y = y0 + (lines.length - 1) * lh + px * .32, x0 = o.center ? W / 2 - o.underline / 2 : (AR ? W - 64 : 64);
    const end = AR ? lastX - lastW : lastX + lastW, len = Math.abs(end - (AR ? W - 64 : 64));
    g.save(); g.shadowColor = C.gold; g.shadowBlur = 14; g.fillStyle = C.gold;
    if (AR) g.fillRect(W - 64 - len, y, len, 5); else g.fillRect(64, y, len, 5); g.restore();
  }
}
function mix(a, b, k) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
}
function kicker(g, str, t, t0) {
  const k = k_(t, t0, .4); if (k <= 0) return;
  const n = Math.ceil(str.length * k);
  txt(g, (AR ? str : str.slice(0, n)), START(), 196, { fam: MONO(), w: 500, px: 26, ls: AR ? 0 : 3, color: '#a8a3b3', align: SIDE(), a: AR ? k : 1 });
}
const CARD = { x: 48, y: 560, w: 984, h: 656, r: 30 };
// the image card (reference A): images cross-dissolve with blur, slow push-in, a typed label, a stamp, pins
function card(g, t, frames, o = {}) {
  const { x, y, w, h, r } = CARD, k = o.inK ?? 1;
  g.save(); g.globalAlpha = k;
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50; g.shadowOffsetY = 18; rr(g, x, y, w, h, r); g.fillStyle = '#000'; g.fill(); g.shadowColor = 'transparent';
  rr(g, x, y, w, h, r); g.clip();
  const z = 1.02 + .07 * clamp((t - (o.t0 ?? 0)) / (o.span ?? 8));
  imageTrack(g, t, frames, (img, a, blur) => { g.globalAlpha = a * k; if (blur) g.filter = `blur(${blur}px)`; cover(g, img, x, y, w, h, z, o.fx ?? .5, o.fy ?? .5); g.filter = 'none'; });
  // top and bottom shades for legibility
  g.globalAlpha = k; let s = g.createLinearGradient(0, y, 0, y + 150); s.addColorStop(0, 'rgba(0,0,0,.6)'); s.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = s; g.fillRect(x, y, w, 150);
  s = g.createLinearGradient(0, y + h - 230, 0, y + h); s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,.65)'); g.fillStyle = s; g.fillRect(x, y + h - 230, w, 230);
  g.restore();
  g.save(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; rr(g, x, y, w, h, r); g.globalAlpha = k; g.stroke(); g.restore();
  return z;
}
// frames = [[t, imgKey], ...]: picks the current image and dissolves from the previous one with blur
function imageTrack(g, t, frames, draw) {
  let i = 0; for (let j = 0; j < frames.length; j++) if (t >= frames[j][0]) i = j;
  const [ti, key] = frames[i], d = .45, k = clamp((t - ti) / d);
  if (i > 0 && k < 1) { draw(IMG[frames[i - 1][1]], 1, k * 18); draw(IMG[key], eio(k), (1 - k) * 18); } else draw(IMG[key], 1, 0);
}
function backdrop(g, t, frames) {
  imageTrack(g, t, frames, (img, a) => { const key = Object.keys(IMG).find(k => IMG[k] === img); g.globalAlpha = a; g.drawImage(BLUR[key], -20, -20, W + 40, H + 40); g.globalAlpha = 1; });
}
function cardLabel(g, t, t0, main, sub) {
  const k = k_(t, t0, .5); if (k <= 0) return;
  const x = AR ? CARD.x + CARD.w - 30 : CARD.x + 30, n = Math.ceil(main.length * k);
  txt(g, AR ? main : main.slice(0, n), x, CARD.y + 50, { w: 800, px: 25, ls: AR ? 0 : 1.5, align: SIDE(), a: AR ? k : 1 });
  if (sub) txt(g, sub, x, CARD.y + 82, { w: 500, px: 20, ls: AR ? 0 : 1, color: 'rgba(255,255,255,.7)', align: SIDE(), a: k_(t, t0 + .3, .3), fam: MONO() });
}
// big number stamped at the bottom of the card with a colour tag under it (reference A: "1600 / LONDON")
function cardStamp(g, t, t0, num, tag, color = C.red) {
  const k = k_(t, t0, .28); if (k <= 0) return;
  const x = AR ? CARD.x + CARD.w - 34 : CARD.x + 34, y = CARD.y + CARD.h - 70, s = 1 + .25 * (1 - back(k));
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = clamp(k * 2);
  txt(g, num, 0, 0, { w: 900, px: 118, align: SIDE(), ls: -3, fam: "'Inter', sans-serif" });
  if (tag) { font(g, 800, 22, SANS()); const tw = g.measureText(tag).width + 22; g.fillStyle = color; g.fillRect(AR ? -tw : 0, 18, tw, 34); txt(g, tag, AR ? -11 : 11, 43, { w: 800, px: 22, align: SIDE() }); }
  g.restore();
}
// red slam stamp like "FLAT" (reference A)
function slamStamp(g, t, t0, str, x, y, color = C.red, rot = -.08, px = 92) {
  const k = k_(t, t0, .22); if (k <= 0) return;
  const s = 1 + .9 * (1 - eo(k));
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha = clamp(k * 1.6);
  font(g, 900, px, SANS()); const tw = g.measureText(str).width;
  g.strokeStyle = color; g.lineWidth = 8; g.strokeRect(-tw / 2 - 26, -px * .82, tw + 52, px * 1.18);
  g.fillStyle = color; g.textAlign = 'center'; g.fillText(str, 0, px * .14); g.restore();
}
// a pin with a leader line and a tag, placed on a point of the card image
function pin(g, t, t0, u, v, z, label, sub, color = C.gold, side = 1) {
  const k = k_(t, t0, .35); if (k <= 0) return;
  const { x, y, w, h } = CARD, px = x + w / 2 + (u - .5) * w * z, py = y + h / 2 + (v - .5) * h * z;
  g.save(); g.globalAlpha = clamp(k * 2);
  g.beginPath(); g.arc(px, py, 10 + 6 * (1 - eo(k)), 0, Math.PI * 2); g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 20; g.fill();
  g.beginPath(); g.arc(px, py, 22 * eo(k), 0, Math.PI * 2); g.strokeStyle = color; g.lineWidth = 2; g.stroke(); g.shadowBlur = 0;
  font(g, 800, 30, SANS()); const lw = g.measureText(label).width; font(g, 600, 21, SANS()); const sw = sub ? g.measureText(sub).width : 0;
  const bw = Math.max(lw, sw) + 34, bh = sub ? 84 : 52, lx = clamp(px + side * 50 - (side < 0 ? bw : 0), x + 14, x + w - bw - 14), ly = py - bh - 26;
  g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px, ly + bh); g.stroke();
  const kk = eo(k_(t, t0 + .08, .3)); rr(g, lx, ly, bw * kk, bh, 12); g.fillStyle = 'rgba(12,10,16,.88)'; g.fill(); g.strokeStyle = color; g.stroke();
  if (kk > .6) { txt(g, label, AR ? lx + bw - 17 : lx + 17, ly + 38, { w: 800, px: 30, color, align: SIDE() }); if (sub) txt(g, sub, AR ? lx + bw - 17 : lx + 17, ly + 70, { w: 600, px: 21, color: '#e9e6ee', align: SIDE() }); }
  g.restore();
}
function capsHead(g, t, items) {   // items: [[t, text], ...]; caps headline under the card, crossfades on change
  let i = -1; items.forEach(([ti], j) => { if (t >= ti) i = j; }); if (i < 0) return;
  const [ti, s] = items[i], k = k_(t, ti, .3), y = CARD.y + CARD.h + 112;
  txt(g, s, W / 2, y + (1 - eo(k)) * 16, { w: 900, px: AR ? 64 : 62, align: 'center', a: k, max: 960, ls: AR ? 0 : -.5 });
}
function pill(g, t) {   // caption pill (reference A): the spoken phrase, dark rounded box, fades between phrases
  const c = cues().find(q => t >= q.t0 && t < q.t1); if (!c) return;
  const k = Math.min(k_(t, c.t0, .15), 1 - k_(t, c.t1 - .12, .12)); if (k <= 0) return;
  g.save(); font(g, 600, 38, SANS());
  const words = c.text.split(' '), lines = []; let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (g.measureText(tt).width > 860 && cur) { lines.push(cur); cur = w; } else cur = tt; } lines.push(cur);
  const lh = 50, bw = Math.max(...lines.map(l => g.measureText(l).width)) + 44, bh = lines.length * lh + 24, y = CARD.y + CARD.h + 180;
  g.globalAlpha = k; rr(g, W / 2 - bw / 2, y, bw, bh, 16); g.fillStyle = C.pill; g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; lines.forEach((l, i) => g.fillText(l, W / 2, y + 48 + i * lh)); g.restore();
}
function charBg(g, glow = C.gold, a = .10) {
  g.fillStyle = C.char; g.fillRect(0, 0, W, H);
  const r = g.createRadialGradient(W / 2, H * .5, 0, W / 2, H * .5, 900); r.addColorStop(0, hexA(glow, a)); r.addColorStop(1, hexA(glow, 0)); g.fillStyle = r; g.fillRect(0, 0, W, H);
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function glowLine(g, x0, y0, x1, y1, k, color = C.gold, w = 4) {
  if (k <= 0) return; g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.shadowColor = color; g.shadowBlur = 16;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); g.stroke(); g.restore();
}
function nodePill(g, cx, cy, label, k, color = C.gold, o = {}) {   // glowing outlined pill (reference B: "MCP")
  if (k <= 0) return; const s = .6 + .4 * back(k);
  g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha = clamp(k * 2);
  font(g, 800, o.px || 46, o.serif && !AR ? "'Instrument Serif', serif" : SANS()); const tw = g.measureText(label).width, bw = tw + 56, bh = (o.px || 46) * 1.7;
  rr(g, -bw / 2, -bh / 2, bw, bh, 18); g.fillStyle = o.fill || 'rgba(20,18,24,.95)'; g.fill();
  g.shadowColor = color; g.shadowBlur = 26; g.strokeStyle = color; g.lineWidth = 3.5; g.stroke(); g.shadowBlur = 0;
  g.fillStyle = o.text || color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, 2); g.restore();
}
function tile(g, cx, cy, size, k, draw) {   // white rounded "app icon" tile that pops in from the side (reference B)
  if (k <= 0) return; const s = back(k);
  g.save(); g.translate(cx + (1 - eo(k)) * 160, cy); g.scale(s, s); g.globalAlpha = clamp(k * 2);
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; rr(g, -size / 2, -size / 2, size, size, size * .22); g.fillStyle = '#fff'; g.fill(); g.shadowBlur = 0;
  draw(g, size); g.restore();
}

// ------------------------------------------------------------------ shots
let SH = [];
function buildShots() {
  const S = L.shots, T = L.t, s = L.s, HD = L.head;
  const order = ['hook', 'threepeat', 'record', 'drought', 'era', 'working', 'help', 'brutal', 'rivals', 'problems', 'odds', 'cta', 'end'];
  const tin = { hook: 'cut', threepeat: 'blur', record: 'cut', drought: 'blur', era: 'blur', working: 'cut', help: 'blur', brutal: 'cut', rivals: 'cut', problems: 'blur', odds: 'cut', cta: 'blur', end: 'blur' };
  const draw = {
    hook(g, t) {   // full-bleed retro illustration, headline reveal on top (reference B + A's two-line headline)
      const z = 1.0 + .06 * clamp(t / 3.5);
      cover(g, IMG.hook_trophy, 0, 0, W, H, z, .5, .62);
      const sh = g.createLinearGradient(0, 0, 0, 760); sh.addColorStop(0, 'rgba(10,4,14,.82)'); sh.addColorStop(1, 'rgba(10,4,14,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 760);
      headline(g, HD.hook, t, 330, { px: 82, center: true });
    },
    threepeat(g, t) {
      const frames = [[S.threepeat, 'diorama_three_rings'], [T.y2000, 'diorama_parade2000'], [T.y2001, 'diorama_confetti'], [T.y2002, 'diorama_three_rings']];
      backdrop(g, t, frames); kicker(g, s.k1, t, S.threepeat + .1);
      const z = card(g, t, frames, { t0: S.threepeat, span: 8 });
      cardLabel(g, t, S.threepeat + .15, s.laLabel, s.laSub);
      if (t < T.three) {
        [[T.y2000, '2000'], [T.y2001, '2001'], [T.y2002, '2002']].forEach(([tt, y], i, a) => { if (t >= tt && (i === a.length - 1 || t < a[i + 1][0])) cardStamp(g, t, tt, y, s.tagChamp, C.purple); });
      } else cardStamp(g, t, T.three, '3×', s.tag3, C.red);
      capsHead(g, t, [[S.threepeat + .2, s.hLA], [T.y2000, s.hThree]]); pill(g, t);
    },
    record(g, t) {   // gold glow chart: the 2001 run game by game (W ×11, L in Finals G1, W ×4)
      charBg(g, C.gold, .08); headline(g, HD.record, t, 300, { px: 78, underline: 1 });
      const rows = [[3, -1], [4, -1], [4, -1], [5, 0]], x0 = 300, y0 = 760, sz = 108, gap = 22;
      let n = 0; const t0 = T.g15 - .35, per = (T.g1 + .5 - t0) / 16;
      rows.forEach(([cnt, lossAt], r) => {
        const y = y0 + r * (sz + 58), rk = k_(t, S.record + .3 + r * .08, .3);
        txt(g, s.rounds[r], AR ? W - 64 : 64, y - 14, { fam: MONO(), w: 500, px: 21, color: '#9a96a4', a: rk, align: SIDE(), max: 560 });
        for (let i = 0; i < cnt; i++) {
          const x = AR ? W - 64 - (i + 1) * (sz + gap) + gap : 64 + i * (sz + gap), loss = i === lossAt, kk = k_(t, t0 + n * per, .18); n++;
          g.save(); rr(g, x, y, sz, sz, 18); g.fillStyle = kk > 0 ? (loss ? 'rgba(255,59,59,.22)' : 'rgba(242,182,50,.16)') : 'rgba(255,255,255,.04)'; g.fill();
          g.strokeStyle = kk > 0 ? (loss ? C.red : C.gold) : 'rgba(255,255,255,.12)'; g.lineWidth = 3; if (kk > 0) { g.shadowColor = loss ? C.red : C.gold; g.shadowBlur = 18 * kk; } g.stroke(); g.shadowBlur = 0;
          if (kk > 0) txt(g, loss ? (AR ? 'خ' : 'L') : (AR ? 'ف' : 'W'), x + sz / 2, y + sz / 2 + 16, { w: 900, px: 46, align: 'center', color: loss ? C.red : C.goldHi, a: kk });
          g.restore();
          if (loss) slamStamp(g, t, T.oneLoss, s.oneLoss, AR ? 230 : W - 230, y - 120, C.red, -.07, 56);
        }
      });
      // running total
      const won = Math.min(15, Math.max(0, Math.floor((t - t0) / per) - (t - t0 > per * 12 ? 1 : 0))), lost = t > t0 + per * 11.5 ? 1 : 0;
      if (t > t0) txt(g, `${won}–${lost}`, W / 2, 1530, { w: 900, px: 190, align: 'center', color: C.white, glow: 'rgba(242,182,50,.5)', blur: 30, fam: "'Inter', sans-serif", ls: -6 });
    },
    drought(g, t) {   // full-bleed hourglass + a timeline drawn 2002 → 2026
      const z = 1.0 + .05 * clamp((t - S.drought) / 5);
      g.fillStyle = '#0b080e'; g.fillRect(0, 0, W, H); cover(g, IMG.retro_hourglass, 0, -260, W, H, z, .5, .55);
      const sh = g.createLinearGradient(0, 0, 0, 700); sh.addColorStop(0, 'rgba(8,6,12,.85)'); sh.addColorStop(1, 'rgba(8,6,12,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 700);
      const sb = g.createLinearGradient(0, H - 640, 0, H - 260); sb.addColorStop(0, 'rgba(8,6,12,0)'); sb.addColorStop(1, 'rgba(8,6,12,.92)'); g.fillStyle = sb; g.fillRect(0, H - 640, W, 640);
      headline(g, HD.drought, t, 300, { px: 84, center: true });
      const y = 1720, xa = 110, xb = W - 110, lk = eio(k_(t, T.y24 - .2, 1.6));
      glowLine(g, xa, y, xb, y, lk, C.gold, 5);
      for (let i = 0; i <= 24; i++) { const x = lerp(xa, xb, i / 24), on = lk >= i / 24; g.fillStyle = on ? C.goldHi : 'rgba(255,255,255,.2)'; g.fillRect(x - 2, y - (i % 4 === 0 ? 22 : 12), 4, i % 4 === 0 ? 44 : 24); }
      txt(g, '2002', xa, y + 70, { w: 800, px: 34, align: 'center', a: k_(t, S.drought + .2) });
      txt(g, String(2002 + Math.round(24 * lk)), xb, y + 70, { w: 800, px: 34, align: 'center', color: C.gold, a: k_(t, T.y24 - .2) });
      slamStamp(g, t, T.nobody, s.noThree, W / 2, y - 120, C.red, -.04, 48);
    },
    era(g, t) {
      const frames = [[S.era, 'retro_locker'], [T.luka - .15, 'diorama_luka77']];
      backdrop(g, t, frames); kicker(g, s.k2, t, S.era + .1);
      card(g, t, frames, { t0: S.era, span: 6 });
      cardLabel(g, t, S.era + .2, s.eraLabel);
      if (t < T.luka - .15) cardStamp(g, t, T.since2018, '2018', s.tag2018, C.purple);
      else cardStamp(g, t, T.luka + .1, '77', s.tag77, C.purple);
      capsHead(g, t, [[S.era + .2, s.hNoLebron], [T.luka - .1, s.hLuka]]); pill(g, t);
    },
    working(g, t) {   // gold chart screen: win ring, 1st in West, 37.2
      charBg(g, C.purple, .14); headline(g, HD.working, t, 280, { px: 84, center: true });
      const cx = W / 2, cy = 720, r = 250, rk = eio(k_(t, T.w14 - .3, 1.3)), frac = 14 / 17;
      g.save(); g.lineCap = 'round'; g.lineWidth = 40; g.strokeStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      g.shadowColor = C.gold; g.shadowBlur = 30; g.strokeStyle = C.gold; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac * rk); g.stroke();
      if (t > T.w3) { g.shadowColor = C.red; g.strokeStyle = 'rgba(255,59,59,.75)'; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 + Math.PI * 2 * frac + .06, -Math.PI / 2 + Math.PI * 2 * (frac + (1 - frac) * eio(k_(t, T.w3, .6))) - .06); g.stroke(); }
      g.restore();
      const wv = Math.round(14 * rk), lv = t > T.w3 ? Math.round(3 * eio(k_(t, T.w3, .6))) : 0;
      if (t > T.w14 - .3) txt(g, `${wv}–${lv}`, cx, cy + 50, { w: 900, px: 150, align: 'center', fam: "'Inter', sans-serif", ls: -5 });
      txt(g, s.record, cx, cy + 110, { fam: MONO(), w: 500, px: 24, align: 'center', color: '#a8a3b3', a: k_(t, T.w14), ls: AR ? 0 : 4 });
      nodePill(g, cx, 1100, s.west, k_(t, T.west, .4), C.gold, { px: 44 });
      // stat tile: 37.2 points per game
      const tk = eo(k_(t, T.p37 - .2, .45)); if (tk > 0) {
        g.save(); g.globalAlpha = tk; rr(g, 120, 1250 + (1 - tk) * 60, 840, 300, 28); g.fillStyle = 'rgba(255,255,255,.06)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; g.stroke(); g.restore();
        const v = (37.2 * eio(k_(t, T.p37 - .1, .9))).toFixed(1);
        txt(g, v, W / 2, 1440 + (1 - tk) * 60, { w: 900, px: 170, align: 'center', color: C.gold, glow: 'rgba(242,182,50,.55)', blur: 30, fam: "'Inter', sans-serif", ls: -5, a: tk });
        txt(g, s.ppg, W / 2, 1505 + (1 - tk) * 60, { w: 700, px: 28, align: 'center', color: '#e8e4ee', a: tk, ls: AR ? 0 : 2 });
      }
      txt(g, s.asOf, W / 2, 1640, { fam: MONO(), w: 500, px: 22, align: 'center', color: '#7d7987', a: k_(t, T.p37 + .4), ls: AR ? 0 : 2 });
    },
    help(g, t) {
      const frames = [[S.help, 'diorama_reaves_kessler']];
      backdrop(g, t, frames); kicker(g, s.k2, t, S.help + .1);
      const z = card(g, t, frames, { t0: S.help, span: 4 });
      cardLabel(g, t, S.help + .15, s.helpLabel);
      pin(g, t, T.reaves, .28, .64, z, s.reaves.split(' · ')[0], s.reaves.split(' · ').slice(1).join(' · '), C.gold, 1);
      pin(g, t, T.kessler, .6, .36, z, s.kessler.split(' · ')[0], s.kessler.split(' · ').slice(1).join(' · '), C.purple, -1);
      capsHead(g, t, [[S.help + .2, s.hHelp]]); pill(g, t);
    },
    brutal(g, t) {   // the one white flash card (reference B)
      g.fillStyle = '#f6f5f2'; g.fillRect(0, 0, W, H);
      headline(g, HD.brutal, t, 880, { px: 110, center: true, dark: true, serifSecond: false });
    },
    rivals(g, t) {   // the road diorama, a tag pinned to each fortress as it is named
      const frames = [[S.rivals, 'diorama_road']];
      backdrop(g, t, frames); kicker(g, s.k3, t, S.rivals + .05);
      const z = card(g, t, frames, { t0: S.rivals, span: 7, fy: .5 });
      cardLabel(g, t, S.rivals + .1, s.roadLabel);
      pin(g, t, S.rivals + .35, .22, .83, z, s.bus, null, C.purple, 1);
      pin(g, t, T.spurs, .36, .66, z, s.spurs, s.spursT, '#d9dde3', 1);
      pin(g, t, T.knicks, .57, .41, z, s.knicks, s.knicksT, '#4d8bff', -1);
      pin(g, t, T.lebron2, .7, .26, z, s.sixers, s.sixersT, C.red, -1);
      capsHead(g, t, [[S.rivals + .2, s.hRoad]]); pill(g, t);
    },
    problems(g, t) {   // gold node diagram: the Lakers' strengths, then two red holes (reference B)
      charBg(g, C.gold, .07); headline(g, HD.problems, t, 300, { px: 82, underline: 1 });
      const cx = W / 2, cy = 980, P = [[cx - 300, 770, s.luka, T.plus - .1], [cx + 300, 770, s.reavesN, T.plus + .15], [cx + 300, 1190, s.kesslerN, T.plus + .4]];
      P.forEach(([x, y, lab, tt]) => { glowLine(g, cx, cy, x, y, eio(k_(t, tt, .35))); });
      const R = [[cx - 300, 1260, s.thin, T.thin], [cx, 1480, s.center, T.center]];
      R.forEach(([x, y, lab, tt]) => { glowLine(g, cx, cy, x, y, eio(k_(t, tt - .15, .35)), C.red); });
      nodePill(g, cx, cy, s.lakers, k_(t, S.problems + .15, .4), C.gold, { px: 56, serif: true });
      P.forEach(([x, y, lab, tt]) => nodePill(g, x, y, lab, k_(t, tt + .2, .35), C.gold, { px: 34, text: '#fff' }));
      R.forEach(([x, y, lab, tt]) => { nodePill(g, x, y, '⚠ ' + lab, k_(t, tt, .35), C.red, { px: 36, text: '#fff' }); });
    },
    odds(g, t) {   // gold bar chart of implied title chances over the blurred slot machine
      g.drawImage(BLUR.retro_slot, -20, -20, W + 40, H + 40); g.fillStyle = 'rgba(10,8,14,.45)'; g.fillRect(0, 0, W, H);
      headline(g, HD.odds, t, 300, { px: 84, center: true });
      txt(g, s.oddsTitle, W / 2, 620, { fam: MONO(), w: 500, px: 24, align: 'center', color: '#cfc9d9', ls: AR ? 0 : 3, a: k_(t, S.odds + .15) });
      const rows = [[s.oddsTeams[0], '+300', 25.0], [s.oddsTeams[1], '+625', 13.8], [s.oddsTeams[2], '+900', 10.0], [s.oddsTeams[3], '+2500', 3.8]];
      rows.forEach(([team, line, pct], i) => {
        const y = 760 + i * 190, me = i === 3, kk = eio(k_(t, S.odds + .25 + i * .12, .7)), full = 640 * pct / 25;
        txt(g, team, AR ? W - 90 : 90, y, { w: 800, px: 40, color: me ? C.gold : '#fff', align: SIDE(), a: clamp(kk * 2) });
        const bx = 90, by = y + 22; rr(g, bx, by, 900, 46, 23); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill();
        g.save(); rr(g, AR ? bx + 900 - Math.max(46, full * kk) : bx, by, Math.max(46, full * kk), 46, 23); g.fillStyle = me ? C.gold : 'rgba(255,255,255,.85)';
        if (me) { g.shadowColor = C.gold; g.shadowBlur = 24; } g.fill(); g.restore();
        txt(g, `${line} · ${pct.toFixed(1)}%`, AR ? 90 : W - 90, y, { w: 700, px: 30, color: me ? C.gold : '#d8d3e0', align: AR ? 'left' : 'right', a: clamp(kk * 2) });
      });
      slamStamp(g, t, T.odds25, '25–1', W / 2, 1640, C.gold, -.06, 110);
      txt(g, s.oddsSrc, W / 2, 1810, { w: 500, px: 21, align: 'center', color: '#9b96a6', a: k_(t, S.odds + .5) });
    },
    cta(g, t) {   // full-bleed ring box; three medallions light on "one, two, three"
      const z = 1.0 + .06 * clamp((t - S.cta) / 5);
      cover(g, IMG.retro_rings, 0, 0, W, H, z, .5, .6);
      const sh = g.createLinearGradient(0, 0, 0, 760); sh.addColorStop(0, 'rgba(14,4,16,.85)'); sh.addColorStop(1, 'rgba(14,4,16,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, 760);
      headline(g, HD.cta, t, 310, { px: 80, center: true });
      [[T.ring1, '1'], [T.ring2, '2'], [T.ring3, '3?']].forEach(([tt, lab], i) => {
        const k = k_(t, tt, .3); const x = W / 2 + (AR ? -1 : 1) * (i - 1) * 230, y = 1660, r = 88;
        g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = 'rgba(12,8,16,.75)'; g.fill(); g.lineWidth = 5;
        g.strokeStyle = k > 0 ? (i === 2 ? C.purple : C.gold) : 'rgba(255,255,255,.25)'; if (k > 0) { g.shadowColor = g.strokeStyle; g.shadowBlur = 30 * k; } g.stroke(); g.restore();
        if (k > 0) txt(g, lab, x, y + 30, { w: 900, px: 84, align: 'center', color: i === 2 ? '#c9b8ff' : C.goldHi, a: k, fam: "'Inter', sans-serif" });
      });
    },
    end(g, t) {
      const frames = [[S.end, 'diorama_arena2026']];
      backdrop(g, t, frames); kicker(g, s.k4, t, S.end + .1);
      card(g, t, frames, { t0: S.end, span: 4 });
      cardLabel(g, t, S.end + .15, s.endLabel);
      cardStamp(g, t, S.end + .45, '?', s.tagEnd, C.purple);
      capsHead(g, t, [[S.end + .2, s.hEnd]]); pill(g, t);
    },
  };
  SH = order.map((id, i) => ({ id, t0: S[id], t1: i < order.length - 1 ? S[order[i + 1]] : DUR, tin: tin[id], draw: draw[id] }));
}

// ------------------------------------------------------------------ frame + transitions
let BUF = null;
export function renderFilm(ctx, t) {
  if (!BUF) { BUF = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c.getContext('2d'); }); }
  const i = SH.findIndex(s => t >= s.t0 && t < s.t1), s = SH[i < 0 ? SH.length - 1 : i], nx = SH[SH.indexOf(s) + 1];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  const BD = .4;
  if (nx && nx.tin === 'blur' && t > nx.t0 - BD) {
    // blur dissolve into the next shot (reference A)
    const k = clamp((t - (nx.t0 - BD)) / BD);
    const a = BUF[0], b = BUF[1]; a.setTransform(1, 0, 0, 1, 0, 0); b.setTransform(1, 0, 0, 1, 0, 0);
    a.clearRect(0, 0, W, H); b.clearRect(0, 0, W, H); s.draw(a, t); nx.draw(b, nx.t0 + .001);
    ctx.filter = `blur(${k * 22}px)`; ctx.drawImage(a.canvas, 0, 0); ctx.filter = `blur(${(1 - k) * 22}px)`; ctx.globalAlpha = eio(k); ctx.drawImage(b.canvas, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none';
  } else {
    s.draw(ctx, t);
    if (s.tin === 'cut' && s.id !== 'hook') { const k = clamp((t - s.t0) / .12); if (k < 1) { ctx.fillStyle = `rgba(255,255,255,${(1 - k) * .18})`; ctx.fillRect(0, 0, W, H); } }
  }
  // a thin progress line across the top
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(0, 0, W, 6); ctx.fillStyle = C.gold; ctx.fillRect(AR ? W - W * t / DUR : 0, 0, W * t / DUR, 6);
}

// ------------------------------------------------------------------ sound events (same clock as the picture)
let EVS = [];
export const events = () => EVS;
function buildEvents() {
  EVS = []; const S = L.shots, T = L.t, ev = (t, type, o = {}) => EVS.push({ t: +t.toFixed(3), type, ...o });
  ev(0, 'vo'); ev(0, 'boom');
  SH.forEach(s => { if (s.tin === 'blur') ev(s.t0 - .35, 'whoosh'); else if (s.id !== 'hook') ev(s.t0, 'cut'); });
  [T.y2000, T.y2001, T.y2002].forEach(x => ev(x, 'stamp')); ev(T.three, 'impact');
  ev(T.g15 - .35, 'ticks', { n: 16, dur: T.g1 + .5 - (T.g15 - .35) }); ev(T.oneLoss, 'slam');
  ev(T.y24 - .2, 'riser', { dur: 1.6 }); ev(T.nobody, 'slam');
  ev(T.since2018, 'stamp'); ev(T.luka + .1, 'impact');
  ev(T.w14 - .3, 'riser', { dur: 1.2 }); ev(T.west, 'pop'); ev(T.p37 - .1, 'ticks', { n: 10, dur: .9 });
  ev(T.reaves, 'pop'); ev(T.kessler, 'pop');
  ev(S.brutal - .05, 'stop'); ev(T.brutal, 'impact');
  ev(S.rivals + .35, 'pop'); ev(T.spurs, 'slam'); ev(T.knicks, 'slam'); ev(T.lebron2, 'slam');
  ev(T.plus - .1, 'pop'); ev(T.plus + .15, 'pop'); ev(T.plus + .4, 'pop'); ev(T.thin, 'alarm'); ev(T.center, 'alarm');
  ev(S.odds + .25, 'riser', { dur: .9 }); ev(T.odds25, 'slam');
  ev(T.ring1, 'ring'); ev(T.ring2, 'ring', { pitch: 3 }); ev(T.ring3, 'ring', { pitch: 7 });
  ev(S.end + .45, 'impact');
  cues().forEach(c => ev(c.t0, 'cue', { t1: c.t1, text: c.text }));
  ['drought', 'era', 'working', 'brutal', 'rivals', 'odds', 'cta', 'end'].forEach(k => ev(S[k], 'sec', { name: k }));
  EVS.sort((a, b) => a.t - b.t);
}
export const markers = () => ({ shots: L.shots, t: L.t, dur: DUR, lang: LANG });

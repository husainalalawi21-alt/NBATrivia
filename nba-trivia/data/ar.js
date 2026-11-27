// ar.js — Arabic (Gulf dialect) for the questions.
//
// Every question template writes an Arabic sentence next to its English one,
// built from the same facts with these helpers. Names come from names-ar.js;
// a name with no Arabic yet stays in English and is listed in MISSING so the
// build can report it. Answers keep their English value (that's what the game
// checks); opt() gives each one its Arabic label.
import { NAMES } from './names-ar.js';

export const MISSING = new Map();
export const COLLISIONS = new Set();     // option sets where two answers read the same in Arabic (build report)          // English name → how many questions used it untranslated
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// A name in Arabic script, or the English name when it isn't in the dictionary yet.
export function N(name) {
  if (name == null) return '';
  const s = String(name).trim();
  if (!s || !/[A-Za-z]/.test(s)) return s;
  const v = NAMES[s] ?? NAMES[strip(s)];
  if (v) return v;
  MISSING.set(s, (MISSING.get(s) || 0) + 1);
  return s;
}

// Scores and records ("41–31", "4–2") inside Arabic text would read backwards;
// a left-to-right isolate keeps them in order.
export const iso = s => '⁦' + s + '⁩';
export const pair = (a, b) => iso(`${a}–${b}`);

export const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const date = d => { const [y, m, day] = String(d).slice(0, 10).split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };

const ORD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر'];
export const ord = n => ORD[n] || `الـ${n}`;

// Counted nouns follow Arabic number agreement: 1 singular, 2 dual, 3–10 plural, 11+ singular.
export const count = (n, [one, two, few, many]) => n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;
export const games = n => count(n, ['مباراة وحدة', 'مباراتين', 'مباريات', 'مباراة']);
export const seasons = n => count(n, ['موسم واحد', 'موسمين', 'مواسم', 'موسماً']);
export const points = n => count(n, ['نقطة وحدة', 'نقطتين', 'نقاط', 'نقطة']);
export const wins = n => count(n, ['فوز واحد', 'فوزين', 'انتصارات', 'انتصاراً']);
// "هدّاف الدوري 3 مرات" — a title won more than once.
export const times = (n, what) => (n === 1 ? what : `${what} ${count(n, ['مرة', 'مرتين', 'مرات', 'مرة'])}`);
export const titles = n => count(n, ['بطولة وحدة', 'بطولتين', 'بطولات', 'بطولة']);

// "A، B، C أو D"
export const list = xs => xs.length < 2 ? (xs[0] || '') : xs.slice(0, -1).join('، ') + ' أو ' + xs[xs.length - 1];

// "1990s" → "التسعينات", "1980s–1990s" → "الثمانينات إلى التسعينات"
const DECADES = { 1940: 'الأربعينات', 1950: 'الخمسينات', 1960: 'الستينات', 1970: 'السبعينات', 1980: 'الثمانينات', 1990: 'التسعينات', 2000: 'الألفينات', 2010: 'عقد 2010', 2020: 'عقد 2020' };
export const era = s => String(s || '').split(/\s*[–-]\s*/).map(d => DECADES[parseInt(d, 10)] || d).join(' إلى ');

export const conf = c => (/^east/i.test(c) ? 'الشرقية' : 'الغربية');
export const DIVS = { Atlantic: 'الأطلسي', Central: 'الوسط', Southeast: 'الجنوب الشرقي', Northwest: 'الشمال الغربي', Pacific: 'الهادئ', Southwest: 'الجنوب الغربي' };
export const finals = y => (y < 1949 ? 'نهائيات BAA' : 'نهائيات NBA');
export const league = y => (y < 1949 ? 'BAA' : 'NBA');
// A playoff round as generate.js names it ("Western Conference Semifinals", "NBA Finals").
export function round(name) {
  if (!name) return '';
  if (name === 'NBA Finals') return 'نهائيات NBA';
  const m = /^(Eastern|Western) Conference (First Round|Semifinals|Finals)$/.exec(name);
  if (m) return { 'First Round': `الدور الأول في المنطقة ${conf(m[1])}`, Semifinals: `نصف نهائي المنطقة ${conf(m[1])}`, Finals: `نهائي المنطقة ${conf(m[1])}` }[m[2]];
  return name;
}
export const OUTCOMES = {
  'Missed the playoffs': 'ما تأهل للبلاي أوف', 'Lost in the first round': 'طلع من الدور الأول',
  'Lost in the conference semifinals': 'طلع من نصف نهائي المنطقة', 'Lost in the conference finals': 'طلع من نهائي المنطقة',
  'Lost in the NBA Finals': 'خسر النهائيات', 'Won the championship': 'فاز باللقب'
};
const COLORS = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', white: 'أبيض', black: 'أسود', teal: 'فيروزي', purple: 'بنفسجي', wine: 'نبيتي',
  gold: 'ذهبي', navy: 'كحلي', blue: 'أزرق', silver: 'فضي', orange: 'برتقالي', cream: 'كريمي', 'beale street blue': 'أزرق فاتح' };
export function colors(s) {
  const parts = String(s).toLowerCase().split(/,\s*|\s+and\s+/).map(x => COLORS[x.trim()]);
  return parts.every(Boolean) ? parts.slice(0, -1).join('، ') + (parts.length > 1 ? ' و' : '') + parts[parts.length - 1] : null;
}
// Height "6-9" → centimetres, the way it's said in the Gulf.
export const cm = h => { const m = /^(\d)-(\d{1,2})$/.exec(h || ''); return m ? Math.round((+m[1] * 12 + +m[2]) * 2.54) : null; };
export const POS = { guard: 'ظهير', forward: 'جناح', center: 'سنتر', 'guard-forward': 'ظهير وجناح', 'forward-guard': 'جناح وظهير',
  'forward-center': 'جناح وسنتر', 'center-forward': 'سنتر وجناح' };
const WORDN = { Zero: 0, One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7 };
const CONFS = { 'Eastern Conference': 'المنطقة الشرقية', 'Western Conference': 'المنطقة الغربية', 'Central Conference': 'المنطقة الوسطى', 'Atlantic Conference': 'المنطقة الأطلسية' };

// Fixed labels other modules register (record values such as "over 40,000").
export const LABELS = {};

// One answer option, as shown in Arabic.
export function opt(o) {
  const s = String(o);
  let m;
  if (LABELS[s]) return LABELS[s];
  if (OUTCOMES[s]) return OUTCOMES[s];
  if (CONFS[s]) return CONFS[s];
  if ((m = /^(\d+) games$/.exec(s))) return games(+m[1]);
  if ((m = /^(Zero|One|Two|Three|Four|Five|Six|Seven) games$/.exec(s))) return games(WORDN[m[1]]);
  if ((m = /^No\. (\d+)$/.exec(s))) return `رقم ${m[1]}`;
  if ((m = /^(\d+)(st|nd|rd|th)$/.exec(s))) return ord(+m[1]);
  if ((m = /^(Atlantic|Central|Southeast|Northwest|Pacific|Southwest) Division$/.exec(s))) return `قسم ${DIVS[m[1]]}`;
  if (/^[\d\s.,–\-+%]+$/.test(s)) return s.includes('–') ? iso(s) : s;   // numbers, records, scores, seasons
  const c = colors(s); if (c) return c;
  return N(s);
}
// Answer labels for a whole question: { english: arabic } for every option that changes.
export function options(list) {
  const o = {};
  for (const a of list || []) { const v = opt(a); if (v !== a) o[a] = v; }
  return o;
}
// Labels for a question's options. Two options that would read the same in
// Arabic (Isiah / Isaiah Thomas) keep their English spelling.
export function labels(answers, extra = {}) {
  const o = { ...options((answers || []).filter(a => !(a in extra))), ...extra }, seen = new Map();
  for (const a of answers || []) { const l = o[a] ?? a; seen.set(l, (seen.get(l) || 0) + 1); }
  for (const a of answers || []) if (seen.get(o[a] ?? a) > 1) { delete o[a]; COLLISIONS.add(answers.join(' / ')); }
  return o;
}
// The Arabic column for a generated question (tools/build.mjs and the weekly update).
export const layerOf = k => (k.ar ? { q: k.ar.q, e: k.ar.e || null, o: labels([k.fact, ...(k.wrongs || [])]) } : null);

// The whole Arabic layer of a bank record: question, explanation, answer labels
// (and the clues of a Who Am I? multiple choice). For a career mystery: the name,
// the explanation, the option labels, and the teams of its career path.
const PATH_LABEL = { 'Career path': 'المسيرة', 'NBA career path': 'مسيرته في NBA', 'Coaching path': 'مسيرته التدريبية', 'NBA coaching path': 'مسيرته التدريبية في NBA' };
export function recordLayer(r) {
  if (r.question_type === 'career_mystery') {
    const p = r.person, name = p.ar_name || N(p.name);
    for (const c of p.clues) if (c.type === 'path') c.ar = { label: PATH_LABEL[c.label || 'Career path'] || 'المسيرة', teams: c.teams.map(N) };
    return { name, e: `${name} — ${p.kind === 'coach' ? 'مدرب' : 'لاعب'}، ${era(p.era)}.`, o: labels([p.name, ...(p.decoys || [])]) };
  }
  if (!r.ar) return null;
  let q = r.ar.q;
  const o = labels(r.answers, r.ar.o || {});
  if (/^(comparison|before_after)$/.test(r.question_type) && (r.answers || []).length === 2) q = `${q.replace(/؟\s*$/, '')}: ${list([...r.answers].sort().map(a => o[a] || a))}؟`;
  return { q, e: r.ar.e || null, o, ...(r.clues ? { clues: q.split('|') } : {}) };
}

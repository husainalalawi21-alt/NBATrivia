// i18n.js — English / Arabic for the interface.
//
// Strings live in i18n/en.json and i18n/ar.json, in the same shape i18next
// uses: nested keys, {{name}} placeholders, and plural forms as key_one,
// key_other (Arabic adds _zero, _two, _few, _many), picked with the
// browser's Intl.PluralRules. English fills any gap in the other language.
//
// The language is the player's saved choice, else the phone's language.
// Arabic switches the whole page to right-to-left (dir="rtl" on <html>).
const KEY = 'v2_lang';
export const LANGS = ['en', 'ar'];
let lang = 'en', dict = {}, fallback = {}, merged = {};

const deepMerge = (base, over) => {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(over || {})) out[k] = v && typeof v === 'object' && !Array.isArray(v) && base && typeof base[k] === 'object' ? deepMerge(base[k], v) : v;
  return out;
};
const get = (obj, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), obj);
async function load(l) { const res = await fetch(`i18n/${l}.json`, { cache: 'no-cache' }); return res.json(); }
function apply() { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }

function preferred() {
  try { const saved = localStorage.getItem(KEY); if (LANGS.includes(saved)) return saved; } catch (e) {}
  return (navigator.languages || [navigator.language]).some(l => /^ar\b/i.test(l || '')) ? 'ar' : 'en';
}

export async function init() {
  lang = preferred();
  try {
    fallback = await load('en');
    dict = lang === 'en' ? fallback : await load(lang);
  } catch (e) { lang = 'en'; dict = fallback; }
  merged = deepMerge(fallback, dict);
  apply();
}

export async function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  dict = l === 'en' ? fallback : await load(l);
  lang = l; merged = deepMerge(fallback, dict);
  try { localStorage.setItem(KEY, l); } catch (e) {}
  apply();
}

export const getLang = () => lang;
export const isRTL = () => lang === 'ar';
// The whole dictionary for the current language (English underneath), for the markup: {{ L.welcome.title }}
export const strings = () => merged;

export function t(key, vars = {}) {
  let s;
  if (typeof vars.count === 'number') {
    const form = new Intl.PluralRules(lang).select(vars.count);
    s = get(dict, `${key}_${form}`) ?? get(dict, `${key}_other`) ?? get(fallback, `${key}_${new Intl.PluralRules('en').select(vars.count)}`) ?? get(fallback, `${key}_other`);
  }
  s = s ?? get(dict, key) ?? get(fallback, key) ?? key;
  return typeof s === 'string' ? s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, n) => (vars[n] ?? '')) : s;
}
// English strings, to recognise a message that arrived as English text (e.g. from the server).
export const english = () => fallback;

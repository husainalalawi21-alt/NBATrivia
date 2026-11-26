// ════════════════════════════════════════════════════════════════
// engine.js — MASTER QUESTION BANK + QUESTION ENGINE
//
// One bank. Every game mode is a VIEW over it, never its own pool.
// Sources (questions.js / mystery.js / teams.js) are normalized into
// immutable master records at boot; a question exists exactly ONCE and
// carries one permanent question_id across every mode that uses it.
//
//   MASTER BANK → ENGINE → (mode rules + user history + dup check) → SESSION
//
// Persistence is localStorage here (no backend in this prototype), but the
// contract is written as a data layer: swapping in a real DB means
// replacing the Store adapter, not the selection logic.
// ════════════════════════════════════════════════════════════════

export const SEASON = '2025-26';
export const MODES = ['streak', 'buzz', 'team', 'q20', 'daily', 'wai', 'h2h'];
export const LIFECYCLE = ['draft', 'pending', 'approved', 'active', 'disabled', 'outdated'];
export const RETENTION_OPTIONS = [7, 30, 60, 90, 180, 0]; // 0 = never repeat
export const DAILY_LEDGER_KEY = 'v2_daily_ledger';

const CKEY = 'v2_q_config', AKEY = 'v2_q_analytics', OKEY = 'v2_q_overrides';
// History is per player: a guest and each signed-in account keep their own.
let HKEY = 'v2_q_history';
export function useHistoryOf(userId) { HKEY = userId ? 'v2_q_history:' + userId : 'v2_q_history'; }
// Fold a player's server-side answer log into the local history the
// exclusion window reads, so "never repeat" holds across their devices.
export function mergeHistory(rows) {
  const h = getHistory();
  for (const r of rows) {
    const t = Date.parse(r.answered_at);
    if (!h[r.question_id] || h[r.question_id].shown_at < t) h[r.question_id] = { shown_at: t, answered_at: t, game_mode: r.mode, result: r.correct ? 'correct' : 'incorrect' };
  }
  Store.write(HKEY, h);
}

// ── Store adapter ────────────────────────────────────────────────
const Store = {
  read(k, fallback) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch (e) { return fallback; } },
  write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

// exclusionDays 0 = a player never sees the same question twice, in any mode or session.
export const defaultConfig = () => ({ exclusionDays: 0, autoPublish: false, semanticThreshold: 0.82, dailyNeverRepeat: true });
export const getConfig = () => Object.assign(defaultConfig(), Store.read(CKEY, {}));
export const setConfig = patch => { const c = Object.assign(getConfig(), patch); Store.write(CKEY, c); return c; };

// ── Deterministic immutable IDs ──────────────────────────────────
export function kpFor(rec) {
  // Stable knowledge-point key: the FACT being tested, not its wording.
  if (rec.knowledge_point_id) return rec.knowledge_point_id;
  const season = rec.season ? rec.season.replace(/[^0-9-]/g, '') : 'ALL';
  const subject = normalizeText(rec.correct_answer).toUpperCase().replace(/ /g, '-').slice(0, 28) || 'UNKNOWN';
  const topic = String(rec.category || 'GEN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
  return `KP-${season}-${topic}-${subject}`;
}

function hash32(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function mintId(seedStr, taken) {
  let n = hash32(seedStr) % 100000000, id;
  do { id = `NBA-${SEASON.slice(0, 4)}-${String(n).padStart(8, '0')}`; n = (n + 1) % 100000000; } while (taken.has(id));
  taken.add(id);
  return id;
}

// ── Normalization / semantic fingerprint ─────────────────────────
const STOP = new Set(['the', 'a', 'an', 'of', 'in', 'to', 'for', 'and', 'or', 'is', 'was', 'were', 'did', 'does', 'do', 'who', 'which', 'what', 'has', 'have', 'had', 'nba', 'player', 'team', 'season', 'regular', 'named', 'won', 'win', 'wins']);
export function normalizeText(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(t) { return new Set(normalizeText(t).split(' ').filter(w => w.length > 2 && !STOP.has(w))); }
function jaccard(a, b) { let inter = 0; a.forEach(x => { if (b.has(x)) inter++; }); const uni = a.size + b.size - inter; return uni ? inter / uni : 0; }

// Similarity blends text overlap with entity/answer/season agreement, so
// "Who won the 2025 NBA MVP?" and "Which player was named MVP of the 2025
// regular season?" score as near-duplicates even with different wording.
export function similarity(a, b) {
  const text = jaccard(tokens(a.question_text), tokens(b.question_text));
  const sameAnswer = normalizeText(a.correct_answer) === normalizeText(b.correct_answer) ? 1 : 0;
  const sameSeason = a.season && a.season === b.season ? 1 : 0;
  const ents = jaccard(new Set([...(a.players || []), ...(a.teams || [])].map(normalizeText)), new Set([...(b.players || []), ...(b.teams || [])].map(normalizeText)));
  const sameCat = a.category === b.category ? 1 : 0;
  return Math.min(1, text * 0.5 + sameAnswer * 0.28 + ents * 0.1 + sameCat * 0.07 + sameSeason * 0.05);
}
export function findDuplicates(record, bank, threshold = getConfig().semanticThreshold) {
  return bank
    .filter(x => x.question_id !== record.question_id && x.status !== 'outdated')
    .map(x => ({ question_id: x.question_id, question_text: x.question_text, score: similarity(record, x) }))
    .filter(x => x.score >= threshold)
    .sort((x, y) => y.score - x.score)
    .slice(0, 5);
}

// ── Bank construction ────────────────────────────────────────────
const DIFF_MAP = { easy: 'easy', medium: 'medium', hard: 'hard', expert: 'expert' };
const TEAM_TIER_DIFF = { fan: 'beginner', diehard: 'easy', superfan: 'medium', legend: 'hard', expert: 'expert' };
const MYSTERY_TIER_DIFF = { rookie: 'beginner', starter: 'easy', allstar: 'medium', superstar: 'hard', legend: 'expert' };
export const TIER_ORDER = ['beginner', 'easy', 'medium', 'hard', 'expert'];
export const TARGET_MIX = { beginner: 0.20, easy: 0.25, medium: 0.30, hard: 0.20, expert: 0.05 };
// Exclusive pools: a question belongs to exactly ONE mode (spec §4/§27).
export const POOLS = ['buzz', 'daily', 'q20', 'wai', 'team'];
export const QUALITY_THRESHOLD = 60;
const DYNAMIC_HINT = /\b(currently|current|this season|so far this|reigning|active leader|leads the (?:nba|league))\b/i;

// Genuinely time-sensitive facts. These carry a validity window and are
// retired automatically by refreshTemporal() when the window closes —
// the mechanism sections 8 and 9 of the brief require.
const DYNAMIC_SEED = [
  { question_text: 'Who is currently the head coach of the Los Angeles Lakers?', correct_answer: 'JJ Redick', answers: ['JJ Redick', 'Darvin Ham', 'Frank Vogel', 'Ty Lue'], category: 'Coaches', difficulty: 'starter', explanation: 'Redick took over as Lakers head coach in 2024.', source_name: 'NBA', teams: ['Los Angeles Lakers'] },
  { question_text: 'Who is the reigning NBA Most Valuable Player?', correct_answer: 'Shai Gilgeous-Alexander', answers: ['Shai Gilgeous-Alexander', 'Nikola Jokić', 'Giannis Antetokounmpo', 'Luka Dončić'], category: 'MVP', difficulty: 'rookie', explanation: 'SGA won MVP for 2024–25.', source_name: 'NBA', players: ['Shai Gilgeous-Alexander'] },
  { question_text: 'Which team are the reigning NBA champions?', correct_answer: 'Oklahoma City Thunder', answers: ['Oklahoma City Thunder', 'Boston Celtics', 'Indiana Pacers', 'Denver Nuggets'], category: 'Championships', difficulty: 'rookie', explanation: 'Oklahoma City won the 2025 Finals.', source_name: 'NBA', teams: ['Oklahoma City Thunder'] },
  { question_text: 'Who is the reigning NBA Defensive Player of the Year?', correct_answer: 'Evan Mobley', answers: ['Evan Mobley', 'Victor Wembanyama', 'Rudy Gobert', 'Bam Adebayo'], category: 'Awards', difficulty: 'allstar', explanation: 'Mobley won Defensive Player of the Year for 2024–25.', source_name: 'NBA', players: ['Evan Mobley'] },
  { question_text: 'Who is currently the NBA\'s all-time leading scorer?', correct_answer: 'LeBron James', answers: ['LeBron James', 'Kareem Abdul-Jabbar', 'Karl Malone', 'Kevin Durant'], category: 'NBA Records', difficulty: 'rookie', explanation: 'James passed Kareem Abdul-Jabbar in February 2023 and still leads.', source_name: 'NBA', players: ['LeBron James'] },
  { question_text: 'Who is the reigning NBA Rookie of the Year?', correct_answer: 'Stephon Castle', answers: ['Stephon Castle', 'Zaccharie Risacher', 'Jaylen Wells', 'Zach Edey'], category: 'Awards', difficulty: 'allstar', explanation: 'Castle won Rookie of the Year for 2024–25 with San Antonio.', source_name: 'NBA', players: ['Stephon Castle'] }
];

function baseRecord(id, over) {
  return Object.assign({
    question_id: id, knowledge_point_id: null, question_text: '', question_type: 'multiple_choice', answers: [], correct_answer: '',
    explanation: '', difficulty: 'medium', category: 'General', subcategory: null,
    pool: null, quality_score: null, verification_status: 'verified', last_verified_at: '2025-09-01',
    teams: [], players: [], seasons: [], relevant_date: null, season: null,
    source_name: 'Basketball Reference', source_url: 'https://www.basketball-reference.com/', source_date: '2025-07-01',
    created_at: '2025-07-01', updated_at: '2025-07-01',
    status: 'active', active: true, temporal: 'static', valid_from: null, valid_until: null,
    game_modes_allowed: [], last_used_at: null, usage_count: 0
  }, over);
}

let BANK = null, BY_ID = null, BUILD_STATS = { kpCollisions: 0, generated: 0, rejectedQuality: 0 };
export const buildStats = () => BUILD_STATS;

// Assign each record to exactly one pool. Format-bound content goes to its
// only possible home (mysteries → WHO AM I, team facts → YOUR TEAM); the
// general corpus is dealt round-robin across BUZZ / DAILY / 20 QUESTIONS
// with short questions biased to BUZZ, so the modes never share content.
function assignPools(records) {
  const general = [];
  for (const r of records) {
    if (r.question_type === 'career_mystery') { r.pool = 'wai'; }
    else if (r.team_id) { r.pool = 'team'; }
    else general.push(r);
  }
  // Short + recognizable first: BUZZ wants fast reads.
  general.sort((a, b) => a.question_text.length - b.question_text.length);
  const buzzCut = Math.floor(general.length * 0.34);
  general.forEach((r, i) => { r.pool = i < buzzCut ? 'buzz' : ((i - buzzCut) % 2 === 0 ? 'daily' : 'q20'); });
  for (const r of records) r.game_modes_allowed = r.pool === 'team' ? ['team'] : r.pool === 'wai' ? ['wai'] : [r.pool, 'h2h'];
  return records;
}

// 0–100 across accuracy proxy, uniqueness, clarity, distractor and source
// quality, and mode fit. Below QUALITY_THRESHOLD never reaches the pool.
export function scoreQuality(rec, bank) {
  let s = 0;
  s += rec.verification_status === 'verified' ? 28 : 10;                       // accuracy
  s += rec.source_url ? 12 : 6;                                               // source
  s += TIER_ORDER.includes(rec.difficulty) ? 10 : 0;                          // difficulty assigned
  const len = rec.question_text.length;
  s += len > 18 && len < 150 ? 14 : 6;                                        // clarity
  const opts = (rec.answers || []).filter(Boolean);
  if (rec.question_type === 'career_mystery') s += 16;
  else {
    const uniq = new Set(opts.map(normalizeText)).size === opts.length;
    const plausible = opts.every(o => String(o).length > 1);
    s += uniq && plausible && opts.length >= 2 ? 16 : 0;                      // distractors
  }
  s += rec.explanation ? 10 : 2;                                              // answer quality
  const dupes = bank ? findDuplicates(rec, bank, 0.9) : [];
  s += dupes.length ? 0 : 10;                                                 // uniqueness
  return Math.min(100, s);
}

export function buildBank({ questions, mystery, teams, facts }) {
  if (BANK) return BANK;
  const taken = new Set(), out = [];
  const kpSeen = new Set();
  let kpCollisions = 0;
  const claim = rec => {
    // ONE knowledge point = ONE question. A second question on the same fact
    // is rejected, which is what stops wording variations inflating the bank.
    const kp = kpFor(rec);
    if (kpSeen.has(kp)) { kpCollisions++; return false; }
    kpSeen.add(kp); rec.knowledge_point_id = kp; return true;
  };
  BUILD_STATS = { kpCollisions: 0, generated: 0, rejectedQuality: 0 };

  // 1 — trivia multiple choice + comparison types
  for (const q of questions.QUESTIONS) {
    const id = mintId('q:' + q.id + ':' + q.text, taken);
    const dynamic = DYNAMIC_HINT.test(q.text);
    const rec = baseRecord(id, {
      source_ref: { kind: 'trivia', id: q.id },
      question_text: q.text, question_type: q.type === 'whoami' ? 'who_am_i' : q.type === 'ba' ? 'before_after' : q.type === 'cmp' ? 'comparison' : 'multiple_choice',
      answers: [q.correct, ...q.wrongs], correct_answer: q.correct, explanation: q.exp,
      difficulty: DIFF_MAP[q.diff] || 'starter', category: q.cat,
      players: /^[A-Z]/.test(q.correct) && q.correct.split(' ').length <= 3 ? [q.correct] : [],
      season: dynamic ? SEASON : null, temporal: dynamic ? 'dynamic' : 'static',
      valid_from: dynamic ? '2025-10-01' : null, valid_until: dynamic ? '2026-06-30' : null,
      clues: q.type === 'whoami' ? q.text.split('|') : null
    });
    if (claim(rec)) out.push(rec); else taken.delete(id);
  }

  // 2 — career mysteries
  for (const p of mystery.PEOPLE) {
    const id = mintId('m:' + p.id + ':' + p.name, taken);
    const rec = baseRecord(id, {
      source_ref: { kind: 'mystery', id: p.id },
      question_text: `Who am I? — ${p.clues[0] && p.clues[0].content ? p.clues[0].content : p.name}`,
      question_type: 'career_mystery', answers: [], correct_answer: p.name,
      explanation: `${p.name} — ${p.kind === 'coach' ? 'coach' : 'player'}, ${p.era}.`,
      difficulty: MYSTERY_TIER_DIFF[p.tier] || 'medium', category: 'Career History', subcategory: p.kind,
      players: p.kind === 'player' ? [p.name] : [], teams: (p.clues.find(c => c.type === 'path') || {}).teams || [],
      identity_puzzle_id: 'IP-' + String(p.id).padStart(5, '0'), person: p
    });
    rec.knowledge_point_id = 'KP-IDENTITY-' + normalizeText(p.name).toUpperCase().replace(/ /g, '-');
    if (claim(rec)) out.push(rec); else taken.delete(id);
  }

  // 3 — team questions: EXHAUSTIVELY materialized into the SAME bank, so the
  // per-team pool is large enough for the 90-day exclusion window to hold.
  const TIER_DIFF = TEAM_TIER_DIFF;
  for (const t of teams.TEAMS) {
    const full = teams.fullName(t);
    const seenText = new Set();
    for (const q of teams.allTemplates(t.id, seededRandom('tpl-' + t.id))) {
      if (seenText.has(q.text)) continue;
      seenText.add(q.text);
      const id = mintId('t:' + t.id + ':' + q.text, taken);
      const rec = baseRecord(id, {
        source_ref: { kind: 'team', teamId: t.id },
        question_text: q.text, answers: [q.correct, ...q.wrongs], correct_answer: q.correct, explanation: q.exp,
        difficulty: TEAM_TIER_DIFF[q.diff] || TIER_DIFF[q.diff] || 'medium',
        category: q.cat, subcategory: full, teams: [full], team_id: t.id,
        source_name: 'Team media guide'
      });
      rec.knowledge_point_id = `KP-${t.id.toUpperCase()}-${String(q.cat || 'GEN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10)}-${normalizeText(q.correct).toUpperCase().replace(/ /g, '-').slice(0, 24)}`;
      if (claim(rec)) out.push(rec); else taken.delete(id);
    }
  }

  // 4 — dynamic (time-sensitive) facts, each with a validity window
  for (const d of DYNAMIC_SEED) {
    const id = mintId('dyn:' + d.question_text, taken);
    const rec = baseRecord(id, Object.assign({}, d, {
      source_ref: { kind: 'dynamic' },
      temporal: 'dynamic', season: SEASON, valid_from: '2025-10-01', valid_until: '2026-09-30',
      source_date: '2025-09-01', relevant_date: '2025-09-01', source_url: 'https://www.nba.com/stats'
    }));
    if (claim(rec)) out.push(rec); else taken.delete(id);
  }

  // 5 — FACT-FIRST GENERATION: verified fact table → knowledge point →
  // question, with same-column same-era distractors. One KP, one question.
  if (facts) {
    const kps = facts.extractKnowledgePoints();
    BUILD_STATS.generated = kps.length;
    for (const kp of kps) {
      const rnd = seededRandom(kp.knowledge_point_id);
      const wrongs = facts.distractorsFor(kp, kps, rnd);
      if (wrongs.length < 3) continue;
      const id = mintId('kp:' + kp.knowledge_point_id, taken);
      const rec = baseRecord(id, {
        source_ref: { kind: 'fact', kp: kp.knowledge_point_id },
        knowledge_point_id: kp.knowledge_point_id,
        question_text: kp.question, answers: [kp.fact, ...wrongs], correct_answer: kp.fact,
        explanation: kp.explanation, difficulty: kp.difficulty, category: kp.category,
        season: kp.season, subcategory: kp.era,
        source_name: 'Basketball Reference', source_url: 'https://www.basketball-reference.com/',
        players: kp.column === 'player' ? [kp.fact] : [], teams: kp.column === 'team' || kp.column === 'champion' ? [kp.fact] : []
      });
      if (claim(rec)) out.push(rec); else taken.delete(id);
    }
  }

  // Pools are exclusive, then every record is quality-gated.
  assignPools(out);
  for (const r of out) {
    r.quality_score = scoreQuality(r, null);
    if (r.quality_score < QUALITY_THRESHOLD) { r.status = 'pending'; r.active = false; BUILD_STATS.rejectedQuality++; }
  }
  BUILD_STATS.kpCollisions = kpCollisions;

  BANK = out;
  BY_ID = new Map(out.map(r => [r.question_id, r]));
  return BANK;
}
export const getBank = () => BANK || [];
// Use a bank loaded from the database instead of building one on the device.
export function setBank(records) {
  BANK = records;
  BY_ID = new Map(records.map(r => [r.question_id, r]));
  BUILD_STATS = { kpCollisions: 0, generated: records.filter(r => r.source_name === 'balldontlie').length, rejectedQuality: records.filter(r => r.status === 'pending').length };
  return BANK;
}
export const byId = id => (BY_ID ? BY_ID.get(id) : null);

// Admin edits (status flips, difficulty changes) persist as sparse overrides
// so the derived bank stays reproducible from source.
export const getOverrides = () => Store.read(OKEY, {});
export function applyOverride(id, patch) {
  const all = getOverrides();
  all[id] = Object.assign({}, all[id], patch, { updated_at: new Date().toISOString().slice(0, 10) });
  Store.write(OKEY, all);
  const rec = byId(id); if (rec) Object.assign(rec, all[id]);
  return all[id];
}
export function hydrateOverrides() { const all = getOverrides(); for (const id in all) { const r = byId(id); if (r) Object.assign(r, all[id]); } }

// ── User history (GLOBAL — not per mode) ─────────────────────────
export const getHistory = () => Store.read(HKEY, {});
export function recordShown(ids, mode, sessionId) {
  const h = getHistory(), now = Date.now();
  for (const id of [].concat(ids)) h[id] = { shown_at: now, game_mode: mode, session_id: sessionId, result: (h[id] || {}).result || null };
  Store.write(HKEY, h);
}
export function recordAnswer(id, { correct, ms, mode }) {
  const h = getHistory();
  h[id] = Object.assign({ shown_at: Date.now(), game_mode: mode }, h[id], { answered_at: Date.now(), result: correct ? 'correct' : 'incorrect' });
  Store.write(HKEY, h);
  const a = Store.read(AKEY, {}), s = a[id] || { shown: 0, answered: 0, correct: 0, totalMs: 0, modes: [] };
  s.shown++; s.answered++; if (correct) s.correct++; s.totalMs += ms || 0;
  if (!s.modes.includes(mode)) s.modes.push(mode);
  s.last_used_at = Date.now();
  a[id] = s; Store.write(AKEY, a);
  const rec = byId(id); if (rec) { rec.usage_count = s.shown; rec.last_used_at = s.last_used_at; }
}
export const getAnalytics = () => Store.read(AKEY, {});
export function statsFor(id) { return statsFrom(getAnalytics()[id]); }
function statsFrom(s) {
  if (!s) return { shown: 0, correctPct: null, avgMs: null, modes: [], last_used_at: null };
  return { shown: s.shown, correctPct: s.answered ? Math.round(s.correct / s.answered * 100) : null, avgMs: s.answered ? Math.round(s.totalMs / s.answered) : null, modes: s.modes, last_used_at: s.last_used_at };
}
export function clearHistory() { Store.write(HKEY, {}); }

// A question is inside the exclusion window if the user saw it within
// `exclusionDays` (0 = never repeat, so any prior sighting blocks it).
export function inExclusion(id, history = getHistory(), cfg = getConfig()) {
  const h = history[id]; if (!h) return false;
  if (cfg.exclusionDays === 0) return true;
  return Date.now() - h.shown_at < cfg.exclusionDays * 864e5;
}

// ── Validation / quality control ─────────────────────────────────
export function validate(rec, bank = getBank()) {
  const errs = [];
  const needsOptions = rec.question_type !== 'career_mystery';
  if (!String(rec.question_text || '').trim()) errs.push('Question text is required');
  if (!rec.correct_answer) errs.push('A correct answer is required');
  if (needsOptions) {
    const opts = (rec.answers || []).filter(Boolean);
    const expected = ['comparison', 'before_after'].includes(rec.question_type) ? 2 : 4;
    if (opts.length !== expected) errs.push(`Needs exactly ${expected} answer options`);
    if (new Set(opts.map(normalizeText)).size !== opts.length) errs.push('Answer options must be unique');
    if (opts.length && !opts.some(o => normalizeText(o) === normalizeText(rec.correct_answer))) errs.push('The correct answer must be one of the options');
  }
  if (!TIER_ORDER.includes(rec.difficulty)) errs.push('Assign a difficulty');
  if (!rec.category) errs.push('Assign a category');
  if (!rec.source_name) errs.push('A source is required');
  if (rec.temporal === 'dynamic' && !(rec.valid_from && rec.valid_until)) errs.push('Dynamic questions need a validity window');
  if (rec.team_id && !(rec.teams || []).length) errs.push('Team questions need team metadata');
  const dups = findDuplicates(rec, bank);
  return { errors: errs, duplicates: dups, publishable: errs.length === 0 && !dups.some(d => d.score > 0.95) };
}
// Dynamic facts age out on their own — no manual retirement needed.
export function refreshTemporal(now = Date.now()) {
  let retired = 0;
  for (const r of getBank()) {
    if (r.temporal !== 'dynamic' || !r.valid_until) continue;
    const expired = now > Date.parse(r.valid_until + 'T23:59:59Z');
    if (expired && r.status === 'active') { r.status = 'outdated'; r.active = false; retired++; }
  }
  return retired;
}

// ── Eligibility + weighted selection ────────────────────────────
const TIER_FOR = { beginner: 1, easy: 2, medium: 3, hard: 4, expert: 5 };
export function bandFor(mode, progress) {
  // Steep ramps: a run warms up for a couple of questions, then gets hard fast.
  if (mode === 'team') return progress < 3 ? ['beginner', 'easy'] : progress < 8 ? ['easy', 'medium'] : progress < 15 ? ['medium', 'hard'] : ['hard', 'expert'];
  if (mode === 'streak') return progress < 2 ? ['beginner', 'easy'] : progress < 6 ? ['easy', 'medium'] : progress < 12 ? ['medium', 'hard'] : ['hard', 'expert'];
  // BUZZ stays fast and recognizable — it never climbs past medium.
  if (mode === 'buzz') return progress < 4 ? ['beginner', 'easy'] : progress < 12 ? ['easy', 'medium'] : ['medium', 'hard'];
  return TIER_ORDER;
}
// 20 QUESTIONS is a hard examination: 1 beginner / 3 easy / 5 medium / 6 hard / 5 expert.
export const Q20_SPREAD = ['beginner', 'easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'hard', 'hard', 'hard', 'expert', 'expert', 'expert', 'expert', 'expert'];

// Core gate: mode allowance + lifecycle + session + GLOBAL history.
export function eligible({ mode, teamId = null, band = null, category = null, sessionUsed = new Set(), history = getHistory(), cfg = getConfig(), ignoreHistory = false }) {
  return getBank().filter(r => {
    if (!r.active || r.status !== 'active') return false;
    if (r.quality_score != null && r.quality_score < QUALITY_THRESHOLD) return false;
    // One shared bank: every multiple-choice question can come up in any
    // multiple-choice mode (Streak, Buzz, 20 Questions, Daily, Head-to-Head),
    // team questions included. "Your Team" draws only its franchise's
    // questions; Who Am I? only career mysteries. History is shared too, so a
    // question seen in one mode never comes back in another.
    if (mode === 'team' && r.team_id !== teamId) return false;
    if (mode === 'wai' && r.question_type !== 'career_mystery') return false;
    if (mode !== 'wai' && r.question_type === 'career_mystery') return false;
    if (band && !band.includes(r.difficulty)) return false;
    if (category && category !== 'All' && r.category !== category) return false;
    if (sessionUsed.has(r.question_id)) return false;
    if (!ignoreHistory && inExclusion(r.question_id, history, cfg)) return false;
    return true;
  });
}

// Weighted, never ORDER BY random(): freshness, global rarity, difficulty
// fit to the user's live accuracy, subject spread, and team affinity.
function weight(r, ctx) {
  let w = 1;
  const st = ctx.statsOf(r.question_id);
  w *= st.last_used_at ? 0.55 : 1.35;                       // freshness
  w *= 1 / (1 + Math.min(6, (r.usage_count || 0) * 0.12));  // global rarity
  if (ctx.accuracy != null) {
    const want = ctx.accuracy > 0.85 ? 4 : ctx.accuracy < 0.55 ? 1.6 : 2.8;
    w *= 1 / (1 + Math.abs(TIER_FOR[r.difficulty] - want) * 0.45);       // difficulty fit
  }
  if (st.correctPct != null && (st.correctPct < 8 || st.correctPct > 97)) w *= 0.5; // suspect item
  if (ctx.subjectCount && ctx.subjectCount[r.correct_answer]) w *= 0.25;  // answer spread
  if (ctx.categoryCount && ctx.categoryCount[r.category] >= 4) w *= 0.3;  // category spread
  if (ctx.favoriteTeam && (r.teams || []).some(t => t.includes(ctx.favoriteTeam))) w *= 1.2;
  if (r.temporal === 'dynamic') w *= 1.15;                  // prefer current facts
  return Math.max(0.01, w);
}
function weightedPick(pool, ctx, rnd) {
  // Read the player's answer log once per pick, not once per candidate.
  const all = getAnalytics();
  ctx = { ...ctx, statsOf: id => statsFrom(all[id]) };
  const ws = pool.map(r => weight(r, ctx));
  const total = ws.reduce((a, b) => a + b, 0);
  let x = rnd() * total;
  for (let i = 0; i < pool.length; i++) { x -= ws[i]; if (x <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

// Shuffle options per serve so the correct answer's position is never learnable.
export function serve(rec, rnd = Math.random) {
  const view = {
    question_id: rec.question_id, text: rec.question_text, type: rec.question_type,
    correct: rec.correct_answer, exp: rec.explanation, cat: rec.category, diff: rec.difficulty,
    teams: rec.teams, season: rec.season, temporal: rec.temporal, source: rec.source_name
  };
  if (rec.question_type === 'career_mystery') {
    const p = rec.person;
    view.kind = p.kind; view.name = p.name; view.accept = p.accept; view.tier = p.tier; view.era = p.era;
    view.clues = p.clues;
    const mc = p.decoys.length >= 3 && ['rookie', 'starter'].includes(p.tier);
    view.options = mc ? shuffle([p.name, ...p.decoys.slice(0, 3)], rnd) : null;
    return view;
  }
  view.options = shuffle((rec.answers || []).slice(), rnd);
  view.clues = rec.clues || null;
  return view;
}
export function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// One question. Falls back by widening the difficulty band — never by
// re-serving something the player has seen. Out of unseen questions → null,
// and the game ends honestly ("you've seen every question here").
export function nextQuestion(session, opts = {}) {
  const rnd = session.rnd || Math.random;
  const band = opts.band || bandFor(session.mode, opts.progress || 0);
  const common = { mode: session.mode, teamId: session.teamId, category: session.category, sessionUsed: session.used, history: session.history };
  let pool = eligible({ ...common, band });
  let relaxed = null;
  // Empty band: step up one difficulty at a time (beginner → easy → …)
  // before giving up on difficulty altogether, so runs still start easy.
  for (let top = Math.max(...band.map(t => TIER_ORDER.indexOf(t))); !pool.length && top < TIER_ORDER.length - 1; ) {
    top++; pool = eligible({ ...common, band: TIER_ORDER.slice(TIER_ORDER.indexOf(band[0]), top + 1) }); relaxed = 'band';
  }
  if (!pool.length) { pool = eligible(common); relaxed = 'band'; }
  if (!pool.length) return null;
  const rec = weightedPick(pool, { accuracy: session.accuracy, subjectCount: session.subjectCount, categoryCount: session.categoryCount, favoriteTeam: opts.favoriteTeam }, rnd);
  session.used.add(rec.question_id);
  session.subjectCount[rec.correct_answer] = (session.subjectCount[rec.correct_answer] || 0) + 1;
  session.categoryCount[rec.category] = (session.categoryCount[rec.category] || 0) + 1;
  session.relaxed = relaxed || session.relaxed;
  recordShown(rec.question_id, session.mode, session.id);
  return serve(rec, rnd);
}

// A fixed set (20 Questions, Daily, Head-to-Head) with a difficulty spread.
export function buildSet(session, count = 20, spread = Q20_SPREAD) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const tier = spread[i] || spread[i % spread.length];
    const q = nextQuestion(session, { band: session.mode === 'wai' ? null : [tier], progress: i });
    if (q) out.push(q);
  }
  // Ramp easy → hard within the served set.
  return out.sort((a, b) => TIER_FOR[a.diff] - TIER_FOR[b.diff]);
}

// Daily: same seed for everyone, then per-user substitution where a question
// is already in that user's exclusion window — shared set, honest history.
export function buildDaily(dateKey, session, count = 10) {
  const rnd = seededRandom('daily-' + dateKey);
  const cfg = getConfig();
  const ledger = dailyLedger(), everUsed = new Set(cfg.dailyNeverRepeat ? ledger.used : []);
  const today = ledger.days[dateKey];
  // Today's set is fixed; a replay only serves what this player hasn't seen
  // (after one full play, nothing — the Daily is once a day).
  if (today) { const recs = today.map(byId).filter(Boolean); if (recs.length) { const fresh = recs.filter(r => !inExclusion(r.question_id, session.history)); fresh.forEach(r => session.used.add(r.question_id)); return fresh.map(r => serve(r, rnd)); } }
  const canonical = eligible({ mode: 'daily', sessionUsed: new Set(), ignoreHistory: true }).filter(r => !everUsed.has(r.question_id));
  const picked = shuffle(canonical, rnd).slice(0, 120);
  const out = [];
  let substituted = 0;
  for (const rec of picked) {
    if (out.length >= count) break;
    if (session.used.has(rec.question_id)) continue;
    if (inExclusion(rec.question_id, session.history)) { substituted++; continue; }
    session.used.add(rec.question_id);
    out.push(serve(rec, rnd));
  }
  while (out.length < count) { const q = nextQuestion(session, { progress: out.length }); if (!q) break; out.push(q); substituted++; }
  session.substituted = substituted;
  commitDaily(dateKey, out.map(q => q.question_id));
  return out.sort((a, b) => TIER_FOR[a.diff] - TIER_FOR[b.diff]);
}

// Head-to-head: one set both players get, excluding anything EITHER has seen.
export function buildMatchSet(seed, historyA = {}, historyB = {}, mode = 'streak', count = 20) {
  const rnd = seededRandom(seed);
  const merged = Object.assign({}, historyA, historyB);
  const session = newSession({ mode: mode === 'h2h' ? 'h2h' : mode, seed, history: merged });
  session.rnd = rnd;
  const set = buildSet(session, count);
  return { questions: set, excludedForBoth: Object.keys(merged).length };
}

export function seededRandom(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// A session guarantees question_id uniqueness for its whole lifetime.
export function newSession({ mode, teamId = null, category = 'All', seed = null, history = null }) {
  return { id: 'S' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), mode, teamId, category,
    rnd: seed ? seededRandom(seed) : Math.random, used: new Set(), subjectCount: {}, categoryCount: {},
    history: history || getHistory(), accuracy: null, relaxed: null };
}

// ── Daily ledger: a question used in ANY completed Daily is never reused ──
export const dailyLedger = () => Store.read(DAILY_LEDGER_KEY, { used: [], days: {} });
export function commitDaily(dateKey, ids) {
  const l = dailyLedger();
  l.days[dateKey] = ids;
  l.used = [...new Set([...l.used, ...ids])];
  Store.write(DAILY_LEDGER_KEY, l);
  return l;
}
export const dailyInventory = () => {
  const l = dailyLedger(), used = new Set(l.used);
  const total = getBank().filter(r => r.pool === 'daily' && r.status === 'active').length;
  const remaining = getBank().filter(r => r.pool === 'daily' && r.status === 'active' && !used.has(r.question_id)).length;
  return { total, remaining, daysServed: Object.keys(l.days).length, daysOfRunway: Math.floor(remaining / 10), low: remaining < 100 };
};

// ── Content health dashboard ─────────────────────────────────────
export function contentHealth() {
  const bank = getBank(), cfg = getConfig(), stats = buildStats();
  const count = fn => bank.filter(fn).length;
  const mix = {}; TIER_ORDER.forEach(t => mix[t] = count(r => r.difficulty === t));
  const pools = {}; POOLS.forEach(pl => pools[pl] = count(r => r.pool === pl && r.status === 'active'));
  const total = bank.length;
  const mixRows = TIER_ORDER.map(t => ({ tier: t, count: mix[t], actual: total ? mix[t] / total : 0, target: TARGET_MIX[t] }));
  return {
    total, active: count(r => r.status === 'active'), pending: count(r => r.status === 'pending'),
    outdated: count(r => r.status === 'outdated'), knowledgePoints: new Set(bank.map(r => r.knowledge_point_id)).size,
    duplicatesRejected: stats.kpCollisions, qualityRejected: stats.rejectedQuality, generated: stats.generated,
    current: count(r => r.temporal === 'dynamic'), historical: count(r => r.temporal === 'static'),
    pools, mixRows, daily: dailyInventory(), target: 500000,
    coverage: (() => { const by = {}; bank.forEach(r => { const k = r.subcategory && /^\d{4}s$/.test(r.subcategory) ? r.subcategory : null; if (k) by[k] = (by[k] || 0) + 1; }); return by; })()
  };
}

// ── Pool health ──────────────────────────────────────────────────
export function poolHealth(teamId = null) {
  const history = getHistory(), cfg = getConfig();
  const line = (label, mode, tid) => {
    const total = eligible({ mode, teamId: tid, sessionUsed: new Set(), ignoreHistory: true }).length;
    const available = eligible({ mode, teamId: tid, sessionUsed: new Set(), history, cfg }).length;
    return { label, total, available, excluded: total - available, low: available < Math.max(20, total * 0.15) };
  };
  const rows = [line('Streak', 'streak', null), line('Buzz', 'buzz', null), line('20 Questions', 'q20', null), line('Daily Challenge', 'daily', null), line('Who Am I?', 'wai', null)];
  if (teamId) rows.push(line('Your Team', 'team', teamId));
  return rows;
}
export function bankSummary() {
  const bank = getBank();
  const by = k => bank.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
  return { total: bank.length, active: bank.filter(r => r.status === 'active').length,
    pending: bank.filter(r => r.status === 'pending').length, outdated: bank.filter(r => r.status === 'outdated').length,
    dynamic: bank.filter(r => r.temporal === 'dynamic').length, seen: Object.keys(getHistory()).length,
    byDifficulty: by('difficulty'), byType: by('question_type') };
}

// ── Automated update feed (candidate ingestion) ──────────────────
// Stands in for a scheduled job that watches trades, awards, records and
// milestones. Candidates land in PENDING REVIEW unless autoPublish is on.
export const UPDATE_FEED = [
  { trigger: 'Award', question_text: 'Who won the 2024–25 NBA Most Valuable Player award?', correct_answer: 'Shai Gilgeous-Alexander', answers: ['Shai Gilgeous-Alexander', 'Nikola Jokić', 'Giannis Antetokounmpo', 'Jayson Tatum'], category: 'MVP', difficulty: 'starter', explanation: 'SGA led the league in scoring and Oklahoma City to 68 wins.', source_name: 'NBA', temporal: 'static', season: '2024-25' },
  { trigger: 'Playoff result', question_text: 'Which team won the 2025 NBA Finals?', correct_answer: 'Oklahoma City Thunder', answers: ['Oklahoma City Thunder', 'Indiana Pacers', 'New York Knicks', 'Boston Celtics'], category: 'Finals', difficulty: 'rookie', explanation: 'Oklahoma City beat Indiana in seven games.', source_name: 'NBA', temporal: 'static', season: '2024-25' },
  { trigger: 'Standings', question_text: 'Who currently leads the NBA in career three-pointers made?', correct_answer: 'Stephen Curry', answers: ['Stephen Curry', 'Ray Allen', 'James Harden', 'Damian Lillard'], category: 'Statistics', difficulty: 'rookie', explanation: 'Curry passed Ray Allen in December 2021 and keeps extending it.', source_name: 'NBA', temporal: 'dynamic', valid_from: '2025-10-01', valid_until: '2026-09-30', season: SEASON },
  { trigger: 'Record', question_text: 'Who holds the record for most three-pointers in a single NBA season?', correct_answer: 'Stephen Curry', answers: ['Stephen Curry', 'James Harden', 'Klay Thompson', 'Damian Lillard'], category: 'NBA Records', difficulty: 'starter', explanation: 'Curry made 402 in 2015–16.', source_name: 'Basketball Reference', temporal: 'static', season: '2015-16' },
  { trigger: 'Milestone', question_text: 'Which player became the NBA\'s all-time leading scorer in February 2023?', correct_answer: 'LeBron James', answers: ['LeBron James', 'Kevin Durant', 'Stephen Curry', 'Kareem Abdul-Jabbar'], category: 'NBA Records', difficulty: 'rookie', explanation: 'He passed Kareem Abdul-Jabbar on February 7, 2023.', source_name: 'NBA', temporal: 'static', season: '2022-23' },
  { trigger: 'Draft', question_text: 'Which team selected Cooper Flagg first overall in the 2025 NBA draft?', correct_answer: 'Dallas Mavericks', answers: ['Dallas Mavericks', 'San Antonio Spurs', 'Philadelphia 76ers', 'Charlotte Hornets'], category: 'Draft', difficulty: 'starter', explanation: 'Dallas won the 2025 lottery and took the Duke forward.', source_name: 'NBA', temporal: 'static', season: '2024-25' }
];
export function ingestCandidates(feed = UPDATE_FEED) {
  const cfg = getConfig(), taken = new Set(getBank().map(r => r.question_id)), added = [];
  for (const c of feed) {
    const id = mintId('feed:' + c.question_text, taken);
    const rec = baseRecord(id, Object.assign({}, c, {
      source_ref: { kind: 'feed', trigger: c.trigger }, source_date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString().slice(0, 10),
      status: cfg.autoPublish ? 'active' : 'pending', active: !!cfg.autoPublish
    }));
    const check = validate(rec);
    if (check.duplicates.some(d => d.score > 0.95)) continue; // already in the bank
    rec.duplicate_warnings = check.duplicates;
    rec.validation_errors = check.errors;
        rec.quality_score = scoreQuality(rec, BANK);
    if (check.errors.length || rec.quality_score < QUALITY_THRESHOLD) { rec.status = 'draft'; rec.active = false; }
    rec.knowledge_point_id = kpFor(rec);
    if (BANK.some(x => x.knowledge_point_id === rec.knowledge_point_id)) continue;
    if (!rec.pool) { rec.pool = 'daily'; rec.game_modes_allowed = ['daily', 'h2h']; }
    BANK.push(rec); BY_ID.set(id, rec); added.push(rec);
  }
  return added;
}

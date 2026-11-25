// build.mjs — build the master question bank and load it into Supabase.
//
//   node tools/build.mjs            build + report (writes tools/.cache/bank.json)
//   node tools/build.mjs --load     … and upsert every question into Supabase
//
// Sources: the app's hand-written bank (questions / mystery / teams / facts)
// plus knowledge points generated from the balldontlie download in
// tools/.cache (run tools/fetch.mjs first). Loading goes through the Supabase
// Management API; the access token is added by the environment's network
// proxy and never appears here. Run with NODE_USE_ENV_PROXY=1.
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'tools', '.cache');
const PROJECT = process.env.SUPABASE_PROJECT || 'mvsyneqcohupycyehsvp';
const LOAD = process.argv.includes('--load');
const today = new Date().toISOString().slice(0, 10);

const [questions, mystery, teams, facts, engine, gen, fr] = await Promise.all(
  ['questions', 'mystery', 'teams', 'facts', 'engine', 'generate', 'franchises'].map(m => import(join(ROOT, 'data', m + '.js'))));

const read = f => JSON.parse(readFileSync(join(CACHE, f), 'utf8'));
const seasonsOf = kind => readdirSync(CACHE).map(f => f.match(new RegExp(`^games-(\\d{4})-${kind}\\.json$`))).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
const current = new Date().getUTCMonth() >= 9 ? new Date().getUTCFullYear() : new Date().getUTCFullYear() - 1;

// ── 1. knowledge points from the data ───────────────────────────
const generated = [], report = { seasons: {}, issues: [] };
const finalsBySeason = {};
for (const y of seasonsOf('post')) {
  const games = read(`games-${y}-post.json`);
  const { kps, finals } = gen.fromPostseason(games, y);
  generated.push(...kps);
  report.seasons[y] = { post: kps.length };
  if (finals) finalsBySeason[finals.season] = finals;
}
// The hand-checked table vs the games (only where the games name a Finals).
report.issues.push(...gen.crossCheck(facts.SEASONS, finalsBySeason).filter(i => !/no Finals in game data/.test(i)));
// Seasons the hand table does not cover yet (e.g. last season): champion + runner-up from the games.
const tableSeasons = new Set(facts.SEASONS.map(r => r[0]));
for (const [s, f] of Object.entries(finalsBySeason)) {
  if (tableSeasons.has(s)) continue;
  const y = +s.slice(0, 4), e = y >= 2020 ? '2020s' : '2010s';
  if (f.partial) continue;
  generated.push({ knowledge_point_id: `KP-${s}-CHAMPION`, column: 'champion', era: e, season: s, category: 'Championships', fact: f.champion,
    question: `Which team won the ${s} NBA championship?`, explanation: `The ${f.champion} beat the ${f.runnerUp} ${f.score} in the Finals.`, difficulty: 'easy' });
  generated.push({ knowledge_point_id: `KP-${s}-FINALS-RUNNER-UP`, column: 'champion', era: e, season: s, category: 'Finals', fact: f.runnerUp,
    question: `Which team lost the ${s} NBA Finals?`, explanation: `The ${f.champion} beat the ${f.runnerUp} ${f.score}.`, difficulty: 'medium' });
}
const lastFinalsSeason = Math.max(...Object.keys(finalsBySeason).map(s => +s.slice(0, 4)));
if (isFinite(lastFinalsSeason)) generated.push(...gen.reigningChampion(finalsBySeason[fr.seasonLabel(lastFinalsSeason)], lastFinalsSeason));

for (const y of seasonsOf('reg')) {
  const games = read(`games-${y}-reg.json`);
  const live = y === current;
  const kps = gen.fromRegularSeason(games, y, live ? { inProgress: true, asOf: today } : {});
  if (live) kps.push(...gen.fromRecentGames(games, y, today));
  generated.push(...kps);
  (report.seasons[y] ||= {}).reg = kps.length;
}
if (existsSync(join(CACHE, 'players.json'))) generated.push(...gen.fromPlayers(read('players.json')));

// ── 2. bring the team profiles up to date with real Finals results ─
// Titles per franchise = the hand-checked champions table, plus any later
// season whose Finals the game data shows complete.
const titles = new Map();
const champs = facts.SEASONS.map(r => [r[0], r[1]]);
for (const [s, f] of Object.entries(finalsBySeason)) if (!tableSeasons.has(s) && !f.partial) champs.push([s, f.champion]);
for (const [s, champ] of champs) {
  const y = +s.slice(0, 4), id = fr.franchiseIdFor(champ, y);
  if (id) titles.set(id, { n: (titles.get(id)?.n || 0) + 1, last: fr.finalsYear(y) });
}
{
  const bdlTeams = JSON.parse(readFileSync(join(CACHE, 'teams.json'), 'utf8'));
  for (const t of teams.TEAMS) {
    const bdl = bdlTeams.find(x => x.abbreviation.toLowerCase() === t.id);
    if (!bdl) continue;
    const got = titles.get(bdl.id) || { n: 0 };
    if (t.titles !== got.n || (got.last && t.lastTitle !== got.last)) {
      report.issues.push(`team ${t.id}: titles ${t.titles}${t.lastTitle ? ' (last ' + t.lastTitle + ')' : ''} → ${got.n}${got.last ? ' (last ' + got.last + ')' : ''} from game data`);
      t.titles = got.n; if (got.last) t.lastTitle = got.last; else delete t.lastTitle;
    }
  }
}

// ── 3. one bank: hand-written + generated, one question per fact ─
const genIds = new Set(generated.map(k => k.knowledge_point_id));
const merged = { ...facts,
  extractKnowledgePoints: () => [...facts.extractKnowledgePoints(), ...generated],
  // Wrong answers from the SAME award or list where it is deep enough
  // (other scoring champions for a scoring-champion question), nearest
  // seasons first; otherwise facts.js's same-column, same-era pick.
  distractorsFor: (kp, all, rnd) => {
    if (kp.wrongs) return kp.wrongs;
    const y = parseInt(kp.season, 10);
    const same = all.filter(x => x.column === kp.column && x.category === kp.category && x.fact !== kp.fact && !isNaN(parseInt(x.season, 10)));
    const near = [...new Set(same.sort((a, b) => Math.abs(parseInt(a.season, 10) - y) - Math.abs(parseInt(b.season, 10) - y)).map(x => x.fact))].slice(0, 8);
    if (isNaN(y) || near.length < 3) return facts.distractorsFor(kp, all, rnd);
    const out = []; while (out.length < 3) out.push(...near.splice(Math.floor(rnd() * near.length), 1));
    return out;
  } };
const bank = engine.buildBank({ questions, mystery, teams, facts: merged });
const genByKp = new Map(generated.map(k => [k.knowledge_point_id, k]));

const TIER = { rookie: 'beginner', starter: 'easy', allstar: 'medium', superstar: 'hard', legend: 'expert' };
const eraOf = s => { const y = parseInt(s, 10); return isNaN(y) ? null : y < 1950 ? '1940s' : `${Math.floor(y / 10) * 10}s`; };
const rows = bank.map(r => {
  const g = genIds.has(r.knowledge_point_id) ? genByKp.get(r.knowledge_point_id) : null;
  const temporal = g?.temporal || r.temporal || 'static';
  const validUntil = g?.valid_until || r.valid_until || null;
  let status = r.status, active = r.active;
  if (temporal === 'dynamic' && validUntil && validUntil < today) { status = 'outdated'; active = false; }
  return {
    question_id: r.question_id, knowledge_point_id: r.knowledge_point_id,
    question_text: r.question_text, correct_answer: r.correct_answer,
    wrong_answers: (r.answers || []).filter(a => a !== r.correct_answer),
    explanation: r.explanation || null, category: r.category || null,
    difficulty: engine.TIER_ORDER.includes(r.difficulty) ? r.difficulty : (TIER[r.difficulty] || 'medium'),
    question_type: r.question_type, pool: r.pool, game_modes_allowed: r.game_modes_allowed,
    status, active, temporal,
    season: r.season || null, era: eraOf(r.season) || (r.subcategory && /^\d{4}s$/.test(r.subcategory) ? r.subcategory : null),
    players: r.players || [], teams: g?.teams || r.teams || [],
    payload: { clues: r.clues || null, person: r.person || null, source_ref: r.source_ref || null },
    source_name: g ? 'balldontlie' : r.source_name, source_url: g ? 'https://www.balldontlie.io' : (r.source_url || null),
    source_date: g ? today : r.source_date, quality_score: r.quality_score,
    team_id: r.team_id || null, valid_from: g?.valid_from || r.valid_from || null, valid_until: validUntil,
    subcategory: r.subcategory || null
  };
});
writeFileSync(join(CACHE, 'bank.json'), JSON.stringify(rows));

// ── report ───────────────────────────────────────────────────────
const count = (f) => rows.reduce((m, r) => (m[f(r)] = (m[f(r)] || 0) + 1, m), {});
console.log('questions', rows.length, '· generated from data', rows.filter(r => r.source_name === 'balldontlie').length, '· live', rows.filter(r => r.active).length);
console.log('by era', count(r => r.era || '—'));
console.log('by category', count(r => r.category || '—'));
console.log('by status', count(r => r.status));
console.log('by difficulty', count(r => r.difficulty));
console.log('seasons with game data: post', seasonsOf('post').length, '· regular', seasonsOf('reg').length);
if (report.issues.length) console.log('\nCHECKS\n  ' + report.issues.join('\n  '));

// ── 4. load ──────────────────────────────────────────────────────
if (LOAD) {
  const COLS = ['question_id', 'knowledge_point_id', 'question_text', 'correct_answer', 'wrong_answers', 'explanation', 'category', 'difficulty',
    'question_type', 'pool', 'game_modes_allowed', 'status', 'active', 'temporal', 'season', 'era', 'players', 'teams', 'payload',
    'source_name', 'source_url', 'source_date', 'quality_score', 'team_id', 'valid_from', 'valid_until', 'subcategory'];
  // On re-runs, content refreshes but an admin's approve/disable stands —
  // except that a fact which has gone out of date is always retired.
  const KEEP = new Set(['question_id', 'status', 'active']);
  const set = COLS.filter(c => !KEEP.has(c)).map(c => `${c} = excluded.${c}`).join(', ');
  const sql = json => `insert into public.questions (${COLS.join(', ')})
    select ${COLS.join(', ')} from jsonb_populate_recordset(null::public.questions, $J$${json}$J$::jsonb)
    on conflict (question_id) do update set ${set}, updated_at = now(),
      status = case when excluded.status = 'outdated' then 'outdated' else questions.status end,
      active = case when excluded.status = 'outdated' then false else questions.active end`;
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = JSON.stringify(rows.slice(i, i + 400));
    if (chunk.includes('$J$')) throw new Error('payload contains the SQL quote tag');
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer proxy-injected' }, body: JSON.stringify({ query: sql(chunk) }) });
    if (!res.ok) throw new Error(`load failed at ${i}: ${res.status} ${(await res.text()).slice(0, 400)}`);
    process.stdout.write(`\rloaded ${Math.min(i + 400, rows.length)} / ${rows.length}`);
  }
  console.log();
}

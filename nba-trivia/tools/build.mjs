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

// The Arabic layer: question, explanation and answer labels (data/ar.js).
const A = await import(join(ROOT, 'data', 'ar.js'));
const [questions, mystery, teams, facts, engine, gen, fr, jerseys] = await Promise.all(
  ['questions', 'mystery', 'teams', 'facts', 'engine', 'generate', 'franchises', 'jerseys'].map(m => import(join(ROOT, 'data', m + '.js'))));

// Games come from the merged table (tools/merge.mjs: balldontlie + Kaggle)
// when it exists; everything else from the cache.
const MERGED = join(CACHE, 'merged'), GDIR = existsSync(join(MERGED, 'report.json')) ? MERGED : CACHE;
const read = f => JSON.parse(readFileSync(join(/^games-/.test(f) ? GDIR : CACHE, f), 'utf8'));
const seasonsOf = kind => readdirSync(GDIR).map(f => f.match(new RegExp(`^games-(\\d{4})-${kind}\\.json$`))).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
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
    question: `Which team won the ${s} NBA championship?`, explanation: `The ${f.champion} beat the ${f.runnerUp} ${f.score} in the Finals.`, difficulty: 'easy',
    ar: { q: `مين الفريق اللي فاز ببطولة NBA موسم ${s}؟`, e: `فاز ${A.N(f.champion)} على ${A.N(f.runnerUp)} ${A.iso(f.score)} في النهائيات.` } });
  generated.push({ knowledge_point_id: `KP-${s}-FINALS-RUNNER-UP`, column: 'champion', era: e, season: s, category: 'Finals', fact: f.runnerUp,
    question: `Which team lost the ${s} NBA Finals?`, explanation: `The ${f.champion} beat the ${f.runnerUp} ${f.score}.`, difficulty: 'medium',
    ar: { q: `أي فريق خسر نهائيات NBA موسم ${s}؟`, e: `فاز ${A.N(f.champion)} على ${A.N(f.runnerUp)} ${A.iso(f.score)}.` } });
}
const lastFinalsSeason = Math.max(...Object.keys(finalsBySeason).map(s => +s.slice(0, 4)));
if (isFinite(lastFinalsSeason)) generated.push(...gen.reigningChampion(finalsBySeason[fr.seasonLabel(lastFinalsSeason)], lastFinalsSeason));

for (const y of seasonsOf('reg')) {
  const games = read(`games-${y}-reg.json`);
  const live = y === current;
  const kps = gen.fromRegularSeason(games, y, live ? { inProgress: true, asOf: today } : {});
  if (live) kps.push(...gen.fromRecentGames(games, y, today));
  // every franchise's season in depth (completed seasons only)
  else kps.push(...gen.fromTeamSeasons(games, existsSync(join(CACHE, `games-${y}-post.json`)) ? read(`games-${y}-post.json`) : [], y));
  generated.push(...kps);
  (report.seasons[y] ||= {}).reg = kps.length;
}
const masterPlayers = existsSync(join(MERGED, 'players.json')) ? JSON.parse(readFileSync(join(MERGED, 'players.json'), 'utf8')) : null;
if (masterPlayers) generated.push(...gen.fromPlayers(masterPlayers.filter(p => p.id)));          // balldontlie ids keep question ids stable
else if (existsSync(join(CACHE, 'players.json'))) generated.push(...gen.fromPlayers(read('players.json')));
generated.push(...gen.fromJerseys(jerseys.JERSEYS));

// ── NBA Database on Kaggle (tools/.cache/kaggle; fetch with tools/fetch-kaggle.mjs) ──
// Draft history, player bios, team box scores. A team's box-score season is
// used only when its win–loss in this file matches balldontlie exactly (the
// Kaggle copy is missing some whole seasons and ends in June 2023).
const KDIR = join(CACHE, 'kaggle');
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows; return body.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
// Who Am I?: the hand-written career mysteries plus one per recognisable
// player in the database (generate.js fromCareers).
let careerPeople = [];
if (existsSync(join(KDIR, 'draft_history.csv'))) {
  const k = name => parseCSV(readFileSync(join(KDIR, name + '.csv'), 'utf8'));
  const teamRows = k('team'), bioRows = k('common_player_info');
  const abbrById = new Map(teamRows.map(t => [t.id, t.abbreviation.toLowerCase()]));
  const abbrOf = id => abbrById.get(String(id)) || null;
  const bios = new Map(bioRows.map(r => [r.person_id, r]));
  if (masterPlayers) careerPeople = gen.fromCareers(masterPlayers, { seasons: facts.SEASONS, jerseys: jerseys.JERSEYS, exclude: mystery.PEOPLE.map(p => p.name), bios });
  report.issues.push(`who am I?: ${mystery.PEOPLE.length} hand-written + ${careerPeople.length} from the player database`);
  const fromK = [...gen.fromDraft(k('draft_history'), { abbrOf, bios }), ...gen.fromBios(masterPlayers ? masterPlayers.filter(p => p.person_id) : bioRows)];
  if (GDIR === MERGED) for (const y of seasonsOf('reg')) if (y !== current) fromK.push(...gen.fromTeamBox(read(`games-${y}-reg.json`), y));
  report.issues.push(`kaggle: ${fromK.length} questions (draft, bios${GDIR === MERGED ? ', box scores from the merged games' : ''})`);
  generated.push(...fromK);
}

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
const bank = engine.buildBank({ questions, mystery: { ...mystery, PEOPLE: [...mystery.PEOPLE, ...careerPeople] }, teams, facts: merged });
const genByKp = new Map(generated.map(k => [k.knowledge_point_id, k]));

// ── six levels for questions that don't come from the game data ──
// Awards, champions and drafts by how famous and how long ago; the app's
// hand-written and team-template questions keep their relative order.
const SHIFT = { rookie: 'easy', starter: 'medium', allstar: 'hard', superstar: 'hardest', legend: 'hall_of_fame',
  beginner: 'easy', easy: 'medium', medium: 'hard', hard: 'hardest', expert: 'hall_of_fame' };              // team templates, mysteries
const HAND = { beginner: 'easy', starter: 'easy', easy: 'easy', medium: 'medium', hard: 'hard', expert: 'hardest' };  // hand-written questions
function tierFor(r) {
  r = { ...r, difficulty: r.raw_difficulty || r.difficulty };
  const kp = r.knowledge_point_id, y = parseInt(r.season, 10), by = steps => gen.tierBy(isNaN(y) ? 0 : y, steps);
  const draftYear = +((kp.match(/^KP-DRAFT-(\d{4})-/) || [])[1] || 0);
  if (/-CHAMPION$/.test(kp)) return by([[2010, 'easy'], [1990, 'medium'], [1970, 'hard'], [1950, 'hardest'], [0, 'hall_of_fame']]);
  if (/-FINALS-RUNNER-UP$|-FINALS-MVP$/.test(kp)) return by([[2010, 'medium'], [1990, 'hard'], [1970, 'hardest'], [0, 'hall_of_fame']]);
  if (/-\d{2}-MVP$/.test(kp)) return by([[2015, 'medium'], [1995, 'hard'], [1975, 'hardest'], [0, 'hall_of_fame']]);
  if (/-ROY$/.test(kp)) return by([[2015, 'hard'], [1990, 'hardest'], [0, 'hall_of_fame']]);
  if (/-SCORING-LEADER$|-CHAMPION-COACH$/.test(kp)) return by([[2010, 'hard'], [1985, 'hardest'], [0, 'hall_of_fame']]);
  if (/^KP-DRAFT-\d{4}-FIRST-PICK$/.test(kp)) return gen.tierBy(draftYear, [[2010, 'medium'], [1990, 'hard'], [1970, 'hardest'], [0, 'hall_of_fame']]);
  if (/FIRST-PICK-TEAM$/.test(kp)) return gen.tierBy(draftYear, [[2010, 'hard'], [1985, 'hardest'], [0, 'hall_of_fame']]);
  if (/SECOND-PICK$/.test(kp)) return gen.tierBy(draftYear, [[2000, 'hardest'], [1975, 'hall_of_fame'], [0, 'goat']]);
  if (/^KP-RECORD-\d+-VALUE$/.test(kp)) return 'hall_of_fame';
  if (/^KP-RECORD-\d+-HOLDER$/.test(kp)) return r.difficulty === 'medium' ? 'hard' : 'hardest';
  const kind = r.source_ref && r.source_ref.kind;
  if (kind === 'team' || kind === 'mystery') return SHIFT[r.difficulty] || 'hard';
  return HAND[r.difficulty] || SHIFT[r.difficulty] || 'medium';
}
const PATH_LABEL = { 'Career path': 'المسيرة', 'NBA career path': 'مسيرته في NBA', 'Coaching path': 'مسيرته التدريبية', 'NBA coaching path': 'مسيرته التدريبية في NBA' };
function arOf(r) {
  if (r.question_type === 'career_mystery') {
    const p = r.person, name = p.ar_name || A.N(p.name);
    // career paths: the teams in Arabic, and the heading
    for (const c of p.clues) if (c.type === 'path') c.ar = { label: PATH_LABEL[c.label || 'Career path'] || 'المسيرة', teams: c.teams.map(A.N) };
    const untranslated = p.clues.filter(c => c.type !== 'numbers' && !c.ar).length;
    if (untranslated) report.issues.push(`Who Am I? ${p.name}: ${untranslated} clue(s) without Arabic`);
    return { name, e: `${name} — ${p.kind === 'coach' ? 'مدرب' : 'لاعب'}، ${A.era(p.era)}.`, o: labels([p.name, ...(p.decoys || [])]) };
  }
  if (!r.ar) return null;
  let q = r.ar.q;
  const o = labels(r.answers, r.ar.o || {});
  if (/^(comparison|before_after)$/.test(r.question_type) && (r.answers || []).length === 2) q = `${q.replace(/؟\s*$/, '')}: ${A.list([...r.answers].sort().map(a => o[a] || a))}؟`;
  // Who Am I? multiple choice: the clues, one per line
  return { q, e: r.ar.e || null, o, ...(r.clues ? { clues: q.split('|') } : {}) };
}
const labels = A.labels;
const eraOf = s => { const y = parseInt(s, 10); return isNaN(y) ? null : y < 1950 ? '1940s' : `${Math.floor(y / 10) * 10}s`; };
const rows = bank.map(r => {
  const g = genIds.has(r.knowledge_point_id) ? genByKp.get(r.knowledge_point_id) : null;
  const temporal = g?.temporal || r.temporal || 'static';
  const validUntil = g?.valid_until || r.valid_until || null;
  let status = r.status, active = r.active;
  if (temporal === 'dynamic' && validUntil && validUntil < today) { status = 'outdated'; active = false; }
  return {
    question_id: r.question_id, knowledge_point_id: r.knowledge_point_id,
    // Two-name questions ("Who was drafted first?") carry both names in the
    // text, so two of them never read as the same question.
    question_text: /^(comparison|before_after)$/.test(r.question_type) && (r.answers || []).length === 2
      ? `${r.question_text.replace(/\?\s*$/, '')}: ${[...r.answers].sort().join(' or ')}?` : r.question_text,
    correct_answer: r.correct_answer,
    wrong_answers: (r.answers || []).filter(a => a !== r.correct_answer),
    explanation: r.explanation || null, category: r.category || null,
    difficulty: g ? g.difficulty : tierFor(r),
    // Generated franchise questions belong to that team's "Your Team" pool only.
    question_type: r.question_type, pool: g?.team_id ? 'team' : r.pool, game_modes_allowed: g?.team_id ? ['team'] : r.game_modes_allowed,
    status, active, temporal,
    season: r.season || null, era: eraOf(r.season) || (r.subcategory && /^\d{4}s$/.test(r.subcategory) ? r.subcategory : null),
    players: r.players || [], teams: g?.teams || r.teams || [],
    payload: { clues: r.clues || null, person: r.person || null, source_ref: r.source_ref || null },
    ar: arOf(r),
    source_name: g ? (g.source || 'balldontlie') : r.source_name,
    source_url: g ? (g.source ? 'https://www.kaggle.com/datasets/wyattowalsh/basketball' : 'https://www.balldontlie.io') : (r.source_url || null),
    source_date: g ? today : r.source_date, quality_score: r.quality_score,
    team_id: g?.team_id || r.team_id || null, valid_from: g?.valid_from || r.valid_from || null, valid_until: validUntil,
    subcategory: r.subcategory || null
  };
});
// ── one question per fact ────────────────────────────────────────
// Two wordings of the same fact ("Who holds the record for most points in a
// single game?" / "Who holds the NBA record for …") would let a player meet
// the same question twice. Same answer + same season + wording that differs
// only by filler words = the same fact: the first wording stays, the others
// are retired for everyone.
const STOPW = new Set(['the','a','an','of','in','to','for','and','or','is','was','were','did','does','do','who','which','what','has','have','had','nba','player','team','season','regular','named','won','win','wins','this','that','his','with','by','on','at','as','from','be','are','he','it']);
const FILLER = new Set(['holds','hold','record','records','league','head','ever','history']);
const words = t => new Set(engine.normalizeText(t).split(' ').filter(w => w.length > 2 && !STOPW.has(w) && !/^\d+$/.test(w)));
const factGroups = new Map();
const sameText = new Map();
for (const r of rows) {
  if (r.status === 'outdated') continue;
  // A career mystery is one per person (its id comes from the name); its text
  // is only the first clue, which two different players can share.
  if (r.question_type === 'career_mystery') continue;
  // Identical wording reads as a repeat to a player even if the answer differs.
  const tkey = engine.normalizeText(r.question_text);
  if (sameText.has(tkey)) { r.status = 'disabled'; r.active = false; r.payload = { ...r.payload, duplicate_of: sameText.get(tkey) }; report.issues.push(`duplicate retired (same wording): "${r.question_text}"`); continue; }
  sameText.set(tkey, r.question_id);
  const key = engine.normalizeText(r.correct_answer) + '|' + (r.season || '');
  const group = factGroups.get(key) || []; factGroups.set(key, group);
  const w = words(r.question_text);
  const twin = group.find(g => { const diff = [...w].filter(x => !g.w.has(x)).concat([...g.w].filter(x => !w.has(x))); return w.size && g.w.size && diff.every(x => FILLER.has(x)); });
  if (twin) { r.status = 'disabled'; r.active = false; r.payload = { ...r.payload, duplicate_of: twin.r.question_id }; report.issues.push(`duplicate retired: "${r.question_text}" = "${twin.r.question_text}"`); }
  else group.push({ r, w });
}
writeFileSync(join(CACHE, 'bank.json'), JSON.stringify(rows));

// ── report ───────────────────────────────────────────────────────
const count = (f) => rows.reduce((m, r) => (m[f(r)] = (m[f(r)] || 0) + 1, m), {});
console.log('questions', rows.length, '· generated from data', rows.filter(r => r.source_name === 'balldontlie').length, '· live', rows.filter(r => r.active).length);
{ // Arabic coverage: questions with an Arabic layer, and names still spelled in English
  const live = rows.filter(r => r.active), noAr = live.filter(r => !r.ar);
  const missing = [...A.MISSING].sort((a, b) => b[1] - a[1]);
  writeFileSync(join(CACHE, 'names-missing.json'), JSON.stringify(missing, null, 0));
  console.log('arabic', live.length - noAr.length, 'of', live.length, 'live questions · without:', Object.entries(noAr.reduce((m, r) => (m[r.source_ref?.kind || r.category] = (m[r.source_ref?.kind || r.category] || 0) + 1, m), {})),
    '· names without Arabic:', missing.length, '(tools/.cache/names-missing.json)', '· option sets kept in English (same Arabic spelling):', A.COLLISIONS.size);
  if (questions.AR_MISMATCH.length) console.log('  hand-written questions without Arabic (questions-ar.js out of step):', questions.AR_MISMATCH);
  if (A.COLLISIONS.size) console.log('  ' + [...A.COLLISIONS].slice(0, 12).join('\n  '));
}
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
    'source_name', 'source_url', 'source_date', 'quality_score', 'team_id', 'valid_from', 'valid_until', 'subcategory', 'ar'];
  // On re-runs, content refreshes but an admin's approve/disable stands —
  // except that a fact which has gone out of date is always retired.
  const KEEP = new Set(['question_id', 'status', 'active']);
  const set = COLS.filter(c => !KEEP.has(c)).map(c => `${c} = excluded.${c}`).join(', ');
  const sql = json => `insert into public.questions (${COLS.join(', ')})
    select ${COLS.join(', ')} from jsonb_populate_recordset(null::public.questions, $J$${json}$J$::jsonb)
    on conflict (question_id) do update set ${set}, updated_at = now(),
      status = case when excluded.status = 'outdated' or excluded.payload ? 'duplicate_of' then excluded.status
                    when questions.payload ? 'retired' then excluded.status else questions.status end,
      active = case when excluded.status = 'outdated' or excluded.payload ? 'duplicate_of' then false
                    when questions.payload ? 'retired' then excluded.active else questions.active end`;
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = JSON.stringify(rows.slice(i, i + 400));
    if (chunk.includes('$J$')) throw new Error('payload contains the SQL quote tag');
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer proxy-injected' }, body: JSON.stringify({ query: sql(chunk) }) });
    if (!res.ok) throw new Error(`load failed at ${i}: ${res.status} ${(await res.text()).slice(0, 400)}`);
    process.stdout.write(`\rloaded ${Math.min(i + 400, rows.length)} / ${rows.length}`);
  }
  console.log();

  // A permanent question this build no longer produces (its wording changed,
  // or it was merged away) is retired; time-limited ones expire on their own.
  const ids = rows.map(r => `'${r.question_id}'`).join(',');
  const stale = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer proxy-injected' },
    body: JSON.stringify({ query: `update public.questions set status = 'disabled', active = false, updated_at = now(),
      payload = coalesce(payload, '{}'::jsonb) || '{"retired": "no longer produced by the bank build"}'::jsonb
      where active and temporal = 'static' and not (question_id = any(array[${ids}])) returning question_id` }) });
  if (!stale.ok) throw new Error(`retire stale: ${stale.status} ${(await stale.text()).slice(0, 300)}`);
  console.log('retired (no longer in the bank):', (await stale.json()).length);

  // Teams and every downloaded game, so the weekly job can compute standings
  // and series from the database instead of re-downloading history.
  const query = async sql => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer proxy-injected' }, body: JSON.stringify({ query: sql }) });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  };
  const teamRows = read('teams.json').map(t => ({ id: t.id, abbreviation: t.abbreviation, full_name: t.full_name, conference: t.conference || null, division: t.division || null }));
  await query(`insert into public.teams select * from jsonb_populate_recordset(null::public.teams, $J$${JSON.stringify(teamRows)}$J$::jsonb)
    on conflict (id) do update set abbreviation = excluded.abbreviation, full_name = excluded.full_name, conference = excluded.conference, division = excluded.division`);
  const games = readdirSync(GDIR).filter(f => /^games-\d{4}-(post|reg)\.json$/.test(f)).flatMap(f => read(f)).map(g => ({
    id: g.id, season: g.season, game_date: g.date.slice(0, 10), postseason: g.postseason, status: g.status, period: g.period, postponed: !!g.postponed,
    home_team_id: g.home_team.id, visitor_team_id: g.visitor_team.id, home_score: g.home_team_score || 0, visitor_score: g.visitor_team_score || 0 }));
  const GC = ['id', 'season', 'game_date', 'postseason', 'status', 'period', 'postponed', 'home_team_id', 'visitor_team_id', 'home_score', 'visitor_score'];
  for (let i = 0; i < games.length; i += 3000) {
    await query(`insert into public.games (${GC.join(', ')}) select ${GC.join(', ')} from jsonb_populate_recordset(null::public.games, $J$${JSON.stringify(games.slice(i, i + 3000))}$J$::jsonb)
      on conflict (id) do update set ${GC.slice(1).map(c => `${c} = excluded.${c}`).join(', ')}, updated_at = now()`);
    process.stdout.write(`\rgames ${Math.min(i + 3000, games.length)} / ${games.length}`);
  }
  console.log();
  // Games that only Kaggle had get ids from 900000000000; drop any an earlier
  // merge produced that this one matched to a balldontlie game instead.
  const kOnly = games.filter(g => g.id >= 900000000000).map(g => g.id);
  await query(`delete from public.games where id >= 900000000000${kOnly.length ? ` and not (id = any(array[${kOnly.join(',')}]::bigint[]))` : ''}`);
}

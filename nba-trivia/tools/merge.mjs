// merge.mjs — one master game table from balldontlie + the Kaggle NBA Database.
//
//   node tools/merge.mjs          → tools/.cache/merged/games-<season>-<reg|post>.json
//                                  + tools/.cache/merged/report.json (and a printed summary)
//
// Each game is matched across the two sources by date and teams (home/away
// swapped or a one-day date shift still match). Rules:
//   • both have the score and agree          → kept, marked 'both'
//   • only one has a real score               → that score is used ('filled')
//   • both have scores that disagree          → Kaggle (stats.nba.com) wins, logged as a conflict
//   • a game only one source has              → added from that source
// Kaggle's team box score (rebounds, assists, threes…) is attached to every
// game it covers. balldontlie stays the only source after June 2023.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'tools', '.cache'), KDIR = join(CACHE, 'kaggle'), OUT = join(CACHE, 'merged');
mkdirSync(OUT, { recursive: true });
const { ABBR_ID } = await import(join(ROOT, 'data', 'franchises.js'));

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
const read = f => JSON.parse(readFileSync(join(CACHE, f), 'utf8'));

// ── teams: Kaggle (stats.nba.com) id → balldontlie id ─────────────
const bdlTeams = read('teams.json'), bdlTeam = new Map(bdlTeams.map(t => [t.id, t]));
const kTeams = parseCSV(readFileSync(join(KDIR, 'team.csv'), 'utf8'));
const kToBdl = new Map(kTeams.map(t => [t.id, ABBR_ID[t.abbreviation]]));
const DEFUNCT = { '1610610023': 47, '1610610024': 45, '1610610025': 37, '1610610026': 39, '1610610027': 50, '1610610028': 40, '1610610029': 46,
  '1610610030': 49, '1610610031': 44, '1610610032': 43, '1610610033': 51, '1610610034': 38, '1610610035': 41, '1610610036': 42, '1610610037': 48 };
for (const [k, v] of Object.entries(DEFUNCT)) kToBdl.set(k, v);

// ── Kaggle games (regular season '2…', playoffs '4…') ─────────────
const kGames = parseCSV(readFileSync(join(KDIR, 'game.csv'), 'utf8')).filter(g => /^[24]/.test(g.season_id));
const BOX = ['fgm', 'fga', 'fg3m', 'fg3a', 'ftm', 'fta', 'oreb', 'dreb', 'reb', 'ast', 'stl', 'blk', 'tov', 'pf'];
const num = v => (v === '' || v == null ? null : Number(v));
const kIndex = new Map();     // `${date}|${home}|${away}` → kaggle row
for (const g of kGames) {
  const h = kToBdl.get(g.team_id_home), a = kToBdl.get(g.team_id_away); if (!h || !a) continue;
  g._season = +g.season_id.slice(1); g._post = g.season_id[0] === '4'; g._h = h; g._a = a; g._date = g.game_date.slice(0, 10);
  kIndex.set(`${g._date}|${h}|${a}`, g);
}
const shift = (d, n) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
function findK(date, h, a) {
  for (const d of [date, shift(date, -1), shift(date, 1)]) {
    if (kIndex.has(`${d}|${h}|${a}`)) return { k: kIndex.get(`${d}|${h}|${a}`), swapped: false };
    if (kIndex.has(`${d}|${a}|${h}`)) return { k: kIndex.get(`${d}|${a}|${h}`), swapped: true };
  }
  return null;
}
const boxOf = (k, side) => { const b = {}; for (const f of BOX) b[f] = num(k[`${f}_${side}`]); return b; };

// ── merge, season by season ────────────────────────────────────────
const seasons = new Set();
for (const f of readdirSync(CACHE)) { const m = f.match(/^games-(\d{4})-(reg|post)\.json$/); if (m) seasons.add(m[1] + '-' + m[2]); }
for (const g of kGames) if (g._h) seasons.add(`${g._season}-${g._post ? 'post' : 'reg'}`);
const report = [], used = new Set(), conflicts = [];
for (const key of [...seasons].sort()) {
  const [y, kind] = key.split('-'), season = +y, post = kind === 'post';
  const bdl = existsSync(join(CACHE, `games-${y}-${kind}.json`)) ? read(`games-${y}-${kind}.json`) : [];
  const out = [], r = { season, kind, bdl: bdl.length, bdlUnscored: 0, kaggle: 0, matched: 0, filled: 0, conflicts: 0, kaggleOnly: 0, bdlOnly: 0, redated: 0 };
  const pending = [];
  const take = (g, merged, m, r) => {
    used.add(m.k.game_id); r.matched++;
    const k = m.k, kh = num(k.pts_home), ka = num(k.pts_away), scored = g.home_team_score > 0 && g.visitor_team_score > 0;
    const [kHome, kAway] = m.swapped ? [ka, kh] : [kh, ka];
    const kScored = kHome > 0 && kAway > 0;
    if (!scored && kScored) { merged.home_team_score = kHome; merged.visitor_team_score = kAway; merged.src = 'filled from Kaggle'; r.filled++; }
    else if (scored && kScored && (kHome !== g.home_team_score || kAway !== g.visitor_team_score)) {
      conflicts.push({ season, date: g.date.slice(0, 10), home: g.home_team.full_name, away: g.visitor_team.full_name, balldontlie: `${g.home_team_score}-${g.visitor_team_score}`, kaggle: `${kHome}-${kAway}` });
      merged.home_team_score = kHome; merged.visitor_team_score = kAway; merged.src = 'conflict: Kaggle used'; r.conflicts++;
    } else merged.src = 'both';
    merged.box = { home: boxOf(k, m.swapped ? 'away' : 'home'), visitor: boxOf(k, m.swapped ? 'home' : 'away') };
    merged.kaggle_game_id = k.game_id;
  };
  for (const g of bdl) {
    const scored = g.home_team_score > 0 && g.visitor_team_score > 0, isFinal = g.status === 'Final';
    if (isFinal && !scored) r.bdlUnscored++;
    const m = isFinal ? findK(g.date.slice(0, 10), g.home_team.id, g.visitor_team.id) : null;
    const merged = { ...g, src: 'balldontlie' };
    if (m && !used.has(m.k.game_id)) take(g, merged, m, r);
    else if (isFinal) pending.push([g, merged]);
    out.push(merged);
  }
  // second pass: postponed games. balldontlie keeps the date a game was first
  // scheduled, Kaggle the date it was played (COVID seasons: up to ~4 months
  // apart). Same season, same two teams, same final score → the same game;
  // the date it was played wins.
  const left = kGames.filter(k => k._h && k._season === season && k._post === post && !used.has(k.game_id));
  for (const [g, merged] of pending) {
    const gd = Date.parse(g.date.slice(0, 10)), pair = [g.home_team.id, g.visitor_team.id];
    let best = null;
    for (const k of left) {
      if (used.has(k.game_id)) continue;
      const swapped = k._h === pair[1] && k._a === pair[0];
      if (!swapped && !(k._h === pair[0] && k._a === pair[1])) continue;
      const [kHome, kAway] = swapped ? [num(k.pts_away), num(k.pts_home)] : [num(k.pts_home), num(k.pts_away)];
      if (kHome !== g.home_team_score || kAway !== g.visitor_team_score) continue;
      const d = Math.abs(Date.parse(k._date) - gd);
      if (!best || d < best.d) best = { k, swapped, d };
    }
    if (!best) { r.bdlOnly++; continue; }
    take(g, merged, best, r);
    if (best.k._date !== g.date.slice(0, 10)) { merged.scheduled_date = g.date.slice(0, 10); merged.date = best.k._date + g.date.slice(10); r.redated++; }
  }
  // games only Kaggle has
  for (const k of kGames) {
    if (!k._h || k._season !== season || k._post !== post || used.has(k.game_id)) continue;
    used.add(k.game_id); r.kaggleOnly++;
    const mins = num(k.min) || 240;
    out.push({ id: 900000000000 + Number(k.game_id), date: k._date, season, postseason: post, status: 'Final', period: mins > 240 ? 4 + Math.round((mins - 240) / 25) : 4,
      postponed: false, home_team: bdlTeam.get(k._h), visitor_team: bdlTeam.get(k._a), home_team_score: num(k.pts_home) || 0, visitor_team_score: num(k.pts_away) || 0,
      src: 'Kaggle only', kaggle_game_id: k.game_id, box: { home: boxOf(k, 'home'), visitor: boxOf(k, 'away') } });
  }
  r.kaggle = kGames.filter(k => k._h && k._season === season && k._post === post).length;
  r.unscoredAfter = out.filter(g => g.status === 'Final' && !g.postponed && !(g.home_team_score > 0 && g.visitor_team_score > 0)).length;
  r.total = out.filter(g => g.status === 'Final').length;
  out.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(join(OUT, `games-${y}-${kind}.json`), JSON.stringify(out));
  report.push(r);
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify({ seasons: report, conflicts }, null, 1));

// ── summary ────────────────────────────────────────────────────────
const sum = k => report.reduce((a, r) => a + r[k], 0);
console.log(`games: balldontlie ${sum('bdl')} · Kaggle ${sum('kaggle')} · matched ${sum('matched')} · scores filled from Kaggle ${sum('filled')} · conflicts ${sum('conflicts')} · Kaggle-only added ${sum('kaggleOnly')} · balldontlie-only ${sum('bdlOnly')}`);
console.log(`postponed games re-dated to the day they were played: ${sum('redated')}`);
console.log(`unscored games: before ${sum('bdlUnscored')} → after ${sum('unscoredAfter')}`);
const fixed = report.filter(r => r.bdlUnscored && !r.unscoredAfter).map(r => `${r.season}${r.kind === 'post' ? 'p' : ''}`);
const still = report.filter(r => r.unscoredAfter).map(r => `${r.season}${r.kind === 'post' ? 'p' : ''}(${r.unscoredAfter})`);
console.log(`seasons made complete by the merge: ${fixed.length} — ${fixed.join(' ')}`);
console.log(`seasons still with unscored games: ${still.length} — ${still.join(' ')}`);
console.log(`conflicting scores (first 8):`); conflicts.slice(0, 8).forEach(c => console.log(`  ${c.date} ${c.away} @ ${c.home}: balldontlie ${c.balldontlie} vs Kaggle ${c.kaggle}`));

// ── players: balldontlie + Kaggle bios + Kaggle draft history ────────
// Matched on name (accents, punctuation and Jr./Sr./II/III ignored), with the
// draft year breaking ties between players who share a name. Each field is
// taken from whichever source has it; where both do and they differ, the
// difference is logged (college / draft pick) and Kaggle is used.
const norm = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '').replace(/[^a-z]/g, '');
const bdlPlayers = read('players.json');
const bios = parseCSV(readFileSync(join(KDIR, 'common_player_info.csv'), 'utf8'));
const drafts = parseCSV(readFileSync(join(KDIR, 'draft_history.csv'), 'utf8'));
const draftByPerson = new Map(drafts.map(d => [d.person_id, d]));
const bioByName = new Map();
for (const b of bios) { const k = norm(b.display_first_last); if (!bioByName.has(k)) bioByName.set(k, []); bioByName.get(k).push(b); }
const clean = v => (v == null || !String(v).trim() || /^(none|null|undefined)$/i.test(String(v).trim()) ? null : String(v).trim());
const players = [], pr = { balldontlie: bdlPlayers.length, kaggleBios: bios.length, matched: 0, ambiguous: 0, bdlOnly: 0, kaggleOnly: 0,
  filled: { college: 0, country: 0, draft: 0, draftTeam: 0 }, differ: { college: 0, draftPick: 0 }, examples: [] };
const matchedBios = new Set();
for (const p of bdlPlayers) {
  const cands = bioByName.get(norm(`${p.first_name} ${p.last_name}`)) || [];
  let b = cands.length === 1 ? cands[0] : cands.find(c => p.draft_year && +c.draft_year === p.draft_year) || null;
  if (!b && cands.length > 1) pr.ambiguous++;
  if (b && matchedBios.has(b.person_id)) b = null;
  const m = { id: p.id, person_id: b ? b.person_id : null, first_name: p.first_name, last_name: p.last_name, display_first_last: b ? b.display_first_last : `${p.first_name} ${p.last_name}`,
    college: clean(p.college), country: clean(p.country), draft_year: p.draft_year, draft_round: p.draft_round, draft_number: p.draft_number,
    team: p.team, jersey: clean(p.jersey_number), position: clean(p.position), height: clean(p.height), src: 'balldontlie' };
  if (b) {
    matchedBios.add(b.person_id); pr.matched++; m.src = 'both';
    const kCollege = clean(b.school), kCountry = clean(b.country);
    if (!m.college && kCollege) { m.college = kCollege; pr.filled.college++; }
    else if (m.college && kCollege && norm(m.college) !== norm(kCollege)) { pr.differ.college++; if (pr.examples.length < 6) pr.examples.push(`${m.display_first_last}: college "${m.college}" vs "${kCollege}"`); }
    if (!m.country && kCountry) { m.country = kCountry; pr.filled.country++; }
    if (!m.draft_year && +b.draft_year) { m.draft_year = +b.draft_year; m.draft_round = +b.draft_round || null; m.draft_number = +b.draft_number || null; pr.filled.draft++; }
    else if (m.draft_number && +b.draft_number && m.draft_number !== +b.draft_number) { pr.differ.draftPick++; m.draft_number = +b.draft_number; }
    Object.assign(m, { from_year: parseInt(b.from_year, 10) || null, to_year: parseInt(b.to_year, 10) || null, season_exp: +b.season_exp || null,
      greatest_75_flag: b.greatest_75_flag, nba_flag: b.nba_flag, birthdate: (b.birthdate || '').slice(0, 10) || null });
    const d = draftByPerson.get(b.person_id);
    if (d) { m.draft_team = `${d.team_city} ${d.team_name}`.trim(); pr.filled.draftTeam++; }
  } else pr.bdlOnly++;
  players.push(m);
}
for (const b of bios) if (!matchedBios.has(b.person_id)) {
  pr.kaggleOnly++;
  const d = draftByPerson.get(b.person_id);
  players.push({ id: null, person_id: b.person_id, first_name: b.first_name, last_name: b.last_name, display_first_last: b.display_first_last,
    college: clean(b.school), country: clean(b.country), draft_year: +b.draft_year || null, draft_round: +b.draft_round || null, draft_number: +b.draft_number || null,
    draft_team: d ? `${d.team_city} ${d.team_name}`.trim() : null, team: null, jersey: clean(b.jersey), position: clean(b.position), height: clean(b.height),
    from_year: parseInt(b.from_year, 10) || null, to_year: parseInt(b.to_year, 10) || null, season_exp: +b.season_exp || null,
    greatest_75_flag: b.greatest_75_flag, nba_flag: b.nba_flag, birthdate: (b.birthdate || '').slice(0, 10) || null, src: 'Kaggle only' });
}
writeFileSync(join(OUT, 'players.json'), JSON.stringify(players));
const rep2 = JSON.parse(readFileSync(join(OUT, 'report.json'), 'utf8')); rep2.players = pr; writeFileSync(join(OUT, 'report.json'), JSON.stringify(rep2, null, 1));
console.log(`\nplayers: balldontlie ${pr.balldontlie} · Kaggle bios ${pr.kaggleBios} · matched ${pr.matched} · balldontlie-only ${pr.bdlOnly} · Kaggle-only ${pr.kaggleOnly} · same-name unresolved ${pr.ambiguous} → master list ${players.length}`);
console.log(`filled from the other source: college ${pr.filled.college} · country ${pr.filled.country} · draft position ${pr.filled.draft} · drafting team ${pr.filled.draftTeam}`);
console.log(`differences: college ${pr.differ.college} · draft pick ${pr.differ.draftPick}`); pr.examples.forEach(e => console.log('  ' + e));

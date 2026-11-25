// generate.js — turn raw NBA data (balldontlie games + players) into knowledge
// points: one verified fact → one question, the same contract as facts.js.
//
// Pure functions, no I/O: the backfill script (Node) and the weekly update
// job (Supabase Edge Function, Deno) both import this file.
//
// A knowledge point here looks like facts.js's, plus:
//   wrongs     explicit distractors (same season's teams, same draft's picks…)
//   temporal   'dynamic' for facts that age (standings, "reigning" titles)
//   valid_from / valid_until   the window a dynamic fact is true for
//   source     'balldontlie'
import { teamNameIn, seasonLabel, finalsYear } from './franchises.js';

const era = y => y < 1950 ? '1940s' : y < 1960 ? '1950s' : y < 1970 ? '1960s' : y < 1980 ? '1970s' : y < 1990 ? '1980s' : y < 2000 ? '1990s' : y < 2010 ? '2000s' : y < 2020 ? '2010s' : '2020s';
const byEra = (y, modern, mid, old) => y >= 2010 ? modern : y >= 1990 ? mid : old;
const WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const finalsName = y => y < 1949 ? 'BAA Finals' : 'NBA Finals';     // 1947–49 were BAA seasons
const leagueName = y => y < 1949 ? 'BAA' : 'NBA';

function rng(seed) { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function pick(pool, n, rnd, not = []) {
  const a = [...new Set(pool)].filter(x => x && !not.includes(x)), out = [];
  while (out.length < n && a.length) out.push(...a.splice(Math.floor(rnd() * a.length), 1));
  return out;
}
const final = g => g.status === 'Final' && g.home_team_score > 0 && g.visitor_team_score > 0;
// Games the source marks as played but with no score (common before the
// 1970s). Any of these in a season means its series and standings can't be
// trusted, so nothing is generated from that season's games.
export const gapsIn = games => games.filter(g => g.status === 'Final' && !g.postponed && !(g.home_team_score > 0 && g.visitor_team_score > 0)).length;
const scoreLine = (a, b) => `${Math.max(a, b)}–${Math.min(a, b)}`;
function nearbyScores(w, l, rnd) {
  const out = new Set(), real = scoreLine(w, l);
  while (out.size < 3) {
    const dw = Math.round((rnd() - 0.5) * 14), dl = Math.round((rnd() - 0.5) * 14);
    const s = scoreLine(Math.max(60, w + dw), Math.max(55, l + dl));
    if (s !== real && Number(s.split('–')[0]) > Number(s.split('–')[1])) out.add(s);
  }
  return [...out];
}
function nearbyNumbers(n, rnd, lo = 0) {
  const out = new Set();
  while (out.size < 3) { const d = Math.ceil(rnd() * 6) * (rnd() < .5 ? -1 : 1); if (n + d >= lo && d !== 0) out.add(String(n + d)); }
  return [...out];
}

// ── playoff series ───────────────────────────────────────────────
// Group a season's postseason games into head-to-head series.
export function seriesOf(games, season) {
  const map = new Map();
  for (const g of games.filter(final).sort((a, b) => a.date.localeCompare(b.date))) {
    const [a, b] = [g.home_team, g.visitor_team].sort((x, y) => x.id - y.id);
    const key = a.id + '-' + b.id;
    if (!map.has(key)) map.set(key, { a, b, wins: { [a.id]: 0, [b.id]: 0 }, games: [], first: g.date, last: g.date });
    const s = map.get(key);
    const winner = g.home_team_score > g.visitor_team_score ? g.home_team : g.visitor_team;
    s.wins[winner.id]++; s.games.push(g); s.last = g.date;
  }
  return [...map.values()].map(s => {
    const aw = s.wins[s.a.id], bw = s.wins[s.b.id];
    const w = aw > bw ? s.a : s.b, l = aw > bw ? s.b : s.a;
    return { ...s, winner: w, loser: l, winnerName: teamNameIn(w, season), loserName: teamNameIn(l, season),
      score: `${Math.max(aw, bw)}–${Math.min(aw, bw)}`, decided: aw !== bw, clincher: s.games[s.games.length - 1] };
  });
}
export function finalsOf(games, season) {
  const all = seriesOf(games, season);
  if (!all.length) return null;
  const f = all.reduce((x, y) => (y.last > x.last ? y : x));
  return f.decided && Math.max(...Object.values(f.wins)) === 4 ? f : null;   // every Finals has been best-of-seven
}

export function fromPostseason(games, season) {
  const kps = [], y = finalsYear(season), s = seasonLabel(season), e = era(season), rnd = rng('post' + season);
  const series = seriesOf(games, season), f = finalsOf(games, season);
  const playoffTeams = [...new Set(series.flatMap(x => [x.winnerName, x.loserName]))];
  const finals = f ? { season: s, champion: f.winnerName, runnerUp: f.loserName, score: f.score, end: f.last, teams: playoffTeams } : null;
  if (gapsIn(games)) return { kps, finals: finals && { ...finals, score: null, partial: true } };
  if (f) {
    const n = f.games.length;
    kps.push({ knowledge_point_id: `KP-${s}-FINALS-LENGTH`, column: 'value', era: e, season: s, category: 'Finals',
      fact: `${WORD[n]} games`, wrongs: ['Four', 'Five', 'Six', 'Seven'].filter(w => w !== WORD[n]).map(w => w + ' games'),
      question: `How many games did the ${y} ${finalsName(y)} last?`,
      explanation: `The ${f.winnerName} beat the ${f.loserName} ${f.score}.`,
      difficulty: byEra(season, 'medium', 'hard', 'expert') });
    const c = f.clincher, cw = Math.max(c.home_team_score, c.visitor_team_score), cl = Math.min(c.home_team_score, c.visitor_team_score);
    kps.push({ knowledge_point_id: `KP-${s}-FINALS-CLINCHER-SCORE`, column: 'value', era: e, season: s, category: 'Finals',
      fact: scoreLine(cw, cl), wrongs: nearbyScores(cw, cl, rnd),
      question: `The ${f.winnerName} clinched the ${y} title against the ${f.loserName}. What was the final score of the clinching game?`,
      explanation: `${f.winnerName} ${cw}, ${f.loserName} ${cl} on ${longDate(c.date)}.`,
      difficulty: byEra(season, 'hard', 'expert', 'expert') });
  }
  // Who knocked out whom — every decided series of three or more games
  // (skips one-game tiebreakers and play-in games).
  const losses = new Map();
  series.forEach(x => losses.set(x.loser.id, (losses.get(x.loser.id) || 0) + 1));
  for (const x of series) {
    if (!x.decided || x.games.length < 3 || x === f || losses.get(x.loser.id) !== 1) continue;
    const wrongs = pick(playoffTeams, 3, rnd, [x.winnerName, x.loserName]);
    if (wrongs.length < 3) continue;
    kps.push({ knowledge_point_id: `KP-${s}-ELIMINATED-${x.loser.id}`, column: 'team', era: e, season: s, category: 'Playoffs',
      fact: x.winnerName, wrongs,
      question: `Which team knocked the ${x.loserName} out of the ${y} ${leagueName(y)} playoffs?`,
      explanation: `The ${x.winnerName} won the series ${x.score}.`,
      difficulty: byEra(season, 'medium', 'hard', 'expert'), teams: [x.winnerName, x.loserName] });
  }
  return { kps, finals };
}

// ── regular season ───────────────────────────────────────────────
export function standings(games, season) {
  const t = new Map();
  for (const g of games.filter(final)) {
    for (const side of ['home', 'visitor']) {
      const team = g[side + '_team'], me = g[side + '_team_score'], them = g[(side === 'home' ? 'visitor' : 'home') + '_team_score'];
      if (!t.has(team.id)) t.set(team.id, { team, name: teamNameIn(team, season), w: 0, l: 0 });
      const r = t.get(team.id); if (me > them) r.w++; else r.l++;
    }
  }
  return [...t.values()].map(r => ({ ...r, pct: r.w / (r.w + r.l) })).sort((a, b) => b.pct - a.pct || b.w - a.w);
}
// A season is usable only if every team has a full slate of games on file.
export function complete(table) {
  if (table.length < 8) return false;
  const gp = table.map(r => r.w + r.l).sort((a, b) => a - b), median = gp[Math.floor(gp.length / 2)];
  return gp[0] >= median * 0.85 && median >= 40;
}

export function fromRegularSeason(games, season, { inProgress = false, asOf = null } = {}) {
  const kps = [], s = seasonLabel(season), e = era(season), rnd = rng('reg' + season);
  const table = standings(games, season);
  if (!table.length) return kps;
  if (inProgress) {
    // Live standings: true for about a week, then the next update replaces them.
    if (table[0].w + table[0].l < 8) return kps;
    const until = new Date(Date.parse(asOf) + 8 * 864e5).toISOString().slice(0, 10);
    // A tie at the top has no single answer: skip that question, keep the rest.
    if (table[0].pct !== table[1].pct) kps.push({ knowledge_point_id: `KP-${s}-LIVE-BEST-RECORD`, column: 'team', era: e, season: s, category: 'This Season',
      fact: table[0].name, wrongs: table.slice(1, 4).map(r => r.name),
      question: `Which team has the NBA's best record so far this season (as of ${longDate(asOf)})?`,
      explanation: `The ${table[0].name} were ${table[0].w}–${table[0].l}.`,
      difficulty: 'easy', temporal: 'dynamic', valid_from: asOf, valid_until: until });
    for (const conf of ['East', 'West']) {
      const c = table.filter(r => r.team.conference === conf);
      if (c.length < 4 || c[0].pct === c[1].pct) continue;
      kps.push({ knowledge_point_id: `KP-${s}-LIVE-${conf.toUpperCase()}-LEADER`, column: 'team', era: e, season: s, category: 'This Season',
        fact: c[0].name, wrongs: c.slice(1, 4).map(r => r.name),
        question: `Which team leads the ${conf}ern Conference so far this season (as of ${longDate(asOf)})?`,
        explanation: `The ${c[0].name} were ${c[0].w}–${c[0].l}.`,
        difficulty: 'medium', temporal: 'dynamic', valid_from: asOf, valid_until: until });
    }
    return kps;
  }
  if (!complete(table) || gapsIn(games)) return kps;
  const best = table[0], worst = table[table.length - 1];
  if (best.pct !== table[1].pct) {
    kps.push({ knowledge_point_id: `KP-${s}-BEST-RECORD`, column: 'team', era: e, season: s, category: 'Regular Season',
      fact: best.name, wrongs: table.slice(1, 4).map(r => r.name),
      question: `Which team had the best regular-season record in ${s}?`,
      explanation: `The ${best.name} went ${best.w}–${best.l}.`, difficulty: byEra(season, 'medium', 'hard', 'expert') });
    kps.push({ knowledge_point_id: `KP-${s}-BEST-RECORD-WINS`, column: 'value', era: e, season: s, category: 'Regular Season',
      fact: String(best.w), wrongs: nearbyNumbers(best.w, rnd, 1),
      question: `How many regular-season games did the ${s} ${best.name} win?`,
      explanation: `They finished ${best.w}–${best.l}, the league's best record.`, difficulty: best.w >= 69 ? 'medium' : 'expert' });
  }
  if (worst.pct !== table[table.length - 2].pct) {
    kps.push({ knowledge_point_id: `KP-${s}-WORST-RECORD`, column: 'team', era: e, season: s, category: 'Regular Season',
      fact: worst.name, wrongs: table.slice(-4, -1).map(r => r.name),
      question: `Which team had the worst regular-season record in ${s}?`,
      explanation: `The ${worst.name} went ${worst.w}–${worst.l}.`, difficulty: byEra(season, 'hard', 'expert', 'expert') });
  }
  return kps;
}

// ── last week's games (dynamic: interesting for about six weeks) ─
export function fromRecentGames(games, season, today = new Date().toISOString().slice(0, 10), days = 8) {
  const kps = [], s = seasonLabel(season), since = new Date(Date.parse(today) - days * 864e5).toISOString().slice(0, 10);
  const until = new Date(Date.parse(today) + 42 * 864e5).toISOString().slice(0, 10);
  const recent = games.filter(final).filter(g => g.date.slice(0, 10) >= since && g.date.slice(0, 10) < today);
  for (const g of recent) {
    const rnd = rng('g' + g.id);
    const home = teamNameIn(g.home_team, season), away = teamNameIn(g.visitor_team, season);
    const homeWon = g.home_team_score > g.visitor_team_score;
    const w = homeWon ? home : away, l = homeWon ? away : home;
    const ws = Math.max(g.home_team_score, g.visitor_team_score), ls = Math.min(g.home_team_score, g.visitor_team_score);
    const when = longDate(g.date);
    kps.push({ knowledge_point_id: `KP-GAME-${g.id}-SCORE`, column: 'value', era: era(season), season: s, category: 'This Week',
      fact: scoreLine(ws, ls), wrongs: nearbyScores(ws, ls, rnd),
      question: `The ${w} beat the ${l} on ${when}. What was the final score?`,
      explanation: `${w} ${ws}, ${l} ${ls}${g.period > 4 ? ` (${g.period === 5 ? 'OT' : (g.period - 4) + 'OT'})` : ''}.`,
      difficulty: 'medium', temporal: 'dynamic', valid_from: g.date.slice(0, 10), valid_until: until, teams: [w, l] });
    if (ws - ls >= 25) kps.push({ knowledge_point_id: `KP-GAME-${g.id}-BLOWOUT`, column: 'team', era: era(season), season: s, category: 'This Week',
      fact: l, wrongs: [], two: [w, l],
      question: `On ${when}, the ${w} won by ${ws - ls} points. Who did they beat?`,
      explanation: `${w} ${ws}, ${l} ${ls}.`, difficulty: 'easy', temporal: 'dynamic', valid_from: g.date.slice(0, 10), valid_until: until, teams: [w, l] });
  }
  // Blowout distractors: other teams that played that week.
  const names = [...new Set(recent.flatMap(g => [teamNameIn(g.home_team, season), teamNameIn(g.visitor_team, season)]))];
  for (const k of kps) if (k.two) { k.wrongs = pick(names, 3, rng(k.knowledge_point_id), k.two); delete k.two; }
  return kps.filter(k => k.wrongs.length === 3);
}

// The latest completed Finals → "reigning champions" (true until the next Finals).
export function reigningChampion(finals, season) {
  if (!finals) return [];
  const nextFinalsEnd = `${finalsYear(season) + 1}-06-30`;
  return [{ knowledge_point_id: 'KP-REIGNING-CHAMPION', column: 'team', era: era(season), season: finals.season, category: 'Championships',
    fact: finals.champion,
    // the beaten finalist plus two other playoff teams from that season
    wrongs: [finals.runnerUp, ...pick(finals.teams || [], 2, rng('reign' + season), [finals.champion, finals.runnerUp])].length === 3
      ? [finals.runnerUp, ...pick(finals.teams || [], 2, rng('reign' + season), [finals.champion, finals.runnerUp])] : null,
    question: 'Which team are the reigning NBA champions?',
    explanation: `The ${finals.champion} beat the ${finals.runnerUp}${finals.score ? ' ' + finals.score : ''} in the ${finalsYear(season)} Finals.`,
    difficulty: 'beginner', temporal: 'dynamic', valid_from: finals.end.slice(0, 10), valid_until: nextFinalsEnd }];
}

// ── players: drafts, colleges, home countries ────────────────────
const fullName = p => `${p.first_name} ${p.last_name}`.trim();
const HOME = new Set(['USA', 'United States', null, undefined, '']);
export function fromPlayers(players) {
  const kps = [];
  const drafted = players.filter(p => p.draft_year && p.draft_round === 1 && p.draft_number);
  const byYear = new Map();
  for (const p of drafted) { if (!byYear.has(p.draft_year)) byYear.set(p.draft_year, []); byYear.get(p.draft_year).push(p); }
  for (const [y, list] of byYear) {
    const at = n => list.filter(p => p.draft_number === n);
    const s = seasonLabel(y), e = era(y), rnd = rng('draft' + y);
    const top = list.filter(p => p.draft_number <= 8).map(fullName);
    for (const [n, tag, word] of [[1, 'FIRST-PICK', 'first'], [2, 'SECOND-PICK', 'second']]) {
      const hit = at(n); if (hit.length !== 1) continue;
      const name = fullName(hit[0]), wrongs = pick(top, 3, rnd, [name]);
      if (wrongs.length < 3) continue;
      kps.push({ knowledge_point_id: `KP-DRAFT-${y}-${tag}`, column: 'player', era: e, season: s, category: 'Draft',
        fact: name, wrongs, question: `Who was the ${word} overall pick in the ${y} NBA draft?`,
        explanation: `${name} went No. ${n} in ${y}.`, difficulty: n === 1 ? (y >= 2010 ? 'easy' : y >= 1990 ? 'medium' : 'hard') : 'expert', players: [name] });
    }
  }
  // Colleges and countries, for top-five picks only (recognisable names).
  // The source's "college" field also holds high schools and overseas clubs
  // (FC Barcelona, even NBA teams), so only names that are a college for at
  // least three American NBA players count — real schools repeat, clubs and one-off
  // entries don't.
  const SCHOOLISH = /\b(HS|High School|Academy|Prep|Christian|FC|BC|KK|Club|Basket|Basketball Club|No College|G League|Overtime Elite)\b/i;
  const alumni = new Map();
  for (const q of players) if (q.college && HOME.has(q.country)) alumni.set(q.college, (alumni.get(q.college) || 0) + 1);   // US players only: clubs abroad drop out
  const nbaTeams = new Set(players.map(q => q.team && q.team.full_name).filter(Boolean));
  const isCollege = c => c && !/^(none|n\/a)$/i.test(c) && !SCHOOLISH.test(c) && !nbaTeams.has(c) && (alumni.get(c) || 0) >= 3;
  const playerCount = new Map();
  for (const q of players) if (!HOME.has(q.country)) playerCount.set(q.country, (playerCount.get(q.country) || 0) + 1);
  const countries = [...playerCount].filter(([, n]) => n >= 3).map(([c]) => c);
  const notable = drafted.filter(p => p.draft_number <= 5 && p.draft_year >= 1960);
  for (const p of notable) {
    const name = fullName(p), y = p.draft_year, rnd = rng('pl' + p.id);
    const near = notable.filter(q => q.id !== p.id && Math.abs(q.draft_year - y) <= 6);
    if (isCollege(p.college)) {
      const college = p.college;
      const wrongs = pick(near.map(q => q.college).filter(isCollege), 3, rnd, [college]);
      if (wrongs.length === 3) kps.push({ knowledge_point_id: `KP-PLAYER-${p.id}-COLLEGE`, column: 'college', era: era(y), season: seasonLabel(y), category: 'Players',
        fact: college, wrongs, question: `Where did ${name} play college basketball before the NBA?`,
        explanation: `${name} came out of ${college} and went No. ${p.draft_number} in the ${y} draft.`, difficulty: y >= 2000 ? 'medium' : 'hard', players: [name] });
    }
    if (!HOME.has(p.country)) {
      const wrongs = pick(countries, 3, rnd, [p.country]);
      if (wrongs.length === 3) kps.push({ knowledge_point_id: `KP-PLAYER-${p.id}-COUNTRY`, column: 'country', era: era(y), season: seasonLabel(y), category: 'Players',
        fact: p.country, wrongs, question: `Which country is ${name} from?`,
        explanation: `${name}, the No. ${p.draft_number} pick in ${y}, is from ${p.country}.`, difficulty: y >= 2010 ? 'easy' : 'medium', players: [name] });
    }
  }
  return kps;
}

// Compare the hand-checked champions list with what the game data says.
export function crossCheck(seasonsTable, finalsBySeason) {
  const issues = [];
  for (const [s, champ, runner] of seasonsTable) {
    const f = finalsBySeason[s];
    if (!f) { issues.push(`${s}: no Finals in game data`); continue; }
    if (f.champion !== champ || f.runnerUp !== runner) issues.push(`${s}: table says ${champ} over ${runner}; games say ${f.champion} over ${f.runnerUp} (${f.score})`);
  }
  return issues;
}

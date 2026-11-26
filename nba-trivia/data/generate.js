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
import { teamNameIn, seasonLabel, finalsYear, ABBR_ID } from './franchises.js';

// Six difficulty levels, easiest first. A question's level comes from how
// famous the fact is and how long ago it happened.
export const TIERS = ['easy', 'medium', 'hard', 'hardest', 'hall_of_fame', 'goat'];
// tierBy(season, [[2010, 'hard'], [1990, 'hardest'], [0, 'goat']]) → first step the season reaches
export const tierBy = (y, steps) => { for (const [from, t] of steps) if (y >= from) return t; return steps[steps.length - 1][1]; };
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

// ── the bracket: conferences and rounds ──────────────────────────
// Teams that met before the Finals were in the same conference, so the
// non-Finals series split the playoff field into its two conferences. Each
// one is named after where most of its teams sit today. From 1984 (the
// 16-team, four-round format) a team's n-th series is round n.
const ROUND_NAMES = { 1: 'First Round', 2: 'Conference Semifinals', 3: 'Conference Finals', 4: 'NBA Finals' };
export function bracket(games, season) {
  const series = seriesOf(games, season).filter(x => x.decided && x.games.length >= 3);
  const f = finalsOf(games, season);
  const parent = new Map(), find = id => { while (parent.get(id) !== id) id = parent.get(id); return id; };
  for (const x of series) for (const t of [x.a, x.b]) if (!parent.has(t.id)) parent.set(t.id, t.id);
  for (const x of series) if (x !== f && !(f && x.a.id === f.a.id && x.b.id === f.b.id)) parent.set(find(x.a.id), find(x.b.id));
  const groups = new Map();
  for (const x of series) for (const t of [x.a, x.b]) { const r = find(t.id); if (!groups.has(r)) groups.set(r, new Map()); groups.get(r).set(t.id, t); }
  const confOf = new Map(), confName = new Map();
  if (groups.size === 2) for (const [root, members] of groups) {
    const votes = [...members.values()].reduce((m, t) => (m[t.conference] = (m[t.conference] || 0) + 1, m), {});
    const name = (votes.East || 0) >= (votes.West || 0) ? 'Eastern' : 'Western';
    for (const id of members.keys()) { confOf.set(id, root); confName.set(id, name); }
  }
  // rounds: only for the four-round format with the whole bracket on file
  // (15 series, no unscored games), and only when both sides agree
  const full = series.length === 15 && !gapsIn(games) && !!f;
  const perTeam = new Map();
  for (const x of [...series].sort((p, q) => p.first.localeCompare(q.first))) for (const t of [x.a, x.b]) { if (!perTeam.has(t.id)) perTeam.set(t.id, []); perTeam.get(t.id).push(x); }
  for (const x of series) {
    const ra = perTeam.get(x.a.id).indexOf(x) + 1, rb = perTeam.get(x.b.id).indexOf(x) + 1;
    x.round = full && season >= 1983 && ra === rb && ra <= 4 && (ra === 4) === (x === f || (f && x.a.id === f.a.id && x.b.id === f.b.id)) ? ra : null;
    x.conference = confName.get(x.winner.id) === confName.get(x.loser.id) ? confName.get(x.winner.id) : null;
    x.roundName = x.round === 4 ? 'NBA Finals' : x.round && x.conference ? (x.round === 1 ? `${x.conference} Conference First Round` : `${x.conference} ${ROUND_NAMES[x.round]}`) : null;
  }
  const teamsById = new Map(series.flatMap(x => [x.a, x.b]).map(t => [t.id, t]));   // each playoff team once
  const sameConference = (id, exclude = []) => [...teamsById.values()].filter(t => confOf.get(t.id) === confOf.get(id) && confOf.has(id) && !exclude.includes(t.id));
  return { series, finals: f, sameConference, confName, full };
}

// ── "How well do you know your team?" — every franchise, every season ─
// Deep, season-by-season questions from the games themselves: how far they
// went, who they beat in each round, Game 7 scores, home record, longest
// winning streak, scoring average, biggest win, season-high, conference
// finish. Tagged with the franchise so they feed its own team mode.
const OUTCOMES = ['Missed the playoffs', 'Lost in the first round', 'Lost in the conference semifinals', 'Lost in the conference finals', 'Lost in the NBA Finals', 'Won the championship'];
const poss = n => /s$/.test(n) ? n + "'" : n + "'s";   // "Miami Heat's", "Boston Celtics'"
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const recordWrongs = (w, l, rnd) => { const out = new Set(); while (out.size < 3) { const d = Math.ceil(rnd() * 6) * (rnd() < .5 ? -1 : 1); if (w + d >= 0 && l - d >= 0 && d) out.add(`${w + d}–${l - d}`); } return [...out]; };
export function fromTeamSeasons(regGames, postGames, season) {
  const kps = [], s = seasonLabel(season), y = finalsYear(season), e = era(season);
  const reg = standingsGames(regGames || [], season);
  if (!reg.length || gapsIn(regGames) || !complete(standings(regGames, season))) return kps;
  const table = standings(regGames, season);
  const br = postGames && postGames.length && !gapsIn(postGames) ? bracket(postGames, season) : null;
  const deep = tierBy(season, [[2015, 'hardest'], [1990, 'hall_of_fame'], [0, 'goat']]);
  for (const row of table) {
    const t = row.team; if (t.id > 30) continue;
    const id = t.abbreviation.toLowerCase(), name = row.name, rnd = rng(s + id);
    const tag = (k, o) => kps.push({ knowledge_point_id: `KP-${s}-${t.abbreviation}-${k}`, era: e, season: s, team_id: id, teams: [name], column: 'value', ...o });
    const mine = reg.filter(g => g.home_team.id === t.id || g.visitor_team.id === t.id).sort((a, b) => a.date.localeCompare(b.date));
    const res = mine.map(g => { const home = g.home_team.id === t.id, us = home ? g.home_team_score : g.visitor_team_score, them = home ? g.visitor_team_score : g.home_team_score;
      return { g, home, us, them, won: us > them, opp: teamNameIn(home ? g.visitor_team : g.home_team, season) }; });
    const opps = [...new Set(res.map(r => r.opp))];
    // home record
    const hw = res.filter(r => r.home && r.won).length, hl = res.filter(r => r.home && !r.won).length;
    tag('HOME-RECORD', { category: 'Team seasons', fact: `${hw}–${hl}`, wrongs: recordWrongs(hw, hl, rnd),
      question: `What was the ${s} ${poss(name)} home record?`, explanation: `${hw}–${hl} at home, ${row.w}–${row.l} overall.`, difficulty: deep });
    // longest winning streak
    let run = 0, best = 0; for (const r of res) { run = r.won ? run + 1 : 0; best = Math.max(best, run); }
    if (best >= 3) tag('WIN-STREAK', { category: 'Team seasons', fact: `${best} games`, wrongs: nearbyNumbers(best, rnd, 2).map(n => n + ' games'),
      question: `What was the ${poss(name)} longest winning streak of the ${s} season?`, explanation: `${best} straight wins on the way to ${row.w}–${row.l}.`,
      difficulty: best >= 20 ? 'hard' : deep });
    // scoring average
    const ppg = (res.reduce((a, r) => a + r.us, 0) / res.length).toFixed(1);
    const skip = Math.floor(rnd() * 4);
    tag('PPG', { category: 'Team seasons', fact: ppg, wrongs: [-6.3, -2.8, 3.4, 5.9].map(d => (Number(ppg) + d).toFixed(1)).filter((v, i) => i !== skip),
      question: `How many points per game did the ${s} ${name} average?`, explanation: `${ppg} points a game over ${res.length} games.`,
      difficulty: tierBy(season, [[2015, 'hall_of_fame'], [0, 'goat']]) });
    // biggest win and season-high: who was the opponent?
    const wins = res.filter(r => r.won), margin = r => r.us - r.them;
    const big = wins.reduce((m, r) => (!m || margin(r) > margin(m) ? r : m), null);
    if (big && wins.filter(r => margin(r) === margin(big)).length === 1) {
      const wrongs = pick(opps, 3, rnd, [big.opp]);
      if (wrongs.length === 3) tag('BIGGEST-WIN', { column: 'team', category: 'Team games', fact: big.opp, wrongs,
        question: `The ${s} ${poss(name)} biggest win was by ${margin(big)} points. Who did they beat?`, explanation: `${name} ${big.us}, ${big.opp} ${big.them} on ${longDate(big.g.date)}.`, difficulty: deep });
    }
    const high = res.reduce((m, r) => (!m || r.us > m.us ? r : m), null);
    if (high && res.filter(r => r.us === high.us).length === 1) {
      const wrongs = pick(opps, 3, rnd, [high.opp]);
      if (wrongs.length === 3) tag('SEASON-HIGH', { column: 'team', category: 'Team games', fact: high.opp, wrongs,
        question: `The ${s} ${name} scored a season-high ${high.us} points. Who were they playing?`, explanation: `${name} ${high.us}, ${high.opp} ${high.them} on ${longDate(high.g.date)} (${high.won ? 'a win' : 'a loss'}).`, difficulty: deep });
    }
    // conference finish (today's alignment holds from 2004–05)
    if (season >= 2004 && t.conference) {
      const conf = table.filter(r => r.team.conference === t.conference && r.team.id <= 30), rank = conf.indexOf(row) + 1;
      const tied = conf.filter(r => r.pct === row.pct).length > 1;
      if (rank && !tied) { const opts = [rank - 2, rank - 1, rank + 1, rank + 2, rank + 3].filter(n => n >= 1 && n <= conf.length && n !== rank);
        tag('CONF-FINISH', { category: 'Team seasons', fact: ord(rank), wrongs: pick(opts.map(ord), 3, rnd),
          question: `Where did the ${s} ${name} finish in the ${t.conference}ern Conference?`, explanation: `${ord(rank)} at ${row.w}–${row.l}.`,
          difficulty: tierBy(season, [[2015, 'hard'], [0, 'hardest']]) }); }
    }
    // the playoff run, round by round (four-round format with the full bracket)
    if (br && br.full) {
      const theirs = br.series.filter(x => x.a.id === t.id || x.b.id === t.id).sort((p, q) => p.round - q.round);
      const lastS = theirs[theirs.length - 1];
      const outcome = !theirs.length ? 0 : lastS.winner.id === t.id && lastS.round === 4 ? 5 : lastS.round;
      const near = OUTCOMES.map((o, i) => [o, Math.abs(i - outcome)]).filter(([, d]) => d > 0).sort((p, q) => p[1] - q[1] || rnd() - .5).slice(0, 3).map(([o]) => o);
      tag('PLAYOFF-RUN', { column: 'outcome', category: 'Team playoffs', fact: OUTCOMES[outcome], wrongs: near,
        question: `How far did the ${s} ${name} go in the playoffs?`,
        explanation: outcome === 5 ? `They won the ${y} title.` : outcome === 0 ? `They finished ${row.w}–${row.l} and missed the playoffs.` : `Their season ended against the ${lastS.winnerName} (${lastS.score}).`,
        difficulty: tierBy(season, [[2018, 'medium'], [2005, 'hard'], [1995, 'hardest'], [0, 'hall_of_fame']]) });
      for (const x of theirs) if (x.winner.id === t.id && x.roundName) {
        const conf = x.round === 4 ? br.series.flatMap(z => [z.a, z.b]).filter(z => br.confName.get(z.id) === br.confName.get(x.loser.id)) : br.sameConference(x.loser.id, [t.id]);
        const wrongs = pick(conf.map(z => teamNameIn(z, season)), 3, rnd, [x.loserName, name]);
        if (wrongs.length === 3) tag(`BEAT-R${x.round}`, { column: 'team', category: 'Team playoffs', fact: x.loserName, wrongs,
          question: `Who did the ${name} beat in the ${y} ${x.roundName}?`, explanation: `${name} won the series ${x.score}.`,
          difficulty: tierBy(season, [[2015, 'hard'], [2000, 'hardest'], [1990, 'hall_of_fame'], [0, 'goat']]) });
        // Game 7s they won
        if (x.games.length === 7) { const g7 = x.games[6], ws = Math.max(g7.home_team_score, g7.visitor_team_score), ls = Math.min(g7.home_team_score, g7.visitor_team_score);
          tag(`GAME7-R${x.round}`, { category: 'Team playoffs', fact: scoreLine(ws, ls), wrongs: nearbyScores(ws, ls, rnd),
            question: `The ${name} won Game 7 of the ${y} ${x.roundName} against the ${x.loserName}. What was the final score?`, explanation: `${name} ${ws}, ${x.loserName} ${ls} on ${longDate(g7.date)}.`,
            difficulty: tierBy(season, [[2010, 'hardest'], [1995, 'hall_of_fame'], [0, 'goat']]) }); }
      }
    }
  }
  return kps;
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
      difficulty: tierBy(season, [[2010, 'hard'], [1990, 'hardest'], [1970, 'hall_of_fame'], [0, 'goat']]) });
    const c = f.clincher, cw = Math.max(c.home_team_score, c.visitor_team_score), cl = Math.min(c.home_team_score, c.visitor_team_score);
    kps.push({ knowledge_point_id: `KP-${s}-FINALS-CLINCHER-SCORE`, column: 'value', era: e, season: s, category: 'Finals',
      fact: scoreLine(cw, cl), wrongs: nearbyScores(cw, cl, rnd),
      question: `The ${f.winnerName} clinched the ${y} title against the ${f.loserName}. What was the final score of the clinching game?`,
      explanation: `${f.winnerName} ${cw}, ${f.loserName} ${cl} on ${longDate(c.date)}.`,
      difficulty: tierBy(season, [[2000, 'hall_of_fame'], [0, 'goat']]) });
  }
  // Who knocked out whom — every decided series of three or more games
  // (skips one-game tiebreakers and play-in games). Wrong answers come from
  // the same conference's playoff teams that year, and the round is named
  // when the format allows ("…out of the 2005 Eastern Conference Finals").
  const br = bracket(games, season);
  const losses = new Map();
  series.forEach(x => losses.set(x.loser.id, (losses.get(x.loser.id) || 0) + 1));
  for (const x of br.series) {
    if (x === br.finals || (br.finals && x.a.id === br.finals.a.id && x.b.id === br.finals.b.id) || losses.get(x.loser.id) !== 1) continue;
    const conf = br.sameConference(x.loser.id, [x.winner.id, x.loser.id]).map(t => teamNameIn(t, season));
    const wrongs = pick(conf.length >= 3 ? conf : playoffTeams, 3, rnd, [x.winnerName, x.loserName]);
    if (wrongs.length < 3) continue;
    kps.push({ knowledge_point_id: `KP-${s}-ELIMINATED-${x.loser.id}`, column: 'team', era: e, season: s, category: 'Playoffs',
      fact: x.winnerName, wrongs,
      question: x.roundName ? `Which team knocked the ${x.loserName} out of the ${y} ${x.roundName}?` : `Which team knocked the ${x.loserName} out of the ${y} ${leagueName(y)} playoffs?`,
      explanation: `The ${x.winnerName} won the series ${x.score}.`,
      difficulty: tierBy(season, [[2015, 'hard'], [1995, 'hardest'], [1975, 'hall_of_fame'], [0, 'goat']]), teams: [x.winnerName, x.loserName] });
  }
  return { kps, finals };
}

// ── regular season ───────────────────────────────────────────────
// balldontlie files two kinds of games as "regular season" that do not count
// in the standings: play-in games (2019–20 onward, after the last full game
// night) and the NBA Cup final (2023–24 onward: alone on its December night,
// between two teams that end up past 82 games).
export function standingsGames(games, season) {
  let g = games.filter(final);
  const perDay = list => list.reduce((m, x) => (m[x.date.slice(0, 10)] = (m[x.date.slice(0, 10)] || 0) + 1, m), {});
  if (season >= 2019) {
    const days = perDay(g), end = Object.keys(days).filter(d => days[d] >= 3).sort().pop();
    if (end) g = g.filter(x => x.date.slice(0, 10) <= end);
  }
  if (season >= 2023) {
    const gp = {}; g.forEach(x => [x.home_team.id, x.visitor_team.id].forEach(id => gp[id] = (gp[id] || 0) + 1));
    const days = perDay(g);
    g = g.filter(x => !(x.date.slice(5, 7) === '12' && days[x.date.slice(0, 10)] === 1 && gp[x.home_team.id] > 82 && gp[x.visitor_team.id] > 82));
  }
  return g;
}
export function standings(games, season) {
  const t = new Map();
  for (const g of standingsGames(games, season)) {
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
      difficulty: 'medium', temporal: 'dynamic', valid_from: asOf, valid_until: until });
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
      explanation: `The ${best.name} went ${best.w}–${best.l}.`, difficulty: tierBy(season, [[2010, 'medium'], [1990, 'hard'], [1970, 'hardest'], [0, 'hall_of_fame']]) });
    kps.push({ knowledge_point_id: `KP-${s}-BEST-RECORD-WINS`, column: 'value', era: e, season: s, category: 'Regular Season',
      fact: String(best.w), wrongs: nearbyNumbers(best.w, rnd, 1),
      question: `How many regular-season games did the ${s} ${best.name} win?`,
      explanation: `They finished ${best.w}–${best.l}, the league's best record.`, difficulty: best.w >= 69 ? 'hard' : tierBy(season, [[2010, 'hardest'], [0, 'hall_of_fame']]) });
  }
  if (worst.pct !== table[table.length - 2].pct) {
    kps.push({ knowledge_point_id: `KP-${s}-WORST-RECORD`, column: 'team', era: e, season: s, category: 'Regular Season',
      fact: worst.name, wrongs: table.slice(-4, -1).map(r => r.name),
      question: `Which team had the worst regular-season record in ${s}?`,
      explanation: `The ${worst.name} went ${worst.w}–${worst.l}.`, difficulty: tierBy(season, [[2010, 'hardest'], [1980, 'hall_of_fame'], [0, 'goat']]) });
  }
  // "Your Team" mode: every current franchise's win total, season by season
  // (the league-best team's total is already asked above).
  table.forEach((r, i) => {
    if (r.team.id > 30 || (i === 0 && best.pct !== table[1].pct)) return;
    const rank = i + 1, ord = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : rank + 'th';
    kps.push({ knowledge_point_id: `KP-${s}-${r.team.abbreviation}-WINS`, column: 'value', era: e, season: s, category: 'Team seasons',
      fact: String(r.w), wrongs: nearbyNumbers(r.w, rng('w' + s + r.team.id), 0),
      question: `How many regular-season games did the ${s} ${r.name} win?`,
      explanation: `They went ${r.w}–${r.l}, ${ord} in the league.`,
      difficulty: tierBy(season, [[2015, 'hardest'], [1995, 'hall_of_fame'], [0, 'goat']]),
      team_id: r.team.abbreviation.toLowerCase(), teams: [r.name] });
  });
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
      difficulty: 'hardest', temporal: 'dynamic', valid_from: g.date.slice(0, 10), valid_until: until, teams: [w, l] });
    if (ws - ls >= 25) kps.push({ knowledge_point_id: `KP-GAME-${g.id}-BLOWOUT`, column: 'team', era: era(season), season: s, category: 'This Week',
      fact: l, wrongs: [], two: [w, l],
      question: `On ${when}, the ${w} won by ${ws - ls} points. Who did they beat?`,
      explanation: `${w} ${ws}, ${l} ${ls}.`, difficulty: 'medium', temporal: 'dynamic', valid_from: g.date.slice(0, 10), valid_until: until, teams: [w, l] });
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
    difficulty: 'easy', temporal: 'dynamic', valid_from: finals.end.slice(0, 10), valid_until: nextFinalsEnd }];
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
        explanation: `${name} went No. ${n} in ${y}.`, difficulty: n === 1 ? tierBy(y, [[2010, 'medium'], [1990, 'hard'], [1970, 'hardest'], [0, 'hall_of_fame']]) : tierBy(y, [[2000, 'hardest'], [1975, 'hall_of_fame'], [0, 'goat']]), players: [name] });
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
        explanation: `${name} came out of ${college} and went No. ${p.draft_number} in the ${y} draft.`, difficulty: tierBy(y, [[2010, 'hard'], [1990, 'hardest'], [0, 'hall_of_fame']]), players: [name] });
    }
    if (!HOME.has(p.country)) {
      const wrongs = pick(countries, 3, rnd, [p.country]);
      if (wrongs.length === 3) kps.push({ knowledge_point_id: `KP-PLAYER-${p.id}-COUNTRY`, column: 'country', era: era(y), season: seasonLabel(y), category: 'Players',
        fact: p.country, wrongs, question: `Which country is ${name} from?`,
        explanation: `${name}, the No. ${p.draft_number} pick in ${y}, is from ${p.country}.`, difficulty: tierBy(y, [[2010, 'medium'], [0, 'hard']]), players: [name] });
    }
  }
  return kps;
}

// ── jersey numbers (data/jerseys.js) ─────────────────────────────
// One question per entry, in one of two forms (so the same fact is never
// asked twice): "Who wore No. 3 for the Miami Heat in 2006-07?" or "What
// number did Dwyane Wade wear for the Miami Heat in 2006-07?". Wrong answers
// come from the same franchise, nearest seasons first.
export function fromJerseys(table) {
  const kps = [];
  const slug = t => t.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();
  for (const [abbr, player, num, season] of table) {
    const id = ABBR_ID[abbr], team = teamNameIn({ id }, season), s = seasonLabel(season), rnd = rng('j' + abbr + player + season);
    const mates = table.filter(([a, p, n, y]) => a === abbr && p !== player && n !== num).sort((p, q) => Math.abs(p[3] - season) - Math.abs(q[3] - season));
    const base = { era: era(season), season: s, category: 'Jersey Numbers', team_id: abbr.toLowerCase(), teams: [team], players: [player] };
    if (hash(abbr + player + season) % 2 === 0) {
      const wrongs = pick(mates.slice(0, 6).map(m => m[1]), 3, rnd, [player]);
      if (wrongs.length === 3) kps.push({ ...base, knowledge_point_id: `KP-JERSEY-${abbr}-${num}-${season}`, column: 'player', fact: player, wrongs,
        question: `Who wore No. ${num} for the ${team} in ${s}?`, explanation: `${player} wore No. ${num} for the ${team}.`,
        difficulty: tierBy(season, [[2010, 'medium'], [1990, 'hard'], [1970, 'hardest'], [0, 'hall_of_fame']]) });
    } else {
      const nums = [...new Set(mates.map(m => m[2]))];
      while (nums.length < 6) { const n = String(Math.floor(rnd() * 56)); if (n !== num && !nums.includes(n)) nums.push(n); }
      const wrongs = pick(nums.slice(0, 6), 3, rnd, [num]).map(n => 'No. ' + n);
      kps.push({ ...base, knowledge_point_id: `KP-JERSEY-${abbr}-${slug(player)}-${season}-NUM`, column: 'number', fact: 'No. ' + num, wrongs,
        question: `What number did ${player} wear for the ${team} in ${s}?`, explanation: `${player} wore No. ${num} for the ${team}.`,
        difficulty: tierBy(season, [[2010, 'hard'], [1990, 'hardest'], [1970, 'hall_of_fame'], [0, 'goat']]) });
    }
  }
  return kps;
}
function hash(t) { let h = 2166136261 >>> 0; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }

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

// weekly-update — Supabase Edge Function (Deno).
//
// Runs on a schedule (pg_cron → public.run_weekly_update()). Each run:
//   1. fetches recent games from balldontlie into public.games
//   2. regenerates the live questions from the database: current standings,
//      last week's games and, once the Finals are over, the new champion
//   3. upserts them into public.questions (one question per fact)
//   4. retires time-sensitive questions whose window has closed
//   5. writes a row to public.sync_runs
//
// Secrets (Project Settings › Edge Functions › Secrets):
//   BALLDONTLIE_API_KEY  the balldontlie key (without it, steps 1–3 are skipped)
//   CRON_SECRET          must match the x-cron-secret header the schedule sends
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// generate.js and franchises.js are the same files as nba-trivia/data/;
// tools/deploy-function.mjs uploads them next to this file.
import { fromRegularSeason, fromRecentGames, fromPostseason, reigningChampion, gapsIn } from './generate.js';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BDL = Deno.env.get('BALLDONTLIE_API_KEY') || '';
const CRON = Deno.env.get('CRON_SECRET') || '';
const MAX_PAGES = 4;               // free plan: 5 requests a minute

const db = (path: string, init: RequestInit = {}) => fetch(`${URL_}/rest/v1/${path}`, {
  ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
async function dbJson(path: string, init: RequestInit = {}) {
  const r = await db(path, init);
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${path.split('?')[0]}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
async function selectAll(path: string) {        // PostgREST caps responses at 1,000 rows
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const page = await dbJson(path, { headers: { Range: `${from}-${from + 999}` } });
    out.push(...page); if (page.length < 1000) return out;
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function bdl(path: string) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch('https://api.balldontlie.io/v1' + path, { headers: { Authorization: BDL } });
    if (r.status === 429) { await sleep(21000); continue; }
    if (!r.ok) throw new Error(`balldontlie ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  throw new Error('balldontlie rate limit');
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const seasonFor = (d: Date) => d.getUTCMonth() >= 9 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;   // seasons start in October

// Same id scheme as the backfill (engine.js mintId), checked against the table.
function hash32(str: string) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
const idFor = (seed: string, bump = 0) => `NBA-2025-${String((hash32(seed) + bump) % 100000000).padStart(8, '0')}`;

function poolFor(text: string, kp: string) {
  if (text.length < 75) return 'buzz';
  return hash32(kp) % 2 ? 'daily' : 'q20';
}
function quality(k: any) {
  const opts = [k.fact, ...(k.wrongs || [])];
  let s = 28 + 12 + 10 + (k.question.length > 18 && k.question.length < 150 ? 14 : 6);
  s += new Set(opts.map((o: string) => o.toLowerCase())).size === 4 ? 16 : 0;
  s += k.explanation ? 10 : 2;
  return Math.min(100, s + 10);
}

Deno.serve(async req => {
  if (!CRON || req.headers.get('x-cron-secret') !== CRON) return new Response('forbidden', { status: 403 });
  const now = new Date(), today = iso(now), season = seasonFor(now);
  const result: Record<string, unknown> = { season, today };
  let run: { id: number } | null = null;
  try {
    [run] = await dbJson('sync_runs', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ source: 'weekly-update' }) });
    // ── 1. new games ───────────────────────────────────────────────
    // A failed download is recorded, and the run carries on with what the
    // database already holds (standings, retirements still happen).
    if (BDL) try {
      // Resume from the last FINISHED game: the schedule's future games are on file too.
      const [latest] = await dbJson(`games?season=eq.${season}&status=eq.Final&select=game_date&order=game_date.desc&limit=1`);
      const floor = new Date(now.getTime() - 21 * 864e5);
      const start = latest ? new Date(Math.max(Date.parse(latest.game_date) - 2 * 864e5, floor.getTime())) : floor;
      const games: any[] = []; let cursor = null, pages = 0;
      do {
        const body = await bdl(`/games?start_date=${iso(start)}&end_date=${today}&per_page=100${cursor ? '&cursor=' + cursor : ''}`);
        games.push(...body.data); cursor = body.meta?.next_cursor; pages++;
      } while (cursor && pages < MAX_PAGES);
      const teams = new Map<number, any>();
      games.forEach(g => [g.home_team, g.visitor_team].forEach((t: any) => teams.set(t.id, t)));
      if (teams.size) await dbJson('teams?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify([...teams.values()].map(t => ({ id: t.id, abbreviation: t.abbreviation, full_name: t.full_name, conference: t.conference || null, division: t.division || null }))) });
      if (games.length) await dbJson('games?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(games.map(g => ({ id: g.id, season: g.season, game_date: g.date.slice(0, 10), postseason: g.postseason, status: g.status, period: g.period,
          postponed: !!g.postponed, home_team_id: g.home_team.id, visitor_team_id: g.visitor_team.id, home_score: g.home_team_score || 0, visitor_score: g.visitor_team_score || 0, updated_at: now.toISOString() }))) });
      result.fetched = { from: iso(start), games: games.length, pages };
      await dbJson(`sync_runs?id=eq.${run!.id}`, { method: 'PATCH', body: JSON.stringify({ from_date: iso(start), through_date: today, games: games.length }) });
    } catch (e) {
      result.fetched = 'failed: ' + String(e).slice(0, 200);
      await dbJson(`sync_runs?id=eq.${run!.id}`, { method: 'PATCH', body: JSON.stringify({ error: 'download: ' + String(e).slice(0, 500) }) }).catch(() => {});
    }
    else result.fetched = 'skipped: BALLDONTLIE_API_KEY is not set';

    // ── 2. regenerate live questions from the database ───────────
    const teamRows = await selectAll('teams?select=*');
    const team = new Map(teamRows.map((t: any) => [t.id, t]));
    const shape = (g: any) => ({ id: g.id, date: g.game_date, season: g.season, postseason: g.postseason, status: g.status, period: g.period, postponed: g.postponed,
      home_team: team.get(g.home_team_id), visitor_team: team.get(g.visitor_team_id), home_team_score: g.home_score, visitor_team_score: g.visitor_score });
    const cur = (await selectAll(`games?season=eq.${season}&select=*&order=game_date`)).map(shape);
    const reg = cur.filter((g: any) => !g.postseason), post = cur.filter((g: any) => g.postseason);
    const kps: any[] = [];
    // Standings only from a full season on file (opening night onward) —
    // never from the last few weeks alone.
    const fromOpener = reg.length && reg[0].date <= `${season}-10-31`;
    if (fromOpener) kps.push(...fromRegularSeason(reg, season, { inProgress: true, asOf: today }));
    result.standings = fromOpener ? 'from opening night' : 'skipped: current season not fully loaded';
    kps.push(...fromRecentGames(cur, season, today));
    // After the Finals: the new champion, the series results and "reigning champions".
    if (post.length) {
      const { kps: p, finals } = fromPostseason(post, season);
      const finalsOver = finals && !finals.partial && Date.parse(finals.end) < now.getTime() - 864e5;
      if (finalsOver) {
        kps.push(...p, ...reigningChampion(finals, season));
        const s = finals.season, e = '2020s';
        kps.push({ knowledge_point_id: `KP-${s}-CHAMPION`, column: 'champion', era: e, season: s, category: 'Championships', fact: finals.champion,
          wrongs: [finals.runnerUp, ...finals.teams.filter((t: string) => t !== finals.champion && t !== finals.runnerUp).slice(0, 2)],
          question: `Which team won the ${s} NBA championship?`, explanation: `The ${finals.champion} beat the ${finals.runnerUp} ${finals.score} in the Finals.`, difficulty: 'easy' });
      }
    }
    const usable = kps.filter(k => k.wrongs && k.wrongs.length === 3);

    // ── 3. upsert, reusing the id a fact already has ──────────────
    const existing = new Map<string, string>(), priorStatus = new Map<string, string>();
    for (let i = 0; i < usable.length; i += 100) {
      const ids = usable.slice(i, i + 100).map(k => `"${k.knowledge_point_id}"`).join(',');
      for (const r of await dbJson(`questions?select=question_id,knowledge_point_id,status&knowledge_point_id=in.(${ids})`)) { existing.set(r.knowledge_point_id, r.question_id); priorStatus.set(r.question_id, r.status); }
    }
    const rows = [];
    for (const k of usable) {
      let id = existing.get(k.knowledge_point_id);
      for (let bump = 0; !id; bump++) {
        const cand = idFor('kp:' + k.knowledge_point_id, bump);
        const [hit] = await dbJson(`questions?select=knowledge_point_id&question_id=eq.${cand}`);
        if (!hit || hit.knowledge_point_id === k.knowledge_point_id) id = cand;
      }
      const pool = poolFor(k.question, k.knowledge_point_id), q = quality(k);
      rows.push({ question_id: id, knowledge_point_id: k.knowledge_point_id, question_text: k.question, correct_answer: k.fact, wrong_answers: k.wrongs,
        explanation: k.explanation || null, category: k.category, difficulty: k.difficulty, question_type: 'multiple_choice', pool, game_modes_allowed: [pool, 'h2h'],
        status: q >= 60 ? 'active' : 'pending', active: q >= 60, temporal: k.temporal || 'static', season: k.season, era: k.era,
        players: k.players || [], teams: k.teams || [], payload: { source_ref: { kind: 'weekly-update' } }, source_name: 'balldontlie',
        source_url: 'https://www.balldontlie.io', source_date: today, quality_score: q, valid_from: k.valid_from || null, valid_until: k.valid_until || null });
    }
    // New facts go in with their status; facts already in the bank get fresh
    // content but keep whatever an admin decided (approved / disabled).
    // A time-sensitive fact retired last week and true again now (this
    // week's standings) comes back; anything an admin disabled stays off.
    const fresh = rows.filter(r => !priorStatus.has(r.question_id));
    const revived = rows.filter(r => priorStatus.get(r.question_id) === 'outdated' && r.temporal === 'dynamic');
    const known = rows.filter(r => priorStatus.has(r.question_id) && !revived.includes(r)).map(({ status, active, ...r }) => r);
    for (const batch of [fresh, revived, known]) for (let i = 0; i < batch.length; i += 200) await dbJson('questions?on_conflict=question_id', { method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(batch.slice(i, i + 200)) });
    result.questions = { generated: kps.length, upserted: rows.length, gaps: gapsIn(cur) };

    // ── 4. retire what has gone out of date ──────────────────────
    const retired = await dbJson('rpc/retire_expired_questions', { method: 'POST', body: '{}' });
    result.retired = retired;
    await dbJson(`sync_runs?id=eq.${run!.id}`, { method: 'PATCH', body: JSON.stringify({ finished_at: new Date().toISOString(), added: rows.length, retired, notes: JSON.stringify(result) }) });
    return Response.json(result);
  } catch (e) {
    if (run) await dbJson(`sync_runs?id=eq.${run.id}`, { method: 'PATCH', body: JSON.stringify({ finished_at: new Date().toISOString(), error: String(e).slice(0, 1000), notes: JSON.stringify(result) }) }).catch(() => {});
    return Response.json({ ...result, error: String(e) }, { status: 500 });
  }
});

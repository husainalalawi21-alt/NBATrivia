// cloud.js — every call the app makes to Supabase, in one place.
//
// Uses the vendored supabase-js (vendor/supabase.js, loaded as a classic
// script, so it is window.supabase). Every function fails soft: callers get
// null / [] / an { error } instead of an exception, so the game keeps
// working offline with the built-in bank and on-device storage.
import { SUPABASE_URL, SUPABASE_KEY, PROVIDERS } from './config.js';

const sb = window.supabase && SUPABASE_URL ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;
export const online = () => !!sb;
export const providerEnabled = p => !!PROVIDERS[p];

const msg = e => (e && (e.message || e.error_description || String(e))) || 'Something went wrong';

// ── auth ───────────────────────────────────────────────────────────
export async function currentUser() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session ? data.session.user : null;
}
export async function signUp(email, password) {
  if (!sb) return { error: 'Offline — try again when you have a connection' };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { error: friendly(error) };
  // With "Confirm email" on, Supabase returns a user but no session yet.
  return { user: data.user, needsConfirm: !data.session };
}
export async function signIn(email, password) {
  if (!sb) return { error: 'Offline — try again when you have a connection' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error) };
  return { user: data.user };
}
export async function signInWith(provider) {
  if (!sb || !providerEnabled(provider)) return { error: `${provider === 'apple' ? 'Apple' : 'Google'} sign-in is coming soon — use email for now.` };
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.href.split('#')[0] } });
  return error ? { error: friendly(error) } : {};
}
export async function signOut() { if (sb) await sb.auth.signOut(); }
function friendly(e) {
  const m = msg(e);
  if (/already registered|already been registered/i.test(m)) return 'That email already has an account — sign in instead';
  if (/invalid login credentials/i.test(m)) return 'Wrong email or password';
  if (/email not confirmed/i.test(m)) return 'Confirm your email first — check your inbox for the link';
  if (/rate limit/i.test(m)) return 'Too many attempts — wait a minute and try again';
  return m;
}

// ── profile ────────────────────────────────────────────────────────
export async function loadProfile(uid) {
  if (!sb) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
  return data || null;
}
export async function usernameTaken(name, myId) {
  if (!sb || !name) return false;
  const { data } = await sb.from('profiles').select('id').ilike('username', name).limit(1);
  return !!(data && data.length && data[0].id !== myId);
}
// The game's full stat block lives in `stats`; the columns beside it are the
// ones other screens (leaderboards, admin) read directly.
export async function saveProfile(uid, { username, favoriteTeam, stats }) {
  if (!sb || !uid) return { error: 'offline' };
  const row = { id: uid, updated_at: new Date().toISOString() };
  if (username !== undefined) row.username = username;
  if (favoriteTeam !== undefined) row.favorite_team = favoriteTeam;
  if (stats) Object.assign(row, {
    stats, games: stats.games || 0, total_q: stats.totalQ || 0, total_correct: stats.totalCorrect || 0,
    best_streak: stats.bestStreak || 0, team_best: stats.teamBest || 0, team_correct: stats.teamCorrect || 0,
    mystery_solved: stats.mysterySolved || 0, badges: stats.badges || [] });
  const { error } = await sb.from('profiles').upsert(row);
  if (error) return { error: /duplicate key|unique/i.test(msg(error)) ? 'Already taken' : msg(error) };
  return {};
}

// ── question bank ──────────────────────────────────────────────────
// Database rows → the record shape engine.js works with.
const toRecord = q => ({
  question_id: q.question_id, knowledge_point_id: q.knowledge_point_id, question_text: q.question_text,
  question_type: q.question_type, answers: [q.correct_answer, ...(q.wrong_answers || [])], correct_answer: q.correct_answer,
  explanation: q.explanation, difficulty: q.difficulty, category: q.category, subcategory: q.era || q.subcategory,
  pool: q.pool, game_modes_allowed: q.game_modes_allowed || [], status: q.status, active: q.active, temporal: q.temporal,
  valid_from: q.valid_from, valid_until: q.valid_until, season: q.season, team_id: q.team_id,
  teams: q.teams || [], players: q.players || [], quality_score: q.quality_score,
  source_name: q.source_name, source_url: q.source_url, source_date: q.source_date,
  person: q.payload && q.payload.person, clues: q.payload && q.payload.clues,
  usage_count: 0, duplicate_warnings: [] });
export async function loadQuestions() {
  if (!sb) return null;
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('questions').select('*').order('question_id').range(from, from + 999);
    if (error) return out.length ? out.map(toRecord) : null;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out.map(toRecord);
}
export async function setQuestionStatus(id, status) {
  if (!sb) return { error: 'offline' };
  const { data, error } = await sb.from('questions').update({ status, active: status === 'active', updated_at: new Date().toISOString() }).eq('question_id', id).select('question_id');
  if (error) return { error: msg(error) };
  return data && data.length ? {} : { error: 'Only admins can change questions' };
}

// ── what a player has seen and how each game went ─────────────────
export async function loadHistory(uid) {
  if (!sb || !uid) return [];
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('question_history').select('question_id, mode, correct, answered_at').eq('user_id', uid).order('answered_at').range(from, from + 999);
    if (error || !data) break;
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
}
export async function recordRun(uid, run) {
  if (!sb || !uid) return;
  await sb.from('runs').insert({ user_id: uid, mode: run.challenge ? 'h2h' : run.mode, team_id: run.teamId || null,
    score: run.score || 0, best: run.best || 0, answers: run.answers || 0, correct: run.correct || 0 });
  const rows = run.log.filter(x => x.qid).map(x => ({ user_id: uid, question_id: x.qid, mode: run.mode, correct: !!x.ok, ms: x.ms == null ? null : Math.round(x.ms) }));
  if (rows.length) await sb.from('question_history').insert(rows);
}

// ── leaderboards ───────────────────────────────────────────────────
export async function leaderboard(period = 'today', team = null, limit = 50) {
  if (!sb) return [];
  const { data } = await sb.rpc('leaderboard', { p_period: period, p_team: team, p_limit: limit });
  return data || [];
}

// ── head to head ───────────────────────────────────────────────────
export async function createChallenge(row) {
  if (!sb) return { error: 'offline' };
  for (let i = 0; i < 4; i++) {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = 'NBA';
    for (let k = 0; k < 4; k++) code += c[Math.floor(Math.random() * c.length)];
    const { data, error } = await sb.from('challenges').insert({ ...row, code }).select().single();
    if (!error) return { challenge: data };
    if (!/duplicate key/i.test(msg(error))) return { error: msg(error) };
  }
  return { error: 'Could not create a code — try again' };
}
export async function challengeByCode(code) {
  if (!sb) return { error: 'offline' };
  const { data, error } = await sb.from('challenges').select('*').eq('code', code).maybeSingle();
  if (error) return { error: msg(error) };
  return data ? { challenge: data } : { error: 'No battle with that code' };
}
export async function myChallenges(uid) {
  if (!sb || !uid) return [];
  const { data } = await sb.from('challenges').select('*').or(`creator_id.eq.${uid},opponent_id.eq.${uid}`).order('created_at', { ascending: false }).limit(50);
  return data || [];
}
export async function completeChallenge(code, score, stat) {
  if (!sb) return { error: 'offline' };
  const { data, error } = await sb.rpc('complete_challenge', { p_code: code, p_score: score, p_stat: stat });
  return error ? { error: msg(error) } : { challenge: data };
}
export async function usernamesFor(ids) {
  if (!sb || !ids.length) return {};
  const { data } = await sb.from('profiles').select('id, username').in('id', [...new Set(ids)]);
  return Object.fromEntries((data || []).map(r => [r.id, r.username]));
}

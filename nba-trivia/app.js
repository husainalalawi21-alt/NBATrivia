// app.js — NBA TRIVIA ("20-0"), the mobile trivia app.
// Screen logic ported from the "20-0 v2" design. renderVals() returns every
// value and handler the markup in index.html reads; dc.js draws it.
import { Logic } from './dc.js';
import * as cloud from './cloud.js';

export class App extends Logic {
  state = {
    screen: 'welcome', reg: false, lib: null, mys: null, teams: null,
    profile: null, account: null, guest: false, pending: null,
    authMode: 'register', authEmail: '', authPass: '', authErrs: [], unameDraft: '',
    teamDraft: null, teamSearch: '', teamCat: 'All', hubFrom: 'home',
    run: null, qVisible: true, gain: null, milestone: null, displayScore: 0,
    scope: 'Global', period: 'Today',
    challenges: [], activeChallenge: null, h2hCode: '', h2hError: '',
    copied: false, newBadges: [], sound: false, poolExhausted: false,
    adminQ: '', adminStatus: 'All', adminMode: 'All', adminDiff: 'All', adminSel: null,
    // live data
    user: null, isAdmin: false, busy: false, unameTakenFor: '', board: [], boardLoading: false,
    ranks: { global: null, team: null }, adminMsg: '', online: false
  };
  PKEY = 'v2_profile'; AKEY = 'v2_account'; CKEY = 'v2_challenges';
  BADGES = [
    ['first', 'First Blood', 'Reach a 10 streak', p => (p.bestStreak || 0) >= 10],
    ['fire', 'On Fire', 'Reach a 25 streak', p => (p.bestStreak || 0) >= 25],
    ['unstop', 'Unstoppable', 'Reach a 50 streak', p => (p.bestStreak || 0) >= 50],
    ['ency', 'Encyclopedia', 'Reach a 100 streak', p => (p.bestStreak || 0) >= 100],
    ['teamx', 'Team Expert', '100 team questions right', p => (p.teamCorrect || 0) >= 100],
    ['ball', 'Knows Ball', 'Answer 500 questions', p => (p.totalQ || 0) >= 500],
    ['legend', 'Legend', 'Answer 1,000 questions', p => (p.totalQ || 0) >= 1000],
    ['sharp', 'Quick Draw', '10 answers under 3 seconds', p => (p.fast || 0) >= 10],
    ['mystic', 'Detective', 'Solve 10 career mysteries', p => (p.mysterySolved || 0) >= 10],
    ['duel', 'Duelist', 'Win a head-to-head battle', p => (p.h2hWins || 0) >= 1]
  ];
  RESERVED = ['admin', 'nba', 'support', 'official', 'root'];
  Q_LIMIT = 24000; BUZZ_START = 24000; BUZZ_CAP = 30000; BUZZ_PENALTY = 3000;
  WAI_POINTS = [1000, 800, 600, 400, 200];

  async componentDidMount() {
    const [lib, mys, teams, eng, facts] = await Promise.all([import('./data/questions.js'), import('./data/mystery.js'), import('./data/teams.js'), import('./data/engine.js'), import('./data/facts.js')]);
    // The live bank from Supabase; the built-in one if the device is offline.
    const [live, user] = await Promise.all([cloud.loadQuestions(), cloud.currentUser()]);
    if (live && live.length) eng.setBank(live);
    else { eng.buildBank({ questions: lib, mystery: mys, teams, facts }); eng.hydrateOverrides(); eng.refreshTemporal(); }
    this.eng = eng;
    const profile = this.localProfile(null);
    // (No screen change here: a player who already tapped ahead stays where they are.)
    this.setState({ lib, mys, teams, eng, profile, account: null, challenges: [], online: !!(live && live.length), teamDraft: profile.favoriteTeam });
    if (user) await this.signedIn(user);
    // A shared challenge link (…?c=NBA7X92) opens that battle.
    const code = new URLSearchParams(location.search).get('c');
    if (code) this.redeem(code.toUpperCase());
    if (this._startWhenReady) { const [m, o] = this._startWhenReady; this._startWhenReady = null; this.startRun(m, o); }
    this.refreshRanks();
    this._clock = setInterval(() => { const r = this.state.run; if (this.state.screen === 'game' && r && r.answered === null) this.tick(); }, 60);
  }
  componentWillUnmount() { clearInterval(this._clock); clearInterval(this._count); }

  fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  // Stats live on the device for guests and in the player's profile row once
  // signed in (cached on the device so the app opens instantly).
  profileKey(uid) { return uid ? this.PKEY + ':' + uid : this.PKEY; }
  localProfile(uid, fromServer) {
    let p = null; try { p = JSON.parse(localStorage.getItem(this.profileKey(uid))); } catch (e) {}
    const base = { games: 0, totalQ: 0, totalCorrect: 0, totalMs: 0, bestStreak: 0, lastStreak: null, fast: 0, teamCorrect: 0, teamBest: 0, mysterySolved: 0, h2hWins: 0, badges: [], records: {}, catCorrect: {}, favoriteTeam: null };
    // The server copy wins unless this device has seen more games.
    const server = fromServer && Object.keys(fromServer).length ? fromServer : null;
    return Object.assign(base, server && (!p || (server.games || 0) >= (p.games || 0)) ? server : (p || {}));
  }
  save(p) {
    const uid = this.state.user && this.state.user.id;
    this.setState({ profile: p });
    try { localStorage.setItem(this.profileKey(uid), JSON.stringify(p)); } catch (e) {}
    if (uid && this.state.account) cloud.saveProfile(uid, { stats: p });
  }
  saveAccount(a) {
    this.setState({ account: a });
    const uid = this.state.user && this.state.user.id;
    if (uid && a) cloud.saveProfile(uid, { favoriteTeam: a.favoriteTeam || null });
  }
  // After any sign-in: profile, answer history, battles and ranks from the server.
  async signedIn(user) {
    const row = await cloud.loadProfile(user.id);
    this.eng.useHistoryOf(user.id);
    this.eng.mergeHistory(await cloud.loadHistory(user.id));
    const profile = this.localProfile(user.id, row && row.stats);
    if (row && row.favorite_team) profile.favoriteTeam = row.favorite_team;
    // A team picked just before the app closed may not have reached the server.
    else if (row && profile.favoriteTeam) { row.favorite_team = profile.favoriteTeam; cloud.saveProfile(user.id, { favoriteTeam: profile.favoriteTeam }); }
    const account = row ? { username: row.username, email: user.email, provider: (user.app_metadata || {}).provider || 'email', favoriteTeam: row.favorite_team || null } : null;
    this.setState({ user, account, profile, isAdmin: !!(row && row.is_admin), guest: false, unameDraft: account ? account.username : '', teamDraft: profile.favoriteTeam,
      screen: account ? 'home' : 'username', reg: !account });
    // Admins also see pending, disabled and retired questions.
    if (row && row.is_admin) { const all = await cloud.loadQuestions(); if (all && all.length) { this.eng.setBank(all); this.forceUpdate(); } }
    this.refreshChallenges(); this.refreshRanks();
  }
  async refreshRanks() {
    const uid = this.state.user && this.state.user.id; if (!uid) return this.setState({ ranks: { global: null, team: null } });
    const tid = this.teamId();
    const [g, t] = await Promise.all([cloud.leaderboard('all', null, 1000), tid ? cloud.leaderboard('all', tid, 1000) : Promise.resolve([])]);
    const mine = list => { const r = list.find(x => x.user_id === uid); return r ? Number(r.rank) : null; };
    this.setState({ ranks: { global: mine(g), team: mine(t) } });
  }
  async refreshBoard() {
    const s = this.state;
    if (s.scope === 'Friends') return this.setState({ board: [], boardLoading: false });
    const period = { 'Today': 'today', 'Week': 'week', 'All time': 'all' }[s.period] || 'today';
    const team = s.scope === 'Your Team' ? this.teamId() : null;
    if (s.scope === 'Your Team' && !team) return this.setState({ board: [], boardLoading: false });
    this.setState({ boardLoading: true });
    const key = s.scope + s.period, rows = await cloud.leaderboard(period, team, 50);
    if (this.state.scope + this.state.period === key) this.setState({ board: rows, boardLoading: false });
  }
  teamId() { const s = this.state; return (s.account && s.account.favoriteTeam) || (s.profile && s.profile.favoriteTeam) || null; }
  team() { const id = this.teamId(); return id && this.state.teams ? this.state.teams.teamById(id) : null; }
  beep(f, d, type = 'square', vol = .07) {
    if (!this.state.sound) return;
    try { const ac = this._ac || (this._ac = new (window.AudioContext || window.webkitAudioContext)()); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch (e) {}
  }
  buzz(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

  // ── accounts ──
  unameCheck(v) {
    v = String(v || '').trim();
    if (!v) return { ok: false, msg: 'Letters, numbers and underscores. 3–20 characters.' };
    if (v.length < 3 || v.length > 20) return { ok: false, msg: 'Must be 3–20 characters' };
    if (!/^[A-Za-z0-9_]+$/.test(v)) return { ok: false, msg: 'Letters, numbers and underscores only' };
    const low = v.toLowerCase();
    if (this.RESERVED.includes(low)) return { ok: false, msg: "That one's reserved" };
    if (this.state.unameTakenFor === low) return { ok: false, msg: 'Already taken' };
    return { ok: true, msg: 'Available' };
  }
  async startSocial(provider) {
    const res = await cloud.signInWith(provider);   // redirects away when the provider is set up
    if (res.error) this.setState({ screen: 'auth', authMode: 'register', authErrs: [res.error] });
  }
  async submitEmailAuth() {
    const { authEmail, authPass, authMode, busy } = this.state, errs = [];
    if (busy) return;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(authEmail)) errs.push('Enter a valid email address');
    if ((authPass || '').length < 8) errs.push('Password must be at least 8 characters');
    if (errs.length) return this.setState({ authErrs: errs });
    this.setState({ busy: true, authErrs: [] });
    const res = authMode === 'signin' ? await cloud.signIn(authEmail.trim(), authPass) : await cloud.signUp(authEmail.trim(), authPass);
    this.setState({ busy: false });
    if (res.error) return this.setState({ authErrs: [res.error] });
    if (res.needsConfirm) return this.setState({ authMode: 'signin', authErrs: ['Almost there — open the link we emailed you, then sign in here.'] });
    this.setState({ authPass: '' });
    await this.signedIn(res.user);
  }
  async claimUsername() {
    const name = this.state.unameDraft.trim(), uid = this.state.user && this.state.user.id;
    if (!this.unameCheck(name).ok || this.state.busy) return;
    if (!uid) return this.setState({ screen: 'welcome', reg: true });
    this.setState({ busy: true });
    if (await cloud.usernameTaken(name, uid)) return this.setState({ busy: false, unameTakenFor: name.toLowerCase() });
    const prev = this.state.account, team = (prev && prev.favoriteTeam) || this.state.profile.favoriteTeam || null;
    const res = await cloud.saveProfile(uid, { username: name, favoriteTeam: team, stats: this.state.profile });
    this.setState({ busy: false });
    if (res.error) return this.setState({ unameTakenFor: res.error === 'Already taken' ? name.toLowerCase() : '' });
    const acct = { username: name, email: this.state.user.email, provider: prev ? prev.provider : 'email', favoriteTeam: team };
    this.setState({ account: acct });
    this.setState({ screen: this.state.reg && !team ? 'teampick' : (this.state.reg ? 'ready' : 'profile'), pending: null, teamDraft: team });
    this.refreshRanks();
  }
  checkUsernameSoon(v) {
    clearTimeout(this._unameT);
    const low = String(v || '').trim().toLowerCase(); if (low.length < 3) return;
    this._unameT = setTimeout(async () => {
      const taken = await cloud.usernameTaken(low, this.state.user && this.state.user.id);
      if (this.state.unameDraft.trim().toLowerCase() === low) this.setState({ unameTakenFor: taken ? low : '' });
    }, 350);
  }

  // ── engine ──
  // Every mode is a view over the one bank: build a session, then pull from
  // the engine. Session + global history dedupe are the engine's job.
  startRun(mode, opts = {}) {
    const eng = this.eng;
    // Tapped before the bank finished loading: start as soon as it has.
    if (!eng) { this._startWhenReady = [mode, opts]; return; }
    const teamId = mode === 'team' ? this.teamId() : null;
    if (mode === 'team' && !teamId) return this.setState({ screen: 'teampick', reg: false, hubFrom: 'home' });
    const dateKey = new Date().toISOString().slice(0, 10);
    const seed = opts.challenge ? opts.challenge.seed : (mode === 'daily' ? 'daily-' + dateKey : 'r' + Math.random().toString(36).slice(2, 10));
    // All multiple-choice modes share one bank; the mode sets the difficulty ramp.
    const poolMode = mode;
    const session = eng.newSession({ mode: poolMode, teamId, category: opts.cat || 'All', seed: mode === 'daily' || opts.challenge ? seed : null });
    const run = { mode, teamId, seed, session, challenge: opts.challenge || null, cat: opts.cat || 'All',
      idx: 0, answered: null, score: 0, streak: 0, best: 0, correct: 0, answers: 0, log: [],
      time: this.BUZZ_START, qStart: Date.now(), started: Date.now(), fastest: null,
      clueIdx: 0, phase: 'idle', guess: '', wrongOpts: [], wrongCount: 0 };
    if (mode === 'daily') run.qs = eng.buildDaily(dateKey, session, 10);
    // A challenge plays the challenger's list, minus anything this player has already seen.
    else if (opts.challenge) run.qs = (opts.challenge.questionIds || []).map(id => eng.byId(id)).filter(Boolean).filter(rec => !eng.inExclusion(rec.question_id)).map(rec => eng.serve(rec, session.rnd));
    else if (mode === 'q20') run.qs = eng.buildSet(session, 20, eng.Q20_SPREAD);
    else if (mode === 'wai') run.qs = eng.buildSet(session, 20, eng.TIER_ORDER);
    run.q = this.nextQ(run);
    // Nothing unseen left: say so — questions are never repeated.
    if (!run.q) return this.setState({ screen: 'play', poolExhausted: true, exhaustedMsg:
      mode === 'daily' ? "You've played today's Daily Challenge. A new set unlocks tomorrow."
      : opts.challenge ? "You've already seen every question in this battle — challenge someone to a new one."
      : "You've answered every question in this mode. New ones are added every week — try another mode meanwhile." });
    this.setState({ screen: 'game', run, qVisible: true, gain: null, milestone: null, newBadges: [], poolExhausted: false });
  }
  nextQ(run) {
    const eng = this.eng;
    if (run.qs) return run.qs[run.idx] || null;
    run.session.accuracy = run.answers ? run.correct / run.answers : null;
    return eng.nextQuestion(run.session, { progress: run.mode === 'buzz' ? run.answers : run.streak, favoriteTeam: (this.team() || {}).name });
  }
  tick() {
    const r = this.state.run, limit = r.mode === 'q20' || r.mode === 'daily' ? 10000 : this.Q_LIMIT;
    if (r.mode === 'buzz') { if (r.time - (Date.now() - r.qStart) <= 0) return this.endRun({ ...r, time: 0 }); this.forceUpdate(); return; }
    if (Date.now() - r.qStart >= limit) return r.mode === 'wai' ? this.waiOut(true) : this.answer('__timeout');
    this.forceUpdate();
  }
  answer(opt) {
    const r = this.state.run, lib = this.state.lib; if (!r || r.answered !== null) return;
    const q = r.q, ms = Math.min(r.mode === 'buzz' ? 99999 : this.Q_LIMIT, Date.now() - r.qStart), ok = opt === q.correct;
    let pts = 0, time = r.time, extra = null;
    if (r.mode === 'buzz') {
      time = r.time - ms;
      if (ok) { const b = lib.timeBonus(ms); time = Math.min(this.BUZZ_CAP, time + b * 1000); pts = 100 + lib.buzzSpeedPts(ms); extra = b ? `+${b} SEC` : null; }
      else { time -= this.BUZZ_PENALTY; extra = '−3 SEC'; }
    } else if (ok) pts = Math.round(100 * lib.streakMult(r.streak));
    const streak = ok ? r.streak + 1 : 0;
    const log = [...r.log, { qid: q.question_id, q: q.text, type: q.type, cat: q.cat, chosen: opt, correct: q.correct, ok, ms, pts, exp: q.exp }];
    const next = { ...r, answered: opt, time, score: r.score + pts, streak, best: Math.max(r.best, streak), correct: r.correct + (ok ? 1 : 0), answers: r.answers + 1, log, fastest: ok && (r.fastest == null || ms < r.fastest) ? ms : r.fastest };
    this.eng.recordAnswer(q.question_id, { correct: ok, ms, mode: r.mode });
    if (ok) { this.beep(700, .06); setTimeout(() => this.beep(1050, .09), 60); this.buzz(18); } else { this.beep(130, .3, 'sawtooth', .09); this.buzz([55, 40, 55]); }
    const mile = ok ? lib.MILESTONES.find(([n]) => n === streak) : null;
    this.setState({ run: next, gain: ok ? { pts: '+' + pts, extra } : (extra ? { pts: '', extra } : null), milestone: mile || null });
    if (r.mode === 'buzz' && next.time <= 0) return setTimeout(() => this.endRun(next), 700);
    if ((r.mode === 'streak' || r.mode === 'team') && !ok) return setTimeout(() => this.endRun(next), 1600);
    const last = (r.mode === 'q20' || r.mode === 'daily') && r.idx + 1 >= r.qs.length;
    setTimeout(() => last ? this.endRun(next) : this.advance(next), ok ? 560 : 1500);
  }
  advance(r) {
    const nx = { ...r, idx: r.idx + 1, answered: null, qStart: Date.now() + 40, clueIdx: 0, phase: 'idle', guess: '', wrongOpts: [], wrongCount: 0 };
    this.setState({ qVisible: false, gain: null, milestone: null });
    setTimeout(() => {
      nx.q = this.nextQ(nx);
      // Out of eligible questions: end the run honestly rather than render a blank.
      if (!nx.q) return this.endRun({ ...nx, exhausted: true });
      this.setState({ run: nx, qVisible: true });
    }, 40);
  }
  // Who Am I?
  nextClue() { const r = this.state.run; if (r.phase !== 'idle' || r.clueIdx + 1 >= r.q.clues.length) return; this.beep(540, .05, 'sine', .04); this.setState({ run: { ...r, clueIdx: r.clueIdx + 1, locked: false } }); }
  waiGuess(text) {
    const r = this.state.run, mys = this.state.mys; if (r.phase !== 'guess') return;
    const q = r.q, ok = mys.matches(text, q);
    if (ok) {
      const pts = this.WAI_POINTS[r.clueIdx] || 200;
      this.eng.recordAnswer(q.question_id, { correct: true, ms: Date.now() - r.qStart, mode: 'wai' });
      const log = [...r.log, { qid: q.question_id, q: 'Who am I? — ' + q.name, ok: true, pts, ms: Date.now() - r.qStart, clue: r.clueIdx + 1, correct: q.name, exp: `Solved on clue ${r.clueIdx + 1}.` }];
      const next = { ...r, phase: 'done', answered: text, score: r.score + pts, correct: r.correct + 1, answers: r.answers + 1, streak: r.streak + 1, best: Math.max(r.best, r.streak + 1), log };
      this.beep(700, .06); setTimeout(() => this.beep(1050, .1), 60); this.buzz(18);
      this.setState({ run: next, gain: { pts: '+' + this.fmt(pts), extra: null } });
      setTimeout(() => r.idx + 1 >= r.qs.length ? this.endRun(next) : this.advance(next), 1500);
      return;
    }
    const lastClue = r.clueIdx + 1 >= q.clues.length;
    this.beep(130, .28, 'sawtooth', .09); this.buzz([55, 40, 55]);
    if (lastClue) return this.waiOut(false, text);
    this.setState({ run: { ...r, phase: 'idle', locked: true, guess: '', score: Math.max(0, r.score - 150), wrongOpts: [...r.wrongOpts, text], wrongCount: r.wrongCount + 1 }, gain: { pts: '−150', extra: null } });
    setTimeout(() => this.setState({ gain: null }), 1000);
  }
  waiOut(timeout, guess) {
    const r = this.state.run, q = r.q;
    this.eng.recordAnswer(q.question_id, { correct: false, ms: Date.now() - r.qStart, mode: 'wai' });
    const log = [...r.log, { qid: q.question_id, q: 'Who am I? — ' + q.name, ok: false, pts: 0, ms: Date.now() - r.qStart, correct: q.name, exp: timeout ? 'Time ran out.' : 'Out of clues.' }];
    const next = { ...r, phase: 'done', answered: guess || '__timeout', answers: r.answers + 1, streak: 0, log };
    this.setState({ run: next, gain: null });
    setTimeout(() => r.idx + 1 >= r.qs.length ? this.endRun(next) : this.advance(next), 1800);
  }

  endRun(r) {
    const lib = this.state.lib, p = { ...this.state.profile };
    const acc = r.answers ? Math.round(r.correct / r.answers * 100) : 0;
    const key = r.mode === 'team' ? 'team' : r.mode;
    const rec = { ...(p.records || {}) }, prev = rec[key] || { score: 0, best: 0, answers: 0 };
    const metric = (r.mode === 'buzz' || r.mode === 'q20' || r.mode === 'daily' || r.mode === 'wai') ? r.score : r.best;
    const prevMetric = (r.mode === 'buzz' || r.mode === 'q20' || r.mode === 'daily' || r.mode === 'wai') ? prev.score : prev.best;
    const isRecord = metric > prevMetric && p.games > 0;
    rec[key] = { score: Math.max(prev.score, r.score), best: Math.max(prev.best, r.best), answers: Math.max(prev.answers, r.answers) };
    p.records = rec; p.games++; p.totalQ += r.answers; p.totalCorrect += r.correct;
    p.totalMs += r.log.reduce((a, x) => a + (x.ms || 0), 0);
    p.bestStreak = Math.max(p.bestStreak || 0, r.best);
    p.fast += r.log.filter(x => x.ok && x.ms != null && x.ms < 3000).length;
    if (r.mode === 'streak') p.lastStreak = r.best;
    if (r.mode === 'team') { p.teamCorrect = (p.teamCorrect || 0) + r.correct; p.teamBest = Math.max(p.teamBest || 0, r.best); }
    if (r.mode === 'wai') { p.mysterySolved = (p.mysterySolved || 0) + r.correct; p.lastWai = r.correct; }
    p.catCorrect = { ...(p.catCorrect || {}) }; r.log.forEach(x => { if (x.ok && x.cat) p.catCorrect[x.cat] = (p.catCorrect[x.cat] || 0) + 1; });
    const held = p.badges || [];
    const newBadges = this.BADGES.filter(([k, , , test]) => test(p) && !held.includes(k)).map(([, n]) => n);
    p.badges = this.BADGES.filter(([k, , , test]) => test(p) || held.includes(k)).map(([k]) => k);
    p.recentBadges = newBadges.length ? newBadges : p.recentBadges;
    this.save(p);
    this.beep(170, .45, 'triangle', .08);
    const done = { ...r, acc, isRecord, prevBest: prevMetric, survived: Math.round((Date.now() - (r.started || r.qStart)) / 1000) };
    const uid = this.state.user && this.state.user.id;
    if (uid && this.state.account) cloud.recordRun(uid, done).then(() => this.refreshRanks());
    if (r.challenge) { this.setState({ run: done }); return this.completeChallenge(done); }
    this.setState({ screen: 'result', run: done, newBadges, displayScore: 0, copied: false });
    clearInterval(this._count); const t0 = Date.now();
    this._count = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / 1100), e = 1 - Math.pow(1 - k, 3); this.setState({ displayScore: Math.round(r.score * e) }); if (k >= 1) clearInterval(this._count); }, 30);
  }

  // ── challenges ──
  // A database row → what the screens show. `result` is from the viewer's
  // side: the server stores it from the challenger's (the opponent's) side.
  toChallenge(c, names = {}) {
    const uid = this.state.user && this.state.user.id, out = c.creator_id === uid;
    const flip = { won: 'lost', lost: 'won', tied: 'tied' };
    return { code: c.code, creator: names[c.creator_id] || 'player', opponent: c.opponent_id ? (names[c.opponent_id] || 'player') : null,
      mode: c.mode, teamId: c.team_id, seed: c.seed, questionIds: c.question_ids || [], creatorScore: c.creator_score, creatorStat: c.creator_stat,
      opponentScore: c.opponent_score, opponentStat: c.opponent_stat, status: c.status, dir: out ? 'out' : 'in',
      result: c.result ? (out ? flip[c.result] : c.result) : null, createdAt: Date.parse(c.created_at), expiresAt: Date.parse(c.expires_at) };
  }
  async refreshChallenges() {
    const uid = this.state.user && this.state.user.id; if (!uid) return this.setState({ challenges: [] });
    const rows = await cloud.myChallenges(uid);
    const names = await cloud.usernamesFor(rows.flatMap(c => [c.creator_id, c.opponent_id]).filter(Boolean));
    this.setState({ challenges: rows.map(c => this.toChallenge(c, names)) });
  }
  async redeem(code) {
    if (!this.state.user) return this.setState({ screen: 'welcome', reg: true, h2hError: '' });
    const res = await cloud.challengeByCode(code);
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    const c = res.challenge;
    if (c.creator_id === this.state.user.id) return this.setState({ screen: 'h2h', h2hError: "That's your own battle — send the code to a friend" });
    if (c.status === 'completed') return this.setState({ screen: 'h2h', h2hError: 'Already played' });
    if (Date.parse(c.expires_at) < Date.now()) return this.setState({ screen: 'h2h', h2hError: 'This battle has expired' });
    const names = await cloud.usernamesFor([c.creator_id]);
    this.setState({ screen: 'h2h-intro', activeChallenge: this.toChallenge(c, names), h2hError: '' });
  }
  async createChallenge(r) {
    const uid = this.state.user && this.state.user.id; if (!uid || !this.state.account) return this.setState({ screen: 'welcome', reg: true });
    // The challenger's exact questions, then spares from the same pool so
    // the opponent can go further than the challenger did.
    const ids = r.log.map(x => x.qid).filter(Boolean);
    const poolMode = r.mode;
    const spares = this.eng.shuffle(this.eng.eligible({ mode: poolMode, teamId: r.teamId, sessionUsed: new Set(ids), ignoreHistory: true })).slice(0, 30).map(x => x.question_id);
    this.setState({ busy: true });
    const res = await cloud.createChallenge({ creator_id: uid, mode: r.mode, team_id: r.teamId || null, seed: r.seed, question_ids: [...ids, ...spares],
      creator_score: r.score, creator_stat: r.mode === 'buzz' ? r.answers : r.best });
    this.setState({ busy: false });
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    this.setState({ screen: 'h2h-made', activeChallenge: this.toChallenge(res.challenge, { [uid]: this.state.account.username }), copied: false });
    this.refreshChallenges();
  }
  async completeChallenge(r) {
    const ch = r.challenge;
    const res = await cloud.completeChallenge(ch.code, r.score, r.best);
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    const names = await cloud.usernamesFor([res.challenge.creator_id, res.challenge.opponent_id]);
    const done = this.toChallenge(res.challenge, names);
    if (done.result === 'won') { const p = { ...this.state.profile, h2hWins: (this.state.profile.h2hWins || 0) + 1 }; this.save(p); }
    this.setState({ screen: 'h2h-result', activeChallenge: done, copied: false });
    this.refreshChallenges();
  }
  // Screens that show live data fetch it when you open them.
  onEnter(screen) {
    if (screen !== 'play' && this.state.poolExhausted) this.setState({ poolExhausted: false });
    if (screen === 'board') this.refreshBoard();
    if (screen === 'h2h' || screen === 'profile') this.refreshChallenges();
    if (screen === 'home') this.refreshRanks();
  }
  challengeLink(code) { return `${location.origin}${location.pathname}?c=${code}`; }
  shareText() {
    const r = this.state.run, url = this.props.shareUrl ?? '20-0.app', name = this.props.appName ?? 'NBA TRIVIA';
    const a = this.state.account, who = a ? '@' + a.username : 'I';
    if (!r) return `${name} — ${url}`;
    if (r.mode === 'buzz') return `${name}\n${who} survived ${r.answers} questions for ${this.fmt(r.score)}. "I know ball."\nBeat me: ${url}`;
    return `${name}\n🔥 ${r.best} STREAK — ${who}. "I know ball."\nBeat me: ${url}`;
  }

  // ── leaderboard ──
  rows() {
    const s = this.state, T = s.teams; if (!T || s.scope === 'Friends') return [];
    const uid = s.user && s.user.id;
    return (s.board || []).map((b, i) => {
      const rank = Number(b.rank), top = rank <= 3, tm = b.favorite_team ? T.teamById(b.favorite_team) : null;
      const r = { name: '@' + b.username, me: b.user_id === uid };
      return { rank: String(rank).padStart(2, '0'), name: r.name, initial: String(b.username).slice(0, 1).toUpperCase(), team: tm ? T.fullName(tm) : '', value: b.value, me: r.me,
        rowStyle: `display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-divider);${r.me ? 'background:var(--color-accent-900)' : top ? 'background:var(--color-surface)' : ''}`,
        rankStyle: `font-family:var(--font-heading);font-weight:800;font-size:${top ? 22 : 16}px;letter-spacing:-0.03em;color:${top ? 'var(--color-accent)' : 'var(--color-neutral-500)'}`,
        avatarStyle: `width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:14px;background:${top ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${top ? '#120800' : 'var(--color-neutral-300)'}`,
        valueStyle: `font-family:var(--font-heading);font-weight:800;font-size:${top ? 24 : 20}px;letter-spacing:-0.03em;color:${top ? 'var(--color-accent)' : 'var(--color-text)'}` };
    });
  }

  adminVals() {
    const s = this.state, eng = this.eng;
    if (!eng || s.screen !== 'admin') return { atAdmin: s.screen === 'admin', bankTotals: [], poolRows: [], adminRows: [], retentionOpts: [], statusOpts: [], modeOpts: [], diffOpts: [], chPools: [], chMix: [], chEras: [], goAdmin: () => this.setState({ screen: 'admin' }), goProfileFromAdmin: () => this.setState({ screen: 'profile' }) };
    const sum = eng.bankSummary(), cfg = eng.getConfig(), ch = eng.contentHealth();
    const poolLabel = { buzz: 'Buzz', daily: 'Daily Challenge', q20: '20 Questions', wai: 'Who Am I?', team: 'Your Team' };
    const gap = ch.target - ch.knowledgePoints;
    const health = {
      chKnowledgePoints: this.fmt(ch.knowledgePoints), chTarget: '500,000',
      chTargetBarStyle: `height:100%;background:var(--color-accent);width:${Math.max(0.4, ch.knowledgePoints / ch.target * 100)}%`,
      chGapNote: `${this.fmt(gap)} knowledge points short of the 500,000 target. The pipeline scales without redesign — reaching the target needs a verified source corpus (season-by-season box scores, rosters, transactions) ingested through the same fact → knowledge point → question path. No wording variations are counted.`,
      chGenerated: this.fmt(ch.generated), chDupesRejected: this.fmt(ch.duplicatesRejected), chQualityRejected: this.fmt(ch.qualityRejected),
      chCurrentSplit: `${ch.current} / ${this.fmt(ch.historical)}`,
      chPools: [
        ['Multiple choice — every mode', eng.getBank().filter(r => r.active && r.status === 'active' && r.question_type !== 'career_mystery').length],
        ['…of which team questions', eng.getBank().filter(r => r.active && r.status === 'active' && r.team_id).length],
        ['Who Am I? career clues', eng.getBank().filter(r => r.active && r.status === 'active' && r.question_type === 'career_mystery').length]
      ].map(([label, n]) => ({ label, count: this.fmt(n) })),
      chMix: ch.mixRows.map(m => ({ tier: m.tier, readout: `${Math.round(m.actual * 100)}% / ${Math.round(m.target * 100)}%`,
        barStyle: `height:100%;background:${Math.abs(m.actual - m.target) > 0.12 ? 'var(--color-accent-700)' : 'var(--color-accent)'};width:${Math.min(100, m.actual * 100 / 0.35 * 1)}%`,
        targetTickStyle: `position:absolute;top:-3px;bottom:-3px;left:${Math.min(99, m.target * 100 / 0.35)}%;width:2px;background:var(--color-text)` })),
      chDailyRemaining: this.fmt(ch.daily.remaining),
      chDailyStyle: `font-family:var(--font-heading);font-weight:800;font-size:30px;letter-spacing:-0.04em;color:${ch.daily.low ? 'var(--color-accent)' : 'var(--color-text)'}`,
      chDailyRunway: `${ch.daily.daysOfRunway} days of runway · ${ch.daily.daysServed} served`,
      chDailyLow: ch.daily.low,
      chEras: Object.entries(ch.coverage).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k} ${v}`)
    };
    const cellN = i => `padding:var(--space-3) var(--space-4) var(--space-3) ${i === 0 ? 'var(--space-4)' : '10px'};${i < 3 ? 'border-right:1px solid var(--color-divider)' : ''}`;
    const statusOpts = ['All', 'active', 'pending', 'draft', 'disabled', 'outdated'];
    const modeOpts = ['All', 'streak', 'buzz', 'team', 'q20', 'daily', 'wai', 'h2h'];
    const diffOpts = ['All', ...eng.TIER_ORDER];
    const term = (s.adminQ || '').toLowerCase();
    const matching = eng.getBank().filter(r =>
      (s.adminStatus === 'All' || r.status === s.adminStatus) &&
      (s.adminMode === 'All' || r.game_modes_allowed.includes(s.adminMode)) &&
      (s.adminDiff === 'All' || r.difficulty === s.adminDiff) &&
      (!term || (r.question_text + ' ' + r.correct_answer + ' ' + (r.players || []).join(' ') + ' ' + (r.teams || []).join(' ') + ' ' + r.question_id).toLowerCase().includes(term)));
    const act = (label, run, primary) => ({ label, run, style: `all:unset;cursor:pointer;padding:7px 11px;font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.06em;border:1px solid ${primary ? 'var(--color-accent)' : 'var(--color-divider)'};color:${primary ? '#120800' : 'var(--color-neutral-300)'};background:${primary ? 'var(--color-accent)' : 'transparent'}` });
    const flip = (id, patch) => async () => {
      if (!this.state.online) { eng.applyOverride(id, patch); return this.forceUpdate(); }
      const res = await cloud.setQuestionStatus(id, patch.status);
      if (res.error) return this.setState({ adminMsg: res.error });
      const rec = eng.byId(id); if (rec) Object.assign(rec, patch);
      this.setState({ adminMsg: '' });
    };
    const adminRows = matching.slice(0, 40).map(r => {
      const st = eng.statsFor(r.question_id);
      const dupes = r.duplicate_warnings || [];
      const actions = [];
      if (!s.isAdmin && s.online) { /* players can look, only admins change */ }
      else if (r.status === 'pending' || r.status === 'draft') { actions.push(act('Approve', flip(r.question_id, { status: 'active', active: true }), true)); actions.push(act('Reject', flip(r.question_id, { status: 'disabled', active: false }))); }
      else if (r.status === 'active') { actions.push(act('Disable', flip(r.question_id, { status: 'disabled', active: false }))); actions.push(act('Retire', flip(r.question_id, { status: 'outdated', active: false }))); }
      else { actions.push(act('Reactivate', flip(r.question_id, { status: 'active', active: true }), true)); }
      return { id: r.question_id, status: r.status.toUpperCase(), diff: r.difficulty, cat: r.category, text: r.question_text, correct: r.correct_answer,
        kp: r.knowledge_point_id, pool: r.pool || '—', quality: r.quality_score == null ? '—' : r.quality_score,
        isDynamic: r.temporal === 'dynamic', hasDupes: dupes.length > 0,
        dupeText: dupes.length ? `${Math.round(dupes[0].score * 100)}% similar to ${dupes[0].question_id}` : '',
        shown: st.shown, correctPct: st.correctPct == null ? '—' : st.correctPct + '%', avg: st.avgMs == null ? '—' : (st.avgMs / 1000).toFixed(1) + 's',
        modes: r.game_modes_allowed.length, actions,
        sourceLine: `${r.source_name} · ${r.source_date} · ${r.question_type.replace(/_/g, ' ')}${r.season ? ' · ' + r.season : ''}`,
        statusStyle: `font-family:var(--font-heading);font-weight:800;font-size:10px;letter-spacing:.08em;padding:3px 7px;background:${r.status === 'active' ? 'var(--color-accent)' : 'transparent'};color:${r.status === 'active' ? '#120800' : 'var(--color-neutral-400)'};border:1px solid ${r.status === 'active' ? 'var(--color-accent)' : 'var(--color-divider)'}`,
        style: `padding:var(--space-3) var(--space-4);border-top:1px solid var(--color-divider);opacity:${r.active ? 1 : .55}` };
    });
    return {
      ...health,
      atAdmin: s.screen === 'admin',
      bankSeason: eng.SEASON,
      bankTotals: [['Total', this.fmt(sum.total)], ['Active', this.fmt(sum.active)], ['Pending', sum.pending], ['Seen', this.fmt(sum.seen)]].map(([label, value], i) => ({ label, value, style: cellN(i) })),
      poolRows: eng.poolHealth(this.teamId()).map(r => ({ label: r.label, available: this.fmt(r.available),
        detail: `${this.fmt(r.total)} in bank · ${this.fmt(r.excluded)} inside reuse window`,
        valueStyle: `font-family:var(--font-heading);font-weight:800;font-size:20px;letter-spacing:-0.03em;color:${r.low ? 'var(--color-accent)' : 'var(--color-text)'}` })),
      retentionOpts: eng.RETENTION_OPTIONS.map(d => ({ label: d === 0 ? 'NEVER REPEAT' : d + ' DAYS', pick: () => { eng.setConfig({ exclusionDays: d }); this.forceUpdate(); },
        style: `all:unset;cursor:pointer;padding:8px 12px;font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.06em;border:1px solid ${cfg.exclusionDays === d ? 'var(--color-accent)' : 'var(--color-divider)'};color:${cfg.exclusionDays === d ? '#120800' : 'var(--color-neutral-300)'};background:${cfg.exclusionDays === d ? 'var(--color-accent)' : 'transparent'}` })),
      retentionNote: cfg.exclusionDays === 0 ? 'A question is never served to the same player twice, in any mode.' : `A question a player has seen in ANY mode is withheld for ${cfg.exclusionDays} days, then becomes eligible again.`,
      autoPublishLabel: cfg.autoPublish ? 'Auto-publish: on' : 'Auto-publish: off',
      toggleAutoPublish: () => { eng.setConfig({ autoPublish: !cfg.autoPublish }); this.forceUpdate(); },
      resetHistory: () => { eng.clearHistory(); this.forceUpdate(); },
      adminQ: s.adminQ, setAdminQ: e => this.setState({ adminQ: e.target.value }),
      adminStatus: s.adminStatus, setAdminStatus: e => this.setState({ adminStatus: e.target.value }),
      adminMode: s.adminMode, setAdminMode: e => this.setState({ adminMode: e.target.value }),
      adminDiff: s.adminDiff, setAdminDiff: e => this.setState({ adminDiff: e.target.value }),
      statusOpts, modeOpts, diffOpts, adminCount: this.fmt(matching.length), adminRows,
      goAdmin: () => this.setState({ screen: 'admin' }), goProfileFromAdmin: () => this.setState({ screen: 'profile' }),
      adminHasMsg: !!s.adminMsg, adminMsg: s.adminMsg,
      adminRoleNote: !s.online ? 'Offline — showing the built-in bank; changes stay on this device.' : s.isAdmin ? 'Admin — your changes apply for every player.' : 'Read-only — only admins can approve, disable or retire questions.'
    };
  }

  renderVals() {
    const s = this.state, p = s.profile || {}, lib = s.lib, T = s.teams, a = s.account, r = s.run;
    const appName = this.props.appName ?? 'NBA TRIVIA';
    const frame = this.props.phoneFrame ?? false;
    const accentGlow = this.props.streakGlow ?? true;
    const rec = p.records || {}, t = this.team();
    const sc = s.screen;
    const go = x => () => { this.setState({ screen: x, copied: false, h2hError: '' }); this.onEnter(x); };
    const totalQ = p.totalQ || 0, acc = totalQ ? Math.round(p.totalCorrect / totalQ * 100) : 0;
    const level = 1 + Math.floor(totalQ / 25), xpInto = totalQ % 25;
    const globalRank = s.ranks.global ? '#' + s.ranks.global : '—';
    const teamRank = t && s.ranks.team ? '#' + s.ranks.team : '—';
    const REG = ['welcome', 'auth', 'username', 'teampick', 'ready'];
    const chList = (s.challenges || []).map(c => c.status === 'open' && c.expiresAt < Date.now() ? { ...c, status: 'expired' } : c);
    const inbox = chList.filter(c => c.dir === 'in' && c.status === 'open');
    const wins = chList.filter(c => c.result === 'won').length, losses = chList.filter(c => c.result === 'lost').length, ties = chList.filter(c => c.result === 'tied').length;

    // ── game view ──
    const q = r && r.q;
    const isWai = r && r.mode === 'wai';
    const limit = r && (r.mode === 'q20' || r.mode === 'daily') ? 10000 : this.Q_LIMIT;
    const answered = r && r.answered !== null;
    const liveMs = r && !answered ? Math.max(0, (r.mode === 'buzz' ? r.time : limit) - (Date.now() - r.qStart)) : (r ? (r.mode === 'buzz' ? r.time : limit) : 0);
    const urgent = r && !answered && liveMs < 5000;
    const letters = ['A', 'B', 'C', 'D'];
    const ok = answered && q && (isWai ? r.log[r.log.length - 1] && r.log[r.log.length - 1].ok : r.answered === q.correct);
    const answers = q && q.options && !(isWai && r.phase !== 'guess') ? q.options.map((o, i) => {
      const isC = isWai ? o === q.name : o === q.correct, chosen = r.answered === o, gone = isWai && r.wrongOpts.includes(o);
      let bg = 'var(--color-surface)', col = 'var(--color-text)', anim = '', bd = 'var(--color-divider)';
      if (answered) { if (isC) { bg = 'var(--color-accent)'; col = '#120800'; bd = 'var(--color-accent)'; } else if (chosen) { bg = 'transparent'; col = 'var(--color-neutral-400)'; bd = 'var(--color-neutral-500)'; anim = 'shake .3s ease-in-out'; } else { col = 'var(--color-neutral-500)'; bd = 'var(--color-neutral-800)'; } }
      return { letter: letters[i], text: o, disabled: answered || gone, pick: () => isWai ? this.waiGuess(o) : this.answer(o),
        style: `all:unset;box-sizing:border-box;cursor:${answered || gone ? 'default' : 'pointer'};display:flex;align-items:center;gap:14px;min-height:clamp(48px,7.6dvh,64px);padding:clamp(6px,1.2dvh,12px) 14px;background:${bg};color:${col};border:1px solid ${bd};font-family:var(--font-heading);font-weight:800;font-size:clamp(15px,2.2dvh,17px);line-height:1.15;opacity:${gone ? .3 : 1};animation:${anim};transition:background .12s,border-color .12s`,
        letterStyle: 'width:26px;flex:none;font-size:12px;opacity:.55;letter-spacing:.06em',
        mark: answered && (isC || chosen), markText: isC ? 'CORRECT' : 'YOURS' };
    }) : [];
    const clueRows = isWai && q ? q.clues.map((c, i) => {
      const locked = i > r.clueIdx;
      return { n: i + 1, locked, isText: !locked && c.type === 'text', isPath: !locked && c.type === 'path', isNumbers: !locked && c.type === 'numbers', isAwards: !locked && c.type === 'awards',
        text: c.content, numbers: c.numbers || [], list: c.list || [],
        teams: (c.teams || []).map((name, j, arr) => ({ name, lineStyle: `position:absolute;left:7px;top:20px;bottom:-8px;width:2px;background:${j < arr.length - 1 ? 'var(--color-divider)' : 'transparent'}` })),
        style: `padding:var(--space-3) 0;border-bottom:1px solid var(--color-divider);opacity:${locked ? .4 : 1};${i === r.clueIdx ? 'animation:in .25s ease-out' : ''}` };
    }) : [];
    const modeName = m => ({ streak: 'Streak', buzz: 'Buzz', team: t ? t.name : 'Team', q20: '20 Questions', wai: 'Who am I?', daily: 'Daily' })[m] || m;
    const lastLog = r && r.log[r.log.length - 1];

    // ── result view ──
    const isStreaky = r && (r.mode === 'streak' || r.mode === 'team');
    const cell3 = i => `padding:var(--space-3) var(--space-4);${(i + 1) % 3 !== 0 ? 'border-right:1px solid var(--color-divider);' : ''}${i < 3 ? 'border-bottom:1px solid var(--color-divider);' : ''}`;
    const cell2 = i => `min-width:0;padding:clamp(8px,1.4dvh,12px) 10px;${i < 3 ? 'border-right:1px solid var(--color-divider);' : ''}`;
    const resultStats = r ? (isStreaky
      ? [['Accuracy', r.acc + '%'], ['Best', p.bestStreak || 0], ['Global', globalRank], ['Team', teamRank]]
      : [['Questions', r.answers], ['Accuracy', r.acc + '%'], ['Streak', r.best], ['Fastest', r.fastest != null ? (r.fastest / 1000).toFixed(1) + 's' : '—']]
    ).map(([label, value], i) => ({ label, value, style: cell2(i) })) : [];

    const nav = [['HOME', 'home'], ['PLAY', 'play'], ['BOARD', 'board'], ['TEAM', t ? 'teamhub' : 'teampick'], ['PROFILE', 'profile']].map(([label, target]) => {
      const map = { home: 'HOME', play: 'PLAY', board: 'BOARD', teamhub: 'TEAM', teampick: 'TEAM', profile: 'PROFILE', h2h: 'PROFILE', 'h2h-result': 'PROFILE', 'h2h-made': 'PROFILE', result: 'HOME', share: 'HOME' };
      const on = map[sc] === label, isPlay = label === 'PLAY';
      return { label, isHome: label === 'HOME', isPlay, isBoard: label === 'BOARD', isTeam: label === 'TEAM', isProfile: label === 'PROFILE',
        badge: label === 'PROFILE' && inbox.length > 0, badgeCount: inbox.length,
        pick: () => { this.setState({ screen: target, reg: false, hubFrom: 'home', copied: false }); this.onEnter(target); },
        style: `all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:62px;padding:8px 2px;color:${on ? 'var(--color-accent)' : 'var(--color-neutral-500)'}`,
        iconWrap: `position:relative;display:flex;align-items:center;justify-content:center;${isPlay ? `width:34px;height:34px;background:${on ? 'var(--color-accent)' : 'var(--color-text)'};color:${on ? '#120800' : 'var(--color-bg)'};margin-top:-2px` : ''}` };
    });
    const uchk = this.unameCheck(s.unameDraft);
    const regStep = sc === 'username' ? 0 : sc === 'teampick' ? 1 : 2;
    const teamList = T ? T.TEAMS.filter(x => { const v = (s.teamSearch || '').toLowerCase(); return !v || (T.fullName(x) + ' ' + x.conf).toLowerCase().includes(v); }).map(x => ({
      name: T.fullName(x), abbr: x.id.toUpperCase(), meta: `${x.conf}ern · ${x.div}`, selected: s.teamDraft === x.id, pick: () => this.setState({ teamDraft: x.id }),
      style: `all:unset;box-sizing:border-box;cursor:pointer;width:100%;display:flex;align-items:center;gap:14px;padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-divider);color:var(--color-text);background:${s.teamDraft === x.id ? 'var(--color-surface)' : 'transparent'}`,
      markStyle: `width:42px;height:42px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:13px;background:${s.teamDraft === x.id ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${s.teamDraft === x.id ? '#120800' : 'var(--color-neutral-300)'}`
    })) : [];
    const draftT = T && s.teamDraft ? T.teamById(s.teamDraft) : null;
    const ch = s.activeChallenge;
    const meIsCreator = !!(ch && ch.dir === 'out');
    const creatorVal = ch ? (ch.mode === 'buzz' ? ch.creatorScore : ch.creatorStat) : 0;
    const oppVal = ch && ch.status === 'completed' ? (ch.mode === 'buzz' ? ch.opponentScore : ch.opponentStat) : 0;
    const chMine = meIsCreator ? creatorVal : oppVal, chTheirs = meIsCreator ? oppVal : creatorVal;
    const theirName = ch ? (meIsCreator ? (ch.opponent || 'opponent') : ch.creator) : '';
    const creatorWon = !!(ch && (meIsCreator ? ch.result === 'won' : ch.result === 'lost'));
    const hubCats = ['All', 'Team history', 'Franchise legends', 'Championships', 'Franchise records', 'Arenas'];
    const heroStreakVal = p.lastStreak != null ? p.lastStreak : (p.bestStreak || 0);

    return {
      appName,
      shellStyle: frame
        ? 'position:relative;width:390px;height:min(844px,calc(100dvh - 48px));overflow:hidden;display:flex;flex-direction:column;background:var(--color-bg);box-shadow:0 0 0 10px #000,0 0 0 12px #2a2a2e,var(--shadow-lg);border-radius:42px'
        : 'position:relative;width:100%;max-width:440px;height:100%;overflow:hidden;display:flex;flex-direction:column;background:var(--color-bg)',

      // The team picker opened from the menu keeps the menu (only sign-up hides it).
      showNav: (!REG.includes(sc) || (sc === 'teampick' && !s.reg)) && sc !== 'game' && sc !== 'admin',
      navItems: nav,

      atWelcome: sc === 'welcome', atAuth: sc === 'auth', atUsername: sc === 'username', atTeamPick: sc === 'teampick', atReady: sc === 'ready',
      atHome: sc === 'home', atPlay: sc === 'play', atGame: sc === 'game', atResult: sc === 'result', atShare: sc === 'share',
      atBoard: sc === 'board', atTeamHub: sc === 'teamhub', atProfile: sc === 'profile',
      atH2H: sc === 'h2h', atH2HIntro: sc === 'h2h-intro', atH2HMade: sc === 'h2h-made', atH2HResult: sc === 'h2h-result',

      // registration
      authApple: () => this.startSocial('apple'), authGoogle: () => this.startSocial('google'),
      goAuthEmail: () => this.setState({ screen: 'auth', authMode: 'register', authErrs: [] }),
      backToWelcome: () => this.setState({ screen: 'welcome', reg: true, authErrs: [] }),
      playGuest: () => this.setState({ screen: 'home', guest: true }),
      isSignIn: s.authMode === 'signin', authTitle: s.authMode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT',
      authSub: s.authMode === 'signin' ? 'Your records are waiting.' : 'Takes about ten seconds.',
      authCta: s.busy ? 'ONE MOMENT…' : s.authMode === 'signin' ? 'SIGN IN' : 'CONTINUE',
      authToggleLabel: s.authMode === 'signin' ? 'No account? Create one' : 'Already have an account? Sign in',
      toggleAuthMode: () => this.setState({ authMode: s.authMode === 'signin' ? 'register' : 'signin', authErrs: [] }),
      authEmail: s.authEmail, setAuthEmail: e => this.setState({ authEmail: e.target.value, authErrs: [] }),
      authPass: s.authPass, setAuthPass: e => this.setState({ authPass: e.target.value, authErrs: [] }),
      authHasErrors: s.authErrs.length > 0, authErrorList: s.authErrs, submitEmailAuth: () => this.submitEmailAuth(),
      regDots: [0, 1, 2].map(i => `width:${i === regStep ? 26 : 9}px;height:4px;background:${i === regStep ? 'var(--color-accent)' : 'var(--color-neutral-800)'}`),
      unameDraft: s.unameDraft, setUname: e => { this.setState({ unameDraft: e.target.value }); this.checkUsernameSoon(e.target.value); },
      unameStatus: uchk.msg, unameInvalid: !uchk.ok,
      unameStatusStyle: `font-size:13px;font-weight:600;margin-top:10px;color:${s.unameDraft && uchk.ok ? 'var(--color-accent-400)' : 'var(--color-neutral-400)'}`,
      claimUsername: () => this.claimUsername(),
      regFlow: s.reg, teamSearch: s.teamSearch, setTeamSearch: e => this.setState({ teamSearch: e.target.value }), teamList,
      noTeamChosen: !draftT, teamCta: draftT ? `LOCK IN THE ${draftT.name.toUpperCase()}` : 'PICK A TEAM',
      saveTeam: () => { if (!s.teamDraft) return; const prof = { ...p, favoriteTeam: s.teamDraft }; this.save(prof); if (a) this.saveAccount({ ...a, favoriteTeam: s.teamDraft }); this.setState({ screen: s.reg ? 'ready' : (s.hubFrom === 'profile' ? 'profile' : 'teamhub'), teamSearch: '' }); this.refreshRanks(); },
      readyMarkStyle: `width:76px;height:76px;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:22px;background:var(--color-accent);color:#120800`,
      readyLine: t ? `Your first ${t.name} question is waiting. One mistake ends the run.` : 'One mistake ends the run. How long can you last?',

      // home
      handle: a ? '@' + a.username : 'GUEST',
      avatarInitial: a ? a.username.slice(0, 1).toUpperCase() : 'G',
      avatarStyle: `width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:16px;background:${a ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${a ? '#120800' : 'var(--color-neutral-300)'}`,
      bigAvatarStyle: `width:68px;height:68px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:28px;background:${a ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${a ? '#120800' : 'var(--color-neutral-300)'}`,
      teamDotStyle: `width:7px;height:7px;flex:none;background:${t ? 'var(--color-accent)' : 'var(--color-neutral-500)'}`,
      homeSubline: `${t ? t.name : 'No team'} · Level ${level}`,
      globalRank,
      streakLabel: p.lastStreak != null ? 'Last streak' : 'Your streak',
      heroStreak: String(heroStreakVal).padStart(2, '0'),
      heroNumStyle: `font-family:var(--font-heading);font-weight:800;font-size:clamp(64px,13.5dvh,132px);line-height:.82;letter-spacing:-0.07em;margin-top:6px;${accentGlow && heroStreakVal >= 10 ? 'color:var(--color-accent);text-shadow:0 0 48px rgba(255,106,26,.45)' : ''}`,
      hasStreak: accentGlow && heroStreakVal >= 10,
      embers: Array.from({ length: 10 }, (_, i) => `position:absolute;left:${8 + i * 9}%;bottom:34%;width:4px;height:4px;background:var(--color-accent);opacity:0;animation:emberUp ${2.4 + (i % 4) * .5}s linear ${(i % 5) * .45}s infinite`),
      bestStreak: p.bestStreak || 0, accuracy: totalQ ? acc + '%' : '—',
      heroPrompt: p.lastStreak != null && p.lastStreak > 0 ? 'KEEP THE STREAK ALIVE' : totalQ ? 'RUN IT BACK' : 'START YOUR FIRST RUN',
      startStreak: () => this.startRun('streak'),
      hasTeam: !!t, myTeamAbbr: t ? t.id.toUpperCase() : '—',
      teamHeadline: t ? `HOW WELL DO YOU KNOW YOUR ${t.name.toUpperCase()}?` : 'PICK YOUR TEAM',
      teamCtaLabel: t ? 'PLAY' : 'CHOOSE',
      teamBest: p.teamBest || 0, teamAnswered: p.teamCorrect || 0,
      teamMarkStyle: `width:52px;height:52px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:15px;background:${t ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${t ? '#120800' : 'var(--color-neutral-300)'}`,
      teamModeSub: t ? `Only ${t.name} questions. Best run ${p.teamBest || 0}.` : 'Pick a franchise to unlock this.',
      goTeamHub: () => this.setState({ screen: t ? 'teamhub' : 'teampick', reg: false, teamDraft: this.teamId(), hubFrom: 'home' }),
      homeRows: [
        { title: 'Daily Challenge', sub: 'Ten curated questions — a new set every day', go: () => this.startRun('daily'), badge: false, badgeText: '' },
        { title: 'Leaderboard', sub: `You're ${globalRank} globally`, go: go('board'), badge: false, badgeText: '' },
        { title: 'Head to head', sub: `${wins}W · ${losses}L · ${ties}T`, go: go('h2h'), badge: inbox.length > 0, badgeText: inbox.length + ' new' }
      ],
      hasRecentBadges: !!(p.recentBadges && p.recentBadges.length), recentBadges: p.recentBadges || [],

      // play
      poolExhausted: !!s.poolExhausted, exhaustedMsg: s.exhaustedMsg || '',
      playModes: [
        { name: 'Buzz', desc: '24 seconds. Fast answers buy time.', pick: () => this.startRun('buzz'), locked: false, hasStat: !!rec.buzz, stat: rec.buzz ? this.fmt(rec.buzz.score) : '' },
        { name: '20 Questions', desc: 'Twenty questions, one run, lifelines.', pick: () => this.startRun('q20'), locked: false, hasStat: !!rec.q20, stat: rec.q20 ? this.fmt(rec.q20.score) : '' },
        { name: 'Who Am I?', desc: 'Name the player or coach from career clues.', pick: () => this.startRun('wai'), locked: false, hasStat: !!rec.wai, stat: rec.wai ? this.fmt(rec.wai.score) : '' },
        { name: 'Head to Head', desc: 'Same questions, against a friend.', pick: go('h2h'), locked: false, hasStat: false, stat: '' },
        { name: 'Tournaments', desc: 'Bracketed weekend events.', pick: () => {}, locked: true, hasStat: false, stat: '' }
      ].map(m => ({ ...m, cls: m.locked ? 'tall-only' : '', style: `all:unset;box-sizing:border-box;cursor:${m.locked ? 'default' : 'pointer'};width:100%;display:flex;align-items:center;gap:var(--space-3);padding:clamp(6px,1.3dvh,12px) var(--space-4);border-bottom:1px solid var(--color-divider);color:var(--color-text);opacity:${m.locked ? .5 : 1}` })),

      // game
      gameShellStyle: `position:relative;display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;${urgent ? 'box-shadow:inset 0 0 0 2px var(--color-accent)' : ''}`,
      quitGame: () => { const uid = s.user && s.user.id; if (uid && a && r) cloud.recordHistory(uid, r.mode, r.log); this.setState({ screen: 'home', run: null }); },
      gameProgress: r ? (r.qs ? `${String(r.idx + 1).padStart(2, '0')} / ${r.qs.length}` : modeName(r.mode).toUpperCase()) : '',
      gameHasClock: !!(r && r.mode === 'buzz'),
      clock: r ? (liveMs / 1000).toFixed(1) : '',
      clockStyle: `font-family:var(--font-heading);font-weight:800;font-size:26px;letter-spacing:-0.04em;font-variant-numeric:tabular-nums;color:${urgent ? 'var(--color-accent)' : 'var(--color-text)'};${urgent ? 'animation:tick .45s ease-in-out infinite' : ''}`,
      gameStreak: r ? r.streak : 0,
      streakChipStyle: `display:flex;align-items:center;gap:4px;font-family:var(--font-heading);font-weight:800;font-size:18px;letter-spacing:-0.02em;color:${r && r.streak >= 5 ? 'var(--color-accent)' : 'var(--color-neutral-400)'}`,
      gameBarStyle: `height:100%;background:${urgent ? 'var(--color-accent)' : 'var(--color-accent-700)'};width:${r ? (r.mode === 'buzz' ? Math.min(100, r.time / this.BUZZ_CAP * 100) : (r.mode === 'streak' || r.mode === 'team') ? Math.max(4, liveMs / limit * 100) : (r.idx + (answered ? 1 : 0)) / r.qs.length * 100) : 0}%;transition:width .25s`,
      gameVisible: s.qVisible,
      qKicker: q ? (isWai ? `${q.kind === 'coach' ? 'Coach' : 'Player'} · worth ${this.fmt(this.WAI_POINTS[r.clueIdx] || 200)}` : `${q.cat} · ${q.diff}`) : '',
      qIsClues: !!isWai, qIsPlain: !isWai,
      qText: q && !isWai ? q.text : '',
      qTextStyle: `font-size:${q && !isWai && q.text.length > 72 ? 'clamp(19px,3.1dvh,25px)' : 'clamp(22px,3.8dvh,31px)'};line-height:1.08;letter-spacing:-0.03em;margin:0;text-wrap:pretty;font-family:var(--font-heading);font-weight:800`,
      clueRows,
      showAnswers: !!(q && (!isWai || (isWai && r.phase === 'guess' && q.options))),
      answers,
      showClueActions: !!(isWai && r.phase === 'idle'),
      nextClue: () => this.nextClue(), noMoreClues: !!(isWai && q && r.clueIdx + 1 >= q.clues.length),
      nextClueWorth: isWai && q && r.clueIdx + 1 < q.clues.length ? `drops to ${this.fmt(this.WAI_POINTS[r.clueIdx + 1])}` : 'final clue',
      openGuess: () => { if (!isWai) return; if (q.options) return this.setState({ run: { ...r, phase: 'guess' } }); this.setState({ run: { ...r, phase: 'guess', guess: '' } }); },
      showGuessInput: !!(isWai && r.phase === 'guess' && !q.options),
      guessText: r ? r.guess : '', setGuess: e => this.setState({ run: { ...r, guess: e.target.value } }),
      guessKey: e => { if (e.key === 'Enter' && r.guess.trim()) this.waiGuess(r.guess); },
      submitGuess: () => { if (r.guess.trim()) this.waiGuess(r.guess); },
      cancelGuess: () => this.setState({ run: { ...r, phase: 'idle' } }),
      showGain: !!s.gain, gainPts: s.gain ? s.gain.pts : '', gainExtra: !!(s.gain && s.gain.extra), gainExtraText: s.gain && s.gain.extra,
      showMilestone: !!s.milestone, milestoneText: s.milestone ? s.milestone[1] : '',
      milestoneStyle: `padding:14px 22px;background:var(--color-accent);color:#120800;font-family:var(--font-heading);font-weight:800;font-size:${s.milestone && s.milestone[0] >= 50 ? 34 : s.milestone && s.milestone[0] >= 20 ? 28 : 22}px;letter-spacing:-0.03em;animation:flare .45s ease-out;box-shadow:var(--shadow-lg)`,
      showFeedback: !!answered,
      feedbackTitle: ok ? 'CORRECT' : (r && r.answered === '__timeout' ? 'TIME' : 'WRONG'),
      feedbackHasTrail: !!(ok && r && (r.mode === 'streak' || r.mode === 'team')),
      feedbackTrail: r ? `${r.streak} STREAK` : '',
      feedbackSub: ok ? ((lastLog && lastLog.exp) || '') : (lastLog ? `Correct answer: ${lastLog.correct}${lastLog.exp ? ' — ' + lastLog.exp : ''}` : ''),
      feedbackStyle: `flex:none;box-sizing:border-box;height:clamp(64px,10.5dvh,88px);overflow:hidden;padding:clamp(6px,1.2dvh,12px) var(--space-4);${answered ? `background:${ok ? 'var(--color-accent)' : 'var(--color-surface)'};color:${ok ? '#120800' : 'var(--color-text)'};border-top:2px solid ${ok ? 'var(--color-accent)' : 'var(--color-neutral-500)'};animation:in .15s ease-out` : 'border-top:2px solid transparent'}`,

      // result
      resultKicker: r ? (r.exhausted ? 'Pool cleared' : isStreaky ? (r.mode === 'team' && t ? `${t.name} run over` : 'Streak ended') : `${modeName(r.mode)} complete`) : '',
      resultNumber: r ? (isStreaky ? String(r.best) : this.fmt(s.displayScore)) : '',
      resultNumStyle: `font-family:var(--font-heading);font-weight:800;font-size:${r && isStreaky ? 'clamp(64px,13dvh,128px)' : 'clamp(48px,9dvh,84px)'};line-height:.85;letter-spacing:-0.06em;margin-top:6px`,
      resultLine: r ? (r.exhausted ? `${r.best} in a row — you've now seen every question in this pool. Fresh ones are on the way.` : isStreaky ? `${r.best} consecutive correct answers.` : `${r.correct} of ${r.answers} right · ${this.fmt(r.score)} points`) : '',
      isRecord: !!(r && r.isRecord), prevBest: r ? this.fmt(r.prevBest) : '',
      resultHeroStyle: `flex:none;padding:clamp(14px,3.4dvh,32px) var(--space-4) clamp(12px,2.6dvh,24px);border-bottom:2px solid var(--color-divider);${r && r.isRecord ? 'background:var(--color-accent);color:#120800' : ''}`,
      resultStats,
      playAgain: () => r && this.startRun(r.mode, { cat: r.cat }),
      goBoard: go('board'), goShare: go('share'),
      canChallenge: !!(r && !r.challenge && a && ['streak', 'buzz', 'team'].includes(r.mode) && r.log.length),
      challengeFriend: () => r && this.createChallenge(r),
      hasNewBadges: s.newBadges.length > 0, newBadges: s.newBadges,
      isGuest: !a, isMember: !!a,
      reviewRows: r ? r.log.map((x, i) => ({ n: i + 1, q: x.q, detail: x.ok ? (x.exp || 'Correct') : (x.chosen === '__timeout' ? 'Ran out of time · ' : '') + 'Answer: ' + x.correct, pts: x.pts ? '+' + this.fmt(x.pts) : '0',
        dotStyle: `width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:11px;background:${x.ok ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${x.ok ? '#120800' : 'var(--color-neutral-400)'}` })) : [],

      // share
      shareKicker: r ? (isStreaky ? 'Streak' : modeName(r.mode)) : 'Streak',
      shareNumber: r ? (isStreaky ? r.best : this.fmt(r.score)) : (p.bestStreak || 0),
      shareFooter: t ? `${t.name} fan · Level ${level}` : `Level ${level}`,
      shareMarkStyle: `width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:12px;background:${t ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${t ? '#120800' : 'var(--color-neutral-300)'}`,
      copyLabel: s.copied ? 'Copied' : 'Copy',
      shareNative: () => { const text = this.shareText(); if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(text); this.setState({ copied: true }); } },
      copyShare: () => { navigator.clipboard && navigator.clipboard.writeText(this.shareText()); this.setState({ copied: true }); },

      // leaderboard
      boardScopes: ['Global', 'Friends', 'Your Team'].map(x => ({ label: x.toUpperCase(), pick: () => { this.setState({ scope: x }); this.refreshBoard(); }, style: `all:unset;box-sizing:border-box;cursor:pointer;padding:13px var(--space-3);font-family:var(--font-heading);font-weight:800;font-size:12px;letter-spacing:.06em;text-align:left;color:${s.scope === x ? '#120800' : 'var(--color-text)'};background:${s.scope === x ? 'var(--color-accent)' : 'transparent'};border-right:1px solid var(--color-divider)` })),
      boardPeriods: ['Today', 'Week', 'All time'].map(x => ({ label: x.toUpperCase(), pick: () => { this.setState({ period: x }); this.refreshBoard(); }, style: `all:unset;cursor:pointer;font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.1em;color:${s.period === x ? 'var(--color-accent)' : 'var(--color-neutral-500)'};border-bottom:2px solid ${s.period === x ? 'var(--color-accent)' : 'transparent'};padding-bottom:3px` })),
      boardEmpty: s.scope === 'Friends', boardHasRows: s.scope !== 'Friends', boardRows: this.rows(),
      boardNone: s.scope !== 'Friends' && !s.boardLoading && !(s.board || []).length,
      boardNoneLine: s.scope === 'Your Team' && !t ? 'Pick a team to see its board.' : `Nobody has finished a ${s.scope === 'Your Team' ? (t ? t.name + ' run' : 'team run') : 'streak'} ${s.period === 'Today' ? 'today' : s.period === 'Week' ? 'this week' : 'yet'}. Be the first.`,
      myRank: (() => { const me = this.rows().find(x => x.me); return me ? '#' + Number(me.rank) : '—'; })(),
      myRankSub: a ? '@' + a.username : 'Sign up to be ranked',
      myRankValue: (() => { const me = this.rows().find(x => x.me); return me ? me.value : '—'; })(),
      goH2H: go('h2h'),

      // team hub
      hubMarkStyle: `width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:19px;background:var(--color-accent);color:#120800`,
      hubHeadline: t ? `HOW WELL DO YOU KNOW YOUR ${t.name.toUpperCase()}?` : 'PICK A TEAM',
      goTeamPick: () => this.setState({ screen: 'teampick', reg: false, teamDraft: this.teamId(), hubFrom: 'teamhub' }),
      hubStats: [['Best run', p.teamBest || 0], ['Answered', p.teamCorrect || 0], ['Team rank', teamRank]].map(([label, value], i) => ({ label, value, style: `padding:var(--space-3) var(--space-4);${i < 2 ? 'border-right:1px solid var(--color-divider)' : ''}` })),
      hubCats: hubCats.map(c => ({ label: c === 'All' ? 'EVERYTHING' : c.toUpperCase(), pick: () => this.setState({ teamCat: c }),
        style: `all:unset;cursor:pointer;padding:9px 13px;font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.06em;border:1px solid ${s.teamCat === c ? 'var(--color-accent)' : 'var(--color-divider)'};color:${s.teamCat === c ? '#120800' : 'var(--color-neutral-300)'};background:${s.teamCat === c ? 'var(--color-accent)' : 'transparent'}` })),
      hubCta: t ? `PLAY ${t.name.toUpperCase()}` : 'PICK A TEAM',
      hubLadder: 'Fan → Die-Hard → Superfan → Legend → Team Expert as your run gets longer.',
      startTeamRun: () => this.startRun('team', { cat: s.teamCat }),

      // profile
      profileMeta: `${t ? t.name + ' fan' : 'No team yet'} · ${globalRank} global`,
      level, xpLine: `${xpInto}/25 to level ${level + 1}`,
      xpBarStyle: `height:100%;background:var(--color-accent);width:${xpInto / 25 * 100}%`,
      profileStats: [['Best streak', p.bestStreak || 0], ['Accuracy', totalQ ? acc + '%' : '—'], ['Games', p.games || 0], ['Questions', totalQ], ['Team best', p.teamBest || 0], ['Fav. category', (Object.entries(p.catCorrect || {}).sort((x, y) => y[1] - x[1])[0] || ['—'])[0]]].map(([label, value], i) => ({ label, value, style: cell3(i) })),
      badgeCount: `${(p.badges || []).length} / ${this.BADGES.length}`,
      badges: this.BADGES.map(([k, name, desc]) => { const on = (p.badges || []).includes(k);
        return { name, desc, initial: name.slice(0, 1),
          style: `padding:var(--space-3);border:1px solid ${on ? 'var(--color-accent)' : 'var(--color-divider)'};background:${on ? 'var(--color-accent-900)' : 'transparent'};opacity:${on ? 1 : .45}`,
          iconStyle: `width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:800;font-size:17px;background:${on ? 'var(--color-accent)' : 'var(--color-neutral-800)'};color:${on ? '#120800' : 'var(--color-neutral-500)'}` }; }),
      engineSummaryLine: this.eng ? `${this.fmt(this.eng.bankSummary().active)} active · ${this.fmt(this.eng.bankSummary().seen)} seen` : '—',
      changeUsername: () => this.setState({ screen: 'username', reg: false, unameDraft: a ? a.username : '' }),
      signOut: async () => { await cloud.signOut(); this.eng.useHistoryOf(null); this.setState({ screen: 'welcome', guest: false, authEmail: '', authPass: '', user: null, account: null, isAdmin: false, challenges: [], ranks: { global: null, team: null }, profile: this.localProfile(null) }); },

      // admin · question engine
      ...this.adminVals(),

      // head to head
      h2hRecord: `${wins}W · ${losses}L · ${ties}T`,
      h2hCode: s.h2hCode, setH2HCode: e => this.setState({ h2hCode: e.target.value.toUpperCase(), h2hError: '' }),
      redeemCode: () => { const code = s.h2hCode.trim().toUpperCase(); if (code) this.redeem(code); },
      h2hHasError: !!s.h2hError, h2hError: s.h2hError,
      h2hEmpty: chList.length === 0,
      h2hRows: chList.map(c => ({ code: c.code, opponent: '@' + (c.dir === 'in' ? c.creator : (c.opponent || 'Pending')), mode: modeName(c.mode),
        result: c.status === 'completed' ? (c.result === 'won' ? 'WON' : c.result === 'lost' ? 'LOST' : 'TIE') : c.status === 'expired' ? 'EXPIRED' : c.dir === 'in' ? 'PLAY' : 'SENT',
        sub: c.status === 'completed' ? `${this.fmt(c.creatorScore)} vs ${this.fmt(c.opponentScore || 0)}` : c.code,
        open: () => this.setState({ screen: c.status === 'completed' ? 'h2h-result' : c.dir === 'out' ? 'h2h-made' : 'h2h-intro', activeChallenge: c, copied: false }),
        style: 'all:unset;box-sizing:border-box;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:var(--space-3) var(--space-4);border-top:1px solid var(--color-divider);color:var(--color-text)',
        pillStyle: `font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:.08em;padding:5px 9px;background:${c.result === 'won' || (c.status === 'open' && c.dir === 'in') ? 'var(--color-accent)' : 'transparent'};color:${c.result === 'won' || (c.status === 'open' && c.dir === 'in') ? '#120800' : 'var(--color-neutral-400)'};border:1px solid ${c.result === 'won' || (c.status === 'open' && c.dir === 'in') ? 'var(--color-accent)' : 'var(--color-divider)'}` })),
      chCreator: ch ? '@' + ch.creator : '', chModeLabel: ch ? modeName(ch.mode) : '', chCodeLabel: ch ? ch.code : '',
      chDeepLink: ch ? this.challengeLink(ch.code).replace(/^https?:\/\//, '') : '',
      chAccept: () => { if (!a) return this.setState({ screen: 'welcome', reg: true }); this.startRun(ch.mode, { challenge: ch }); },
      chShare: () => { const text = ch && ch.status === 'completed' ? `${appName} — @${ch.creator} ${this.fmt(creatorVal)} vs @${ch.opponent} ${this.fmt(oppVal)}. ${this.challengeLink(ch.code)}` : `Beat my ${ch ? this.fmt(creatorVal) : ''} on ${appName}. Code ${ch ? ch.code : ''} · ${ch ? this.challengeLink(ch.code) : ''}`; if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(text); this.setState({ copied: true }); } },
      chCopy: () => { navigator.clipboard && navigator.clipboard.writeText(ch ? this.challengeLink(ch.code) : ''); this.setState({ copied: true }); },
      chResultTitle: ch && ch.result === 'won' ? 'YOU WIN' : ch && ch.result === 'lost' ? 'YOU LOSE' : 'DEAD HEAT',
      chResultSub: ch ? (ch.result === 'won' ? `You beat @${theirName} by ${this.fmt(Math.abs(chMine - chTheirs))}.` : ch.result === 'lost' ? `@${theirName} edged you by ${this.fmt(Math.abs(chTheirs - chMine))}.` : `Both of you finished on ${this.fmt(chMine)}.`) : '',
      chResultHeroStyle: `padding:var(--space-8) var(--space-4) var(--space-6);border-bottom:2px solid var(--color-divider);${ch && ch.result === 'won' ? 'background:var(--color-accent);color:#120800' : ''}`,
      chScores: ch ? [{ name: '@' + ch.creator, value: this.fmt(creatorVal), style: `padding:var(--space-4);border-right:1px solid var(--color-divider);${creatorWon ? 'background:var(--color-surface)' : ''}` }, { name: '@' + (ch.opponent || 'You'), value: this.fmt(oppVal), style: `padding:var(--space-4);${ch.result !== 'tied' && !creatorWon ? 'background:var(--color-surface)' : ''}` }] : [],
      chRematch: () => ch && this.startRun(ch.mode)
    };
  }
}

// ── <image-slot> ─────────────────────────────────────────────────
// Photo areas from the design (welcome hero, home team card, team hub).
// Set an image per slot id in SLOT_IMAGES; empty slots keep the soft fill.
export const SLOT_IMAGES = {
  // 'v2-welcome': 'assets/welcome.jpg',
  // 'v2-team': 'assets/team.jpg',
  // 'v2-hub': 'assets/hub.jpg',
};
class ImageSlot extends HTMLElement {
  connectedCallback() {
    if (this._ready) return; this._ready = true;
    this.style.cssText = 'display:block;position:relative;width:100%;height:100%;overflow:hidden;background:rgba(127,127,127,.08)';
    const src = this.getAttribute('src') || SLOT_IMAGES[this.id];
    if (!src) return;
    const img = new Image();
    img.alt = ''; img.src = src;
    img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:${this.getAttribute('fit') || 'cover'}`;
    img.onerror = () => img.remove();
    this.appendChild(img);
  }
}
if (!customElements.get('image-slot')) customElements.define('image-slot', ImageSlot);

// app.js — NBA TRIVIA ("20-0"), the mobile trivia app.
// Screen logic ported from the "20-0 v2" design. renderVals() returns every
// value and handler the markup in index.html reads; dc.js draws it.
import { Logic } from './dc.js';
import * as cloud from './cloud.js';
import { t, t as translate, strings, getLang, setLang, english } from './i18n.js';

export class App extends Logic {
  state = {
    screen: 'welcome', reg: false, lib: null, mys: null, teams: null,
    profile: null, account: null, guest: false, pending: null,
    authMode: 'register', authEmail: '', authPass: '', authErrs: [], unameDraft: '',
    teamDraft: null, teamSearch: '', teamCat: 'All', hubFrom: 'home',
    run: null, qVisible: true, gain: null, milestone: null, displayScore: 0,
    scope: 'Global', period: 'Today', authFrom: null,
    challenges: [], activeChallenge: null, h2hCode: '', h2hError: '',
    copied: false, newBadges: [], sound: (() => { try { return localStorage.getItem('v2_sound') === '1'; } catch (e) { return false; } })(), poolExhausted: false, loadingRun: null,
    adminQ: '', adminStatus: 'All', adminMode: 'All', adminDiff: 'All', adminSel: null,
    // live data
    user: null, isAdmin: false, busy: false, unameTakenFor: '', board: [], boardLoading: false,
    ranks: { global: null, team: null }, adminMsg: '', online: false
  };
  PKEY = 'v2_profile'; AKEY = 'v2_account'; CKEY = 'v2_challenges';
  // Resolves once the question engine is loaded; anything that needs it
  // (a sign-in that finishes first on a slow connection) waits on this.
  ready = new Promise(resolve => { this._ready = resolve; });
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
    // Teams, stats and menus show straight away; the question bank follows.
    // (No screen change here: a player who already tapped ahead stays where they are.)
    const profile = this.localProfile(null), guestTeam = profile.favoriteTeam;
    this.setState({ lib, mys, teams, profile, account: null, challenges: [], teamDraft: guestTeam });
    // The live bank from Supabase; the built-in one if the device is offline.
    // A signed-in player's profile shows while it downloads.
    // Games can start on the first 1,000 questions (ids are hashed, so it's a
    // random slice of every level); the rest replace it when they arrive.
    const arabic = getLang() === 'ar';
    const liveP = cloud.loadQuestions(guestTeam, false, first => {
      if (this.eng || !first.length) return;
      eng.setBank(first); this._bankAr = arabic; this.eng = eng; this._ready(); this.setState({ eng, online: true }); this.flushPendingStart();
    }, arabic);
    const user = await cloud.currentUser();
    const signing = user ? this.signedIn(user) : null;
    const live = await liveP;
    this._bankTeam = guestTeam;
    if (live && live.length) { eng.setBank(live); this._bankAr = arabic; }
    else if (!this.eng) { eng.buildBank({ questions: lib, mystery: mys, teams, facts }); eng.hydrateOverrides(); eng.refreshTemporal(); this._bankAr = true; }
    this.eng = eng; this._bankComplete = true;
    if (getLang() === 'ar' && !this._bankAr) this.ensureArabic();   // switched language while it downloaded
    this._ready();
    this.setState({ eng, online: !!(live && live.length) });
    if (signing) await signing;
    // A shared challenge link (…?c=NBA7X92) opens that battle.
    const code = new URLSearchParams(location.search).get('c');
    if (code) this.redeem(code.toUpperCase());
    this.flushPendingStart();
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
    // Games wait until this player's history is in, so nothing seen repeats.
    this._hold = true;
    const row = await cloud.loadProfile(user.id);
    const profile = this.localProfile(user.id, row && row.stats);
    if (row && row.favorite_team) profile.favoriteTeam = row.favorite_team;
    // A team picked just before the app closed may not have reached the server.
    else if (row && profile.favoriteTeam) { row.favorite_team = profile.favoriteTeam; cloud.saveProfile(user.id, { favoriteTeam: profile.favoriteTeam }); }
    const account = row ? { username: row.username, email: user.email, provider: (user.app_metadata || {}).provider || 'email', favoriteTeam: row.favorite_team || null } : null;
    this.setState({ user, account, profile, isAdmin: !!(row && row.is_admin), guest: false, unameDraft: account ? account.username : '', teamDraft: profile.favoriteTeam,
      screen: account ? 'home' : 'username', reg: !account });
    await this.ready;
    try { this.eng.useHistoryOf(user.id); this.eng.mergeHistory(await cloud.loadHistory(user.id)); }
    finally { this._hold = false; }
    this.flushPendingStart();
    // Admins see everything (pending, disabled, every team); players get their own team's deep questions.
    if ((row && row.is_admin) || profile.favoriteTeam !== this._bankTeam) this.reloadBank(row && row.is_admin);
    this.refreshChallenges(); this.refreshRanks();
    if (account && this._pendingCode) { const c = this._pendingCode; this._pendingCode = null; this.redeem(c); }
  }
  async reloadBank(everything = this.state.isAdmin) {
    const team = this.teamId(), arabic = getLang() === 'ar', rows = await cloud.loadQuestions(team, everything, null, arabic);
    if (rows && rows.length) { this.eng.setBank(rows); this._bankTeam = team; this._bankAr = arabic; this.forceUpdate(); }
    if (getLang() === 'ar' && !this._bankAr) this.ensureArabic();
  }
  // The Arabic text of the questions already on the device (a player who
  // switches to Arabic mid-session; English players never download it).
  async ensureArabic() {
    if (this._arLoading || !this.eng || !this.state.online) return;
    this._arLoading = true;
    try {
      const map = await cloud.loadArabic(this._bankTeam, this.state.isAdmin);
      if (!map) return;
      for (const rec of this.eng.getBank()) if (map.has(rec.question_id)) rec.ar = map.get(rec.question_id);
      const run = this.state.run;
      if (run && run.q && map.has(run.q.question_id)) run.q.ar = map.get(run.q.question_id);
      this._bankAr = true; this.forceUpdate();
    } finally { this._arLoading = false; }
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
  // Team names in the player's language (the Arabic file carries [city, nickname] per team).
  teamNick(team) { const n = team && strings().team_names && strings().team_names[team.id]; return team ? (n ? n[1] : team.name) : ''; }
  teamFull(team) { const n = team && strings().team_names && strings().team_names[team.id]; return team ? (n ? n.join(' ') : this.state.teams.fullName(team)) : ''; }
  // "@name" as a left-to-right island, so the @ stays in front of the name inside Arabic text.
  at(name) { return name ? (getLang() === 'ar' ? '\u2066@' + name + '\u2069' : '@' + name) : ''; }
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
    if (!v) return { ok: false, msg: t('username.rules') };
    if (v.length < 3 || v.length > 20) return { ok: false, msg: t('username.length') };
    if (!/^[A-Za-z0-9_]+$/.test(v)) return { ok: false, msg: t('username.chars') };
    const low = v.toLowerCase();
    if (this.RESERVED.includes(low)) return { ok: false, msg: t('username.reserved') };
    if (this.state.unameTakenFor === low) return { ok: false, msg: t('username.taken') };
    return { ok: true, msg: t('username.available') };
  }
  async startSocial(provider) {
    const res = await cloud.signInWith(provider);   // redirects away when the provider is set up
    if (res.error) this.setState({ screen: 'auth', authMode: 'register', authErrs: [res.error] });
  }
  async submitEmailAuth() {
    const { authEmail, authPass, authMode, busy } = this.state, errs = [];
    if (busy) return;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(authEmail)) errs.push({ k: 'errors.invalid_email' });
    if ((authPass || '').length < 8) errs.push({ k: 'errors.short_password' });
    if (errs.length) return this.setState({ authErrs: errs });
    this.setState({ busy: true, authErrs: [] });
    const res = authMode === 'signin' ? await cloud.signIn(authEmail.trim(), authPass) : await cloud.signUp(authEmail.trim(), authPass);
    this.setState({ busy: false });
    if (res.error) return this.setState({ authErrs: [res.error] });
    if (res.needsConfirm) return this.setState({ authMode: 'signin', authErrs: [{ k: 'errors.confirm_email_sent' }] });
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
    if (this._pendingCode) { const c = this._pendingCode; this._pendingCode = null; this.redeem(c); }
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
    // The Daily (same set for everyone) and battles (the challenger's exact
    // questions) wait for the whole bank; other modes start on the first part.
    const needsAll = mode === 'daily' || mode === 'h2h' || !!opts.challenge;
    if (!eng || this._hold || (needsAll && !this._bankComplete)) { this._startWhenReady = [mode, opts]; return this.setState({ loadingRun: mode }); }
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
    else if (mode === 'h2h' && !opts.challenge) run.qs = eng.buildSet(session, 10, eng.BATTLE_SPREAD);
    // A challenge plays the challenger's list in order; a question this player
    // has already seen is swapped for an unseen one of the same level.
    else if (opts.challenge) run.qs = (opts.challenge.questionIds || []).map(id => eng.byId(id)).filter(Boolean).map(rec => {
      if (!eng.inExclusion(rec.question_id) && !session.used.has(rec.question_id)) { session.used.add(rec.question_id); return eng.serve(rec, session.rnd); }
      return eng.nextQuestion(session, { band: [rec.difficulty] });
    }).filter(Boolean);
    else if (mode === 'q20') run.qs = eng.buildSet(session, 20, eng.Q20_SPREAD);
    else if (mode === 'wai') run.qs = eng.buildSet(session, 20, eng.TIER_ORDER);
    run.q = this.nextQ(run);
    // Nothing unseen left: say so — questions are never repeated.
    if (!run.q) return this.setState({ screen: 'home', poolExhausted: true, loadingRun: null, exhaustedMsg:
      { k: mode === 'daily' ? 'home.exhausted_daily' : opts.challenge ? 'home.exhausted_battle' : 'home.exhausted_mode' } });
    this.setState({ screen: 'game', run, qVisible: true, gain: null, milestone: null, newBadges: [], poolExhausted: false, loadingRun: null });
  }
  flushPendingStart() {
    if (!this._startWhenReady || !this.eng || this._hold) return;
    const [mode, opts] = this._startWhenReady;
    if ((mode === 'daily' || mode === 'h2h' || (opts && opts.challenge)) && !this._bankComplete) return;
    const [m, o] = this._startWhenReady; this._startWhenReady = null; this.startRun(m, o);
  }
  nextQ(run) {
    const eng = this.eng;
    if (run.qs) return run.qs[run.idx] || null;
    run.session.accuracy = run.answers ? run.correct / run.answers : null;
    return eng.nextQuestion(run.session, { progress: run.correct, favoriteTeam: (this.team() || {}).name });
  }
  tick() {
    const r = this.state.run, limit = this.limitFor(r.mode);
    if (r.mode === 'buzz') { if (r.time - (Date.now() - r.qStart) <= 0) return this.endRun({ ...r, time: 0 }); this.forceUpdate(); return; }
    if (Date.now() - r.qStart >= limit) return r.mode === 'wai' ? this.waiOut(true) : this.answer('__timeout');
    this.forceUpdate();
  }
  limitFor(mode) { return mode === 'q20' || mode === 'daily' ? 10000 : mode === 'h2h' ? 15000 : this.Q_LIMIT; }
  answer(opt) {
    const r = this.state.run, lib = this.state.lib; if (!r || r.answered !== null) return;
    const q = r.q, ms = Math.min(r.mode === 'buzz' ? 99999 : this.Q_LIMIT, Date.now() - r.qStart), ok = opt === q.correct;
    let pts = 0, time = r.time, extra = null;
    if (r.mode === 'buzz') {
      time = r.time - ms;
      if (ok) { const b = lib.timeBonus(ms); time = Math.min(this.BUZZ_CAP, time + b * 1000); extra = b ? t('game.plus_sec', { n: b }) : null; }
      else { time -= this.BUZZ_PENALTY; extra = t('game.minus_sec', { n: 3 }); }
      if (ok) pts = (this.eng.TIER_POINTS[q.diff] || 100) + lib.buzzSpeedPts(ms);
    } else if (ok) pts = (this.eng.TIER_POINTS[q.diff] || 100) + (r.mode === 'h2h' ? (ms < 3000 ? 50 : ms < 6000 ? 25 : 0) : 0);
    const streak = ok ? r.streak + 1 : 0;
    const qa = q.ar, lbl = o => (qa && qa.o && qa.o[o]) || o;
    const log = [...r.log, { qid: q.question_id, q: q.text.split('|').join(' '), type: q.type, cat: q.cat, chosen: opt, correct: q.correct, ok, ms, pts, exp: q.exp,
      ar: qa && qa.q ? { q: qa.q.split('|').join(' '), correct: lbl(q.correct), e: qa.e || '' } : null }];
    const next = { ...r, answered: opt, time, score: r.score + pts, streak, best: Math.max(r.best, streak), correct: r.correct + (ok ? 1 : 0), answers: r.answers + 1, log, fastest: ok && (r.fastest == null || ms < r.fastest) ? ms : r.fastest };
    this.eng.recordAnswer(q.question_id, { correct: ok, ms, mode: r.mode });
    this.eng.noteAnswer(r.session, q, { correct: ok, ms });
    if (ok) { this.beep(700, .06); setTimeout(() => this.beep(1050, .09), 60); this.buzz(18); } else { this.beep(130, .3, 'sawtooth', .09); this.buzz([55, 40, 55]); }
    // Climbing modes: crossing into the next level gets its own banner.
    const climbs = ['streak', 'team', 'buzz'].includes(r.mode), was = this.eng.ladderStage(r.correct), now = this.eng.ladderStage(r.correct + (ok ? 1 : 0));
    const hit = ok ? lib.MILESTONES.find(([n]) => n === streak) : null;
    const mile = ok && climbs && now.index > was.index ? { tier: now.tier, type: 'level' } : hit ? { tier: '', type: 'streak', n: streak, text: hit[1] } : null;
    this.setState({ run: next, gain: ok ? { pts: '+' + pts, extra } : (extra ? { pts: '', extra } : null), milestone: mile || null });
    if (r.mode === 'buzz' && next.time <= 0) return setTimeout(() => this.endRun(next), 700);
    if ((r.mode === 'streak' || r.mode === 'team') && !ok) return setTimeout(() => this.endRun(next), 1600);
    const last = (r.mode === 'q20' || r.mode === 'daily' || r.mode === 'h2h') && r.idx + 1 >= r.qs.length;
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
  arName(q) { return q.ar_name || (q.ar && q.ar.name) || null; }
  nextClue() { const r = this.state.run; if (r.phase !== 'idle' || r.clueIdx + 1 >= r.q.clues.length) return; this.beep(540, .05, 'sine', .04); this.setState({ run: { ...r, clueIdx: r.clueIdx + 1, locked: false } }); }
  waiGuess(text) {
    const r = this.state.run, mys = this.state.mys; if (!r || r.phase === 'done') return;
    const q = r.q, ok = mys.matches(text, q) || (!!mys.matchesAr && mys.matchesAr(text, this.arName(q)));
    if (ok) {
      const pts = this.WAI_POINTS[r.clueIdx] || 200;
      this.eng.recordAnswer(q.question_id, { correct: true, ms: Date.now() - r.qStart, mode: 'wai' });
      const log = [...r.log, { qid: q.question_id, q: 'Who am I? — ' + q.name, ok: true, pts, ms: Date.now() - r.qStart, clue: r.clueIdx + 1, correct: q.name, exp: `Solved on clue ${r.clueIdx + 1}.`, wai: 'solved', arName: this.arName(q) }];
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
    const log = [...r.log, { qid: q.question_id, q: 'Who am I? — ' + q.name, ok: false, pts: 0, ms: Date.now() - r.qStart, correct: q.name, exp: timeout ? 'Time ran out.' : 'Out of clues.', wai: timeout ? 'timeout' : 'clues', arName: this.arName(q) }];
    const next = { ...r, phase: 'done', answered: guess || '__timeout', answers: r.answers + 1, streak: 0, log };
    this.setState({ run: next, gain: null });
    setTimeout(() => r.idx + 1 >= r.qs.length ? this.endRun(next) : this.advance(next), 1800);
  }

  endRun(r) {
    const lib = this.state.lib, p = { ...this.state.profile };
    const acc = r.answers ? Math.round(r.correct / r.answers * 100) : 0;
    const key = r.mode === 'team' ? 'team' : r.mode;
    const rec = { ...(p.records || {}) }, prev = rec[key] || { score: 0, best: 0, answers: 0 };
    const byScore = ['buzz', 'q20', 'daily', 'wai', 'h2h'].includes(r.mode);
    const metric = byScore ? r.score : r.best;
    const prevMetric = byScore ? prev.score : prev.best;
    const isRecord = metric > prevMetric && prevMetric > 0;
    rec[key] = { score: Math.max(prev.score, r.score), best: Math.max(prev.best, r.best), answers: Math.max(prev.answers, r.answers) };
    p.records = rec; p.games++; p.totalQ += r.answers; p.totalCorrect += r.correct;
    p.totalMs += r.log.reduce((a, x) => a + (x.ms || 0), 0);
    p.bestStreak = Math.max(p.bestStreak || 0, r.best);
    p.fast += r.log.filter(x => x.ok && x.ms != null && x.ms < 3000).length;
    if (r.mode === 'streak') p.lastStreak = r.best;
    if (r.mode === 'daily') p.lastDaily = { date: new Date().toISOString().slice(0, 10), correct: r.correct, of: r.answers };
    if (r.mode === 'team') { p.teamCorrect = (p.teamCorrect || 0) + r.correct; p.teamBest = Math.max(p.teamBest || 0, r.best); }
    if (r.mode === 'wai') { p.mysterySolved = (p.mysterySolved || 0) + r.correct; p.lastWai = r.correct; }
    p.catCorrect = { ...(p.catCorrect || {}) }; r.log.forEach(x => { if (x.ok && x.cat) p.catCorrect[x.cat] = (p.catCorrect[x.cat] || 0) + 1; });
    const held = p.badges || [];
    const newBadges = this.BADGES.filter(([k, , , test]) => test(p) && !held.includes(k)).map(([k]) => k);
    p.badges = this.BADGES.filter(([k, , , test]) => test(p) || held.includes(k)).map(([k]) => k);
    p.recentBadges = newBadges.length ? newBadges : p.recentBadges;
    this.save(p);
    this.beep(170, .45, 'triangle', .08);
    const done = { ...r, acc, isRecord, prevBest: prevMetric, survived: Math.round((Date.now() - (r.started || r.qStart)) / 1000) };
    const uid = this.state.user && this.state.user.id;
    if (uid && this.state.account) cloud.recordRun(uid, done).then(() => this.refreshRanks());
    else if (!r.challenge) cloud.logGuestRun(done).catch(() => {});
    if (r.challenge) { this.setState({ run: done }); return this.completeChallenge(done); }
    if (r.mode === 'h2h') { this.setState({ run: done }); return this.createChallenge(done); }
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
    if (!this.state.user || !this.state.account) { this._pendingCode = code; return this.setState({ screen: 'auth', authMode: 'register', reg: true, authErrs: [{ k: 'errors.accept_battle', v: { code } }] }); }
    const res = await cloud.challengeByCode(code);
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    const c = res.challenge;
    if (c.creator_id === this.state.user.id) return this.setState({ screen: 'h2h', h2hError: { k: 'errors.own_battle' } });
    if (c.status === 'completed') return this.setState({ screen: 'h2h', h2hError: { k: 'errors.already_played' } });
    if (Date.parse(c.expires_at) < Date.now()) return this.setState({ screen: 'h2h', h2hError: { k: 'errors.expired' } });
    const names = await cloud.usernamesFor([c.creator_id]);
    this.setState({ screen: 'h2h-intro', activeChallenge: this.toChallenge(c, names), h2hError: '' });
  }
  async createChallenge(r) {
    const uid = this.state.user && this.state.user.id; if (!uid || !this.state.account) return this.setState({ screen: 'welcome', reg: true });
    // The challenger's exact questions, then spares from the same pool so
    // the opponent can go further than the challenger did.
    // Only questions every player's device has (no team deep-dives).
    const shared = id => { const q = this.eng.byId(id); return q && !(q.team_id && /^Team (seasons|games|playoffs)$/.test(q.category)); };
    const ids = r.log.map(x => x.qid).filter(Boolean).filter(shared);
    // A streak challenge also carries spares so the opponent can go further.
    const spares = r.mode === 'h2h' ? [] : this.eng.shuffle(this.eng.eligible({ mode: 'h2h', sessionUsed: new Set(ids), ignoreHistory: true })).slice(0, 30).map(x => x.question_id);
    this.setState({ busy: true });
    const res = await cloud.createChallenge({ creator_id: uid, mode: r.mode, team_id: r.teamId || null, seed: r.seed, question_ids: [...ids, ...spares],
      creator_score: r.score, creator_stat: r.mode === 'buzz' ? r.answers : r.mode === 'h2h' ? r.correct : r.best });
    this.setState({ busy: false });
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    this.setState({ screen: 'h2h-made', activeChallenge: this.toChallenge(res.challenge, { [uid]: this.state.account.username }), copied: false });
    this.refreshChallenges();
  }
  async completeChallenge(r) {
    const ch = r.challenge;
    const res = await cloud.completeChallenge(ch.code, r.score, r.mode === 'h2h' ? r.correct : r.best);
    if (res.error) return this.setState({ screen: 'h2h', h2hError: res.error });
    const names = await cloud.usernamesFor([res.challenge.creator_id, res.challenge.opponent_id]);
    const done = this.toChallenge(res.challenge, names);
    if (done.result === 'won') { const p = { ...this.state.profile, h2hWins: (this.state.profile.h2hWins || 0) + 1 }; this.save(p); }
    this.setState({ screen: 'h2h-result', activeChallenge: done, copied: false });
    this.refreshChallenges();
  }
  // Screens that show live data fetch it when you open them.
  onEnter(screen) {
    if (this.state.poolExhausted) this.setState({ poolExhausted: false });
    if (screen === 'board') this.refreshBoard();
    if (screen === 'h2h' || screen === 'profile') this.refreshChallenges();
    if (screen === 'home') this.refreshRanks();
  }
  challengeLink(code) { return `${location.origin}${location.pathname}?c=${code}`; }
  shareText() {
    const r = this.state.run, url = this.props.shareUrl ?? '20-0.app', name = this.props.appName ?? 'NBA Trivia';
    const a = this.state.account, who = a ? '@' + a.username : t('share.me');
    if (!r) return `${name} — ${url}`;
    if (r.mode === 'buzz') return t('share.text_buzz', { app: name, who, answers: r.answers, points: this.fmt(r.score), url });
    return t('share.text_streak', { app: name, who, best: r.best, url });
  }
  // A message to show: a key ({ k, v }) or text; English text from the server is matched to its key.
  tr(m) {
    if (!m) return '';
    if (typeof m === 'object') return t(m.k, m.v || {});
    const errs = english().errors || {}, key = Object.keys(errs).find(k => errs[k] === m);
    return key ? t('errors.' + key) : m;
  }
  async changeLang(l) { await setLang(l); this.forceUpdate(); if (l === 'ar' && !this._bankAr) this.ensureArabic(); }

  // ── leaderboard ──
  rows() {
    const s = this.state, T = s.teams; if (!T) return [];
    const uid = s.user && s.user.id;
    return (s.board || []).map(b => {
      const rank = Number(b.rank), tm = b.favorite_team ? T.teamById(b.favorite_team) : null;
      return { rank: String(rank), medal: rank <= 3 ? String(rank) : false, top: rank <= 3, name: this.at(b.username), initial: String(b.username).slice(0, 1).toUpperCase(),
        team: tm ? this.teamFull(tm) : t('ranks.no_team'), value: b.value, me: b.user_id === uid };
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
    const s = this.state, p = s.profile || {}, T = s.teams, a = s.account, r = s.run, eng = this.eng, t_ = translate;
    const appName = this.props.appName ?? 'NBA Trivia';
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
    const yes = v => v ? 'true' : 'false';
    const initial = n => String(n || '?').replace(/^@/, '').slice(0, 1).toUpperCase();
    const chipFor = id => { const hex = TEAM_HEX[id]; return hex ? `background:${hex};color:${inkOn(hex)}` : ''; };
    const myChip = t ? chipFor(t.id) : '';
    const L = strings(), lang = getLang(), tn = x => this.teamNick(x), tf = x => this.teamFull(x);
    const LABEL = L.tiers, SHORT = L.tiers_short;
    const best = p.bestStreak || 0;
    let cum = 0;
    const ladderSteps = LADDER.map(([tier, size]) => { const start = cum; cum += size === Infinity ? 0 : size;
      return { tier, label: LABEL[tier], short: SHORT[tier], count: size === Infinity ? t_('ladder.until_miss') : t_('ladder.count', { count: size }), done: size === Infinity ? best > start : best >= cum }; });
    const today = new Date().toISOString().slice(0, 10);
    const dailyDone = !!(p.lastDaily && p.lastDaily.date === today);

    // ── game view ──
    const q = r && r.q;
    const isWai = r && r.mode === 'wai';
    const limit = r ? this.limitFor(r.mode) : this.Q_LIMIT;
    const answered = r && r.answered !== null;
    const liveMs = r && !answered ? Math.max(0, (r.mode === 'buzz' ? r.time : limit) - (Date.now() - r.qStart)) : (r ? (r.mode === 'buzz' ? r.time : limit) : 0);
    const urgent = !!(r && !answered && liveMs < 5000);
    const letters = lang === 'ar' ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
    // Arabic mode reads the question's Arabic layer (answers are still checked in English).
    // In Arabic text a hyphen doesn't join two numbers ("1981-82" would show as "82-1981"),
    // so seasons and year ranges go in a left-to-right isolate.
    const AR = lang === 'ar', bidi = x => (AR && typeof x === 'string' ? x.replace(/\d+(?:-\d+)+/g, m => '\u2066' + m + '\u2069') : x);
    const qa = AR && q && q.ar ? q.ar : null, say = o => bidi((qa && qa.o && qa.o[o]) || o);
    const shown = q && !isWai ? bidi(((qa && qa.q) || q.text).split('|').join(' ')) : '';
    const logView = x => {
      if (x.wai) { const name = (AR && x.arName) || x.correct;
        return { q: `${L.game.who_am_i} — ${name}`, correct: name, exp: x.wai === 'solved' ? t_('game.solved_on', { n: x.clue }) : x.wai === 'timeout' ? L.game.time_ran_out : L.game.out_of_clues }; }
      const a = AR && x.ar; return { q: bidi(a ? a.q : x.q), correct: bidi(a ? a.correct : x.correct), exp: bidi(a ? a.e : x.exp) };
    };
    const ok = !!(answered && q && (isWai ? r.log[r.log.length - 1] && r.log[r.log.length - 1].ok : r.answered === q.correct));
    const answers = q && q.options ? q.options.map((o, i) => {
      const isC = isWai ? o === q.name : o === q.correct, chosen = r.answered === o, gone = isWai && r.wrongOpts.includes(o);
      const state = gone ? 'gone' : !answered ? 'idle' : isC ? 'right' : chosen ? 'wrong' : 'dim';
      return { letter: letters[i], text: say(o), state, disabled: answered || gone, isRight: state === 'right', isWrong: state === 'wrong', pick: () => isWai ? this.waiGuess(o) : this.answer(o) };
    }) : [];
    const clueRows = isWai && q ? q.clues.slice(0, r.clueIdx + 1).map((c, i) => {
      const locked = false;
      return { n: i + 1, locked, isNew: i === r.clueIdx && i > 0, isText: !locked && c.type === 'text', isPath: !locked && c.type === 'path', isNumbers: !locked && c.type === 'numbers', isAwards: !locked && c.type === 'awards',
        text: bidi(AR && typeof c.ar === 'string' ? c.ar : c.content), numbers: c.numbers || [], list: (AR && Array.isArray(c.ar) ? c.ar : c.list || []).map(bidi),
        teams: (AR && c.ar && c.ar.teams ? c.ar.teams : c.teams || []).map(name => ({ name })) };
    }) : [];
    const modeName = m => m === 'team' ? (t ? tn(t) : L.modes.team) : (L.modes[m] || m);
    const climbs = r && ['streak', 'team', 'buzz'].includes(r.mode);
    const stage = climbs && eng ? eng.ladderStage(r.correct) : null;
    const lastLog = r && r.log[r.log.length - 1];
    const tierKey = stage ? stage.tier : q && q.diff ? q.diff : '';
    const segs = !r ? [] : stage ? (stage.size === Infinity ? [true] : Array.from({ length: stage.size }, (_, i) => i < stage.n - 1))
      : r.qs ? Array.from({ length: r.qs.length }, (_, i) => i < r.idx + (answered ? 1 : 0)) : [];
    const timePct = !r ? 0 : r.mode === 'buzz' ? Math.min(100, liveMs / this.BUZZ_CAP * 100) : liveMs / limit * 100;
    const pointsMode = r && ['buzz', 'q20', 'daily', 'h2h', 'wai'].includes(r.mode);

    // ── result view ──
    const isStreaky = r && (r.mode === 'streak' || r.mode === 'team');
    const reached = r && climbs && eng ? eng.ladderStage(r.correct) : null;
    const resultStats = r ? (isStreaky
      ? [[L.result.accuracy, r.acc + '%'], [L.result.best, best], [L.result.global, globalRank], [L.result.team, teamRank]]
      : [[L.result.right, `${r.correct}/${r.answers}`], [L.result.accuracy, r.acc + '%'], [L.result.best_run, r.best], [L.result.fastest, r.fastest != null ? (r.fastest / 1000).toFixed(1) + 's' : '—']]
    ).map(([label, value]) => ({ label, value })) : [];
    const CONF = ['#ffc53d', '#ff6a1a', '#2fd47a', '#38bdf8', '#a78bfa', '#f472b6'];
    const confetti = Array.from({ length: 28 }, (_, i) => `left:${(i * 37) % 100}%;background:${CONF[i % CONF.length]};animation-delay:${(i % 7) * 0.12}s;transform:rotate(${i * 29}deg)`);

    const navDefs = [[L.nav.home, 'home', '#i-home'], [L.nav.battles, 'h2h', '#i-swords'], [L.nav.ranks, 'board', '#i-trophy'], [L.nav.profile, 'profile', '#i-user']];
    const tabOf = { home: 'home', play: 'home', result: 'home', share: 'home', teamhub: 'home', teampick: 'home', h2h: 'h2h', 'h2h-intro': 'h2h', 'h2h-made': 'h2h', 'h2h-result': 'h2h', board: 'board', profile: 'profile', username: 'profile', admin: 'profile' };
    const nav = navDefs.map(([label, target, icon]) => ({ label, icon, current: tabOf[sc] === target ? 'page' : false,
      badge: target === 'h2h' && inbox.length > 0, badgeCount: inbox.length,
      pick: () => { this.setState({ screen: target, reg: false, hubFrom: 'home', copied: false, h2hError: '' }); this.onEnter(target); } }));
    const uchk = this.unameCheck(s.unameDraft);
    const regStep = sc === 'username' ? 0 : sc === 'teampick' ? 1 : 2;
    const teamList = T ? T.TEAMS.filter(x => { const v = (s.teamSearch || '').toLowerCase().trim(); return !v || (T.fullName(x) + ' ' + tf(x) + ' ' + x.id + ' ' + x.conf).toLowerCase().includes(v); }).map(x => ({
      city: (L.team_names[x.id] || [x.city])[0], name: tn(x), abbr: x.id.toUpperCase(), chip: chipFor(x.id), selected: s.teamDraft === x.id, pressed: yes(s.teamDraft === x.id), pick: () => this.setState({ teamDraft: x.id }) })) : [];
    const draftT = T && s.teamDraft ? T.teamById(s.teamDraft) : null;
    const ch = s.activeChallenge;
    const meIsCreator = !!(ch && ch.dir === 'out');
    // Buzz and battles are decided by points; streak challenges by streak length.
    const byPoints = !!(ch && (ch.mode === 'buzz' || ch.mode === 'h2h'));
    const creatorVal = ch ? (byPoints ? ch.creatorScore : ch.creatorStat) : 0;
    const oppVal = ch && ch.status === 'completed' ? (byPoints ? ch.opponentScore : ch.opponentStat) : 0;
    const chMine = meIsCreator ? creatorVal : oppVal, chTheirs = meIsCreator ? oppVal : creatorVal;
    const theirName = ch ? (meIsCreator ? (ch.opponent || L.battles.opponent) : ch.creator) : '';
    const creatorWon = !!(ch && (meIsCreator ? ch.result === 'won' : ch.result === 'lost'));
    const hubCats = ['All', 'Team history', 'Franchise legends', 'Championships', 'Franchise records', 'Arenas'];
    const boardRows = this.rows();
    const social = cloud.providerEnabled('apple') || cloud.providerEnabled('google');
    const goAuth = mode => () => this.setState({ screen: 'auth', authMode: mode, authErrs: [], authFrom: REG.includes(sc) ? 'welcome' : sc });
    const changeTeam = () => this.setState({ screen: 'teampick', reg: false, teamDraft: this.teamId(), hubFrom: sc === 'profile' ? 'profile' : sc === 'teamhub' ? 'teamhub' : 'home', teamSearch: '' });
    const goTeamHub = () => this.setState({ screen: t ? 'teamhub' : 'teampick', reg: false, teamDraft: this.teamId(), hubFrom: 'home', teamSearch: '' });
    const ms = s.milestone;

    return {
      appName, screenName: sc, L,
      otherLang: lang === 'ar' ? 'en' : 'ar', toggleLang: () => this.changeLang(lang === 'ar' ? 'en' : 'ar'),
      langOpts: ['en', 'ar'].map(code => ({ code, label: L.lang[code], on: yes(lang === code), pick: () => this.changeLang(code) })),
      showNav: (!REG.includes(sc) || ((sc === 'teampick' || sc === 'username') && !s.reg)) && sc !== 'game',
      navItems: nav, showSideCta: sc !== 'game',
      showLoading: !!s.loadingRun && sc !== 'game',

      atWelcome: sc === 'welcome', atAuth: sc === 'auth', atUsername: sc === 'username', atTeamPick: sc === 'teampick', atReady: sc === 'ready',
      atHome: sc === 'home' || sc === 'play', atGame: sc === 'game', atResult: sc === 'result', atShare: sc === 'share',
      atBoard: sc === 'board', atTeamHub: sc === 'teamhub', atProfile: sc === 'profile',
      atH2H: sc === 'h2h', atH2HIntro: sc === 'h2h-intro', atH2HMade: sc === 'h2h-made', atH2HResult: sc === 'h2h-result',
      goHome: go('home'), goBoard: go('board'), goH2H: go('h2h'), goProfile: go('profile'), goShare: go('share'),

      // ── welcome & sign-up ──
      socialOn: social, hasApple: cloud.providerEnabled('apple'), hasGoogle: cloud.providerEnabled('google'),
      authApple: () => this.startSocial('apple'), authGoogle: () => this.startSocial('google'),
      goAuthEmail: goAuth('register'), goSignIn: goAuth('signin'),
      backToWelcome: () => this.setState({ screen: s.authFrom && s.authFrom !== 'auth' ? s.authFrom : 'welcome', authErrs: [] }),
      playGuest: () => { this.setState({ screen: 'home', guest: true }); this.onEnter('home'); },
      authTitle: s.authMode === 'signin' ? L.auth.title_signin : L.auth.title_signup,
      authSub: s.authMode === 'signin' ? L.auth.sub_signin : L.auth.sub_signup,
      authTabs: [[L.auth.tab_signup, 'register'], [L.auth.tab_signin, 'signin']].map(([label, mode]) => ({ label, on: yes((s.authMode === 'signin') === (mode === 'signin')), pick: () => this.setState({ authMode: mode, authErrs: [] }) })),
      authCta: s.busy ? L.auth.busy : s.authMode === 'signin' ? L.auth.cta_signin : L.auth.cta_signup,
      passAutocomplete: s.authMode === 'signin' ? 'current-password' : 'new-password',
      authEmail: s.authEmail, setAuthEmail: e => this.setState({ authEmail: e.target.value, authErrs: [] }),
      authPass: s.authPass, setAuthPass: e => this.setState({ authPass: e.target.value, authErrs: [] }),
      authKey: e => { if (e.key === 'Enter') this.submitEmailAuth(); },
      authHasErrors: s.authErrs.length > 0, authErrorList: s.authErrs.map(e => this.tr(e)), submitEmailAuth: () => this.submitEmailAuth(), busy: !!s.busy,
      regFlow: !!s.reg, notRegFlow: !s.reg,
      regDots: [0, 1, 2].map(i => i === regStep),
      unameDraft: s.unameDraft, setUname: e => { this.setState({ unameDraft: e.target.value }); this.checkUsernameSoon(e.target.value); },
      unameKey: e => { if (e.key === 'Enter') this.claimUsername(); },
      unameStatus: uchk.msg, unameInvalid: !uchk.ok || !!s.busy, unameOk: !!(s.unameDraft && uchk.ok),
      claimUsername: () => this.claimUsername(),
      teamSearch: s.teamSearch, setTeamSearch: e => this.setState({ teamSearch: e.target.value }), teamList, noTeamsFound: !!T && !teamList.length,
      noTeamChosen: !draftT, teamCta: draftT ? t_('teampick.lock_in', { team: tn(draftT) }) : L.teampick.pick, noTeamText: t_('teampick.none', { query: s.teamSearch || '' }),
      teamPickBack: () => this.setState({ screen: s.hubFrom === 'profile' ? 'profile' : s.hubFrom === 'teamhub' && t ? 'teamhub' : 'home', teamSearch: '' }),
      skipTeam: () => this.setState({ screen: 'ready', teamSearch: '' }),
      saveTeam: () => { if (!s.teamDraft) return; const prof = { ...p, favoriteTeam: s.teamDraft }; this.save(prof); if (a) this.saveAccount({ ...a, favoriteTeam: s.teamDraft }); this.setState({ screen: s.reg ? 'ready' : (s.hubFrom === 'profile' ? 'profile' : 'teamhub'), teamSearch: '' }); this.refreshRanks(); if (s.teamDraft !== this._bankTeam) this.reloadBank(); },
      readyLine: t ? t_('ready.line_team', { team: tn(t) }) : L.ready.line, readyTitle: t_('ready.title', { handle: a ? this.at(a.username) : L.common.guest }),
      ladderSteps,

      // ── home ──
      handle: a ? this.at(a.username) : L.common.guest,
      avatarInitial: a ? initial(a.username) : 'G',
      greeting: a ? this.at(a.username) : L.home.playing_guest,
      homeSubline: [t_('home.level', { level }), t ? tn(t) : '', totalQ ? t_('home.right_pct', { pct: acc }) : ''].filter(Boolean).join(' · '),
      globalRank, rankPill: s.ranks.global ? globalRank : L.home.ranks, isMember: !!a, isGuest: !a, isAdmin: !!s.isAdmin,
      myTeamChip: myChip, myTeamAbbr: t ? t.id.toUpperCase() : '—',
      poolExhausted: !!s.poolExhausted, exhaustedMsg: this.tr(s.exhaustedMsg),
      hasInbox: inbox.length > 0, inboxInitial: inbox[0] ? initial(inbox[0].creator) : '',
      inboxTitle: inbox[0] ? t_('home.challenged', { name: this.at(inbox[0].creator) }) : '',
      inboxSub: inbox[0] ? `${modeName(inbox[0].mode)} · ${inbox.length > 1 ? t_('home.more_waiting', { count: inbox.length - 1 }) : L.home.your_move}` : '',
      openInbox: () => inbox[0] && this.setState({ screen: 'h2h-intro', activeChallenge: inbox[0], copied: false }),
      startStreak: () => this.startRun('streak'),
      heroBest: best ? t_('home.best', { n: best }) : '',
      heroPrompt: best ? t_('home.beat', { n: best }) : L.home.how_long,
      heroSub: L.home.hero_sub,
      heroCta: totalQ ? L.home.play_streak : L.home.first_run,
      startDaily: () => { if (!dailyDone) this.startRun('daily'); },
      dailyDone, dailyOpen: !dailyDone,
      dailySub: dailyDone ? L.home.daily_done : L.home.daily_open,
      dailyScore: dailyDone ? `${p.lastDaily.correct}/${p.lastDaily.of}` : '',
      modeTiles: [
        { kind: 'team', isTeam: !!t, isIcon: !t, icon: '#i-jersey', chip: myChip, abbr: t ? t.id.toUpperCase() : '', name: t ? tn(t) : L.modes.your_team, desc: t ? L.modes.team_desc : L.modes.team_locked, hasStat: !!p.teamBest, stat: t_('home.best', { n: p.teamBest || 0 }), pick: goTeamHub },
        { kind: 'buzz', isTeam: false, isIcon: true, icon: '#i-bolt', name: L.modes.buzz, desc: L.modes.buzz_desc, hasStat: !!rec.buzz, stat: rec.buzz ? this.fmt(rec.buzz.score) : '', pick: () => this.startRun('buzz') },
        { kind: 'q20', isTeam: false, isIcon: true, icon: '#i-list', name: L.modes.q20, desc: L.modes.q20_desc, hasStat: !!rec.q20, stat: rec.q20 ? this.fmt(rec.q20.score) : '', pick: () => this.startRun('q20') },
        { kind: 'wai', isTeam: false, isIcon: true, icon: '#i-mystery', name: L.modes.wai, desc: L.modes.wai_desc, hasStat: !!rec.wai, stat: rec.wai ? this.fmt(rec.wai.score) : '', pick: () => this.startRun('wai') }
      ],
      goTeamHub,

      // ── game ──
      urgent,
      quitGame: () => { const uid = s.user && s.user.id; if (uid && a && r) cloud.recordHistory(uid, r.mode, r.log); this.setState({ screen: 'home', run: null }); },
      tierKey, tierName: isWai && !q ? L.modes.wai : (LABEL[tierKey] || modeName(r ? r.mode : '')),
      hasStageCount: !!r, stageCount: !r ? '' : stage ? (stage.size === Infinity ? `#${stage.n}` : `${stage.n}/${stage.size}`) : r.qs ? `${r.idx + 1}/${r.qs.length}` : '',
      segs, endless: !!(stage && stage.size === Infinity),
      timerStyle: `width:${timePct.toFixed(1)}%`,
      gameHasClock: !!(r && r.mode === 'buzz'), clock: r ? (liveMs / 1000).toFixed(1) : '',
      showScore: !!pointsMode, scoreText: r ? this.fmt(r.score) : '',
      showStreak: !!(r && !pointsMode), gameStreak: r ? r.streak : 0, hot: !!(r && r.streak >= 3),
      gameVisible: s.qVisible,
      qKicker: q ? (isWai ? t_('game.worth', { kind: q.kind === 'coach' ? L.game.coach : L.game.player, points: this.fmt(this.WAI_POINTS[r.clueIdx] || 200) }) : (L.categories[q.cat] || q.cat)) : '',
      qIsClues: !!isWai, qIsPlain: !isWai,
      qText: shown, qLong: shown.length > (AR ? 80 : 90),
      clueRows,
      showAnswers: !!(q && q.options),
      hasLockedClues: !!(isWai && q && r.clueIdx + 1 < q.clues.length && r.phase !== 'done'),
      lockedCluesText: isWai && q ? t_('game.locked', { count: q.clues.length - r.clueIdx - 1 }) : '',
      showGuessInline: !!(isWai && q && !q.options && r.phase !== 'done'), guessEmpty: !(r && r.guess && r.guess.trim()),
      showNextClue: !!(isWai && q && r.phase !== 'done' && r.clueIdx + 1 < q.clues.length),
      nextClueLabel: isWai && q && r.clueIdx + 1 < q.clues.length ? L.game.next_clue : L.game.no_more_clues,
      answers,
      nextClue: () => this.nextClue(), noMoreClues: !!(isWai && q && r.clueIdx + 1 >= q.clues.length),
      nextClueWorth: isWai && q && r.clueIdx + 1 < q.clues.length ? t_('game.drops', { points: this.fmt(this.WAI_POINTS[r.clueIdx + 1]) }) : L.game.make_guess,
      guessText: r ? r.guess : '', setGuess: e => this.setState({ run: { ...r, guess: e.target.value } }),
      guessKey: e => { if (e.key === 'Enter' && r.guess.trim()) this.waiGuess(r.guess); },
      submitGuess: () => { if (r.guess.trim()) this.waiGuess(r.guess); },
      showGain: !!s.gain, gainPts: s.gain ? s.gain.pts : '', gainExtra: !!(s.gain && s.gain.extra), gainExtraText: s.gain && s.gain.extra,
      showMilestone: !!ms, milestoneTier: ms ? ms.tier : '', milestoneKicker: ms ? (ms.type === 'level' ? L.game.level_up : t_('game.in_a_row', { count: ms.n })) : '',
      milestoneText: ms ? (ms.type === 'level' ? LABEL[ms.tier] : (L.milestones[ms.n] || ms.text)) : '',
      showFeedback: !!answered, feedbackOk: ok, feedbackBad: !!answered && !ok,
      feedbackTitle: ok ? L.game['right_' + ((r.answers || 0) % 4)] : (r && r.answered === '__timeout' ? L.game.time_up : L.game.not_quite),
      feedbackHasTrail: !!(ok && isStreaky), feedbackTrail: r ? t_('game.in_a_row', { count: r.streak }) : '',
      feedbackSub: !lastLog ? '' : (lv => ok ? (lv.exp || '') : t_('game.answer', { answer: lv.correct }) + (lv.exp ? ' — ' + lv.exp : ''))(logView(lastLog)),

      // ── result ──
      resultKicker: r ? (r.exhausted ? L.result.pool_cleared : isStreaky ? (r.mode === 'team' && t ? t_('result.team_over', { team: tn(t) }) : L.result.streak_over) : t_('result.complete', { mode: modeName(r.mode) })) : '',
      resultNumber: r ? (isStreaky ? String(r.best) : this.fmt(s.displayScore)) : '',
      resultLine: r ? (r.exhausted ? t_('result.line_exhausted', { count: r.best }) : isStreaky ? t_('result.line_streak', { count: r.best }) : t_('result.line_points', { correct: r.correct, total: r.answers, points: this.fmt(r.score) })) : '',
      isRecord: !!(r && r.isRecord), prevBest: r ? this.fmt(r.prevBest) : '', newBestText: r ? t_('result.new_best', { prev: this.fmt(r.prevBest) }) : '', confetti,
      hasReached: !!reached, reachedTier: reached ? reached.tier : '', reachedLabel: reached ? LABEL[reached.tier] : '', reachedText: reached ? t_('result.reached', { level: LABEL[reached.tier] }) : '',
      resultStats,
      playAgain: () => r && this.startRun(r.mode, { cat: r.cat }),
      canChallenge: !!(r && !r.challenge && a && ['streak', 'buzz', 'team'].includes(r.mode) && r.log.length),
      cantChallenge: !(r && !r.challenge && a && ['streak', 'buzz', 'team'].includes(r.mode) && r.log.length),
      challengeFriend: () => r && this.createChallenge(r),
      hasNewBadges: s.newBadges.length > 0, newBadgesText: s.newBadges.map(k => (L.badges[k] && L.badges[k].name) || k).join(lang === 'ar' ? '، ' : ', '),
      reviewCount: r ? `${r.correct}/${r.answers}` : '',
      reviewRows: r ? r.log.map(x => { const v = logView(x); return { ok: !!x.ok, bad: !x.ok, q: v.q, detail: x.ok ? (v.exp || L.result.correct) : (x.chosen === '__timeout' ? L.result.timeout : '') + t_('game.answer', { answer: v.correct }), pts: x.pts ? '+' + this.fmt(x.pts) : '0' }; }) : [],

      // ── share ──
      shareBack: () => this.setState({ screen: r ? 'result' : 'home' }),
      shareKicker: r ? (isStreaky ? L.share.streak : modeName(r.mode)) : L.share.best_streak,
      shareNumber: r ? (isStreaky ? r.best : this.fmt(r.score)) : best,
      shareFooter: t ? t_('share.fan', { team: tn(t), level }) : t_('share.level', { level }),
      copyLabel: s.copied ? L.common.copied : L.common.copy,
      shareNative: () => { const text = this.shareText(); if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(text); this.setState({ copied: true }); } },
      copyShare: () => { navigator.clipboard && navigator.clipboard.writeText(this.shareText()); this.setState({ copied: true }); },

      // ── ranks ──
      boardCaption: L.ranks.caption,
      boardScopes: [[L.ranks.global, 'Global'], [L.ranks.your_team, 'Your Team']].map(([label, x]) => ({ label, on: yes(s.scope === x), pick: () => { this.setState({ scope: x }); this.refreshBoard(); } })),
      boardPeriods: ['Today', 'Week', 'All time'].map(x => ({ label: L.ranks[{ Today: 'today', Week: 'week', 'All time': 'all' }[x]], on: yes(s.period === x), pick: () => { this.setState({ period: x }); this.refreshBoard(); } })),
      boardLoadingNow: !!s.boardLoading && !boardRows.length, skeleton: [1, 2, 3, 4, 5, 6],
      boardHasRows: boardRows.length > 0, boardRows,
      boardNone: !s.boardLoading && !boardRows.length,
      boardNoneTitle: s.scope === 'Your Team' && !t ? L.ranks.pick_first : L.ranks.nobody,
      boardNoneLine: s.scope === 'Your Team' && !t ? L.ranks.pick_line : t_(`ranks.none_${s.scope === 'Your Team' ? 'team' : 'streak'}_${{ Today: 'today', Week: 'week' }[s.period] || 'all'}`, { team: t ? tn(t) : '' }),
      boardNoneCta: s.scope === 'Your Team' && !t ? L.ranks.choose_team : s.scope === 'Your Team' ? t_('ranks.play_team', { team: tn(t) }) : L.ranks.play_streak,
      boardNoneAction: () => s.scope === 'Your Team' && !t ? changeTeam() : s.scope === 'Your Team' ? this.startRun('team') : this.startRun('streak'),
      myRank: (() => { const me = boardRows.find(x => x.me); return me ? me.rank : '—'; })(),
      myRankSub: a ? this.at(a.username) : L.ranks.sign_up_ranked,
      myRankValue: (() => { const me = boardRows.find(x => x.me); return me ? me.value : '—'; })(),

      // ── team hub ──
      goTeamPick: changeTeam,
      hubVars: t ? `--team:${TEAM_HEX[t.id] || '#ff6a1a'}` : '',
      hubHeadline: t ? t_('hub.headline', { team: tn(t) }) : L.hub.pick,
      hubStats: [[L.hub.best_run, p.teamBest || 0], [L.hub.answered, p.teamCorrect || 0], [L.hub.team_rank, teamRank]].map(([label, value]) => ({ label, value })),
      hubCats: hubCats.map(c => ({ label: L.hub.cats[c] || c, on: yes(s.teamCat === c), pick: () => this.setState({ teamCat: c }) })),
      hubCta: t ? t_('hub.play', { team: tn(t) }) : L.hub.pick,
      hubLadder: L.hub.ladder,
      startTeamRun: () => this.startRun('team', { cat: s.teamCat }),

      // ── profile ──
      changeTeam,
      teamLinkLabel: t && T ? tf(t) : L.profile.choose_team,
      teamMenuLabel: t ? L.profile.change_team : L.profile.choose_team,
      level, levelText: t_('profile.level', { level }), xpLine: t_('profile.to_next', { n: 25 - xpInto, next: level + 1 }), xpWidth: `width:${xpInto / 25 * 100}%`,
      profileStats: [[L.profile.stats.best_streak, best], [L.profile.stats.accuracy, totalQ ? acc + '%' : '—'], [L.profile.stats.games, p.games || 0], [L.profile.stats.questions, this.fmt(totalQ)], [L.profile.stats.team_best, p.teamBest || 0], [L.profile.stats.top_category, (c => L.categories[c] || c)((Object.entries(p.catCorrect || {}).sort((x, y) => y[1] - x[1])[0] || ['—'])[0])]].map(([label, value]) => ({ label, value })),
      badgeCount: t_('profile.of', { n: (p.badges || []).length, total: this.BADGES.length }),
      badges: this.BADGES.map(([k, name, desc]) => { const on = (p.badges || []).includes(k), b = L.badges[k] || {}; return { name: b.name || name, desc: b.desc || desc, on, off: !on }; }),
      toggleSound: () => { const v = !s.sound; try { localStorage.setItem('v2_sound', v ? '1' : '0'); } catch (e) {} this.setState({ sound: v }); if (v) this.beep(880, .08, 'sine', .05); },
      soundOn: !!s.sound, soundIcon: s.sound ? '#i-sound' : '#i-mute',
      engineSummaryLine: eng ? `${this.fmt(eng.bankSummary().active)} active · ${this.fmt(eng.bankSummary().seen)} seen` : L.profile.loading,
      changeUsername: () => this.setState({ screen: 'username', reg: false, unameDraft: a ? a.username : '' }),
      signOut: async () => { await cloud.signOut(); if (this.eng) this.eng.useHistoryOf(null); this.setState({ screen: 'welcome', guest: false, authEmail: '', authPass: '', user: null, account: null, isAdmin: false, challenges: [], ranks: { global: null, team: null }, profile: this.localProfile(null) }); },

      // ── admin · question engine ──
      ...this.adminVals(),

      // ── battles ──
      wins, losses, ties,
      startBattle: () => a ? this.startRun('h2h') : this.setState({ screen: 'auth', authMode: 'register', reg: true, authFrom: 'h2h', authErrs: [{ k: 'errors.start_battle' }] }),
      battleCta: a ? L.battles.start : L.battles.sign_up_to,
      h2hCode: s.h2hCode, setH2HCode: e => this.setState({ h2hCode: e.target.value.toUpperCase(), h2hError: '' }),
      codeKey: e => { if (e.key === 'Enter') { const code = s.h2hCode.trim().toUpperCase(); if (code) this.redeem(code); } },
      redeemCode: () => { const code = s.h2hCode.trim().toUpperCase(); if (code) this.redeem(code); },
      h2hHasError: !!s.h2hError, h2hError: this.tr(s.h2hError),
      h2hEmpty: chList.length === 0,
      h2hRows: chList.map(c => {
        const who = c.dir === 'in' ? c.creator : (c.opponent || '');
        const kind = c.status === 'completed' ? (c.result === 'won' ? 'won' : c.result === 'lost' ? 'lost' : 'tied') : c.status === 'expired' ? 'expired' : c.dir === 'in' ? 'play' : 'sent';
        return { code: c.code, initial: who ? initial(who) : '?', opponent: who ? this.at(who) : L.battles.waiting, mode: modeName(c.mode), kind,
          result: { won: L.battles.won, lost: L.battles.lost, tied: L.battles.tied, expired: L.battles.expired, play: L.battles.your_turn, sent: L.battles.sent }[kind],
          sub: c.status === 'completed' ? `${this.fmt(c.dir === 'out' ? c.creatorScore : c.opponentScore)} – ${this.fmt(c.dir === 'out' ? c.opponentScore : c.creatorScore)}` : c.code,
          open: () => this.setState({ screen: c.status === 'completed' ? 'h2h-result' : c.dir === 'out' ? 'h2h-made' : 'h2h-intro', activeChallenge: c, copied: false }) };
      }),
      chKicker: ch ? (ch.mode === 'h2h' ? L.battles.result : t_('battles.mode_battle', { mode: modeName(ch.mode) })) : '', chCreator: ch ? this.at(ch.creator) : '', chThinks: ch ? t_('battles.thinks', { name: this.at(ch.creator) }) : '', chCreatorInitial: ch ? initial(ch.creator) : '', chModeLabel: ch ? modeName(ch.mode) : '', chCodeLabel: ch ? ch.code : '',
      chDeepLink: ch ? this.challengeLink(ch.code).replace(/^https?:\/\//, '') : '',
      chAccept: () => { if (!a) return this.setState({ screen: 'welcome', reg: true }); this.startRun(ch.mode, { challenge: ch }); },
      chShare: () => { const text = ch && ch.status === 'completed' ? t_('battles.share_done', { app: appName, a: '@' + ch.creator, sa: this.fmt(creatorVal), b: '@' + ch.opponent, sb: this.fmt(oppVal), link: this.challengeLink(ch.code) }) : t_('battles.share_open', { score: ch ? this.fmt(creatorVal) : '', app: appName, code: ch ? ch.code : '', link: ch ? this.challengeLink(ch.code) : '' }); if (navigator.share) navigator.share({ text }).catch(() => {}); else { navigator.clipboard && navigator.clipboard.writeText(text); this.setState({ copied: true }); } },
      chCopy: () => { navigator.clipboard && navigator.clipboard.writeText(ch ? this.challengeLink(ch.code) : ''); this.setState({ copied: true }); },
      chWon: !!(ch && ch.result === 'won'), chLost: !!(ch && ch.result === 'lost'),
      chResultTitle: ch && ch.result === 'won' ? L.battles.you_win : ch && ch.result === 'lost' ? L.battles.you_lose : L.battles.dead_heat,
      chResultSub: ch ? (ch.result === 'won' ? t_(byPoints ? 'battles.beat_by_points' : 'battles.beat_by', { name: this.at(theirName), diff: this.fmt(Math.abs(chMine - chTheirs)) }) : ch.result === 'lost' ? t_(byPoints ? 'battles.edged_points' : 'battles.edged', { name: this.at(theirName), diff: this.fmt(Math.abs(chTheirs - chMine)) }) : t_('battles.both', { score: this.fmt(chMine) })) : '',
      chScores: ch ? [{ name: this.at(ch.creator), initial: initial(ch.creator), value: this.fmt(creatorVal), win: creatorWon }, { name: ch.opponent ? this.at(ch.opponent) : L.battles.you_handle, initial: initial(ch.opponent || L.battles.you_handle), value: this.fmt(oppVal), win: ch.result !== 'tied' && !creatorWon && ch.status === 'completed' }] : [],
      chRematch: () => ch && this.startRun(ch.mode)
    };
  }
}

// Team colours for the three-letter marks (no logos).
const TEAM_HEX = { atl: '#E03A3E', bos: '#007A33', bkn: '#4b4b55', cha: '#00788C', chi: '#CE1141', cle: '#860038', dal: '#00538C', den: '#FEC524', det: '#1D42BA', gsw: '#1D428A',
  hou: '#CE1141', ind: '#FDBB30', lac: '#C8102E', lal: '#552583', mem: '#5D76A9', mia: '#98002E', mil: '#00471B', min: '#236192', nop: '#85714D', nyk: '#006BB6',
  okc: '#007AC1', orl: '#0077C0', phi: '#ED174C', phx: '#E56020', por: '#E03A3E', sac: '#5A2D81', sas: '#C4CED4', tor: '#CE1141', uta: '#753BBD', was: '#E31837' };
function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] > .4 ? '#14110c' : '#ffffff';
}
// The climb (mirrors engine.js LADDER, which loads later than the menus).
const LADDER = [['easy', 5], ['medium', 5], ['hard', 7], ['hardest', 10], ['hall_of_fame', 15], ['goat', Infinity]];

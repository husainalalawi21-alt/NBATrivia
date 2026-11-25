// fetch.mjs — download NBA history from balldontlie into tools/.cache (resumable).
//
//   node tools/fetch.mjs [postseason|players|regular|recent] [fromSeason] [toSeason]
//
// The API key is never read here: the environment's network proxy adds it to
// requests for api.balldontlie.io. The free plan allows 5 requests a minute,
// so requests are spaced 15 s apart and every page is cached the moment it
// lands — rerunning skips anything already on disk.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.balldontlie.io/v1';
const CACHE = join(dirname(fileURLToPath(import.meta.url)), '.cache');
const GAP_MS = 15000;
mkdirSync(CACHE, { recursive: true });

let last = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(path) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = last + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(API + path, { headers: { Authorization: process.env.BALLDONTLIE_KEY || 'proxy-injected' } });
    if (res.status === 429) { console.log('  rate limited, waiting 65 s'); await sleep(65000); continue; }
    if (res.status >= 500) { console.log('  server', res.status, '— retrying'); await sleep(20000); continue; }
    if (!res.ok) throw new Error(`${res.status} ${path}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  throw new Error('gave up on ' + path);
}

// Every page of a cursor-paginated listing, cached page by page.
async function all(name, path) {
  const out = [];
  let cursor = null, page = 0;
  while (true) {
    const file = join(CACHE, `${name}.p${page}.json`);
    let body;
    if (existsSync(file)) body = JSON.parse(readFileSync(file, 'utf8'));
    else {
      body = await get(path + (path.includes('?') ? '&' : '?') + 'per_page=100' + (cursor ? `&cursor=${cursor}` : ''));
      writeFileSync(file, JSON.stringify(body));
    }
    out.push(...body.data);
    cursor = body.meta && body.meta.next_cursor;
    if (!cursor) break;
    page++;
  }
  writeFileSync(join(CACHE, `${name}.json`), JSON.stringify(out));
  return out;
}

const [what = 'postseason', from = '1946', to] = process.argv.slice(2);
const current = new Date().getUTCMonth() >= 9 ? new Date().getUTCFullYear() : new Date().getUTCFullYear() - 1; // season starts in October
const last_ = Number(to || current);

if (!existsSync(join(CACHE, 'teams.json'))) writeFileSync(join(CACHE, 'teams.json'), JSON.stringify((await get('/teams')).data));

if (what === 'players') {
  const p = await all('players', '/players');
  console.log('players', p.length);
} else if (what === 'recent') {
  // Last 10 days of games (the weekly top-up uses the same call shape).
  const end = new Date(), start = new Date(Date.now() - 10 * 864e5);
  const d = x => x.toISOString().slice(0, 10);
  const g = await all(`recent-${d(end)}`, `/games?start_date=${d(start)}&end_date=${d(end)}`);
  console.log('recent games', g.length);
} else {
  const post = what === 'postseason';
  for (let s = Number(from); s <= last_; s++) {
    const name = `games-${s}-${post ? 'post' : 'reg'}`;
    if (existsSync(join(CACHE, name + '.json')) && s < current) { continue; }
    const g = await all(name, `/games?seasons[]=${s}&postseason=${post}`);
    console.log(name, g.length, new Date().toISOString().slice(11, 19));
  }
}
console.log('done', what);

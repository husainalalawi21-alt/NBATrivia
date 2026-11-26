// fetch-kaggle.mjs — download the NBA Database tables the bank uses.
//
//   NODE_USE_ENV_PROXY=1 node tools/fetch-kaggle.mjs
//
// Source: https://www.kaggle.com/datasets/wyattowalsh/basketball (CC BY-SA 4.0).
// Only the small CSVs are fetched (not the 2.3 GB SQLite / play-by-play).
// The Kaggle API key is added by the environment's network proxy; it never
// appears here. Files land in tools/.cache/kaggle/ (git-ignored).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '.cache', 'kaggle');
const FILES = ['draft_history', 'common_player_info', 'team', 'game'];
mkdirSync(OUT, { recursive: true });
for (const f of FILES) {
  const res = await fetch(`https://www.kaggle.com/api/v1/datasets/download/wyattowalsh/basketball/csv%2F${f}.csv`, {
    headers: { Authorization: 'Basic proxy-injected' } });
  if (!res.ok) throw new Error(`${f}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  writeFileSync(join(OUT, f + '.csv'), text);
  console.log(f, text.split('\n').length - 1, 'rows');
}

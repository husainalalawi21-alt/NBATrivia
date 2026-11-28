// Copies the web game (the folder above) into www/, which the iPhone app ships.
// Only what the game loads: no build tools, database migrations or reviews.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), app = join(here, '..', '..'), www = join(here, '..', 'www');
rmSync(www, { recursive: true, force: true }); mkdirSync(www, { recursive: true });
const files = ['index.html', 'app.js', 'app.css', 'modernist.css', 'cloud.js', 'config.js', 'dc.js', 'i18n.js', 'CREDITS'];
const dirs = ['data', 'fonts', 'i18n', 'vendor'];
for (const f of files) if (existsSync(join(app, f))) cpSync(join(app, f), join(www, f));
for (const d of dirs) cpSync(join(app, d), join(www, d), { recursive: true, filter: src => !/names-ar[\/\\]|\.tsv$/.test(src.slice(app.length)) });
console.log('www ready:', www);

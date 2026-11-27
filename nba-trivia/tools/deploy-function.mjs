// deploy-function.mjs — deploy the weekly-update Edge Function to Supabase.
//
//   NODE_USE_ENV_PROXY=1 node tools/deploy-function.mjs
//
// Uploads supabase/functions/weekly-update/index.ts together with the shared
// data/generate.js and data/franchises.js (the same rules the backfill uses) and
// data/ar.js with data/names-ar.js (the Arabic of each question).
// The Supabase access token is added by the environment's network proxy.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = process.env.SUPABASE_PROJECT || 'mvsyneqcohupycyehsvp';
const SLUG = 'weekly-update';
const files = {
  'index.ts': join(ROOT, 'supabase/functions', SLUG, 'index.ts'),
  'generate.js': join(ROOT, 'data/generate.js'),
  'franchises.js': join(ROOT, 'data/franchises.js'),
  'ar.js': join(ROOT, 'data/ar.js'),                 // the Arabic of each question
  'names-ar.js': join(ROOT, 'data/names-ar.js'),
};

const form = new FormData();
// verify_jwt is off: the function checks its own x-cron-secret header instead,
// because any visitor holds a valid (public) JWT.
form.append('metadata', JSON.stringify({ name: SLUG, entrypoint_path: 'index.ts', verify_jwt: false }));
for (const [name, path] of Object.entries(files)) {
  form.append('file', new Blob([readFileSync(path)], { type: name.endsWith('.ts') ? 'application/typescript' : 'application/javascript' }), name);
}
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/functions/deploy?slug=${SLUG}`, {
  method: 'POST', headers: { Authorization: 'Bearer proxy-injected' }, body: form });
const text = await res.text();
console.log(res.status, text.slice(0, 600));
if (!res.ok) process.exit(1);

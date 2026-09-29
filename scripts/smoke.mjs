// Runtime DB smoke: provisions a throwaway Postgres, applies sql/*.sql, asserts the schema is
// valid + queryable. Degrades to a clean skip (exit 0) when Postgres isn't available. Generated
// by Getflowing.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SQL_DIR = join(process.cwd(), "apps/api/sql");
const sh = (cmd) => spawnSync('sh', ['-c', cmd], { encoding: 'utf8' });
const have = (bin) => sh(`command -v ${bin}`).status === 0;
const skip = (why) => { console.log(`[smoke] skipped - ${why}`); process.exit(0); };

if (!have('initdb') || !have('pg_ctl')) skip('no local Postgres binaries on PATH');
if (!existsSync(SQL_DIR)) skip('no sql/ migrations to verify');

// Postgres won't run as root; when we are root (the worker is) run its commands as 'postgres'.
const asRoot = typeof process.getuid === 'function' && process.getuid() === 0;
const dataDir = mkdtempSync(join(tmpdir(), 'smoke-pg-'));
if (asRoot) sh(`chown -R postgres ${dataDir}`);
const pg_ = (cmd) => asRoot ? sh(`su postgres -s /bin/sh -c ${JSON.stringify(cmd)}`) : sh(cmd);
const port = 5500 + Math.floor(Math.random() * 400);
let started = false;
const cleanup = () => {
  if (started) pg_(`pg_ctl -D ${dataDir} stop -m immediate`);
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* best effort */ }
};
const fail = (msg) => { console.error(`[smoke] FAIL - ${msg}`); cleanup(); process.exit(1); };
const pass = (msg) => { console.log(`[smoke] OK - ${msg}`); cleanup(); process.exit(0); };

if (pg_(`initdb -D ${dataDir} -U postgres --auth=trust`).status !== 0) { cleanup(); skip('initdb failed'); }
if (pg_(`pg_ctl -D ${dataDir} -o "-p ${port} -k ${dataDir} -c listen_addresses=localhost" -w -l ${dataDir}/log start`).status !== 0) { cleanup(); skip('postgres did not start'); }
started = true;
pg_(`createdb -h localhost -p ${port} -U postgres smoke`);

try {
  const { default: pg } = await import('pg');
  const client = new pg.Client({ host: 'localhost', port, user: 'postgres', database: 'smoke' });
  await client.connect();
  const files = readdirSync(SQL_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) await client.query(readFileSync(join(SQL_DIR, f), 'utf8'));
  const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  await client.end();
  if (files.length > 0 && rows.length === 0) fail('migrations ran but created no tables');
  pass(`applied ${files.length} migration(s); ${rows.length} table(s) present`);
} catch (err) {
  fail(err && err.message ? err.message : String(err));
}

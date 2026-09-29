// Production entrypoint: run the API on an internal port and Next on the public port in one
// container. Next proxies /api/* to the API (see apps/web/next.config.js), so only WEB_PORT is
// exposed. If either child exits, take the whole container down so the platform restarts it.
const { spawn } = require('node:child_process');

const WEB_PORT = process.env.PORT || '3000';
// The platform injects PORT for the PUBLIC (web) process. If it happens to equal the API
// default (e.g. PORT=8080), both children would fight over one port and the container would
// crash-loop. Bump the internal API port off the public one, deterministically.
let API_PORT = process.env.API_PORT || '8080';
if (API_PORT === WEB_PORT) API_PORT = String(Number(WEB_PORT) + 1);

// The API runs with cwd apps/api so everything it resolves relative to process.cwd() (most
// importantly its boot migrations at join(process.cwd(), 'sql')) finds the files the image
// ships at /app/apps/api/. (Module resolution still walks up to /app/node_modules.) Running
// it from the repo root made the migration loader look at /app/sql, find nothing, and skip
// silently, and the app booted 'healthy' with no tables.
const api = spawn('node', ['dist/main.js'], {
  cwd: 'apps/api',
  stdio: 'inherit',
  // Set BOTH. The API prefers API_PORT (so a dev runner can give it a port of its own), so
  // passing only PORT let a stale API_PORT in the environment (an ENV in the Dockerfile, a
  // project env var) override the port this script just carefully chose. Observed live: the
  // image carried API_PORT=8080, the API took it, Next already had 8080, and the container died
  // with "EADDRINUSE 0.0.0.0:8080" on every deploy. Whatever this script decides IS the API port.
  env: { ...process.env, PORT: API_PORT, API_PORT },
});
const web = spawn('node', ['apps/web/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: WEB_PORT, API_INTERNAL_URL: 'http://localhost:' + API_PORT, HOSTNAME: '0.0.0.0' },
});

function shutdown(code) { api.kill('SIGTERM'); web.kill('SIGTERM'); process.exit(code); }
api.on('exit', (c) => shutdown(c ?? 1));
web.on('exit', (c) => shutdown(c ?? 1));
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

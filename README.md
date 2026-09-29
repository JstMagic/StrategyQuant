# Build a fully web-based MVP

Full-stack monorepo scaffolded by Getflowing (secure by default, see the security baseline):

- `apps/api`: Express + TypeScript API (helmet/CSP, CORS allowlist, rate limiting, zod
  validation, SSRF-guarded fetch, parameterized Postgres, fail-fast env).
- `apps/web`: Next.js (App Router) + Tailwind (security headers + CSP, Server Components).

The web proxies `/api/*` to the API, so the browser stays same-origin.

```bash
npm install
npm run dev      # API on :8080, web on http://localhost:3000
npm run verify   # type-checks both apps
```

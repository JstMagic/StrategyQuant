# Build a fully web-based MVP: web

Secure Next.js (App Router) + Tailwind app scaffolded by Getflowing. Security headers + a strict
CSP are set in `next.config.js`; Server Components keep secrets off the client. Pinned past the
Next middleware-bypass CVE: don't rely on middleware alone for auth, enforce on the server too.

```bash
npm install
npm run dev   # http://localhost:3000
```

/** @type {import('next').NextConfig} */

// Static security headers that are the SAME on every response. The content policy is NOT here:
// it needs a per-request nonce and lives in middleware.ts. See the long note there for why a
// static, nonce-less policy silently blanks the app in the browser while the server looks fine.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Deterministic monorepo tracing: pin the workspace root so the standalone output NESTS
  // this app (server.js at <root>/.next/standalone/apps/web/server.js, exactly where
  // the combo Dockerfile and scripts/start.js expect it). Without this, Next GUESSES the
  // root from lockfile locations; a wrong guess flattens the layout and the deployed
  // container dies at startup with Cannot find module '/app/apps/web/server.js'.
  //
  // UNDER experimental BECAUSE THIS SCAFFOLD PINS NEXT 14, where that is the key's only
  // home. At the top level Next 14 does not recognise it: it prints "Invalid next.config.js
  // options detected" and carries on guessing, so the pin above reads as if it holds and
  // does nothing at all. Next 15 promoted it to the top level, so this moves out of
  // experimental when the pin does, and not before.
  experimental: {
    outputFileTracingRoot: require('node:path').join(__dirname, '..', '..'),
  },
  // We lint via our own flat ESLint config (eslint.config.js) in the verify step; don't let
  // 'next build' run its own (eslintrc-based) lint, which would clash with the flat config.
  eslint: { ignoreDuringBuilds: true },
  async headers() { return [{ source: '/:path*', headers: securityHeaders }]; },
  // Proxy /api/* to the backend so the browser stays same-origin (no CORS, API port private).
  async rewrites() { return [{ source: '/api/:path*', destination: (process.env.API_INTERNAL_URL || 'http://localhost:8080') + '/api/:path*' }]; },
};

module.exports = nextConfig;

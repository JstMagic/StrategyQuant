import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Framing: 'none' by default so the DEPLOYED app can't be embedded (clickjacking defense). The
// live-preview runtime injects PREVIEW_FRAME_ANCESTORS (the dashboard origin) so the in-dashboard
// preview can iframe the dev server; production never sets it, so it stays locked.
//
// script-src carries the nonce + 'strict-dynamic': the nonce'd bootstrap is trusted, and
// 'strict-dynamic' lets it load the app's own chunks, while a stray injected <script> is not.
// img/font/media/connect allow https: because blocking a CDN photo or a Google Font breaks a
// real app in the browser with nothing in the logs; an image can't execute code, so https: is
// safe. Tighten to specific hosts once you know them.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const frameAncestors = process.env.PREVIEW_FRAME_ANCESTORS || "'none'";
  // next dev builds modules with webpack's eval-source-map devtool, which is what 'unsafe-eval'
  // is here for. A production build does not, and both scaffold Dockerfiles set NODE_ENV to
  // production explicitly, so the deployed policy stays strict.
  // The live preview runs the app in DEV mode, so without this the preview page dies with
  // "'unsafe-eval' is not an allowed source of script"; the deployed production app is unaffected.
  const devEval = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`,
    "style-src 'self' 'unsafe-inline'",   // Tailwind/Next inject inline styles
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "media-src 'self' https:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join('; ');

  // Set the CSP on the REQUEST headers so Next detects the nonce and applies it to its own
  // inline scripts; echo the nonce on x-nonce for any app code that renders its own <script>.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

// Run on document requests only. Excluding /_next static assets, images and favicon keeps the
// nonce off cacheable static responses (a per-request header must never be cached) and avoids
// the cost on every chunk.
export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico).*)' }],
};

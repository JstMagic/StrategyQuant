import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Build a fully web-based MVP', description: 'Built with Getflowing' };

// A nonce CSP requires per-request rendering. The nonce is minted per request in middleware.ts,
// but a STATICALLY PRERENDERED page has its inline hydration scripts baked at BUILD time, with no
// nonce, so at runtime the header carries a fresh nonce the scripts don't have, the browser
// blocks them, and the page fails to hydrate (blank). Dev always renders dynamically, so this
// only bites the production build. force-dynamic makes every route render per-request, so Next
// stamps the request's nonce onto its scripts. Applied at the root layout → covers all routes.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}

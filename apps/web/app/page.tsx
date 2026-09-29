// Server Component by default: runs on the server, so it never ships secrets to the browser.
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Build a fully web-based MVP</h1>
      <p className="mt-4 text-lg text-gray-600">
        Edit <code className="rounded bg-gray-100 px-1.5 py-0.5">app/page.tsx</code> to build this page. Styled with Tailwind CSS.
      </p>
    </main>
  );
}

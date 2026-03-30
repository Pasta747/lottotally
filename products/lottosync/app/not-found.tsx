import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white text-xl font-bold">L</div>
        <span className="text-xl font-semibold text-slate-900">LottoTally</span>
      </div>

      <div className="card text-center max-w-sm">
        <div className="mb-4 text-6xl font-bold text-slate-300">404</div>
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mb-6 text-sm text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="btn-primary block text-center">
            Go to Dashboard
          </Link>
          <Link href="/" className="btn-secondary block text-center">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

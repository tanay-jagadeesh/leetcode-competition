import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-mono text-muted mb-6">404</div>
        <h1 className="text-2xl mb-3">Page not found</h1>
        <p className="text-muted mb-8">
          This page doesn&apos;t exist or the match has expired.
        </p>
        <Link
          href="/"
          className="btn-primary inline-block px-6 py-3"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-gradient mb-4">404</div>
        <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-400 mb-8">
          This page doesn&apos;t exist or the match has expired.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white text-xl font-bold rounded-xl glow-button"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}

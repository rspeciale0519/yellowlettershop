'use client'

// Last-resort boundary for crashes in the root layout itself. Must render its
// own <html>/<body>. Keep dependency-free so it works even if app chrome fails.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#fafafa',
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, marginBottom: 8, color: '#111' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#555', marginBottom: 20, lineHeight: 1.5 }}>
              An unexpected error interrupted the page. Your data is safe. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

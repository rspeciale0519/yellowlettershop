/**
 * AmbientBackground
 * - CSS-only animated background with flowing gradients
 * - Fixed, pointer-events-none backdrop that sits behind all content
 * - Home page only; no external dependencies
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="ambient-bg pointer-events-none fixed inset-0 -z-10"
    >
      {/* Base gradient with CSS animation for ebb and flow effect */}
      <div className="ambient-base" />

      {/* Static blobs for additional visual depth */}
      <div className="blob blob-1"><div className="blob-core" /></div>
      <div className="blob blob-2"><div className="blob-core" /></div>
      <div className="blob blob-3"><div className="blob-core" /></div>
      <div className="blob blob-4"><div className="blob-core" /></div>
    </div>
  )
}

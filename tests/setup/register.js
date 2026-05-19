// Minimal Mocha bootstrap (CommonJS so it loads before any .ts).
//
// The original tests/setup/* harness referenced by .mocharc.json is absent
// from the repo (only in temp/versions backups). This shim restores a
// pure-logic runner: ts-node in transpileOnly mode so the repo's pre-existing
// broken types (missing @/types/supabase etc.) never block test EXECUTION —
// type safety is gated separately via `npm run typecheck:ui` (baseline-delta).
// Component/UI behavior is verified via chrome-devtools per the plan, not here.
const path = require('path')

const repoRoot = path.join(__dirname, '..', '..')

require('ts-node').register({
  project: path.join(__dirname, '..', 'tsconfig.mocha.json'),
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

require('tsconfig-paths').register({
  baseUrl: repoRoot,
  paths: { '@/*': ['./*'] },
})

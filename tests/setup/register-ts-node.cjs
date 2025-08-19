// Cross-platform ts-node registration without relying on env vars or cross-env
const path = require('path')

// Register ts-node with the test-specific tsconfig
require('ts-node').register({
  project: path.join(__dirname, '..', 'tsconfig.mocha.json'),
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
})

// Enable path aliases (@/*)
require('tsconfig-paths').register()

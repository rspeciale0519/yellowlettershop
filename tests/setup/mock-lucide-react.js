// Mock lucide-react (ESM-only) for CJS mocha + ts-node tests using a resolver redirect
// This avoids overriding Module._load and plays nicer with other loaders (e.g., ts-node)
const Module = require('module')
const path = require('path')

const originalResolve = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'lucide-react') {
    return path.join(__dirname, 'lucide-react-cjs-stub.js')
  }
  // @ts-ignore - maintain original signature compatibility
  return originalResolve.call(this, request, parent, isMain, options)
}

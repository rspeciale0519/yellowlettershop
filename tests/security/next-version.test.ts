import { strict as assert } from 'assert'
import manifest from '../../package.json'
import lock from '../../package-lock.json'

describe('patched Next.js dependency floor', () => {
  it('requires and installs Next.js 15.5.28 or newer', () => {
    for (const version of [manifest.dependencies.next, lock.packages['node_modules/next'].version, require('next/package.json').version]) {
      const [major, minor, patch] = version.replace(/^[~^]/, '').split('.').map(Number)
      assert.ok(major > 15 || major === 15 && (minor > 5 || minor === 5 && patch >= 28), `Unpatched Next.js ${version}`)
    }
  })
})

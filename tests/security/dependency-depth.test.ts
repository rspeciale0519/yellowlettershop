import { strict as assert } from 'assert'
import { createRequire } from 'module'
// Resolve the actual transitive dependency, never a global NODE_PATH package.
const braces = createRequire(require.resolve('micromatch'))('braces')

describe('brace parser dependency denial-of-service protection', () => {
  it('rejects excessive nesting in braces and parentheses before recursive compilation', () => {
    for (const [open, close] of [['{', '}'], ['(', ')']]) {
      assert.throws(() => braces.parse(open.repeat(200) + 'x' + close.repeat(200)), /depth/i)
    }
  })
  it('preserves ordinary brace expansion, ranges, matching and stringification', () => {
    assert.deepEqual(braces.expand('file-{a,b}-{1..2}.ts'), ['file-a-1.ts', 'file-a-2.ts', 'file-b-1.ts', 'file-b-2.ts'])
    assert.equal(braces.stringify(braces.parse('file-{a,b}.ts')), 'file-{a,b}.ts')
    assert.equal(require('micromatch').isMatch('file-a.ts', 'file-{a,b}.ts'), true)
  })
  it('bounds recursive AST compilation, stringification and expansion', () => {
    for (const method of ['compile', 'stringify', 'expand']) {
      let node: Record<string, unknown> = { type: 'text', value: 'x' }
      for (let i = 0; i < 200; i++) node = { type: 'brace', nodes: [node] }
      const ast = { type: 'root', nodes: [node] }
      assert.throws(() => braces[method](ast), /depth/i, method)
    }
  })
})

import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { fitCanvas } from '../../components/designer/workspace/fit-canvas'

describe('fitCanvas', () => {
  it('fits both dimensions inside the desktop workspace with padding', () => {
    assert.equal(fitCanvas({ width: 680, height: 640 }, { width: 850, height: 1100 }, 24), 53)
  })
  it('fits a wide piece by width and rounds down', () => {
    assert.equal(fitCanvas({ width: 390, height: 600 }, { width: 1100, height: 850 }, 24), 31)
  })
  it('fits small phone spaces below the manual zoom minimum', () => {
    assert.equal(fitCanvas({ width: 220, height: 200 }, { width: 850, height: 1100 }, 24), 13)
  })
  it('never enlarges a piece past actual size', () => {
    assert.equal(fitCanvas({ width: 2000, height: 2000 }, { width: 600, height: 400 }, 0), 100)
  })
  it('handles hidden viewports and invalid sizes without an invalid zoom', () => {
    assert.equal(fitCanvas({ width: 0, height: 0 }, { width: 850, height: 1100 }, 24), 1)
    assert.equal(fitCanvas({ width: 400, height: 400 }, { width: 0, height: 0 }, 24), 1)
    assert.equal(fitCanvas({ width: Number.NaN, height: 400 }, { width: 850, height: 1100 }, 24), 1)
  })
})

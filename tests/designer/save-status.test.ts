import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { saveStatusLabel } from '../../hooks/use-designer-autosave'

describe('saveStatusLabel', () => {
  it('maps every status to the expected human label', () => {
    assert.equal(saveStatusLabel('idle'), 'Draft not saved')
    assert.equal(saveStatusLabel('dirty'), 'Unsaved changes')
    assert.equal(saveStatusLabel('saving'), 'Saving…')
    assert.equal(saveStatusLabel('local-only'), 'Saved locally; sign in to sync')
    assert.equal(saveStatusLabel('error'), 'Saved locally; server save failed')
  })

  it('includes the timestamp for saved/recovered when provided', () => {
    assert.equal(saveStatusLabel('saved', '3:42 PM'), 'Saved 3:42 PM')
    assert.equal(saveStatusLabel('recovered', '3:40 PM'), 'Recovered 3:40 PM')
  })

  it('falls back gracefully when no timestamp is given', () => {
    assert.equal(saveStatusLabel('saved'), 'Saved')
    assert.equal(saveStatusLabel('recovered'), 'Recovered')
  })
})

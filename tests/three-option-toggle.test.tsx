import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThreeOptionToggle, type ThreeOption } from '@/components/list-builder/mortgage-filters/components/three-option-toggle'
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'

function setup(initial: ThreeOption = 'no-preference') {
  const calls: ThreeOption[] = []
  function Harness() {
    const [val, setVal] = React.useState<ThreeOption>(initial)
    return (
      <ThreeOptionToggle
        label="Test Toggle"
        value={val}
        onChange={(v) => {
          calls.push(v)
          setVal(v)
        }}
      />
    )
  }
  render(<Harness />)
  const user = userEvent.setup()
  return { user, calls }
}

describe('ThreeOptionToggle', () => {
  it('renders with the provided label and initial value', () => {
    setup('only')
    // Labels should be visible
    screen.getByText('Test Toggle')
    screen.getByLabelText('Only')
    screen.getByLabelText('Exclude')
    screen.getByLabelText('No preference')
  })

  it('emits onChange when selecting distinct options', async () => {
    // Start with a concrete selection to ensure each click changes the value
    const { user, calls } = setup('only')

    await user.click(screen.getByLabelText('Exclude'))
    await user.click(screen.getByLabelText('No preference'))
    await user.click(screen.getByLabelText('Only'))

    assert.deepEqual(calls, ['exclude', 'no-preference', 'only'])
  })
})

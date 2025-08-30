import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect, type MultiSelectOption } from '@/components/list-builder/common/multi-select'

function setup(initialSelected: string[] = []) {
  const options: MultiSelectOption[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ]
  const calls: string[][] = []

  function Controlled() {
    const [selected, setSelected] = React.useState<string[]>(initialSelected)
    return (
      <MultiSelect
        label="Test Multi"
        options={options}
        selected={selected}
        onChange={(sel) => {
          calls.push(sel)
          setSelected(sel)
        }}
        placeholder="Select Test Multi"
      />
    )
  }

  render(<Controlled />)
  const user = userEvent.setup()
  return { user, calls, options }
}

describe('MultiSelect (common)', () => {
  it('opens dropdown and toggles items via row click', async () => {
    const { user, calls } = setup()

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /Select Test Multi|\d+ selected/ })
    await user.click(trigger)

    // Wait for options to appear before clicking
    const checks = await screen.findAllByRole('checkbox')
    // Toggle first (Alpha) and second (Beta)
    await user.click(checks[0])
    await user.click(checks[1])

    // onChange called each time with cumulative selections
    expect(calls.length).toBeGreaterThanOrEqual(2)
    expect(calls[calls.length - 1].sort()).toEqual(['a', 'b'])

    // Clicking Alpha again should remove it
    await user.click(checks[0])
    expect(calls[calls.length - 1].sort()).toEqual(['b'])
  })

  it('toggling via checkbox fires only one onChange per click', async () => {
    const { user, calls } = setup()

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /Select Test Multi|\d+ selected/ })
    await user.click(trigger)

    // Click the first checkbox (stopPropagation on checkbox prevents double toggle)
    const checkboxes = await screen.findAllByRole('checkbox')
    const initialCalls = calls.length
    await user.click(checkboxes[0])
    expect(calls.length).toBe(initialCalls + 1)
  })
})

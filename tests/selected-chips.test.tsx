import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectedChips } from '@/components/list-builder/demographics/SelectedChips'

describe('SelectedChips', () => {
  it('renders nothing when items is empty', () => {
    const { container } = render(<SelectedChips items={[]} onRemove={() => {}} />)
    // Component returns null => no DOM nodes
    expect(container.firstChild).toBeNull()
  })

  it('renders chips and removes by index when X clicked', async () => {
    const calls: number[] = []
    const user = userEvent.setup()
    const items = ['Alpha', 'Bravo', 'Charlie']
    render(<SelectedChips items={items} onRemove={(i) => calls.push(i)} />)

    // All chip labels should be present
    for (const label of items) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }

    // Buttons should equal items length
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(items.length)

    // Click the X on the second chip (index 1)
    await user.click(buttons[1])
    expect(calls).toEqual([1])

    // Click the X on the first chip (index 0)
    await user.click(buttons[0])
    expect(calls).toEqual([1, 0])
  })
})

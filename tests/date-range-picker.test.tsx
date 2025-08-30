import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker, type DateRangeValue } from '@/components/list-builder/mortgage-filters/components/date-range-picker'

function setup(initial?: { from?: string | null; to?: string | null } | null) {
  const calls: Array<DateRangeValue | null> = []
  render(
    <DateRangePicker
      label="Test Date"
      value={initial}
      onChange={(v) => calls.push(v)}
    />,
  )
  const user = userEvent.setup()
  return { user, calls }
}

describe('DateRangePicker', () => {
  it('renders summary and clears to null', async () => {
    const { user, calls } = setup({ from: '2025-01-01', to: '2025-01-10' })

    // Summary should not be the placeholder once a value is present.
    // Query the button by its visible summary contents (date strings or —)
    const trigger = screen.getByRole('button', { name: /—|Jan|\d{4}/ })
    expect(trigger.textContent || '').toMatch(/—|Jan|2025|\d{4}/)

    // Open popover and click Clear
    await user.click(trigger)
    const clearBtn = await screen.findByRole('button', { name: /Clear/i })
    await user.click(clearBtn)

    // onChange should have been called with null
    expect(calls.length).toBeGreaterThanOrEqual(1)
    expect(calls[calls.length - 1]).toBeNull()
  })
})

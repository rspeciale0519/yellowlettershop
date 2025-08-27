import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { DemographicsGroup } from '@/components/list-builder/demographics/DemographicsGroup'

describe('DemographicsGroup', () => {
  it('renders title, icon, and description; children only when expanded', () => {
    const onToggle = () => {}
    const { rerender } = render(
      <DemographicsGroup
        title="My Group"
        icon={<span data-testid="icon" />}
        description="Desc here"
        expanded={false}
        onToggle={onToggle}
      >
        <div>Child Content</div>
      </DemographicsGroup>,
    )

    // Header pieces exist
    assert.ok(screen.getByText('My Group'))
    assert.ok(screen.getByText('Desc here'))
    assert.ok(screen.getByTestId('icon'))

    // Children hidden when not expanded
    assert.equal(screen.queryByText('Child Content'), null)

    // When expanded, children render
    rerender(
      <DemographicsGroup
        title="My Group"
        icon={<span data-testid="icon" />}
        description="Desc here"
        expanded={true}
        onToggle={onToggle}
      >
        <div>Child Content</div>
      </DemographicsGroup>,
    )
    assert.ok(screen.getByText('Child Content'))
  })

  it('fires onToggle when header is clicked', async () => {
    const calls: number[] = []
    const user = userEvent.setup()

    render(
      <DemographicsGroup
        title="Toggle Group"
        icon={<span data-testid="icon" />}
        description="Click header to toggle"
        expanded={false}
        onToggle={() => calls.push(1)}
      >
        <div>Child</div>
      </DemographicsGroup>,
    )

    // Click the header by clicking the title text (bubbles to CardHeader onClick)
    const title = screen.getByText('Toggle Group')
    await user.click(title)

    assert.equal(calls.length, 1)
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByText('My Group')).toBeInTheDocument()
    expect(screen.getByText('Desc here')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()

    // Children hidden when not expanded
    expect(screen.queryByText('Child Content')).toBeNull()

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
    expect(screen.getByText('Child Content')).toBeInTheDocument()
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

    expect(calls.length).toBe(1)
  })
})

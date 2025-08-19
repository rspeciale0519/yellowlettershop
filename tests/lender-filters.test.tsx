import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'

import { LenderOriginationFilter } from '@/components/list-builder/mortgage-filters/filters/lender-origination-filter'
import { LenderAssignedFilter } from '@/components/list-builder/mortgage-filters/filters/lender-assigned-filter'
import type { MortgageCriteria } from '@/types/list-builder'

function makeCriteria(overrides: Partial<MortgageCriteria> = {}): MortgageCriteria {
  return {
    lienPosition: 'all',
    selectedCriteria: [],
    mortgageAmount: null,
    interestRate: null,
    loanToValue: null,
    mortgageOriginationDate: null,
    maturityDate: null,
    mortgageTerm: null,
    primaryLoanType: [],
    lenderOrigination: [],
    lenderAssigned: [],
    adjustableRateRider: {
      selectedSubCriteria: null,
      interestOnly: 'no-preference',
      interestRateChangeLimit: [],
      interestRateChange: [],
      interestRateChangeDate: { type: 'initial', dates: [] },
      interestRateChangeFrequency: [],
      interestRateIndexType: [],
      interestRateMaximum: [],
      negativeAmortization: 'no-preference',
      paymentOption: 'no-preference',
      prepaymentPenalty: 'no-preference',
      prepaymentPenaltyExpireDate: [],
    },
    balloonLoan: 'no-preference',
    creditLineLoan: 'no-preference',
    equityLoan: 'no-preference',
    maturedMortgage: 'no-preference',
    ...overrides,
  }
}

function renderWithState(
  Component: (props: { criteria: MortgageCriteria; onUpdate: (patch: Partial<MortgageCriteria>) => void }) => JSX.Element,
  initial: MortgageCriteria = makeCriteria(),
) {
  const calls: Partial<MortgageCriteria>[] = []
  function Harness() {
    const [criteria, setCriteria] = React.useState<MortgageCriteria>(initial)
    return (
      <Component
        criteria={criteria}
        onUpdate={(patch) => {
          calls.push(patch)
          setCriteria((c) => ({ ...c, ...patch }))
        }}
      />
    )
  }
  render(<Harness />)
  const user = userEvent.setup()
  return { user, calls }
}

describe('LenderOriginationFilter', () => {
  it('adds via Enter', async () => {
    const { user, calls } = renderWithState(LenderOriginationFilter)
    const input = screen.getByPlaceholderText('Add lender name') as HTMLInputElement

    await user.type(input, 'Acme Bank')
    await user.keyboard('{Enter}')

    // Badge appears
    screen.getByText('Acme Bank')
    // onUpdate called with appended list
    assert.ok(calls.some((p) => Array.isArray(p.lenderOrigination) && p.lenderOrigination.includes('Acme Bank')))
  })

  it('adds via button', async () => {
    const { user, calls } = renderWithState(LenderOriginationFilter)
    const input = screen.getByPlaceholderText('Add lender name') as HTMLInputElement

    await user.type(input, 'Zenith Lending')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    screen.getByText('Zenith Lending')
    assert.ok(calls.some((p) => Array.isArray(p.lenderOrigination) && p.lenderOrigination.includes('Zenith Lending')))
  })

  it('removes via chip X', async () => {
    const { user } = renderWithState(LenderOriginationFilter)
    const input = screen.getByPlaceholderText('Add lender name') as HTMLInputElement

    await user.type(input, 'RemoveMe')
    await user.keyboard('{Enter}')
    screen.getByText('RemoveMe')

    await user.click(screen.getByLabelText('Remove RemoveMe'))

    // Badge disappears
    const removed = screen.queryByText('RemoveMe')
    assert.equal(removed, null)
  })

  it('clears all', async () => {
    const { user } = renderWithState(LenderOriginationFilter)
    const input = screen.getByPlaceholderText('Add lender name') as HTMLInputElement

    await user.type(input, 'A')
    await user.keyboard('{Enter}')
    await user.type(input, 'B')
    await user.keyboard('{Enter}')
    screen.getByText('A')
    screen.getByText('B')

    await user.click(screen.getByRole('button', { name: 'Clear All' }))

    assert.equal(screen.queryByText('A'), null)
    assert.equal(screen.queryByText('B'), null)
  })
})

describe('LenderAssignedFilter', () => {
  it('adds via Enter and button', async () => {
    const { user, calls } = renderWithState(LenderAssignedFilter)
    const input = screen.getByPlaceholderText('Add lender/servicer name') as HTMLInputElement

    await user.type(input, 'Servicer One')
    await user.keyboard('{Enter}')
    screen.getByText('Servicer One')

    await user.type(input, 'Servicer Two')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    screen.getByText('Servicer Two')

    const lastPatch = calls[calls.length - 1]
    assert.ok(Array.isArray(lastPatch.lenderAssigned) && lastPatch.lenderAssigned.includes('Servicer Two'))
  })

  it('removes via chip X and supports Clear All', async () => {
    const { user } = renderWithState(LenderAssignedFilter)
    const input = screen.getByPlaceholderText('Add lender/servicer name') as HTMLInputElement

    await user.type(input, 'X1')
    await user.keyboard('{Enter}')
    await user.type(input, 'X2')
    await user.keyboard('{Enter}')

    screen.getByText('X1')
    screen.getByText('X2')

    await user.click(screen.getByLabelText('Remove X1'))
    assert.equal(screen.queryByText('X1'), null)

    await user.click(screen.getByRole('button', { name: 'Clear All' }))
    assert.equal(screen.queryByText('X2'), null)
  })
})

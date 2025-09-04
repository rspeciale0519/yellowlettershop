import { transformDataWithMappings } from '../lib/mailing-lists/transform'

describe('transformDataWithMappings', () => {
  const headers = ['A', 'B', 'C']
  const rows = [
    ['John', 'Doe', '90210'],
    ['Jane', '', '10001'],
  ]

  it('maps fields according to column mappings', () => {
    const mappings = { A: 'firstName', B: 'lastName', C: 'zipCode' }
    const out = transformDataWithMappings(headers, rows, mappings)
    expect(out).toEqual([
      { firstName: 'John', lastName: 'Doe', zipCode: '90210' },
      { firstName: 'Jane', lastName: '', zipCode: '10001' },
    ])
  })

  it('ignores columns mapped to skip sentinel', () => {
    const mappings = { A: 'firstName', B: 'skip', C: 'zipCode' }
    const out = transformDataWithMappings(headers, rows, mappings)
    expect(out).toEqual([
      { firstName: 'John', zipCode: '90210' },
      { firstName: 'Jane', zipCode: '10001' },
    ])
  })

  it('ignores empty-string mapped columns for backward compatibility', () => {
    const mappings = { A: 'firstName', B: '', C: 'zipCode' } as any
    const out = transformDataWithMappings(headers, rows, mappings)
    expect(out).toEqual([
      { firstName: 'John', zipCode: '90210' },
      { firstName: 'Jane', zipCode: '10001' },
    ])
  })
})

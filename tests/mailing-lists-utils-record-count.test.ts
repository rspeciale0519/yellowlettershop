import { strict as assert } from 'assert'
import { filterSortPaginateLists } from '@/lib/mailing-lists-utils'
import type { MailingList, Campaign, Tag } from '@/types/supabase'
import type { AdvancedSearchCriteria } from '@/types/advanced-search'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function defaultCriteria(overrides: Partial<AdvancedSearchCriteria> = {}): AdvancedSearchCriteria {
  return {
    columnFilters: [],
    tagFilter: { tags: [], matchType: 'any' },
    mailingHistoryFilter: null,
    recordCountFilter: null,
    listFilter: null,
    logicalOperator: 'AND',
    ...overrides,
  }
}

function sampleLists() {
  const tags: Tag[] = [
    { id: 't1', name: 'VIP' },
    { id: 't2', name: 'Cold' },
  ]

  const campaigns: Campaign[] = [
    {
      id: 'c1',
      name: 'C1',
      status: 'sent',
      active_order_id: 'AO1',
      created_at: daysAgo(10),
      created_by: 'u2',
      sent_at: daysAgo(5),
    },
  ]

  const lists: MailingList[] = [
    {
      id: '1',
      name: 'Alpha',
      description: 'A list',
      record_count: 100,
      created_at: daysAgo(30),
      created_by: 'u1',
      modified_at: daysAgo(25),
      modified_by: 'u1',
      tags: [tags[0]],
      campaigns: [],
      metadata: {},
      criteria: {},
      version: 1,
    },
    {
      id: '2',
      name: 'Beta',
      description: 'B list',
      record_count: 50,
      created_at: daysAgo(10),
      created_by: 'u2',
      // no modified_at
      tags: [{ tag: tags[1] } as any], // relation shape
      campaigns: campaigns,
      metadata: {},
      criteria: {},
      version: 1,
    } as any,
    {
      id: '3',
      name: 'Gamma',
      description: 'G list',
      record_count: 200,
      created_at: daysAgo(90),
      created_by: 'u3',
      modified_at: daysAgo(60),
      modified_by: 'u3',
      tags: [tags[0], tags[1]],
      campaigns: [
        {
          id: 'c2',
          name: 'C2',
          status: 'scheduled',
          created_at: daysAgo(85),
          created_by: 'u3',
          scheduled_at: daysAgo(80),
        },
      ],
      metadata: {},
      criteria: {},
      version: 2,
    },
    {
      id: '4',
      name: 'Delta',
      description: 'D list',
      record_count: 0,
      created_at: daysAgo(2),
      created_by: 'system',
      tags: [],
      campaigns: [],
      metadata: {},
      criteria: {},
      version: 1,
    },
  ]

  return { lists, tags, campaigns }
}

describe('mailing-lists-utils record count filters', () => {
  it('applies recordCountFilter: range', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ recordCountFilter: { type: 'range', range: [60, 150] } }),
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Alpha'])
  })

  it('applies recordCountFilter: top', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ recordCountFilter: { type: 'top', count: 2 } }),
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Gamma', 'Alpha'])
  })

  it('applies recordCountFilter: random with seed determinism', () => {
    const { lists } = sampleLists()
    const run = () =>
      filterSortPaginateLists(lists, {
        criteria: defaultCriteria({ recordCountFilter: { type: 'random', count: 2 } }),
        seed: 'fixed-seed',
        page: 1,
        pageSize: 10,
      }).items.map((i) => i.id)

    const first = run()
    const second = run()
    assert.deepEqual(first, second)
  })
})

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

describe('mailing-lists-utils mailing history filters', () => {
  it('applies mailingHistoryFilter: not_mailed / in_last / more_than / between_dates', () => {
    const { lists } = sampleLists()

    // not_mailed -> lists with no campaigns
    let { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ mailingHistoryFilter: { type: 'not_mailed' } }),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Alpha', 'Delta'])

    // in_last 7 days -> Beta only (sent 5 days ago)
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ mailingHistoryFilter: { type: 'in_last', days: 7 } }),
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Beta'])

    // more_than 30 days -> Gamma only (last mail 80 days ago)
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ mailingHistoryFilter: { type: 'more_than', days: 30 } }),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Gamma'])

    // between_dates around 70-85 days -> Gamma only
    const start = new Date()
    start.setDate(start.getDate() - 85)
    const end = new Date()
    end.setDate(end.getDate() - 70)
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ mailingHistoryFilter: { type: 'between_dates', startDate: start.toISOString(), endDate: end.toISOString() } }),
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Gamma'])
  })
})

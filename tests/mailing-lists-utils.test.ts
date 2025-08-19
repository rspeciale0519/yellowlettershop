import { strict as assert } from 'assert'
import { filterSortPaginateLists, mapSupabaseListToUI } from '@/lib/mailing-lists-utils'
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

describe('mailing-lists-utils', () => {
  it('maps Supabase list to UI camelCase shape', () => {
    const { lists } = sampleLists()
    const ui = mapSupabaseListToUI(lists[0])
    assert.equal(ui.id, '1')
    assert.equal(ui.name, 'Alpha')
    assert.equal(ui.recordCount, 100)
    assert.ok(ui.createdAt)
    assert.equal(ui.createdBy, 'u1')
    assert.ok(ui.modifiedDate)
    assert.equal(ui.modifiedBy, 'u1')
    assert.equal(ui.tags.length, 1)
    assert.equal(ui.tags[0].name, 'VIP')
    assert.equal(ui.campaigns.length, 0)

    const ui2 = mapSupabaseListToUI(sampleLists().lists[1])
    assert.equal(ui2.tags[0].name, 'Cold') // relation shape handled
  })

  it('applies quickFilter: last_7_days', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      quickFilter: 'last_7_days',
      page: 1,
      pageSize: 10,
    })
    // Only Delta created 2 days ago
    assert.equal(items.length, 1)
    assert.equal(items[0].name, 'Delta')
  })

  it('applies quickFilter: used_in_campaign', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      quickFilter: 'used_in_campaign',
      page: 1,
      pageSize: 10,
      sortBy: { column: 'name', direction: 'asc' },
    })
    assert.deepEqual(items.map((i) => i.name), ['Beta', 'Gamma'])
  })

  it('applies searchQuery on name', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      searchQuery: 'alp',
      page: 1,
      pageSize: 10,
    })
    assert.equal(items.length, 1)
    assert.equal(items[0].name, 'Alpha')
  })

  it('applies column filters with AND/OR', () => {
    const { lists } = sampleLists()
    // name contains 'a' AND created_by equals 'u2' -> Beta only
    let { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({
        columnFilters: [
          { id: 1, column: 'name', operator: 'contains', value: 'a' },
          { id: 2, column: 'created_by', operator: 'equals', value: 'u2' },
        ],
        logicalOperator: 'AND',
      }),
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Beta'])

    // OR -> Alpha, Beta, Delta, Gamma where either condition matches
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({
        columnFilters: [
          { id: 1, column: 'name', operator: 'contains', value: 'alpha' },
          { id: 2, column: 'created_by', operator: 'equals', value: 'u2' },
        ],
        logicalOperator: 'OR',
      }),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Alpha', 'Beta'])
  })

  it('applies tagFilter any/all', () => {
    const { lists } = sampleLists()
    // any t2 -> Beta, Gamma
    let { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ tagFilter: { tags: ['t2'], matchType: 'any' } }),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Beta', 'Gamma'])

    // all [t1, t2] -> Gamma only
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ tagFilter: { tags: ['t1', 't2'], matchType: 'all' } }),
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Gamma'])
  })

  it('applies listFilter to specific IDs', () => {
    const { lists } = sampleLists()
    const { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria({ listFilter: ['1', '3'] }),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Alpha', 'Gamma'])
  })

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

  it('sorts by camelCase keys and back-compat created_at', () => {
    const { lists } = sampleLists()
    // name asc
    let { items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      sortBy: { column: 'name', direction: 'asc' },
      page: 1,
      pageSize: 10,
    })
    assert.deepEqual(items.map((i) => i.name), ['Alpha', 'Beta', 'Delta', 'Gamma'])

    // recordCount desc
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      sortBy: { column: 'recordCount', direction: 'desc' },
      page: 1,
      pageSize: 10,
    }))
    assert.deepEqual(items.map((i) => i.name), ['Gamma', 'Alpha', 'Beta', 'Delta'])

    // createdAt desc (or created_at for back-compat)
    ;({ items } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      sortBy: { column: 'created_at', direction: 'desc' },
      page: 1,
      pageSize: 10,
    }))
    assert.equal(items[0].name, 'Delta')
  })

  it('paginates results correctly', () => {
    const { lists } = sampleLists()
    const { items, total } = filterSortPaginateLists(lists, {
      criteria: defaultCriteria(),
      sortBy: { column: 'name', direction: 'asc' },
      page: 2,
      pageSize: 2,
    })
    assert.equal(total, 4)
    assert.deepEqual(items.map((i) => i.name), ['Delta', 'Gamma'])
  })
})

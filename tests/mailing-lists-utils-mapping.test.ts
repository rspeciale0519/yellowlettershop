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

describe('mailing-lists-utils mapping', () => {
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

    // Reuse the same fixture instance to avoid regenerating dates
    const ui2 = mapSupabaseListToUI(lists[1])
    assert.equal(ui2.tags[0].name, 'Cold') // relation shape handled
    // When modified_at is absent, mapping should not invent values
    assert.equal(ui2.modifiedDate ?? null, null)
    assert.equal(ui2.modifiedBy ?? null, null)

    // Validate campaign mapping on list 3 (snake_case → camelCase)
    const ui3 = mapSupabaseListToUI(lists[2])
    assert.equal(ui3.campaigns.length, 1)
    assert.equal(ui3.campaigns[0].id, 'c2')
    assert.equal(ui3.campaigns[0].name, 'C2')
    assert.equal(ui3.campaigns[0].status, 'scheduled')
    // created_at should map to createdAt
    assert.ok(ui3.campaigns[0].createdAt)
    // scheduled_at should map to scheduledAt
    assert.ok(ui3.campaigns[0].scheduledAt)
  })
})

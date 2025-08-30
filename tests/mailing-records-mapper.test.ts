/**
 * Unit tests for mailing list records mapper
 */

import { 
  mapSupabaseRecordToUI, 
  mapSupabaseRecords, 
  getDbFieldName, 
  uiToDbField 
} from '@/lib/mappers/mailingListRecords'
import type { SupabaseMailingListRecord } from '@/types/mailing-records'

describe('Mailing Records Mapper', () => {
  const mockSupabaseRecord: SupabaseMailingListRecord = {
    id: 'rec_123',
    mailing_list_id: 'list_456',
    first_name: 'John',
    last_name: 'Doe',
    address_line1: '123 Main St',
    address_line2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    zip_code: '62701',
    phone: '555-0123',
    email: 'john.doe@example.com',
    status: 'active',
    external_id: 'ext_789',
    created_at: '2024-01-15T10:30:00Z',
    modified_at: '2024-01-20T14:45:00Z',
    modified_by: 'user_abc',
    tags: [{ id: 'tag_1', name: 'VIP' }],
    campaigns: [{ id: 'camp_1', name: 'Spring Sale', status: 'active' }]
  }

  describe('mapSupabaseRecordToUI', () => {
    it('should map all fields correctly from snake_case to camelCase', () => {
      const result = mapSupabaseRecordToUI(mockSupabaseRecord)

      expect(result).toEqual({
        id: 'rec_123',
        listId: 'list_456',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        phone: '555-0123',
        email: 'john.doe@example.com',
        status: 'active',
        externalId: 'ext_789',
        createdAt: '2024-01-15T10:30:00Z',
        modifiedAt: '2024-01-20T14:45:00Z',
        modifiedBy: 'user_abc',
        tags: [{ id: 'tag_1', name: 'VIP' }],
        campaigns: [{ id: 'camp_1', name: 'Spring Sale', status: 'active' }]
      })
    })

    it('should handle null values by converting to empty strings', () => {
      const recordWithNulls: SupabaseMailingListRecord = {
        ...mockSupabaseRecord,
        first_name: null,
        last_name: null,
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        zip_code: null,
        phone: null,
        email: null,
        external_id: null,
        modified_at: null,
        modified_by: null
      }

      const result = mapSupabaseRecordToUI(recordWithNulls)

      expect(result.firstName).toBe('')
      expect(result.lastName).toBe('')
      expect(result.address).toBe('')
      expect(result.addressLine2).toBe('')
      expect(result.city).toBe('')
      expect(result.state).toBe('')
      expect(result.zipCode).toBe('')
      expect(result.phone).toBe('')
      expect(result.email).toBe('')
      expect(result.externalId).toBe('')
      expect(result.modifiedAt).toBe('')
      expect(result.modifiedBy).toBe('')
    })

    it('should preserve status enum values', () => {
      const statuses: Array<'active' | 'doNotContact' | 'returnedMail'> = [
        'active', 
        'doNotContact', 
        'returnedMail'
      ]

      statuses.forEach(status => {
        const record = { ...mockSupabaseRecord, status }
        const result = mapSupabaseRecordToUI(record)
        expect(result.status).toBe(status)
      })
    })

    it('should handle empty arrays for tags and campaigns', () => {
      const recordWithEmptyArrays = {
        ...mockSupabaseRecord,
        tags: [],
        campaigns: []
      }

      const result = mapSupabaseRecordToUI(recordWithEmptyArrays)
      expect(result.tags).toEqual([])
      expect(result.campaigns).toEqual([])
    })
  })

  describe('mapSupabaseRecords', () => {
    it('should map an array of records', () => {
      const records = [mockSupabaseRecord, { ...mockSupabaseRecord, id: 'rec_456' }]
      const result = mapSupabaseRecords(records)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('rec_123')
      expect(result[1].id).toBe('rec_456')
      expect(result[0].firstName).toBe('John')
      expect(result[1].firstName).toBe('John')
    })

    it('should handle empty array', () => {
      const result = mapSupabaseRecords([])
      expect(result).toEqual([])
    })
  })

  describe('getDbFieldName', () => {
    it('should return correct database field names for UI fields', () => {
      expect(getDbFieldName('firstName')).toBe('first_name')
      expect(getDbFieldName('lastName')).toBe('last_name')
      expect(getDbFieldName('address')).toBe('address_line1')
      expect(getDbFieldName('zipCode')).toBe('zip_code')
      expect(getDbFieldName('listId')).toBe('mailing_list_id')
      expect(getDbFieldName('externalId')).toBe('external_id')
      expect(getDbFieldName('createdAt')).toBe('created_at')
      expect(getDbFieldName('modifiedAt')).toBe('modified_at')
      expect(getDbFieldName('modifiedBy')).toBe('modified_by')
    })

    it('should return original field name if no mapping exists', () => {
      expect(getDbFieldName('city')).toBe('city')
      expect(getDbFieldName('state')).toBe('state')
      expect(getDbFieldName('phone')).toBe('phone')
      expect(getDbFieldName('email')).toBe('email')
      expect(getDbFieldName('status')).toBe('status')
      expect(getDbFieldName('unknownField')).toBe('unknownField')
    })
  })

  describe('uiToDbField mapping', () => {
    it('should contain all expected field mappings', () => {
      const expectedMappings = {
        listId: 'mailing_list_id',
        firstName: 'first_name',
        lastName: 'last_name',
        address: 'address_line1',
        addressLine2: 'address_line2',
        zipCode: 'zip_code',
        externalId: 'external_id',
        createdAt: 'created_at',
        modifiedAt: 'modified_at',
        modifiedBy: 'modified_by',
      }

      expect(uiToDbField).toEqual(expectedMappings)
    })
  })
})

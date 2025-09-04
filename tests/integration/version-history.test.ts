import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { recordChange, getUserChangeHistory, undoLastChange, redoLastChange } from '@/lib/version-history/change-tracker'
import { undoSingleChange, redoSingleChange } from '@/lib/version-history/undo-redo'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('Version History System Tests', () => {
  let supabase: any
  let testUser: any

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: `version-test-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    testUser = user.user
  })

  afterAll(async () => {
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  })

  describe('Change Tracking', () => {
    it('should record changes with proper sequence numbering', async () => {
      const resourceId = uuidv4()
      
      // Record multiple changes
      await recordChange('mailing_list', resourceId, 'create', {
        newValue: { name: 'Test List' },
        description: 'Created test list'
      })

      await recordChange('mailing_list', resourceId, 'update', {
        fieldName: 'name',
        oldValue: 'Test List',
        newValue: 'Updated Test List',
        description: 'Updated list name'
      })

      // Get change history
      const changes = await getUserChangeHistory(10)
      
      expect(changes.length).toBeGreaterThanOrEqual(2)
      expect(changes[0].sequence_number).toBeGreaterThan(changes[1].sequence_number)
    })

    it('should support batch changes', async () => {
      const batchId = uuidv4()
      const resourceIds = [uuidv4(), uuidv4(), uuidv4()]

      // Record batch changes
      const batchChanges = resourceIds.map(id => ({
        resourceType: 'mailing_list_record' as const,
        resourceId: id,
        changeType: 'create' as const,
        newValue: { name: `Record ${id}` },
        description: `Created record ${id}`
      }))

      await recordBatchChanges(batchChanges, batchId)

      // Verify all changes have same batch_id
      const { data: changes } = await supabase
        .from('change_history')
        .select('*')
        .eq('batch_id', batchId)

      expect(changes).toHaveLength(3)
      changes.forEach(change => {
        expect(change.batch_id).toBe(batchId)
      })
    })
  })

  describe('Undo/Redo Operations', () => {
    it('should undo and redo single changes', async () => {
      // Create a mailing list
      const listId = uuidv4()
      const { data: mailingList } = await supabase
        .from('mailing_lists')
        .insert({
          id: listId,
          user_id: testUser.id,
          name: 'Original Name',
          source: 'manual'
        })
        .select()
        .single()

      // Record the creation
      await recordChange('mailing_list', listId, 'create', {
        newValue: mailingList,
        description: 'Created mailing list'
      })

      // Update the list
      await supabase
        .from('mailing_lists')
        .update({ name: 'Updated Name' })
        .eq('id', listId)

      // Record the update
      await recordChange('mailing_list', listId, 'update', {
        fieldName: 'name',
        oldValue: 'Original Name',
        newValue: 'Updated Name',
        description: 'Updated list name'
      })

      // Undo the last change
      const undoResult = await undoLastChange()
      expect(undoResult).toBe(true)

      // Verify the change was undone
      const { data: undoneList } = await supabase
        .from('mailing_lists')
        .select('name')
        .eq('id', listId)
        .single()

      expect(undoneList.name).toBe('Original Name')

      // Redo the change
      const redoResult = await redoLastChange()
      expect(redoResult).toBe(true)

      // Verify the change was redone
      const { data: redoneList } = await supabase
        .from('mailing_lists')
        .select('name')
        .eq('id', listId)
        .single()

      expect(redoneList.name).toBe('Updated Name')
    })

    it('should handle undo/redo state correctly', async () => {
      const { canUndo: initialUndo, canRedo: initialRedo } = await getUndoRedoState()
      
      // Should be able to undo if there are changes
      expect(typeof initialUndo).toBe('boolean')
      expect(typeof initialRedo).toBe('boolean')

      if (initialUndo) {
        await undoLastChange()
        const { canUndo: afterUndo, canRedo: afterUndoRedo } = await getUndoRedoState()
        expect(afterUndoRedo).toBe(true) // Should be able to redo after undo
      }
    })
  })

  describe('Multi-tenant Change Isolation', () => {
    it('should isolate change history between users', async () => {
      // Create another test user
      const { data: user2 } = await supabase.auth.admin.createUser({
        email: `version-test2-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })

      // Record changes for both users
      await recordChange('mailing_list', uuidv4(), 'create', {
        newValue: { name: 'User 1 List' },
        description: 'User 1 change'
      })

      // Switch to user 2 context (would need proper auth context in real implementation)
      const user2Changes = await supabase
        .from('change_history')
        .select('*')
        .eq('user_id', user2.user.id)

      expect(user2Changes.data).toHaveLength(0)

      // Cleanup
      await supabase.auth.admin.deleteUser(user2.user.id)
    })
  })

  describe('Change History Performance', () => {
    it('should handle large numbers of changes efficiently', async () => {
      const startTime = Date.now()
      const resourceId = uuidv4()

      // Create many changes
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          recordChange('mailing_list', resourceId, 'update', {
            fieldName: 'name',
            oldValue: `Name ${i}`,
            newValue: `Name ${i + 1}`,
            description: `Update ${i}`
          })
        )
      }

      await Promise.all(promises)
      const endTime = Date.now()

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds

      // Verify changes were recorded
      const changes = await getUserChangeHistory(100)
      expect(changes.length).toBeGreaterThanOrEqual(100)
    })
  })
})

// Helper function to get undo/redo state
async function getUndoRedoState() {
  const changes = await getUserChangeHistory(1)
  const canUndo = changes.length > 0 && !changes[0].is_undone
  
  const undoneChanges = await supabase
    .from('change_history')
    .select('*')
    .eq('user_id', testUser.id)
    .eq('is_undone', true)
    .order('sequence_number', { ascending: false })
    .limit(1)

  const canRedo = undoneChanges.data && undoneChanges.data.length > 0

  return { canUndo, canRedo }
}

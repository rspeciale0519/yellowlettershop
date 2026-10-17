import { canonicalDocumentContent, documentRevision } from './content-revision'
import { contextIdentity, writeDraft, writePendingDesign, type DraftContext, type DraftStorage } from './draft-context'
import type { DesignerDocument } from '../../types/designer'

export { canonicalDocumentContent, documentRevision } from './content-revision'
export type SaveDesignResult = { ok: true; designId: string; revision: string } | { ok: false; recoverySaved: boolean; message: string }
export interface SaveSnapshot { document: DesignerDocument; context: DraftContext; active?: boolean }
export interface SaveControllerOptions {
  getCurrent(): SaveSnapshot
  storage?: DraftStorage
  persist(snapshot: SaveSnapshot, designId: string | undefined, revision: string): Promise<SaveDesignResult>
}

/** Serializing writes prevents an older PUT from overwriting a newer snapshot remotely. */
export function createDesignerSaveController(options: SaveControllerOptions) {
  let queue: Promise<unknown> = Promise.resolve()
  const remoteIds = new Map<string, string>()
  return {
    save(): Promise<SaveDesignResult> {
      const current = options.getCurrent()
      // Freeze the request; caller mutations cannot change what was submitted.
      const snapshot = JSON.parse(JSON.stringify(current)) as SaveSnapshot
      const recoverySaved = options.storage ? writeDraft(options.storage, snapshot.context, snapshot.document) : false
      const signature = () => `${contextIdentity(snapshot.context)}:${canonicalDocumentContent(snapshot.document)}`
      const isCurrent = () => {
        const latest = options.getCurrent()
        return latest.active !== false && `${contextIdentity(latest.context)}:${canonicalDocumentContent(latest.document)}` === signature()
      }
      const failure = (message: string): SaveDesignResult => ({ ok: false, recoverySaved, message })
      const run = async (): Promise<SaveDesignResult> => {
        try {
          if (!snapshot.context.userId) return failure('Sign in to save your design.')
          if (!isCurrent()) return failure('The design changed. Save the current version before continuing.')
          const revision = await documentRevision(snapshot.document)
          const key = contextIdentity(snapshot.context)
          const result = await options.persist(snapshot, remoteIds.get(key) ?? snapshot.context.designId, revision)
          if (!result.ok) return failure(result.message)
          if (result.revision !== revision || !result.designId) return failure('The saved revision could not be confirmed. Retry saving.')
          remoteIds.set(key, result.designId)
          if (!isCurrent()) return failure('Newer edits are waiting to be saved. Save again before continuing.')
          if (options.storage) {
            await writePendingDesign(options.storage, snapshot.context, result, snapshot.document, isCurrent)
            // Hashing/storage can yield; check once more before reporting success.
            if (!isCurrent()) return failure('Newer edits are waiting to be saved. Save again before continuing.')
          }
          return result
        } catch (error) { return failure(error instanceof Error ? error.message : 'Unable to save. Retry saving your design.') }
      }
      const pending = queue.then(run, run)
      queue = pending
      return pending
    },
  }
}

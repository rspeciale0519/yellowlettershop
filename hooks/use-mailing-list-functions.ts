"use client"

import { useCallback } from "react"
import {
  getMailingLists,
  getMailingList,
  createMailingList,
  updateMailingList,
  deleteMailingList,
  getMailingListRecords,
  createMailingListRecord,
  updateMailingListRecord,
  deleteMailingListRecord,
  bulkImportRecords,
  addTagToList,
  removeTagFromList,
} from "@/lib/supabase/mailing-lists"

export function useMailingListFunctions() {
  return {
    getMailingLists: useCallback(getMailingLists, []),
    getMailingList: useCallback(getMailingList, []),
    createMailingList: useCallback(createMailingList, []),
    updateMailingList: useCallback(updateMailingList, []),
    deleteMailingList: useCallback(deleteMailingList, []),
    getMailingListRecords: useCallback(getMailingListRecords, []),
    createMailingListRecord: useCallback(createMailingListRecord, []),
    updateMailingListRecord: useCallback(updateMailingListRecord, []),
    deleteMailingListRecord: useCallback(deleteMailingListRecord, []),
    bulkImportRecords: useCallback(bulkImportRecords, []),
    addTagToList: useCallback(addTagToList, []),
    removeTagFromList: useCallback(removeTagFromList, []),
  }
}

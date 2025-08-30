'use client'

import { useState, useRef, useEffect } from 'react'
import { useLists } from '@/hooks/use-lists'
import { useTags } from '@/hooks/use-tags'
import { useMailingListFunctions } from '@/hooks/use-mailing-list-functions'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { MailingList, MailingListRecord } from '@/types/supabase'

export function useListData() {
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Data fetching hooks
  const {
    lists,
    isLoading: listsLoading,
    error: listsError,
    mutate: mutateLists,
  } = useLists()
  const { tags, isLoading: tagsLoading, error: tagsError } = useTags()
  const {
    getMailingListRecords,
    createMailingList,
    updateMailingList,
    deleteMailingList,
    createMailingListRecord,
    updateMailingListRecord,
    deleteMailingListRecord,
    addTagToRecord: addTagToRecordAPI,
    removeTagFromRecord: removeTagFromRecordAPI,
  } = useMailingListFunctions()

  // View state
  const [viewMode, setViewMode] = useLocalStorage<'lists' | 'records'>(
    'mailingListManagerView',
    'lists'
  )
  const [selectedList, setSelectedList] = useState<MailingList | null>(null)
  const [records, setRecords] = useState<MailingListRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)

  return {
    // Data
    lists,
    tags,
    records,
    totalRecords,
    
    // Loading states
    listsLoading,
    tagsLoading,
    
    // Error states
    listsError,
    tagsError,
    
    // View state
    viewMode,
    setViewMode,
    selectedList,
    setSelectedList,
    
    // Functions
    getMailingListRecords,
    createMailingList,
    updateMailingList,
    deleteMailingList,
    createMailingListRecord,
    updateMailingListRecord,
    deleteMailingListRecord,
    addTagToRecordAPI,
    removeTagFromRecordAPI,
    mutateLists,
    
    // Utils
    setRecords,
    setTotalRecords,
    isMountedRef,
  }
}
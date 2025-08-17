"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { getMailingLists } from "@/lib/supabase/mailing-lists"
import { createClient } from "@/utils/supabase/client"

const fetcher = async () => {
  try {
    const data = await getMailingLists()
    return data || []
  } catch (error) {
    console.error('Error fetching mailing lists:', error)
    return []
  }
}

export function useLists() {
  const { data, error, mutate } = useSWR("mailing-lists", fetcher)

  useEffect(() => {
    const supabase = createClient()
    
    // Set up real-time subscription for mailing lists
    const channel = supabase
      .channel('mailing-lists-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mailing_lists' },
        () => {
          // Revalidate data when changes occur
          mutate()
        }
      )
      .subscribe()

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    lists: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  }
}

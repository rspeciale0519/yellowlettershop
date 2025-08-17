"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { getTags } from "@/lib/supabase/mailing-lists"
import { createClient } from "@/utils/supabase/client"

const fetcher = async () => {
  try {
    const data = await getTags()
    return data || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    return []
  }
}

export function useTags() {
  const { data, error, mutate } = useSWR("tags", fetcher)

  useEffect(() => {
    const supabase = createClient()
    
    // Set up real-time subscription for tags
    const channel = supabase
      .channel('tags-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags' },
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
    tags: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  }
}

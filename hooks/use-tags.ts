"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { getTags } from "@/lib/supabase/mailing-lists"
import { createClient } from "@/utils/supabase/client"

const fetcher = async () => {
  // Avoid running Supabase calls during SSR/prerender when envs may be absent
  if (typeof window === "undefined") return []
  // Require an authenticated session to query RLS-protected tables
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
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
    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true

    // Subscribe only when authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session) return
      channel = supabase
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
    })

    // Clean up subscription
    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    tags: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  }
}


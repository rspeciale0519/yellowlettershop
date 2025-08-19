"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { getMailingLists } from "@/lib/supabase/mailing-lists"
import { createClient } from "@/utils/supabase/client"

const fetcher = async () => {
  // Avoid running Supabase calls during SSR/prerender when envs may be absent
  if (typeof window === "undefined") return []
  // Require an authenticated session to query tables protected by RLS (GRANT authenticated)
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
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
    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true

    // Only subscribe when authenticated; otherwise RLS prevents events from being useful
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session) return
      channel = supabase
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
    })

    // Clean up subscription
    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [mutate])

  return {
    lists: data || [],
    isLoading: !error && !data,
    error,
    mutate,
  }
}


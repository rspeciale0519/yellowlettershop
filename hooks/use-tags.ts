"use client"

import useSWR from "swr"

// In a real implementation, this would fetch from an API
const fetcher = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return [] // Return empty array instead of mock data
}

export function useTags() {
  const { data, error, mutate } = useSWR("tags", fetcher)

  return {
    tags: data || [], // Provide empty array as fallback
    isLoading: !error && !data,
    error,
    mutate,
  }
}

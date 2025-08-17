"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)
    params.set("auth", "reset")
    const query = params.toString()
    router.replace(`/${query ? `?${query}` : ""}${url.hash || ""}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-md text-center text-sm text-muted-foreground">
        Redirecting to reset password...
      </div>
    </div>
  )
}

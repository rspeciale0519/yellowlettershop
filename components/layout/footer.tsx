"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')
  const isAdmin = pathname?.startsWith('/dashboard/admin')

  // Hide footer entirely in admin panel
  if (isAdmin) return null

  return (
    <footer className={`border-t bg-gray-100 dark:bg-gray-900 ${isDashboard ? 'lg:ml-64 lg:w-[calc(100%-16rem)]' : 'w-full'}`}>
      <div className="w-full grid items-center gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="flex items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/yls-logo.png" alt="Yellow Letter Shop Logo" width={180} height={40} />
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium md:gap-6">
          <Link href="/templates" className="transition-colors hover:text-yellow-500">
            Templates
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-yellow-500">
            Pricing
          </Link>
          <a href="mailto:support@yellowlettershop.com" className="transition-colors hover:text-yellow-500">
            Contact
          </a>
        </nav>
        <div className="flex items-center justify-center md:justify-end">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Yellow Letter Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

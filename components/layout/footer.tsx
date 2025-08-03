import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full border-t bg-gray-100 dark:bg-gray-900">
      <div className="container grid items-center gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="flex items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/yls-logo.png" alt="Yellow Letter Shop Logo" width={180} height={40} />
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium md:gap-6">
          <Link href="/dashboard" className="transition-colors hover:text-yellow-500">
            Dashboard
          </Link>
          <Link href="/mailing-lists" className="transition-colors hover:text-yellow-500">
            Mailing Lists
          </Link>
          <Link href="/about" className="transition-colors hover:text-yellow-500">
            About
          </Link>
          <Link href="/contact" className="transition-colors hover:text-yellow-500">
            Contact
          </Link>
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

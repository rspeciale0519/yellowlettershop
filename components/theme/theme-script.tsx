"use client"

import Script from "next/script"

export function ThemeScript() {
  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          try {
            var theme = localStorage.getItem('theme')
            var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            var resolvedTheme = theme === 'system' || !theme ? systemTheme : theme
            
            if (resolvedTheme === 'dark') {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
            
            // Set CSS custom properties for theme colors
            var root = document.documentElement
            if (resolvedTheme === 'dark') {
              root.style.setProperty('--theme-bg', '222.2 84% 4.9%')
              root.style.setProperty('--theme-fg', '210 40% 98%')
              root.style.setProperty('--theme-accent', '217.2 32.6% 17.5%')
            } else {
              root.style.setProperty('--theme-bg', '0 0% 100%')
              root.style.setProperty('--theme-fg', '222.2 84% 4.9%')
              root.style.setProperty('--theme-accent', '210 40% 96%')
            }
          } catch (e) {
            console.warn('Theme initialization failed:', e)
          }
        `,
      }}
    />
  )
}

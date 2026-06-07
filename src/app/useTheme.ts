import { useState, useEffect } from "react"

export type ThemeMode = "light" | "system" | "dark"
export const themeStorageKey = "diversibebs-theme-v1"
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(themeStorageKey)
      if (stored === "light" || stored === "system" || stored === "dark") return stored
    } catch {
      return "system"
    }
    return "system"
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function applyTheme() {
      const prefersDark = mediaQuery.matches
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark))
    }

    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Theme persistence is a local preference; keep the session usable if storage is unavailable.
    }
    applyTheme()
    mediaQuery.addEventListener("change", applyTheme)

    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme])

  return [theme, setTheme] as const
}

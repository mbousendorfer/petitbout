import { useCallback, useState } from "react"

const runtimeConfig = typeof window !== "undefined" ? window.__PETITBOUT_CONFIG__ : undefined

const adminUsername =
  runtimeConfig?.VITE_ADMIN_USERNAME || (import.meta.env.VITE_ADMIN_USERNAME as string | undefined) || ""
const adminPassword =
  runtimeConfig?.VITE_ADMIN_PASSWORD || (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || ""

const unlockedKey = "petitbout-admin-unlocked"

export const adminFeatureEnabled = Boolean(adminUsername && adminPassword)

function readUnlocked() {
  if (!adminFeatureEnabled || typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(unlockedKey) === "1"
  } catch {
    return false
  }
}

function setUnlocked(value: boolean) {
  try {
    if (value) {
      window.sessionStorage.setItem(unlockedKey, "1")
    } else {
      window.sessionStorage.removeItem(unlockedKey)
    }
  } catch {
    // Session persistence is optional; in-memory state still updates.
  }
}

export type AdminAccess = {
  enabled: boolean
  ready: boolean
  unlocked: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

export function useAdminAccess(): AdminAccess {
  const [unlocked, setUnlockedState] = useState(readUnlocked)

  const login = useCallback((username: string, password: string) => {
    const ok = adminFeatureEnabled && username.trim() === adminUsername && password === adminPassword
    if (ok) {
      setUnlocked(true)
      setUnlockedState(true)
    }
    return ok
  }, [])

  const logout = useCallback(() => {
    setUnlocked(false)
    setUnlockedState(false)
  }, [])

  return {
    enabled: adminFeatureEnabled,
    ready: true,
    unlocked,
    login,
    logout,
  }
}

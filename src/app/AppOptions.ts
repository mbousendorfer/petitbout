import { useState, useEffect, useMemo, useContext, createContext } from "react"
import { popotePacks } from "@/data/foods"

export const appOptionsStorageKey = "diversibebs-options-v1"
export type AppOptions = {
  activePopotePackId: string | null
  setActivePopotePackId: (packId: string | null) => void
}

export const defaultPopotePackId = popotePacks[0]?.id ?? null
export const popotePackIdSet = new Set(popotePacks.map((pack) => pack.id))

export type StoredAppOptions = {
  activePopotePackId?: string | null
  popoteEnabled?: boolean
}

export const AppOptionsContext = createContext<AppOptions | null>(null)
export function useStoredAppOptions() {
  const [activePopotePackId, setActivePopotePackId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(appOptionsStorageKey)
      if (!stored) return defaultPopotePackId

      const parsed = JSON.parse(stored) as StoredAppOptions

      if (typeof parsed.activePopotePackId === "string") {
        return popotePackIdSet.has(parsed.activePopotePackId) ? parsed.activePopotePackId : null
      }
      if (parsed.activePopotePackId === null) return null

      if (typeof parsed.popoteEnabled === "boolean") {
        return parsed.popoteEnabled ? defaultPopotePackId : null
      }

      return defaultPopotePackId
    } catch {
      return defaultPopotePackId
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(appOptionsStorageKey, JSON.stringify({ activePopotePackId }))
    } catch {
      // Local display preference; the app remains usable without persistence.
    }
  }, [activePopotePackId])

  return useMemo(
    () => ({ activePopotePackId, setActivePopotePackId }),
    [activePopotePackId],
  )
}

export function useAppOptions() {
  const options = useContext(AppOptionsContext)
  if (!options) throw new Error("AppOptionsContext is missing")
  return options
}

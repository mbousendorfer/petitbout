import { useEffect, useMemo, useState } from "react"

import { isSupabaseConfigured, supabase } from "@/lib/supabase"

export type Reaction = "aucune réaction" | "digestion difficile" | "rougeur" | "vomissement" | "autre"

export type FoodTest = {
  id: string
  foodId: string
  date: string
  reaction: Reaction
  note: string
}

export type BabyProfile = {
  ageMonths: number
  birthDate: string
  childName: string
}

type StoredState = {
  profile: BabyProfile
  tests: FoodTest[]
}

type FamilySession = {
  familyCodeHash: string
  familyCodeLabel?: string
}

type SyncStatus = "idle" | "loading" | "syncing" | "error" | "offline" | "not-configured"

const storageKey = "diversibebs-state-v2"
const legacyStorageKey = "diversibebs-state-v1"
const familySessionKey = "diversibebs-family-session-v1"

const initialState: StoredState = {
  profile: { ageMonths: 4, birthDate: "", childName: "" },
  tests: [],
}

function calculateAgeMonths(birthDate: string) {
  if (!birthDate) return null

  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    today.getMonth() -
    birth.getMonth()

  if (today.getDate() < birth.getDate()) months -= 1

  return Math.max(0, months)
}

function readStoredState() {
  const stored = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey)
  if (!stored) return initialState

  try {
    const parsed = { ...initialState, ...JSON.parse(stored) } as StoredState
    const profile = { ...initialState.profile, ...parsed.profile }
    const computedAgeMonths = calculateAgeMonths(profile.birthDate)
    return {
      ...parsed,
      profile: {
        ...profile,
        ageMonths: computedAgeMonths ?? profile.ageMonths,
      },
    }
  } catch {
    return initialState
  }
}

function readFamilySession() {
  const stored = localStorage.getItem(familySessionKey)
  if (!stored) return null

  try {
    return JSON.parse(stored) as FamilySession
  } catch {
    return null
  }
}

async function hashFamilyCode(code: string) {
  const normalizedCode = code.trim().toLowerCase()
  const encoded = new TextEncoder().encode(normalizedCode)
  const digest = await crypto.subtle.digest("SHA-256", encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function sortTests(tests: FoodTest[]) {
  return [...tests].sort((a, b) => b.date.localeCompare(a.date))
}

function parseRemoteState(data: unknown): StoredState {
  if (!data || typeof data !== "object") return initialState

  const value = data as {
    profile?: { ageMonths?: number; birthDate?: string | null; childName?: string | null }
    tests?: Array<{
      id?: string
      foodId?: string
      date?: string
      reaction?: Reaction
      note?: string
    }>
  }

  const birthDate = value.profile?.birthDate ?? ""
  const computedAgeMonths = calculateAgeMonths(birthDate)

  return {
    profile: {
      ageMonths: computedAgeMonths ?? value.profile?.ageMonths ?? initialState.profile.ageMonths,
      birthDate,
      childName: value.profile?.childName ?? "",
    },
    tests: sortTests(
      (value.tests ?? [])
        .filter((test): test is FoodTest =>
          Boolean(test.id && test.foodId && test.date && test.reaction),
        )
        .map((test) => ({
          id: test.id,
          foodId: test.foodId,
          date: test.date,
          reaction: test.reaction,
          note: test.note ?? "",
        })),
    ),
  }
}

export function useBabyStore() {
  const [state, setState] = useState<StoredState>(() => readStoredState())
  const [familySession, setFamilySession] = useState<FamilySession | null>(() => readFamilySession())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured ? "idle" : "not-configured",
  )
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!familySession) {
      localStorage.removeItem(familySessionKey)
      return
    }

    localStorage.setItem(familySessionKey, JSON.stringify(familySession))
  }, [familySession])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !familySession) return

    let isCancelled = false
    const familyCodeHash = familySession.familyCodeHash

    async function loadRemoteState() {
      setSyncStatus("loading")
      setSyncError(null)

      const { data, error } = await supabase!.rpc("get_baby_family_state", {
        p_family_code_hash: familyCodeHash,
      })

      if (isCancelled) return

      if (error) {
        setSyncStatus(navigator.onLine ? "error" : "offline")
        setSyncError(error.message)
        return
      }

      setState(parseRemoteState(data))
      setSyncStatus("idle")
    }

    loadRemoteState()

    return () => {
      isCancelled = true
    }
  }, [familySession])

  const testedFoodIds = useMemo(
    () => new Set(state.tests.map((test) => test.foodId)),
    [state.tests],
  )

  const latestByFood = useMemo(() => {
    const latest = new Map<string, FoodTest>()
    state.tests.forEach((test) => {
      const existing = latest.get(test.foodId)
      if (!existing || test.date > existing.date) latest.set(test.foodId, test)
    })
    return latest
  }, [state.tests])

  async function connectFamily(code: string) {
    if (!isSupabaseConfigured || !supabase) {
      setSyncStatus("not-configured")
      setSyncError("Supabase n’est pas encore configuré.")
      return false
    }

    const familyCodeHash = await hashFamilyCode(code)
    const nextSession = { familyCodeHash, familyCodeLabel: code.trim() }
    setFamilySession(nextSession)
    return true
  }

  function disconnectFamily() {
    setFamilySession(null)
    setState(initialState)
    setSyncError(null)
    setSyncStatus(isSupabaseConfigured ? "idle" : "not-configured")
  }

  async function refresh() {
    if (!isSupabaseConfigured || !supabase || !familySession) return

    setSyncStatus("loading")
    const { data, error } = await supabase.rpc("get_baby_family_state", {
      p_family_code_hash: familySession.familyCodeHash,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setState(parseRemoteState(data))
    setSyncStatus("idle")
    setSyncError(null)
  }

  async function updateProfile(nextProfile: Partial<BabyProfile>) {
    const mergedProfile = {
      ...state.profile,
      ...nextProfile,
    }
    const computedAgeMonths = calculateAgeMonths(mergedProfile.birthDate)
    const profile = {
      ...mergedProfile,
      ageMonths: computedAgeMonths ?? mergedProfile.ageMonths,
    }

    setState((current) => ({
      ...current,
      profile,
    }))

    if (!isSupabaseConfigured || !supabase || !familySession) return

    setSyncStatus("syncing")
    const { error } = await supabase.rpc("upsert_baby_profile", {
      p_age_months: profile.ageMonths,
      p_birth_date: profile.birthDate || null,
      p_child_name: profile.childName || null,
      p_family_code_hash: familySession.familyCodeHash,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setSyncStatus("idle")
    setSyncError(null)
  }

  async function updateAge(ageMonths: number) {
    await updateProfile({ ageMonths, birthDate: "" })
  }

  async function addTest(test: Omit<FoodTest, "id">) {
    const nextTest = { ...test, id: crypto.randomUUID() }

    setState((current) => ({
      ...current,
      tests: sortTests([nextTest, ...current.tests]),
    }))

    if (!isSupabaseConfigured || !supabase || !familySession) return

    setSyncStatus("syncing")
    const { error } = await supabase.rpc("add_baby_food_test", {
      p_date: nextTest.date,
      p_family_code_hash: familySession.familyCodeHash,
      p_food_id: nextTest.foodId,
      p_id: nextTest.id,
      p_note: nextTest.note,
      p_reaction: nextTest.reaction,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setSyncStatus("idle")
    setSyncError(null)
  }

  return {
    ...state,
    addTest,
    connectFamily,
    disconnectFamily,
    familySession,
    isConfigured: isSupabaseConfigured,
    latestByFood,
    refresh,
    syncError,
    syncStatus,
    testedFoodIds,
    updateAge,
    updateProfile,
  }
}

export const reactions: Reaction[] = [
  "aucune réaction",
  "digestion difficile",
  "rougeur",
  "vomissement",
  "autre",
]

import { useEffect, useMemo, useState } from "react"

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

export type Reaction = "aucune réaction" | "digestion difficile" | "rougeur" | "vomissement" | "autre"

export type FoodTest = {
  id: string
  foodId: string
  date: string
  isPopote: boolean
  reaction: Reaction
  note: string
}

export type BabyProfile = {
  ageMonths: number
  birthDate: string
  childName: string
}

export type StoredState = {
  profile: BabyProfile
  tests: FoodTest[]
}

export type FamilySession = {
  familyCodeHash: string
  familyCodeLabel?: string
}

export type BabyBackup = {
  app: "diversibebs"
  exportedAt: string
  familySession: FamilySession | null
  state: StoredState
  version: 1
}

type SyncStatus = "idle" | "loading" | "syncing" | "error" | "offline" | "not-configured"

const storageKey = "diversibebs-state-v2"
const legacyStorageKey = "diversibebs-state-v1"
const familySessionKey = "diversibebs-family-session-v1"

const initialState: StoredState = {
  profile: { ageMonths: 4, birthDate: "", childName: "" },
  tests: [],
}

const validReactions: Reaction[] = [
  "aucune réaction",
  "digestion difficile",
  "rougeur",
  "vomissement",
  "autre",
]

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

function readLocalStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The in-memory state remains usable even if private browsing or quota blocks writes.
  }
}

function removeLocalStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage cleanup errors; the current session state is still authoritative.
  }
}

function isReaction(value: unknown): value is Reaction {
  return typeof value === "string" && validReactions.includes(value as Reaction)
}

function normalizeStoredState(value: Partial<StoredState> | null | undefined): StoredState {
  const profile = { ...initialState.profile, ...(value?.profile ?? {}) }
  const computedAgeMonths = calculateAgeMonths(profile.birthDate)

  return {
    profile: {
      ageMonths: computedAgeMonths ?? profile.ageMonths,
      birthDate: profile.birthDate ?? "",
      childName: profile.childName ?? "",
    },
    tests: sortTests(
      (value?.tests ?? [])
        .filter((test): test is FoodTest =>
          Boolean(test.id && test.foodId && test.date && isReaction(test.reaction)),
        )
        .map((test) => ({
          id: test.id,
          foodId: test.foodId,
          date: test.date,
          isPopote: test.isPopote ?? false,
          reaction: test.reaction,
          note: test.note ?? "",
        })),
    ),
  }
}

function readStoredState() {
  const stored = readLocalStorage(storageKey) ?? readLocalStorage(legacyStorageKey)
  if (!stored) return initialState

  try {
    return normalizeStoredState(JSON.parse(stored) as Partial<StoredState>)
  } catch {
    return initialState
  }
}

function readFamilySession() {
  const stored = readLocalStorage(familySessionKey)
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

function remoteTextOrFallback(value: string | null | undefined, fallback: string) {
  if (value === null || typeof value === "undefined") return fallback
  if (value === "" && fallback) return fallback
  return value
}

function parseRemoteState(data: unknown, fallbackState: StoredState = initialState): StoredState {
  if (!data || typeof data !== "object") return fallbackState

  const value = data as {
    profile?: { ageMonths?: number; birthDate?: string | null; childName?: string | null }
    tests?: Array<{
      id?: string
      foodId?: string
      isPopote?: boolean
      date?: string
      reaction?: Reaction
      note?: string
    }>
  }

  return normalizeStoredState({
    profile: {
      ageMonths: value.profile?.ageMonths ?? fallbackState.profile.ageMonths,
      birthDate: remoteTextOrFallback(value.profile?.birthDate, fallbackState.profile.birthDate),
      childName: remoteTextOrFallback(value.profile?.childName, fallbackState.profile.childName),
    },
    tests: (value.tests ?? []).map((test) => ({
      id: test.id ?? "",
      foodId: test.foodId ?? "",
      date: test.date ?? "",
      isPopote: test.isPopote ?? false,
      reaction: test.reaction ?? "aucune réaction",
      note: test.note ?? "",
    })),
  })
}

function parseBackupPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Le fichier sélectionné n’est pas une sauvegarde Diversibebs valide.")
  }

  const value = payload as Partial<BabyBackup>

  if (value.app !== "diversibebs" || value.version !== 1 || !value.state) {
    throw new Error("Le format de sauvegarde n’est pas reconnu.")
  }

  const familySession =
    value.familySession &&
    typeof value.familySession === "object" &&
    typeof value.familySession.familyCodeHash === "string"
      ? {
          familyCodeHash: value.familySession.familyCodeHash,
          familyCodeLabel: value.familySession.familyCodeLabel,
        }
      : null

  return {
    familySession,
    state: normalizeStoredState(value.state),
  }
}

export function useBabyStore() {
  const initialFamilySession = useMemo(() => readFamilySession(), [])
  const [state, setState] = useState<StoredState>(() => readStoredState())
  const [familySession, setFamilySession] = useState<FamilySession | null>(initialFamilySession)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured ? (initialFamilySession ? "loading" : "idle") : "not-configured",
  )
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    writeLocalStorage(storageKey, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!familySession) {
      removeLocalStorage(familySessionKey)
      return
    }

    writeLocalStorage(familySessionKey, JSON.stringify(familySession))
  }, [familySession])

  useEffect(() => {
    if (!isSupabaseConfigured || !familySession) return

    let isCancelled = false
    const familyCodeHash = familySession.familyCodeHash

    async function loadRemoteState() {
      setSyncStatus("loading")
      setSyncError(null)

      const client = await getSupabase()
      if (!client || isCancelled) return

      const { data, error } = await client.rpc("get_baby_family_state", {
        p_family_code_hash: familyCodeHash,
      })

      if (isCancelled) return

      if (error) {
        setSyncStatus(navigator.onLine ? "error" : "offline")
        setSyncError(error.message)
        return
      }

      setState((current) => parseRemoteState(data, current))
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
    if (!isSupabaseConfigured) {
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
    if (!isSupabaseConfigured || !familySession) return

    setSyncStatus("loading")
    const client = await getSupabase()
    if (!client) return

    const { data, error } = await client.rpc("get_baby_family_state", {
      p_family_code_hash: familySession.familyCodeHash,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setState((current) => parseRemoteState(data, current))
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

    if (!isSupabaseConfigured || !familySession) return true

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return true

    const { error } = await client.rpc("upsert_baby_profile", {
      p_age_months: profile.ageMonths,
      p_birth_date: profile.birthDate || null,
      p_child_name: profile.childName || null,
      p_family_code_hash: familySession.familyCodeHash,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    setSyncStatus("idle")
    setSyncError(null)
    return true
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

    if (!isSupabaseConfigured || !familySession) return

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return

    const { error } = await client.rpc("add_baby_food_test", {
      p_date: nextTest.date,
      p_family_code_hash: familySession.familyCodeHash,
      p_food_id: nextTest.foodId,
      p_id: nextTest.id,
      p_is_popote: nextTest.isPopote,
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

  async function updateTest(testId: string, nextTest: Omit<FoodTest, "id">) {
    const testWithId = { ...nextTest, id: testId }

    setState((current) => ({
      ...current,
      tests: sortTests(current.tests.map((test) => (test.id === testId ? testWithId : test))),
    }))

    if (!isSupabaseConfigured || !familySession) return

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return

    const { error } = await client.rpc("update_baby_food_test", {
      p_date: testWithId.date,
      p_family_code_hash: familySession.familyCodeHash,
      p_id: testWithId.id,
      p_is_popote: testWithId.isPopote,
      p_note: testWithId.note,
      p_reaction: testWithId.reaction,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setSyncStatus("idle")
    setSyncError(null)
  }

  async function deleteTest(testId: string) {
    setState((current) => ({
      ...current,
      tests: current.tests.filter((test) => test.id !== testId),
    }))

    if (!isSupabaseConfigured || !familySession) return

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return

    const { error } = await client.rpc("delete_baby_food_test", {
      p_family_code_hash: familySession.familyCodeHash,
      p_id: testId,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return
    }

    setSyncStatus("idle")
    setSyncError(null)
  }

  function exportBackup(): BabyBackup {
    return {
      app: "diversibebs",
      exportedAt: new Date().toISOString(),
      familySession,
      state,
      version: 1,
    }
  }

  function importBackup(payload: unknown) {
    const nextBackup = parseBackupPayload(payload)
    setState(nextBackup.state)
    setFamilySession(nextBackup.familySession)
    setSyncError(null)
    setSyncStatus(isSupabaseConfigured ? "idle" : "not-configured")
  }

  return {
    ...state,
    addTest,
    connectFamily,
    deleteTest,
    disconnectFamily,
    familySession,
    exportBackup,
    importBackup,
    isConfigured: isSupabaseConfigured,
    latestByFood,
    refresh,
    syncError,
    syncStatus,
    testedFoodIds,
    updateAge,
    updateProfile,
    updateTest,
  }
}

export const reactions: Reaction[] = [
  ...validReactions,
]

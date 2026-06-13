import { useEffect, useMemo, useState } from "react"

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

export type Reaction = "Aucune" | "Aime" | "Aime pas" | "Allergie" | "Vomi" | "Digestion" | "Autre"

export type FoodTest = {
  id: string
  foodId: string
  date: string
  mealTime: string
  reaction: Reaction
  note: string
}

export type BabyProfile = {
  ageMonths: number
  avatarEmoji: string
  birthDate: string
  childName: string
}

export const defaultAvatarEmoji = "👶"

export type StoredState = {
  profile: BabyProfile
  tests: FoodTest[]
}

export type FamilySession = {
  familyCodeHash: string
  familyCodeLabel?: string
  hasProfilePin?: boolean
}

export type BabyBackup = {
  app: "petitbout"
  exportedAt: string
  familySession: FamilySession | null
  state: StoredState
  version: 1
}

type SyncStatus = "idle" | "loading" | "syncing" | "error" | "offline" | "not-configured"
type SupabaseClientInstance = NonNullable<Awaited<ReturnType<typeof getSupabase>>>

export const familyCodeMinLength = 8
export const familyCodeMaxLength = 80
export const profilePinLength = 4
export const childNameMaxLength = 40
export const foodIdMaxLength = 80
export const noteMaxLength = 800
export const reactionDetailMaxLength = 120
export const minAgeMonths = 0
export const maxAgeMonths = 36

const appStorageNamespace = "petitbout"
const previousStorageNamespace = ["diversi", "bebs"].join("")

const storageKey = `${appStorageNamespace}-state-v2`
const legacyStorageKey = `${appStorageNamespace}-state-v1`
const previousStorageKeys = [`${previousStorageNamespace}-state-v2`, `${previousStorageNamespace}-state-v1`]
const familySessionKey = `${appStorageNamespace}-family-session-v1`
const previousFamilySessionKey = `${previousStorageNamespace}-family-session-v1`
const lastSyncedAtKey = `${appStorageNamespace}-last-synced-at-v1`

const initialState: StoredState = {
  profile: { ageMonths: 4, avatarEmoji: defaultAvatarEmoji, birthDate: "", childName: "" },
  tests: [],
}

const validReactions: Reaction[] = [
  "Aucune",
  "Aime",
  "Aime pas",
  "Allergie",
  "Vomi",
  "Digestion",
  "Autre",
]

// Anciennes valeurs de réaction (proto pré-alignement iOS) → nouvel ensemble iOS.
// Garde les carnets locaux et distants lisibles après la migration.
const legacyReactionMap: Record<string, Reaction> = {
  "aucune réaction": "Aucune",
  "digestion difficile": "Digestion",
  rougeur: "Allergie",
  vomissement: "Vomi",
  autre: "Autre",
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

export function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function sanitizeFreeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false

  const [year, month, day] = value.split("-").map(Number)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function sanitizeDateString(value: unknown): string {
  return isValidDateString(value) ? value : ""
}

function sanitizeMealTime(value: unknown): string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return ""

  const [hour, minute] = value.split(":").map(Number)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return ""

  return value
}

function isValidFamilyCodeHash(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
}

function sanitizeFamilyCodeLabel(value: unknown) {
  return sanitizeText(value, familyCodeMaxLength)
}

function sanitizeProfilePin(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\D/g, "").slice(0, profilePinLength)
}

function normalizeFamilySession(value: unknown): FamilySession | null {
  if (!value || typeof value !== "object") return null

  const session = value as Partial<FamilySession>
  if (!isValidFamilyCodeHash(session.familyCodeHash)) return null

  return {
    familyCodeHash: session.familyCodeHash,
    familyCodeLabel: sanitizeFamilyCodeLabel(session.familyCodeLabel),
    hasProfilePin: Boolean(session.hasProfilePin),
  }
}

export function calculateAgeMonths(birthDate: string) {
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

function coerceReaction(value: unknown): Reaction {
  if (typeof value !== "string") return "Aucune"
  if (validReactions.includes(value as Reaction)) return value as Reaction
  return legacyReactionMap[value] ?? "Aucune"
}

function normalizeStoredState(value: Partial<StoredState> | null | undefined): StoredState {
  const profile = { ...initialState.profile, ...(value?.profile ?? {}) }
  const birthDate = sanitizeDateString(profile.birthDate)
  const computedAgeMonths = calculateAgeMonths(birthDate)

  return {
    profile: {
      ageMonths: clampNumber(computedAgeMonths ?? profile.ageMonths, minAgeMonths, maxAgeMonths, initialState.profile.ageMonths),
      avatarEmoji: profile.avatarEmoji?.trim() ? profile.avatarEmoji : defaultAvatarEmoji,
      birthDate,
      childName: sanitizeText(profile.childName, childNameMaxLength),
    },
    tests: sortTests(
      (value?.tests ?? [])
        .filter((test): test is FoodTest => Boolean(test.id && test.foodId && isValidDateString(test.date)))
        .map((test) => ({
          id: sanitizeText(test.id, 80),
          foodId: sanitizeText(test.foodId, foodIdMaxLength),
          date: sanitizeDateString(test.date),
          mealTime: sanitizeMealTime(test.mealTime),
          reaction: coerceReaction(test.reaction),
          note: sanitizeFreeText(test.note, noteMaxLength),
        }))
        .filter((test) => Boolean(test.id && test.foodId && test.date)),
    ),
  }
}

function readStoredState() {
  const stored =
    readLocalStorage(storageKey) ??
    readLocalStorage(legacyStorageKey) ??
    previousStorageKeys.map((key) => readLocalStorage(key)).find(Boolean)
  if (!stored) return initialState

  try {
    return normalizeStoredState(JSON.parse(stored) as Partial<StoredState>)
  } catch {
    return initialState
  }
}

function readFamilySession() {
  const stored = readLocalStorage(familySessionKey) ?? readLocalStorage(previousFamilySessionKey)
  if (!stored) return null

  try {
    return normalizeFamilySession(JSON.parse(stored))
  } catch {
    return null
  }
}

function readLastSyncedAt() {
  const stored = readLocalStorage(lastSyncedAtKey)
  if (!stored) return null

  const date = new Date(stored)
  return Number.isNaN(date.getTime()) ? null : stored
}

export function normalizeFamilyCode(code: string) {
  return sanitizeText(code, familyCodeMaxLength).toLowerCase()
}

export function normalizeProfilePin(pin: string) {
  return sanitizeProfilePin(pin)
}

async function hashFamilyAccess(code: string, pin: string) {
  const normalizedCode = normalizeFamilyCode(code)
  const normalizedPin = normalizeProfilePin(pin)
  const encoded = new TextEncoder().encode(`${normalizedCode}\u001f${normalizedPin}`)
  const digest = await crypto.subtle.digest("SHA-256", encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function sortTests(tests: FoodTest[]) {
  return [...tests].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date)
    if (dateOrder !== 0) return dateOrder

    return (b.mealTime || "00:00").localeCompare(a.mealTime || "00:00")
  })
}

function remoteTextOrFallback(value: string | null | undefined, fallback: string) {
  if (value === null || typeof value === "undefined") return fallback
  if (value === "" && fallback) return fallback
  return value
}

export function parseRemoteState(data: unknown, fallbackState: StoredState = initialState): StoredState {
  if (!data || typeof data !== "object") return fallbackState

  const value = data as {
    profile?: { ageMonths?: number; avatarEmoji?: string | null; birthDate?: string | null; childName?: string | null }
    tests?: Array<{
      id?: string
      foodId?: string
      date?: string
      mealTime?: string
      reaction?: Reaction
      note?: string
    }>
  }

  return normalizeStoredState({
    profile: {
      ageMonths: clampNumber(value.profile?.ageMonths, minAgeMonths, maxAgeMonths, fallbackState.profile.ageMonths),
      avatarEmoji: remoteTextOrFallback(value.profile?.avatarEmoji, fallbackState.profile.avatarEmoji),
      birthDate: remoteTextOrFallback(value.profile?.birthDate, fallbackState.profile.birthDate),
      childName: remoteTextOrFallback(value.profile?.childName, fallbackState.profile.childName),
    },
    tests: (value.tests ?? []).slice(0, 1000).map((test) => ({
      id: test.id ?? "",
      foodId: test.foodId ?? "",
      date: test.date ?? "",
      mealTime: test.mealTime ?? "",
      reaction: coerceReaction(test.reaction),
      note: test.note ?? "",
    })),
  })
}

export function parseBackupPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Le fichier sélectionné n’est pas une sauvegarde Petitbout valide.")
  }

  const value = payload as Partial<BabyBackup>

  if (
    ![appStorageNamespace, previousStorageNamespace].includes(String(value.app)) ||
    value.version !== 1 ||
    !value.state
  ) {
    throw new Error("Le format de sauvegarde n’est pas reconnu.")
  }

  const familySession = normalizeFamilySession(value.familySession)

  return {
    familySession,
    state: normalizeStoredState(value.state),
  }
}

async function upsertRemoteProfile(
  client: SupabaseClientInstance,
  familyCodeHash: string,
  profile: BabyProfile,
) {
  const payload = {
    p_age_months: profile.ageMonths,
    p_birth_date: profile.birthDate || null,
    p_child_name: profile.childName || null,
    p_family_code_hash: familyCodeHash,
  }

  const { error } = await client.rpc("upsert_baby_profile", {
    ...payload,
    p_avatar_emoji: profile.avatarEmoji || defaultAvatarEmoji,
  })

  if (!error) return { error: null }

  const canRetryWithoutAvatar =
    error.message.includes("p_avatar_emoji") ||
    error.message.includes("Could not find the function")

  if (!canRetryWithoutAvatar) return { error }

  const { error: legacyError } = await client.rpc("upsert_baby_profile", payload)
  return { error: legacyError }
}

export function useBabyStore() {
  const initialFamilySession = useMemo(() => readFamilySession(), [])
  const [state, setState] = useState<StoredState>(() => readStoredState())
  const [familySession, setFamilySession] = useState<FamilySession | null>(initialFamilySession)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured ? (initialFamilySession ? "loading" : "idle") : "not-configured",
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => readLastSyncedAt())

  function markSyncSucceeded() {
    setLastSyncedAt(new Date().toISOString())
  }

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
    if (lastSyncedAt) {
      writeLocalStorage(lastSyncedAtKey, lastSyncedAt)
      return
    }

    removeLocalStorage(lastSyncedAtKey)
  }, [lastSyncedAt])

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
      markSyncSucceeded()
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
      if (
        !existing ||
        `${test.date}T${test.mealTime || "00:00"}` > `${existing.date}T${existing.mealTime || "00:00"}`
      ) {
        latest.set(test.foodId, test)
      }
    })
    return latest
  }, [state.tests])

  async function connectFamily(code: string, pin: string) {
    const normalizedCode = normalizeFamilyCode(code)
    if (normalizedCode.length < familyCodeMinLength) {
      setSyncError(`Le code famille doit contenir au moins ${familyCodeMinLength} caractères.`)
      return false
    }

    const normalizedPin = normalizeProfilePin(pin)
    if (normalizedPin.length !== profilePinLength) {
      setSyncError(`Le PIN du profil bébé doit contenir ${profilePinLength} chiffres.`)
      return false
    }

    const familyCodeHash = await hashFamilyAccess(normalizedCode, normalizedPin)
    const nextSession = { familyCodeHash, familyCodeLabel: normalizedCode, hasProfilePin: true }

    if (!isSupabaseConfigured) {
      setSyncStatus("not-configured")
      setSyncError("Supabase n’est pas encore configuré.")
      setFamilySession(nextSession)
      return true
    }

    setSyncStatus("syncing")
    setSyncError(null)

    const client = await getSupabase()
    if (!client) return false

    const { error } = await upsertRemoteProfile(client, familyCodeHash, state.profile)
    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    setFamilySession(nextSession)
    markSyncSucceeded()
    return true
  }

  function disconnectFamily() {
    setFamilySession(null)
    setState(initialState)
    setSyncError(null)
    setLastSyncedAt(null)
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
    markSyncSucceeded()
    setSyncStatus("idle")
    setSyncError(null)
  }

  async function updateProfile(nextProfile: Partial<BabyProfile>) {
    const mergedProfile = {
      ...state.profile,
      ...nextProfile,
    }
    const birthDate = sanitizeDateString(mergedProfile.birthDate)
    const computedAgeMonths = calculateAgeMonths(birthDate)
    const profile = {
      ...mergedProfile,
      ageMonths: clampNumber(computedAgeMonths ?? mergedProfile.ageMonths, minAgeMonths, maxAgeMonths, initialState.profile.ageMonths),
      birthDate,
      childName: sanitizeText(mergedProfile.childName, childNameMaxLength),
    }

    setState((current) => ({
      ...current,
      profile,
    }))

    if (!familySession) return true

    if (!isSupabaseConfigured) {
      setSyncStatus("not-configured")
      setSyncError("Supabase n’est pas encore configuré.")
      setLastSyncedAt(null)
      return false
    }

    setSyncStatus("syncing")
    setSyncError(null)
    const client = await getSupabase()
    if (!client) {
      setSyncStatus("not-configured")
      setSyncError("Supabase n’est pas encore configuré.")
      setLastSyncedAt(null)
      return false
    }

    const { error } = await upsertRemoteProfile(client, familySession.familyCodeHash, profile)

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    setSyncStatus("idle")
    setSyncError(null)
    markSyncSucceeded()
    return true
  }

  async function updateAge(ageMonths: number) {
    await updateProfile({ ageMonths, birthDate: "" })
  }

  async function addTest(test: Omit<FoodTest, "id">) {
    const nextTest = normalizeStoredState({
      ...state,
      tests: [{ ...test, id: crypto.randomUUID() }],
    }).tests[0]
    if (!nextTest) return false
    const previousState = state

    setState((current) => ({
      ...current,
      tests: sortTests([nextTest, ...current.tests]),
    }))

    if (!isSupabaseConfigured || !familySession) return true

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return true

    const addPayload = {
      p_date: nextTest.date,
      p_family_code_hash: familySession.familyCodeHash,
      p_food_id: nextTest.foodId,
      p_id: nextTest.id,
      p_meal_time: nextTest.mealTime || null,
      p_note: nextTest.note,
      p_reaction: nextTest.reaction,
    }

    let { error } = await client.rpc("add_baby_food_test", addPayload)
    if (error && error.message.includes("p_meal_time")) {
      const { p_meal_time: _pMealTime, ...legacyPayload } = addPayload
      ;({ error } = await client.rpc("add_baby_food_test", legacyPayload))
    }

    if (error) {
      setState(previousState)
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    const { error: profileError } = await upsertRemoteProfile(client, familySession.familyCodeHash, state.profile)
    if (profileError) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(profileError.message)
      markSyncSucceeded()
      return true
    }

    setSyncStatus("idle")
    setSyncError(null)
    markSyncSucceeded()
    return true
  }

  async function updateTest(testId: string, nextTest: Omit<FoodTest, "id">) {
    const testWithId = normalizeStoredState({
      ...state,
      tests: [{ ...nextTest, id: testId }],
    }).tests[0]
    if (!testWithId) return false
    const previousState = state

    setState((current) => ({
      ...current,
      tests: sortTests(current.tests.map((test) => (test.id === testId ? testWithId : test))),
    }))

    if (!isSupabaseConfigured || !familySession) return true

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return true

    const updatePayload = {
      p_date: testWithId.date,
      p_family_code_hash: familySession.familyCodeHash,
      p_id: testWithId.id,
      p_meal_time: testWithId.mealTime || null,
      p_note: testWithId.note,
      p_reaction: testWithId.reaction,
    }

    let { error } = await client.rpc("update_baby_food_test", updatePayload)
    if (error && error.message.includes("p_meal_time")) {
      const { p_meal_time: _pMealTime, ...legacyPayload } = updatePayload
      ;({ error } = await client.rpc("update_baby_food_test", legacyPayload))
    }

    if (error) {
      setState(previousState)
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    const { error: profileError } = await upsertRemoteProfile(client, familySession.familyCodeHash, state.profile)
    if (profileError) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(profileError.message)
      markSyncSucceeded()
      return true
    }

    setSyncStatus("idle")
    setSyncError(null)
    markSyncSucceeded()
    return true
  }

  async function deleteTest(testId: string) {
    const previousState = state

    setState((current) => ({
      ...current,
      tests: current.tests.filter((test) => test.id !== testId),
    }))

    if (!isSupabaseConfigured || !familySession) return true

    setSyncStatus("syncing")
    const client = await getSupabase()
    if (!client) return true

    const { error } = await client.rpc("delete_baby_food_test", {
      p_family_code_hash: familySession.familyCodeHash,
      p_id: testId,
    })

    if (error) {
      setState(previousState)
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    const { error: profileError } = await upsertRemoteProfile(client, familySession.familyCodeHash, state.profile)
    if (profileError) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(profileError.message)
      markSyncSucceeded()
      return true
    }

    setSyncStatus("idle")
    setSyncError(null)
    markSyncSucceeded()
    return true
  }

  function exportBackup(): BabyBackup {
    return {
      app: "petitbout",
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
    setLastSyncedAt(null)
    setSyncStatus(isSupabaseConfigured ? "idle" : "not-configured")
  }

  function clearDeviceData() {
    setState(initialState)
    setFamilySession(null)
    setSyncError(null)
    setLastSyncedAt(null)
    setSyncStatus(isSupabaseConfigured ? "idle" : "not-configured")
  }

  async function deleteFamilySpace() {
    if (!familySession) {
      clearDeviceData()
      return true
    }

    if (!isSupabaseConfigured) {
      clearDeviceData()
      return true
    }

    setSyncStatus("syncing")
    setSyncError(null)

    const client = await getSupabase()
    if (!client) {
      setSyncStatus("not-configured")
      setSyncError("Supabase n’est pas encore configuré.")
      return false
    }

    const { error } = await client.rpc("delete_baby_family_state", {
      p_family_code_hash: familySession.familyCodeHash,
    })

    if (error) {
      setSyncStatus(navigator.onLine ? "error" : "offline")
      setSyncError(error.message)
      return false
    }

    clearDeviceData()
    return true
  }

  return {
    ...state,
    addTest,
    clearDeviceData,
    connectFamily,
    deleteTest,
    deleteFamilySpace,
    disconnectFamily,
    familySession,
    exportBackup,
    importBackup,
    isConfigured: isSupabaseConfigured,
    lastSyncedAt,
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

import { useCallback, useEffect, useState } from "react"

/**
 * Personal admin mode for editing the food catalog.
 *
 * GitHub Pages is static hosting, so there is no server to write back to the
 * repository. The admin editor therefore works on a local draft and lets the
 * maintainer export an updated `FoodCatalog.csv` to commit by hand.
 *
 * Access is gated by a two-step secret that never ships in plaintext:
 *   1. a secret URL param (`?admin=<secret>`) reveals the mode and is then
 *      remembered on the device (localStorage),
 *   2. a PIN unlocks editing for the current tab session (sessionStorage).
 *
 * Only the SHA-256 hashes of the secret and PIN are baked into the bundle, via
 * build-time env vars. If either is missing the whole feature stays inert, so a
 * default build exposes nothing.
 */

const secretHash = (import.meta.env.VITE_ADMIN_SECRET_HASH as string | undefined)?.toLowerCase()
const pinHash = (import.meta.env.VITE_ADMIN_PIN_HASH as string | undefined)?.toLowerCase()

export const adminFeatureEnabled = Boolean(secretHash && pinHash)

const adminUrlParam = "admin"
const revealedKey = "petitbout-admin-revealed"
const unlockedKey = "petitbout-admin-unlocked"

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function readRevealed() {
  if (!adminFeatureEnabled || typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(revealedKey) === "1"
  } catch {
    return false
  }
}

function readUnlocked() {
  if (!readRevealed() || typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(unlockedKey) === "1"
  } catch {
    return false
  }
}

function stripAdminParam() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(adminUrlParam)) return
  url.searchParams.delete(adminUrlParam)
  const search = url.searchParams.toString()
  window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`)
}

/**
 * Consumes `?admin=<secret>` from the URL. On a correct secret the mode is
 * revealed and remembered on this device; the param is always stripped so it
 * does not linger in history or get shared accidentally.
 */
async function processAdminUrlParam() {
  if (!adminFeatureEnabled || typeof window === "undefined") return readRevealed()

  const candidate = new URLSearchParams(window.location.search).get(adminUrlParam)
  if (candidate === null) return readRevealed()

  let matched: boolean
  try {
    matched = (await sha256Hex(candidate)) === secretHash
  } catch {
    matched = false
  }

  if (matched) {
    try {
      window.localStorage.setItem(revealedKey, "1")
    } catch {
      // Ignore storage failures (private mode); the param check below still cleans up.
    }
  }

  stripAdminParam()
  return matched || readRevealed()
}

async function verifyAdminPin(pin: string) {
  if (!readRevealed()) return false

  let matched: boolean
  try {
    matched = (await sha256Hex(pin.trim())) === pinHash
  } catch {
    matched = false
  }

  if (matched) {
    try {
      window.sessionStorage.setItem(unlockedKey, "1")
    } catch {
      // Unlock will simply not persist across reloads; the session still works.
    }
  }

  return matched
}

function clearAdminAccess() {
  try {
    window.localStorage.removeItem(revealedKey)
    window.sessionStorage.removeItem(unlockedKey)
  } catch {
    // Nothing else to do.
  }
}

export type AdminAccess = {
  enabled: boolean
  ready: boolean
  revealed: boolean
  unlocked: boolean
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  revoke: () => void
}

export function useAdminAccess(): AdminAccess {
  const [ready, setReady] = useState(!adminFeatureEnabled)
  const [revealed, setRevealed] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    if (!adminFeatureEnabled) return

    let active = true
    void processAdminUrlParam().then((isRevealed) => {
      if (!active) return
      setRevealed(isRevealed)
      setUnlocked(isRevealed && readUnlocked())
      setReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  const unlock = useCallback(async (pin: string) => {
    const ok = await verifyAdminPin(pin)
    if (ok) setUnlocked(true)
    return ok
  }, [])

  const lock = useCallback(() => {
    try {
      window.sessionStorage.removeItem(unlockedKey)
    } catch {
      // Ignore.
    }
    setUnlocked(false)
  }, [])

  const revoke = useCallback(() => {
    clearAdminAccess()
    setRevealed(false)
    setUnlocked(false)
  }, [])

  return { enabled: adminFeatureEnabled, ready, revealed, unlocked, unlock, lock, revoke }
}

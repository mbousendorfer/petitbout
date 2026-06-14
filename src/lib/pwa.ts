import { registerSW } from "virtual:pwa-register"
import { appBuildId } from "@/lib/buildInfo"

let hasReloadedForUpdate = false
const cacheRepairKey = "petitbout-pwa-cache-repair-v2"
const cacheRepairVersion = appBuildId
const appScope =
  typeof window !== "undefined"
    ? new URL(import.meta.env.BASE_URL, window.location.origin).href
    : ""

function reloadForUpdate() {
  if (hasReloadedForUpdate) return
  hasReloadedForUpdate = true
  window.location.reload()
}

async function repairStaleCachesOnce() {
  if (
    typeof window === "undefined" ||
    import.meta.env.DEV ||
    !navigator.onLine ||
    !("caches" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return
  }

  try {
    if (localStorage.getItem(cacheRepairKey) === cacheRepairVersion) return
    if (!navigator.serviceWorker.controller) {
      localStorage.setItem(cacheRepairKey, cacheRepairVersion)
      return
    }

    localStorage.setItem(cacheRepairKey, cacheRepairVersion)

    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((registration) => registration.scope.startsWith(appScope))
        .map((registration) => registration.unregister()),
    )

    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.includes("petitbout") || cacheName.includes("workbox-precache"))
        .map((cacheName) => caches.delete(cacheName)),
    )

    reloadForUpdate()
  } catch (error) {
    console.warn("PWA cache repair failed", error)
  }
}

export async function refreshPwaCaches() {
  if (
    typeof window === "undefined" ||
    !navigator.onLine ||
    !("caches" in window) ||
    !("serviceWorker" in navigator)
  ) {
    reloadForUpdate()
    return
  }

  try {
    await pwaUpdate(true)

    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((registration) => registration.scope.startsWith(appScope))
        .map((registration) => registration.update()),
    )

    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.includes("petitbout") || cacheName.includes("workbox-precache"))
        .map((cacheName) => caches.delete(cacheName)),
    )
  } catch (error) {
    console.warn("PWA cache refresh failed", error)
  } finally {
    reloadForUpdate()
  }
}

export const pwaUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event("petitbout:pwa-update"))
    void pwaUpdate(true)
  },
  onNeedReload() {
    reloadForUpdate()
  },
  onOfflineReady() {
    window.dispatchEvent(new Event("petitbout:pwa-offline-ready"))
  },
  onRegisteredSW(_swScriptUrl, registration) {
    if (!registration) return

    void repairStaleCachesOnce()

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void registration.update()
    })
  },
  onRegisterError(error) {
    console.warn("Service worker registration failed", error)
  },
})

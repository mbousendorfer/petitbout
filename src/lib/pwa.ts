import { useCallback, useEffect, useState } from "react"
import { registerSW } from "virtual:pwa-register"

let hasReloadedForUpdate = false
let installPrompt: BeforeInstallPromptEvent | null = null
const installPromptListeners = new Set<() => void>()
const appScope =
  typeof window !== "undefined"
    ? new URL(import.meta.env.BASE_URL, window.location.origin).href
    : ""

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function notifyInstallPromptListeners() {
  installPromptListeners.forEach((listener) => listener())
}

function setInstallPromptEvent(event: BeforeInstallPromptEvent | null) {
  installPrompt = event
  notifyInstallPromptListeners()
}

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false

  return /Android/i.test(navigator.userAgent)
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    setInstallPromptEvent(event as BeforeInstallPromptEvent)
  })

  window.addEventListener("appinstalled", () => {
    setInstallPromptEvent(null)
  })
}

function reloadForUpdate() {
  if (hasReloadedForUpdate) return
  hasReloadedForUpdate = true
  window.location.reload()
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

export function isPwaStandalone() {
  if (typeof window === "undefined") return false

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  )
}

export function usePwaInstallPrompt() {
  const [availableInstallPrompt, setAvailableInstallPrompt] = useState<BeforeInstallPromptEvent | null>(installPrompt)
  const [isStandalone, setIsStandalone] = useState(isPwaStandalone)
  const [isAndroid] = useState(isAndroidDevice)

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)")

    function updateStandaloneState() {
      setIsStandalone(isPwaStandalone())
    }

    function updateInstallPromptState() {
      setAvailableInstallPrompt(installPrompt)
    }

    function handleAppInstalled() {
      setIsStandalone(true)
    }

    window.addEventListener("appinstalled", handleAppInstalled)
    standaloneQuery.addEventListener("change", updateStandaloneState)
    fullscreenQuery.addEventListener("change", updateStandaloneState)
    installPromptListeners.add(updateInstallPromptState)
    updateInstallPromptState()
    updateStandaloneState()

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled)
      standaloneQuery.removeEventListener("change", updateStandaloneState)
      fullscreenQuery.removeEventListener("change", updateStandaloneState)
      installPromptListeners.delete(updateInstallPromptState)
    }
  }, [])

  const install = useCallback(async () => {
    if (!availableInstallPrompt) return false

    try {
      await availableInstallPrompt.prompt()
      const choice = await availableInstallPrompt.userChoice
      setInstallPromptEvent(null)
      return choice.outcome === "accepted"
    } catch (error) {
      console.warn("PWA install prompt failed", error)
      setInstallPromptEvent(null)
      return false
    }
  }, [availableInstallPrompt])

  return {
    canInstall: Boolean(availableInstallPrompt) && !isStandalone,
    install,
    isAndroid,
    isStandalone,
  }
}

export const pwaUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event("petitbout:pwa-update"))
  },
  onNeedReload() {
    reloadForUpdate()
  },
  onOfflineReady() {
    window.dispatchEvent(new Event("petitbout:pwa-offline-ready"))
  },
  onRegisteredSW(_swScriptUrl, registration) {
    if (!registration) return

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void registration.update()
    })
  },
  onRegisterError(error) {
    console.warn("Service worker registration failed", error)
  },
})

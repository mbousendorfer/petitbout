import { useCallback, useEffect, useState } from "react"
import { registerSW } from "virtual:pwa-register"

let hasReloadedForUpdate = false
const appScope =
  typeof window !== "undefined"
    ? new URL(import.meta.env.BASE_URL, window.location.origin).href
    : ""

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(isPwaStandalone)

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)")

    function updateStandaloneState() {
      setIsStandalone(isPwaStandalone())
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setInstallPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    standaloneQuery.addEventListener("change", updateStandaloneState)
    fullscreenQuery.addEventListener("change", updateStandaloneState)
    updateStandaloneState()

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      standaloneQuery.removeEventListener("change", updateStandaloneState)
      fullscreenQuery.removeEventListener("change", updateStandaloneState)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      setInstallPrompt(null)
      return choice.outcome === "accepted"
    } catch (error) {
      console.warn("PWA install prompt failed", error)
      setInstallPrompt(null)
      return false
    }
  }, [installPrompt])

  return {
    canInstall: Boolean(installPrompt) && !isStandalone,
    install,
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

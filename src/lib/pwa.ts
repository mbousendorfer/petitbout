import { registerSW } from "virtual:pwa-register"

let hasReloadedForUpdate = false

function reloadForUpdate() {
  if (hasReloadedForUpdate) return
  hasReloadedForUpdate = true
  window.location.reload()
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

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void registration.update()
    })
  },
  onRegisterError(error) {
    console.warn("Service worker registration failed", error)
  },
})

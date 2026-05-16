import { registerSW } from "virtual:pwa-register"

export const pwaUpdate = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event("diversibebs:pwa-update"))
  },
  onOfflineReady() {
    window.dispatchEvent(new Event("diversibebs:pwa-offline-ready"))
  },
  onRegisterError(error) {
    console.warn("Service worker registration failed", error)
  },
})

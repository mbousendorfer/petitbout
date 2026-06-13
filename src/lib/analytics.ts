const runtimeConfig = typeof window !== "undefined" ? window.__PETITBOUT_CONFIG__ : undefined

const plausibleDomain =
  runtimeConfig?.VITE_PLAUSIBLE_DOMAIN ||
  (import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined) ||
  "app.petitbout.app"

const plausibleScriptUrl =
  runtimeConfig?.VITE_PLAUSIBLE_SCRIPT_URL ||
  (import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL as string | undefined) ||
  "https://analytics.edenpulse.com/js/script.js"

const plausibleApiUrl =
  runtimeConfig?.VITE_PLAUSIBLE_API_URL ||
  (import.meta.env.VITE_PLAUSIBLE_API_URL as string | undefined) ||
  ""

export function initAnalytics() {
  if (typeof document === "undefined" || !plausibleDomain) {
    return
  }

  if (
    document.querySelector("script[data-petitbout-analytics='plausible']") ||
    document.querySelector(`script[data-domain='${plausibleDomain}'][src='${plausibleScriptUrl}']`)
  ) {
    return
  }

  const script = document.createElement("script")
  script.defer = true
  script.dataset.petitboutAnalytics = "plausible"
  script.dataset.domain = plausibleDomain
  script.src = plausibleScriptUrl

  if (plausibleApiUrl) {
    script.dataset.api = plausibleApiUrl
  }

  document.head.append(script)
}

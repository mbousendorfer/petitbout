/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __PETITBOUT_CONFIG__?: {
    VITE_SUPABASE_URL?: string
    VITE_SUPABASE_ANON_KEY?: string
    VITE_FEEDBACK_EMAIL?: string
    VITE_PLAUSIBLE_DOMAIN?: string
    VITE_PLAUSIBLE_SCRIPT_URL?: string
    VITE_PLAUSIBLE_API_URL?: string
  }
}

interface ImportMetaEnv {
  readonly VITE_FEEDBACK_EMAIL?: string
  readonly VITE_PLAUSIBLE_DOMAIN?: string
  readonly VITE_PLAUSIBLE_SCRIPT_URL?: string
  readonly VITE_PLAUSIBLE_API_URL?: string
}

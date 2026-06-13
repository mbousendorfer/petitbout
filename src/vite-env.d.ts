/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __PETITBOUT_CONFIG__?: {
    VITE_SUPABASE_URL?: string
    VITE_SUPABASE_ANON_KEY?: string
  }
}

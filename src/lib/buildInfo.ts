export const appBuildId = import.meta.env.VITE_APP_BUILD_ID ?? "dev"
export const appVersion = import.meta.env.VITE_APP_VERSION ?? `dev+${appBuildId}`

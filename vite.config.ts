import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string
}

function readGitValue(command: string) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return ""
  }
}

const buildIdSource =
  process.env.VITE_APP_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  readGitValue("git rev-parse --short=12 HEAD") ||
  `local-${Date.now()}`
const appBuildId = buildIdSource.slice(0, 12)
const appVersion = `${packageJson.version}+${appBuildId}`

export default defineConfig({
  base: "/",
  define: {
    "import.meta.env.VITE_APP_BUILD_ID": JSON.stringify(appBuildId),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      includeAssets: [
        "apple-touch-icon.png",
        "favicon.svg",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-192.png",
        "icon-maskable-512.png",
        "manifest.webmanifest",
        "offline.html",
      ],
      manifest: false,
      registerType: "autoUpdate",
      workbox: {
        cacheId: `petitbout-${appBuildId}`,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: null,
        runtimeCaching: [
          {
            handler: "NetworkFirst",
            options: {
              cacheName: `petitbout-navigation-${appBuildId}`,
              networkTimeoutSeconds: 3,
              precacheFallback: {
                fallbackURL: "offline.html",
              },
            },
            urlPattern: ({ request }) => request.mode === "navigate",
          },
        ],
        skipWaiting: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

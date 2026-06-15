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

// Incrementing build number: the count of commits reachable from HEAD, so it
// grows by one with each commit. CI must check out full history (fetch-depth: 0);
// inside Docker the .git folder is excluded, so the number is passed as a build
// arg via VITE_APP_BUILD_NUMBER.
const appBuildId =
  process.env.VITE_APP_BUILD_NUMBER ||
  readGitValue("git rev-list --count HEAD") ||
  `local-${Date.now()}`
const appVersion = `${packageJson.version}+${appBuildId}`

export default defineConfig({
  base: "/",
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
        globIgnores: ["env-config.js"],
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

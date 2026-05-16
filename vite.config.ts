import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: "/diversibebs/",
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
      ],
      manifest: false,
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "/diversibebs/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

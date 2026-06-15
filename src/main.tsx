import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter } from "react-router-dom"

// Nunito — police de marque embarquée (self-hosted) pour le repli hors Apple
// défini par le design system Argile. Sur Apple, SF Pro Rounded/Text passe en
// premier (cf. --font-rounded / --font-text) ; ailleurs, Nunito prend le relais.
// Sous-ensembles latin + latin-ext pour couvrir le français (é à ç ô œ…).
import "@fontsource/nunito/latin-400.css"
import "@fontsource/nunito/latin-500.css"
import "@fontsource/nunito/latin-600.css"
import "@fontsource/nunito/latin-700.css"
import "@fontsource/nunito/latin-800.css"
import "@fontsource/nunito/latin-ext-400.css"
import "@fontsource/nunito/latin-ext-500.css"
import "@fontsource/nunito/latin-ext-600.css"
import "@fontsource/nunito/latin-ext-700.css"
import "@fontsource/nunito/latin-ext-800.css"

import App from "@/App"
import "@/index.css"
import { initAnalytics } from "@/lib/analytics"
import "@/lib/viewport"
import "@/lib/pwa"

initAnalytics()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

import { useEffect, useMemo, useState } from "react"
import { Check, Download, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  )
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const isIos = useMemo(() => (typeof window === "undefined" ? false : isIosDevice()), [])

  useEffect(() => {
    const standaloneMediaQuery = window.matchMedia("(display-mode: standalone)")

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)
    standaloneMediaQuery.addEventListener("change", handleInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      standaloneMediaQuery.removeEventListener("change", handleInstalled)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <Card className="bg-card/92">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          {installed ? (
            <Check className="size-5" aria-hidden="true" />
          ) : isIos ? (
            <Share className="size-5" aria-hidden="true" />
          ) : (
            <Download className="size-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{installed ? "Diversibebs est installée" : "Installer Diversibebs"}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {installed
              ? "L’app est déjà disponible depuis l’écran d’accueil de cet appareil."
              : isIos
              ? "Sur iPhone ou iPad : partagez cette page, puis choisissez Ajouter à l’écran d’accueil."
              : "Ajoutez l’app à l’écran d’accueil pour l’ouvrir plus vite et l’utiliser hors ligne."}
          </p>
          {!installed && !isIos && deferredPrompt && (
            <Button type="button" size="sm" className="mt-3" onClick={install}>
              <Download data-icon="inline-start" aria-hidden="true" />
              Installer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

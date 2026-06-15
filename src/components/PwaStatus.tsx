import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import { Home, RefreshCw, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { pwaUpdate } from "@/lib/pwa"

export function PwaStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    function handleUpdate() {
      setHasUpdate(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("petitbout:pwa-update", handleUpdate)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("petitbout:pwa-update", handleUpdate)
    }
  }, [])

  if (isOnline && !hasUpdate) return null

  return (
    <div
      aria-live="polite"
      className="rounded-md border bg-card/90 p-3 text-sm text-muted-foreground shadow-soft"
    >
      {!isOnline && (
        <div className="grid gap-3">
          <span className="flex items-center gap-2">
            <WifiOff className="size-4" aria-hidden="true" />
            Hors ligne, les dernières données locales restent disponibles.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" size="sm" variant="outline">
              <NavLink to="/">
                <Home data-icon="inline-start" aria-hidden="true" />
                Accueil
              </NavLink>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        </div>
      )}
      {hasUpdate && (
        <div className="mt-3 flex items-center justify-between gap-3 first:mt-0">
          <span>Une mise à jour est disponible.</span>
          <Button type="button" size="sm" onClick={() => pwaUpdate(true)}>
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Mettre à jour
          </Button>
        </div>
      )}
    </div>
  )
}

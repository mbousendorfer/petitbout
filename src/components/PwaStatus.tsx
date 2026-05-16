import { useEffect, useState } from "react"
import { RefreshCw, WifiOff } from "lucide-react"
import { toast } from "sonner"

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

    function handleOfflineReady() {
      toast.success("Diversibebs est prêt hors ligne")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("diversibebs:pwa-update", handleUpdate)
    window.addEventListener("diversibebs:pwa-offline-ready", handleOfflineReady)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("diversibebs:pwa-update", handleUpdate)
      window.removeEventListener("diversibebs:pwa-offline-ready", handleOfflineReady)
    }
  }, [])

  if (isOnline && !hasUpdate) return null

  return (
    <div
      aria-live="polite"
      className="rounded-md border bg-card/90 p-3 text-sm text-muted-foreground shadow-soft"
    >
      {!isOnline && (
        <span className="flex items-center gap-2">
          <WifiOff className="size-4" aria-hidden="true" />
          Hors ligne, les dernières données locales restent disponibles.
        </span>
      )}
      {hasUpdate && (
        <div className="flex items-center justify-between gap-3">
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

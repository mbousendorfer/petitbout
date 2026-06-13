import { useRef } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ChevronLeft, CircleCheck, Download, ShieldCheck, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { backupFileName, backupToJson } from "@/lib/backup"
import { downloadTextFile } from "@/lib/formatting"
import { useBabyStore } from "@/lib/storage"
import { SettingsSection } from "@/pages/SettingsPage"

function lastSyncLabel(lastSyncedAt: string | null) {
  if (!lastSyncedAt) return "Jamais synchronisé"

  const date = new Date(lastSyncedAt)
  if (Number.isNaN(date.getTime())) return "Jamais synchronisé"

  return date.toLocaleString("fr-FR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function syncStatusCopy(store: ReturnType<typeof useBabyStore>) {
  if (store.syncStatus === "syncing" || store.syncStatus === "loading") {
    return { title: "Synchro en cours", detail: "Mise à jour du suivi..." }
  }

  if (store.syncStatus === "not-configured") {
    return {
      title: "Synchro indisponible",
      detail: "Stockage partagé non configuré sur cette installation",
    }
  }

  if (store.syncStatus === "offline") {
    return { title: "Synchro en attente", detail: "Hors connexion, réessaie plus tard" }
  }

  if (store.syncStatus === "error") {
    return { title: "Synchro à vérifier", detail: store.syncError ?? "Dernière tentative échouée" }
  }

  return { title: "Dernière synchro réalisée", detail: lastSyncLabel(store.lastSyncedAt) }
}

export function DataPrivacyPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const navigate = useNavigate()
  const importInputRef = useRef<HTMLInputElement>(null)
  const syncCopy = syncStatusCopy(store)

  function exportBackup() {
    const backup = store.exportBackup()
    downloadTextFile(backupToJson(backup), backupFileName(), "application/json")
    toast.success("Sauvegarde exportée")
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const confirmed = window.confirm(
        "Importer cette sauvegarde remplacera le suivi sur cet appareil. Une sauvegarde de sécurité va d’abord être téléchargée. Continuer ?",
      )

      if (!confirmed) return

      downloadTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
      store.importBackup(parsed)
      toast.success("Sauvegarde importée")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’importer cette sauvegarde")
    } finally {
      event.target.value = ""
    }
  }

  function clearDeviceData() {
    const confirmed = window.confirm(
      "Supprimer le suivi de cet appareil ? Les données partagées ne sont pas supprimées pour les autres appareils.",
    )

    if (!confirmed) return

    downloadTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
    store.clearDeviceData()
    toast.success("Données supprimées de cet appareil")
  }

  async function deleteFamilySpace() {
    const confirmed = window.confirm(
      "Supprimer tout l’espace famille ? Une sauvegarde de sécurité va d’abord être téléchargée. Cette action supprimera le profil et les essais partagés pour tous les appareils connectés à cet espace.",
    )

    if (!confirmed) return

    downloadTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
    const didDelete = await store.deleteFamilySpace()

    if (didDelete) {
      toast.success("Espace famille supprimé")
    } else {
      toast.error("Impossible de supprimer l’espace famille partagé")
    }
  }

  return (
    <>
      <header className="flex items-center gap-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground"
          onClick={() => navigate("/settings")}
          aria-label="Retour aux réglages"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="eyebrow">Réglages</p>
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-normal">
            Sauvegarde et données
          </h1>
        </div>
      </header>

      <div className="grid gap-1">
        <SettingsSection
          description="Synchronise, exporte, importe ou supprime le suivi depuis un seul endroit."
          title="Sauvegarde"
        >
          <SyncStatusCard detail={syncCopy.detail} title={syncCopy.title} />
          <Button type="button" variant="outline" className="h-12 justify-start rounded-lg px-4 text-base" onClick={exportBackup}>
            <Download data-icon="inline-start" aria-hidden="true" />
            Exporter les données
          </Button>
          <input
            ref={importInputRef}
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={(event) => void importBackup(event)}
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-start rounded-lg px-4 text-base"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" aria-hidden="true" />
            Importer une sauvegarde
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-start rounded-lg px-4 text-base text-destructive hover:border-destructive/25 hover:bg-destructive/[0.08] hover:text-destructive"
            onClick={clearDeviceData}
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Supprimer de cet appareil
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-start rounded-lg px-4 text-base text-destructive hover:border-destructive/25 hover:bg-destructive/[0.08] hover:text-destructive"
            onClick={() => void deleteFamilySpace()}
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Supprimer l’espace famille
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            L’import et les suppressions demandent confirmation et téléchargent une sauvegarde de sécurité avant remplacement.
          </p>
        </SettingsSection>

        <SettingsSection
          description="Retrouve ce qui reste local, ce qui est synchronisé et ce qui est mesuré."
          title="Confidentialité"
        >
          <Button asChild variant="outline" className="h-12 justify-start rounded-lg px-4 text-base">
            <NavLink to="/privacy">
              <ShieldCheck data-icon="inline-start" aria-hidden="true" />
              Confidentialité des données
            </NavLink>
          </Button>
        </SettingsSection>
      </div>
    </>
  )
}

function SyncStatusCard({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card/85 p-3 text-sm leading-5 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <CircleCheck className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

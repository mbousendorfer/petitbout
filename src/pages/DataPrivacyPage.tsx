import { useId } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ChevronLeft, CircleCheck, Download, FileUp, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { backupFileName, backupToJson } from "@/lib/backup"
import { saveTextFile } from "@/lib/formatting"
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
      detail: "Le carnet reste local sur cet appareil.",
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
  const importInputId = useId()
  const syncCopy = syncStatusCopy(store)

  async function exportBackup() {
    try {
      const backup = store.exportBackup()
      const didSave = await saveTextFile(backupToJson(backup), backupFileName(), "application/json")
      if (didSave) toast.success("Sauvegarde exportée")
    } catch {
      toast.error("Impossible d’exporter la sauvegarde")
    }
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

      const didSave = await saveTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
      if (!didSave) return
      store.importBackup(parsed)
      toast.success("Sauvegarde importée")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’importer cette sauvegarde")
    } finally {
      event.target.value = ""
    }
  }

  async function clearDeviceData() {
    const confirmed = window.confirm(
      "Supprimer le suivi de cet appareil ? Les données partagées ne sont pas supprimées pour les autres appareils.",
    )

    if (!confirmed) return

    try {
      const didSave = await saveTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
      if (!didSave) return
      store.clearDeviceData()
      toast.success("Données supprimées de cet appareil")
    } catch {
      toast.error("Impossible de préparer la sauvegarde")
    }
  }

  async function deleteFamilySpace() {
    const confirmed = window.confirm(
      "Supprimer tout l’espace famille ? Une sauvegarde de sécurité va d’abord être téléchargée. Cette action supprimera le profil et les essais partagés pour tous les appareils connectés à cet espace.",
    )

    if (!confirmed) return

    let didSave: boolean
    try {
      didSave = await saveTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
    } catch {
      toast.error("Impossible de préparer la sauvegarde")
      return
    }

    if (!didSave) return

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
          description="Garde une copie du carnet ou restaure une sauvegarde."
          title="Sauvegarde"
        >
          <SyncStatusCard detail={syncCopy.detail} title={syncCopy.title} />
          <Button
            type="button"
            className="h-12 rounded-xl text-base"
            onClick={() => void exportBackup()}
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Télécharger une sauvegarde
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Recommandé avant de changer de téléphone ou de supprimer des données.
          </p>
        </SettingsSection>

        <SettingsSection description="Utilise un fichier PetitBout déjà exporté." title="Restaurer">
          <input
            id={importInputId}
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={(event) => void importBackup(event)}
          />
          <Button asChild variant="outline" className="h-12 justify-start rounded-lg px-4 text-base">
            <label htmlFor={importInputId}>
              <FileUp data-icon="inline-start" aria-hidden="true" />
              Importer une sauvegarde
            </label>
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Le carnet actuel est sauvegardé avant d’être remplacé.
          </p>
        </SettingsSection>

        <SettingsSection description="Actions définitives, avec confirmation." title="Supprimer">
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-start rounded-lg px-4 text-base text-destructive hover:border-destructive/25 hover:bg-destructive/[0.08] hover:text-destructive"
            onClick={() => void clearDeviceData()}
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
            Une sauvegarde est proposée avant chaque suppression.
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
    <div className="flex items-center gap-3 rounded-[1.2rem] border bg-card/85 p-3 text-sm leading-5 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CircleCheck className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

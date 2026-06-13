import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, CircleCheck, Database, Download, Eye, LockKeyhole, ShieldCheck, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { backupFileName, backupToJson } from "@/lib/backup"
import { downloadTextFile } from "@/lib/formatting"
import { useBabyStore } from "@/lib/storage"
import { SettingsSection } from "@/pages/SettingsPage"

const trackedItems = [
  {
    title: "Pages vues",
    description:
      "Si Plausible est configuré, Petitbout compte les pages ouvertes pour comprendre les écrans vraiment utiles.",
  },
  {
    title: "Aucun événement métier",
    description:
      "Les aliments consultés, les réactions, le profil de bébé, le code famille et le PIN ne sont pas envoyés à l’outil d’analyse.",
  },
  {
    title: "Pas de publicité",
    description:
      "Le suivi d’usage ne sert pas à faire du ciblage publicitaire et n’ajoute pas de profil marketing dans Petitbout.",
  },
]

const databaseItems = [
  {
    title: "Espace famille",
    rows: [
      "Hash SHA-256 calculé à partir du code famille et du PIN, jamais le code ou le PIN en clair",
      "Date de dernière mise à jour du profil",
    ],
  },
  {
    title: "Profil de bébé",
    rows: [
      "Prénom renseigné dans le profil",
      "Date de naissance, si elle est renseignée",
      "Âge en mois, utilisé pour adapter les repères",
      "Avatar choisi pour bébé",
    ],
  },
  {
    title: "Essais alimentaires",
    rows: [
      "Identifiant technique unique de l’essai",
      "Hash SHA-256 du code famille associé",
      "Identifiant de l’aliment",
      "Date et heure optionnelle du repas",
      "Réaction choisie",
      "Note libre, si elle est renseignée",
      "Date de création de l’essai",
    ],
  },
]

const notStoredItems = [
  "Le code famille en clair",
  "Le PIN du profil bébé",
  "Une adresse email de compte utilisateur",
  "Une donnée de paiement ou de publicité",
]

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
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">
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
          description="Petitbout garde uniquement ce qui est nécessaire au carnet alimentaire et au partage familial."
          title="En bref"
        >
          <div className="rounded-lg border bg-card/85 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">Pas de surprise cachée dans le suivi</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Les données de santé du quotidien restent limitées au carnet de bébé. L’analyse d’usage, quand elle
                  est activée, se limite aux pages vues et ne contient pas le contenu du carnet.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          description="Le suivi d’usage sert seulement à repérer les écrans consultés, pas à lire le carnet."
          title="Ce qui est tracké"
        >
          <div className="grid gap-3">
            {trackedItems.map((item) => (
              <PrivacyCard key={item.title} icon={Eye} title={item.title}>
                {item.description}
              </PrivacyCard>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          description="Ces informations sont synchronisées avec Supabase quand l’espace famille est connecté et que le stockage partagé est configuré."
          title="Ce qui est enregistré en base de données"
        >
          <div className="grid gap-3">
            {databaseItems.map((group) => (
              <div key={group.title} className="rounded-lg border bg-card/85 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Database className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="font-semibold">{group.title}</h2>
                </div>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
                  {group.rows.map((row) => (
                    <li key={row} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span>{row}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          description="Ces informations ne sont pas stockées dans les tables partagées de Petitbout."
          title="Ce qui n’est pas enregistré"
        >
          <div className="rounded-lg border bg-card/85 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-tested/10 text-status-tested">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </span>
              <p className="font-semibold">Les données sensibles restent réduites au strict nécessaire</p>
            </div>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              {notStoredItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-status-tested" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
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

function PrivacyCard({
  children,
  icon: Icon,
  title,
}: {
  children: string
  icon: typeof Eye
  title: string
}) {
  return (
    <div className="rounded-lg border bg-card/85 p-4 shadow-sm">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
        </div>
      </div>
    </div>
  )
}

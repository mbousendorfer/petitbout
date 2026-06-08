import { useState, useEffect, useRef, type ReactNode } from "react"
import { Check, Copy, Download, Home, LogOut, Monitor, Moon, Sun, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { backupFileName, backupToJson } from "@/lib/backup"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { downloadTextFile } from "@/lib/formatting"
import { type ThemeMode } from "@/app/useTheme"
import { Header } from "@/components/primitives"

export function SettingsPage({
  store,
  theme,
  setTheme,
}: {
  store: ReturnType<typeof useBabyStore>
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const [isSavingChildProfile, setIsSavingChildProfile] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const familyCodeLabel = store.familySession?.familyCodeLabel ?? ""
  const hasChildProfileChanges =
    childName.trim() !== store.profile.childName || birthDate !== store.profile.birthDate

  useEffect(() => {
    setChildName(store.profile.childName)
    setBirthDate(store.profile.birthDate)
  }, [store.profile.birthDate, store.profile.childName])

  async function copyFamilyCode() {
    if (!familyCodeLabel) {
      toast.error("Code famille indisponible sur cet appareil")
      return
    }

    await navigator.clipboard.writeText(familyCodeLabel)
    toast.success("Code famille copié")
  }

  async function saveChildProfile() {
    if (!hasChildProfileChanges) return

    setIsSavingChildProfile(true)
    const didSync = await store.updateProfile({ childName: childName.trim(), birthDate })
    setIsSavingChildProfile(false)

    if (didSync) {
      toast.success("Profil enfant sauvegardé")
    } else {
      toast.warning("Sauvegardé sur cet appareil, synchro à vérifier")
    }
  }

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

  return (
    <>
      <Header eyebrow="Préférences" title="Réglages" />

      <div className="grid gap-1 lg:grid-cols-2 lg:gap-4">
        <SettingsSection
          description="Profil et code partagés entre vos appareils."
          title="Espace famille"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Code famille</span>
            <div className="flex min-w-0 items-stretch gap-2">
              <Input
                readOnly
                aria-label="Code famille"
                className="h-11 min-w-0 flex-1 bg-background/70 font-medium"
                placeholder="Code indisponible"
                value={familyCodeLabel}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 px-3"
                onClick={copyFamilyCode}
                disabled={!familyCodeLabel}
              >
                <Copy data-icon="inline-start" aria-hidden="true" />
                Copier
              </Button>
            </div>
            {!familyCodeLabel && (
              <span className="text-xs text-muted-foreground">
                Le code original n’est pas disponible sur cet appareil.
              </span>
            )}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Nom de l’enfant</span>
            <Input
              className="h-11 bg-background/70"
              placeholder="Ex. Alba"
              value={childName}
              onChange={(event) => setChildName(event.target.value)}
            />
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-medium">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Date de naissance</span>
            <Input
              className="h-11 min-w-0 max-w-full bg-background/70"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>
          <Button
            type="button"
            onClick={() => void saveChildProfile()}
            disabled={!hasChildProfileChanges || isSavingChildProfile}
          >
            <Check data-icon="inline-start" aria-hidden="true" />
            {isSavingChildProfile ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </SettingsSection>

        <SettingsSection description="Le thème reste propre à cet appareil." title="Apparence">
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/70 p-1.5">
            <ThemeButton active={theme === "light"} icon={Sun} label="Clair" onClick={() => setTheme("light")} />
            <ThemeButton active={theme === "system"} icon={Monitor} label="Système" onClick={() => setTheme("system")} />
            <ThemeButton active={theme === "dark"} icon={Moon} label="Sombre" onClick={() => setTheme("dark")} />
          </div>
        </SettingsSection>

        <InstallHelpSection />

        <SettingsSection description="Gardez une copie, restaurez le suivi ou préparez un rendez-vous." title="Sauvegarde">
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={exportBackup}>
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
          <Button type="button" variant="secondary" className="h-11 justify-start" onClick={() => importInputRef.current?.click()}>
            <Upload data-icon="inline-start" aria-hidden="true" />
            Importer une sauvegarde
          </Button>
          <Button type="button" variant="ghost" className="h-11 justify-start text-destructive" onClick={clearDeviceData}>
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Supprimer les données
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            L’import demande confirmation et télécharge une sauvegarde de sécurité avant remplacement.
          </p>
        </SettingsSection>

        <section className="flex justify-center border-t border-border/60 py-6 lg:col-span-2">
          <Button type="button" variant="ghost" className="h-11 px-6 text-muted-foreground" onClick={() => store.disconnectFamily()}>
            <LogOut data-icon="inline-start" aria-hidden="true" />
            Se déconnecter
          </Button>
        </section>
      </div>
    </>
  )
}


export function InstallHelpSection() {
  return (
    <SettingsSection
      description="Installez Diversibebs sur l’écran d’accueil pour y revenir d’un geste, hors connexion."
      title="Installation"
    >
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Home aria-hidden="true" className="size-4 text-muted-foreground" />
          iPhone et iPad
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvrez l’app dans Safari.</li>
          <li>Touchez le bouton Partager (icône en forme de flèche).</li>
          <li>Choisissez « Sur l’écran d’accueil » puis Ajouter.</li>
        </ol>
      </div>
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Home aria-hidden="true" className="size-4 text-muted-foreground" />
          Android
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvrez l’app dans Chrome.</li>
          <li>Touchez le menu (trois points) en haut à droite.</li>
          <li>Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».</li>
        </ol>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Une fois installée, Diversibebs s’ouvre comme une app, garde le suivi récent disponible hors connexion et propose les raccourcis Semaine et Aliments.
      </p>
    </SettingsSection>
  )
}

export function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <section className="border-t border-border/60 py-4 first:border-t-0">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  )
}

export function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Sun
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "h-14 flex-col gap-1 px-2 text-xs shadow-none",
        active && "bg-background text-foreground shadow-sm",
      )}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
      {label}
    </Button>
  )
}

// Argile per-category tints (DiversiColors): each food category carries a
// muted editorial colour — sage/coral/honey/plum/slate/olive — so the
// catalogue reads at a glance. "Divers" falls back to the clay primary.

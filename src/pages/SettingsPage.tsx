import { useRef, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import {
  ChevronRight,
  Copy,
  Download,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { backupFileName, backupToJson } from "@/lib/backup"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { downloadTextFile } from "@/lib/formatting"
import { type ThemeMode } from "@/app/useTheme"
import { Header } from "@/components/primitives"
import { BabyAvatar } from "@/components/BabyAvatar"

function birthDateLabel(birthDate: string) {
  if (!birthDate) return null
  const date = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

export function SettingsPage({
  store,
  theme,
  setTheme,
}: {
  store: ReturnType<typeof useBabyStore>
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const familyCodeLabel = store.familySession?.familyCodeLabel ?? ""
  const displayName = store.profile.childName.trim() ? store.profile.childName.trim() : "bébé"
  const bornLabel = birthDateLabel(store.profile.birthDate)

  async function copyFamilyCode() {
    if (!familyCodeLabel) {
      toast.error("Code famille indisponible sur cet appareil")
      return
    }

    await navigator.clipboard.writeText(familyCodeLabel)
    toast.success("Code famille copié")
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

      <NavLink
        to="/profile"
        className="paper-surface soft-ring flex items-center gap-3 rounded-hero p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Modifier le profil de ${displayName}`}
      >
        <BabyAvatar emoji={store.profile.avatarEmoji} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold tracking-[-0.01em]">{displayName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {store.profile.ageMonths} mois{bornLabel ? ` · né le ${bornLabel}` : ""}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground/65" aria-hidden="true" />
      </NavLink>

      <div className="grid gap-1 lg:grid-cols-2 lg:gap-4">
        <SettingsSection
          description="Code partagé entre tes appareils pour retrouver le même suivi."
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
        </SettingsSection>

        <SettingsSection description="Le thème reste propre à cet appareil." title="Apparence">
          <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1">
            <ThemeButton active={theme === "light"} icon={Sun} label="Clair" onClick={() => setTheme("light")} />
            <ThemeButton active={theme === "system"} icon={Monitor} label="Système" onClick={() => setTheme("system")} />
            <ThemeButton active={theme === "dark"} icon={Moon} label="Sombre" onClick={() => setTheme("dark")} />
          </div>
        </SettingsSection>

        <InstallHelpSection />

        <DataPrivacySection />

        <FeedbackSection />

        <SettingsSection description="Garde une copie, restaure le suivi ou prépare un rendez-vous." title="Sauvegarde">
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

function FeedbackSection() {
  return (
    <SettingsSection
      description="Partage ce qui bloque, ce qui aide ou ce qui rendrait Petitbout plus utile au quotidien."
      title="Feedback"
    >
      <Button asChild variant="outline" className="h-12 justify-start rounded-lg px-4 text-base">
        <NavLink to="/feedback">
          <MessageSquare data-icon="inline-start" aria-hidden="true" />
          Envoyer un retour
        </NavLink>
      </Button>
    </SettingsSection>
  )
}

function DataPrivacySection() {
  return (
    <SettingsSection
      description="Vois clairement ce qui est suivi, ce qui est synchronisé et ce qui ne l’est pas."
      title="Confidentialité"
    >
      <Button asChild variant="outline" className="h-12 justify-start rounded-lg px-4 text-base">
        <NavLink to="/data-privacy">
          <ShieldCheck data-icon="inline-start" aria-hidden="true" />
          Confidentialité des données
        </NavLink>
      </Button>
    </SettingsSection>
  )
}


export function InstallHelpSection() {
  return (
    <SettingsSection
      description="Installe Petitbout sur l’écran d’accueil pour y revenir d’un geste, hors connexion."
      title="Installation"
    >
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppleLogo className="size-5" />
          </span>
          <p className="font-semibold">iPhone et iPad</p>
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvre l’app dans Safari.</li>
          <li>Touche le bouton Partager (icône en forme de flèche).</li>
          <li>Choisis « Sur l’écran d’accueil » puis Ajouter.</li>
        </ol>
      </div>
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5ec] dark:bg-[#203528]">
            <AndroidLogo className="h-5 w-7" />
          </span>
          <p className="font-semibold">Android</p>
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvre l’app dans Chrome.</li>
          <li>Touche le menu (trois points) en haut à droite.</li>
          <li>Choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».</li>
        </ol>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Une fois installée, Petitbout s’ouvre comme une app, garde le suivi récent disponible hors connexion et propose les raccourcis Semaine et Aliments.
      </p>
    </SettingsSection>
  )
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      width="209"
      height="256"
      viewBox="0 0 814 1000"
    >
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
      />
    </svg>
  )
}

function AndroidLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="256"
      height="150"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 150"
    >
      <path
        fill="#34A853"
        d="M255.285 143.47c-.084-.524-.164-1.042-.251-1.56a128.119 128.119 0 0 0-12.794-38.288 128.778 128.778 0 0 0-23.45-31.86 129.166 129.166 0 0 0-22.713-18.005c.049-.08.09-.168.14-.25 2.582-4.461 5.172-8.917 7.755-13.38l7.576-13.068c1.818-3.126 3.632-6.26 5.438-9.386a11.776 11.776 0 0 0 .662-10.484 11.668 11.668 0 0 0-4.823-5.536 11.85 11.85 0 0 0-5.004-1.61 11.963 11.963 0 0 0-2.218.018 11.738 11.738 0 0 0-8.968 5.798c-1.814 3.127-3.628 6.26-5.438 9.386l-7.576 13.069c-2.583 4.462-5.173 8.918-7.755 13.38-.282.487-.567.973-.848 1.467-.392-.157-.78-.313-1.172-.462-14.24-5.43-29.688-8.4-45.836-8.4-.442 0-.879 0-1.324.006-14.357.143-28.152 2.64-41.022 7.12a119.434 119.434 0 0 0-4.42 1.642c-.262-.455-.532-.911-.79-1.367-2.583-4.462-5.173-8.918-7.755-13.38L65.123 15.25c-1.818-3.126-3.632-6.259-5.439-9.386A11.736 11.736 0 0 0 48.5.048 11.71 11.71 0 0 0 43.49 1.66a11.716 11.716 0 0 0-4.077 4.063c-.281.474-.532.967-.742 1.473a11.808 11.808 0 0 0-.365 8.188c.259.786.594 1.554 1.023 2.296a3973.32 3973.32 0 0 1 5.439 9.386c2.53 4.357 5.054 8.713 7.58 13.069 2.582 4.462 5.168 8.918 7.75 13.38.02.038.046.075.065.112A129.184 129.184 0 0 0 45.32 64.38a129.693 129.693 0 0 0-22.2 24.015 127.737 127.737 0 0 0-9.34 15.24 128.238 128.238 0 0 0-10.843 28.764 130.743 130.743 0 0 0-1.951 9.524c-.087.518-.167 1.042-.247 1.56A124.978 124.978 0 0 0 0 149.118h256c-.205-1.891-.449-3.77-.734-5.636l.019-.012Z"
      />
      <path
        fill="#202124"
        d="M194.59 113.712c5.122-3.41 5.867-11.3 1.661-17.62-4.203-6.323-11.763-8.682-16.883-5.273-5.122 3.41-5.868 11.3-1.662 17.621 4.203 6.322 11.764 8.682 16.883 5.272ZM78.518 108.462c4.206-6.321 3.46-14.21-1.662-17.62-5.123-3.41-12.68-1.05-16.886 5.27-4.203 6.323-3.458 14.212 1.662 17.622 5.122 3.41 12.683 1.05 16.886-5.272Z"
      />
    </svg>
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
      variant="ghost"
      aria-pressed={active}
      className={cn(
        "h-12 flex-col gap-0.5 rounded-md px-2 text-xs font-bold text-muted-foreground shadow-none hover:bg-card/70 hover:text-foreground",
        active && "bg-card text-primary ring-1 ring-primary/30 shadow-sm hover:bg-card hover:text-primary",
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

import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ChevronLeft, Copy, KeyRound, Link2, LogOut, Server, ShieldCheck, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { backupFileName, backupToJson } from "@/lib/backup"
import { downloadTextFile } from "@/lib/formatting"
import {
  familyCodeMaxLength,
  familyCodeMinLength,
  normalizeFamilyCode,
  normalizeProfilePin,
  profilePinLength,
  useBabyStore,
} from "@/lib/storage"
import { SettingsSection } from "@/pages/SettingsPage"
import { cn } from "@/lib/utils"

function lastSyncLabel(lastSyncedAt: string | null) {
  if (!lastSyncedAt) return "Pas encore synchronisé"

  const date = new Date(lastSyncedAt)
  if (Number.isNaN(date.getTime())) return "Pas encore synchronisé"

  return date.toLocaleString("fr-FR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function familyStatusCopy(store: ReturnType<typeof useBabyStore>) {
  if (!store.familySession) {
    return {
      accent: "muted" as const,
      detail: "Le carnet reste uniquement sur cet appareil tant que le partage n’est pas activé.",
      title: "Partage multi-appareil inactif",
    }
  }

  if (store.syncStatus === "syncing" || store.syncStatus === "loading") {
    return {
      accent: "primary" as const,
      detail: "PetitBout met à jour le carnet partagé.",
      title: "Synchronisation en cours",
    }
  }

  if (store.syncStatus === "not-configured") {
    return {
      accent: "warning" as const,
      detail: "Le serveur PetitBout n’est pas configuré sur cette installation.",
      title: "Synchro indisponible",
    }
  }

  if (store.syncStatus === "offline") {
    return {
      accent: "warning" as const,
      detail: "La prochaine mise à jour partira quand la connexion reviendra.",
      title: "Hors connexion",
    }
  }

  if (store.syncStatus === "error") {
    return {
      accent: "warning" as const,
      detail: store.syncError ?? "La dernière tentative de synchro n’a pas abouti.",
      title: "Synchro à vérifier",
    }
  }

  return {
    accent: "primary" as const,
    detail: `Dernière synchro: ${lastSyncLabel(store.lastSyncedAt)}.`,
    title: "Partage multi-appareil actif",
  }
}

export function FamilySpacePage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const navigate = useNavigate()
  const [familyCode, setFamilyCode] = useState(store.familySession?.familyCodeLabel ?? "")
  const [profilePin, setProfilePin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasFamilySpace = Boolean(store.familySession)
  const status = familyStatusCopy(store)
  const normalizedActivationCode = normalizeFamilyCode(familyCode)
  const normalizedActivationPin = normalizeProfilePin(profilePin)
  const normalizedNewPin = normalizeProfilePin(newPin)

  async function activateFamilySpace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (normalizedActivationCode.length < familyCodeMinLength) {
      toast.error(`Choisis un code d’au moins ${familyCodeMinLength} caractères`)
      return
    }

    if (normalizedActivationPin.length !== profilePinLength) {
      toast.error(`Choisis un PIN de ${profilePinLength} chiffres`)
      return
    }

    setIsSubmitting(true)
    const didConnect = await store.connectFamily(normalizedActivationCode, normalizedActivationPin)
    setIsSubmitting(false)

    if (didConnect) {
      setProfilePin("")
      toast.success("Espace famille activé")
    } else {
      toast.error(store.syncError ?? "Impossible d’activer l’espace famille")
    }
  }

  async function saveNewPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !store.familySession) return

    if (normalizedNewPin.length !== profilePinLength) {
      toast.error(`Choisis un PIN de ${profilePinLength} chiffres`)
      return
    }

    const confirmed = window.confirm(
      "Changer le PIN mettra à jour l’accès de l’espace famille pour tous les appareils. Les proches devront utiliser le nouveau PIN. Continuer ?",
    )

    if (!confirmed) return

    setIsSubmitting(true)
    const didSave = await store.updateFamilyPin(normalizedNewPin)
    setIsSubmitting(false)

    if (didSave) {
      setNewPin("")
      toast.success("PIN de l’espace famille modifié")
    } else {
      toast.error(store.syncError ?? "Impossible de modifier le PIN")
    }
  }

  async function copyFamilyCode() {
    const code = store.familySession?.familyCodeLabel
    if (!code) {
      toast.error("Code de connexion indisponible sur cet appareil")
      return
    }

    await navigator.clipboard.writeText(code)
    toast.success("Code de connexion copié")
  }

  function leaveOnDevice() {
    const confirmed = window.confirm(
      "Se déconnecter de l’espace famille sur cet appareil ? Le carnet local reste disponible, mais il ne sera plus synchronisé.",
    )

    if (!confirmed) return

    store.leaveFamilySpaceOnDevice()
    toast.success("Cet appareil est déconnecté de l’espace famille")
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
      navigate("/settings")
    } else {
      toast.error(store.syncError ?? "Impossible de supprimer l’espace famille partagé")
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
            Espace famille
          </h1>
        </div>
      </header>

      <div className="grid gap-1">
        <SettingsSection
          description="Le partage multi-appareil synchronise le carnet avec le serveur PetitBout. Sans activation, tout reste sur cet appareil."
          title="Partage multi-appareil"
        >
          <StatusPanel detail={status.detail} accent={status.accent} title={status.title} />
          <div className="grid gap-3 rounded-lg border bg-card/85 p-4 text-sm leading-6 shadow-sm">
            <InfoRow
              icon={Smartphone}
              title="Un même carnet sur tes appareils"
              text="Utilise le même code de connexion et le même PIN pour retrouver le suivi ailleurs."
            />
            <InfoRow
              icon={Server}
              title="Synchronisé seulement si tu l’actives"
              text="Le partage nécessite le serveur PetitBout; sinon le carnet reste local."
            />
            <NavLink to="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
              Voir la confidentialité des données
            </NavLink>
          </div>
        </SettingsSection>

        {!hasFamilySpace ? (
          <SettingsSection
            description="Choisis un code facile à transmettre et un PIN de 4 chiffres à partager séparément."
            title="Activer ou rejoindre"
          >
            <form className="grid gap-3" onSubmit={(event) => void activateFamilySpace(event)}>
              <label className="grid gap-1.5 text-sm font-medium">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Code de connexion</span>
                <Input
                  autoComplete="off"
                  className="h-12 bg-background/70"
                  maxLength={familyCodeMaxLength}
                  minLength={familyCodeMinLength}
                  placeholder="Ex. famille-maxence-2026"
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <span className="text-xs font-semibold uppercase text-muted-foreground">PIN profil bébé</span>
                <Input
                  autoComplete="off"
                  className="h-12 bg-background/70 text-lg"
                  inputMode="numeric"
                  maxLength={profilePinLength}
                  minLength={profilePinLength}
                  pattern={`\\d{${profilePinLength}}`}
                  placeholder="Ex. 4821"
                  type="password"
                  value={profilePin}
                  onChange={(event) => setProfilePin(normalizeProfilePin(event.target.value))}
                />
              </label>
              <Button
                type="submit"
                className="h-12"
                disabled={
                  isSubmitting ||
                  !store.isConfigured ||
                  normalizedActivationCode.length < familyCodeMinLength ||
                  normalizedActivationPin.length !== profilePinLength
                }
              >
                <Link2 data-icon="inline-start" aria-hidden="true" />
                {isSubmitting ? "Activation..." : "Activer le partage multi-appareil"}
              </Button>
              {!store.isConfigured && (
                <p className="rounded-lg border bg-muted/65 p-3 text-sm leading-5 text-muted-foreground">
                  Le serveur PetitBout n’est pas configuré sur cette installation. Le suivi reste local pour le moment.
                </p>
              )}
            </form>
          </SettingsSection>
        ) : (
          <>
            <SettingsSection
              description="Le code identifie l’espace famille. Le PIN reste secret et doit être transmis séparément."
              title="Accès"
            >
              <div className="grid gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Code de connexion</span>
                <div className="flex min-w-0 items-stretch gap-2">
                  <Input
                    readOnly
                    aria-label="Code de connexion"
                    className="h-12 min-w-0 flex-1 bg-background/70 font-medium"
                    placeholder="Code indisponible"
                    value={store.familySession?.familyCodeLabel ?? ""}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 shrink-0 px-3"
                    onClick={() => void copyFamilyCode()}
                    disabled={!store.familySession?.familyCodeLabel}
                  >
                    <Copy data-icon="inline-start" aria-hidden="true" />
                    Copier
                  </Button>
                </div>
              </div>
              <form className="grid gap-3" onSubmit={(event) => void saveNewPin(event)}>
                <label className="grid gap-1.5 text-sm font-medium">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Nouveau PIN</span>
                  <Input
                    autoComplete="off"
                    className="h-12 bg-background/70 text-lg"
                    inputMode="numeric"
                    maxLength={profilePinLength}
                    minLength={profilePinLength}
                    pattern={`\\d{${profilePinLength}}`}
                    placeholder="Ex. 4821"
                    type="password"
                    value={newPin}
                    onChange={(event) => setNewPin(normalizeProfilePin(event.target.value))}
                  />
                </label>
                <Button
                  type="submit"
                  className="h-12"
                  disabled={isSubmitting || !store.isConfigured || normalizedNewPin.length !== profilePinLength}
                >
                  <KeyRound data-icon="inline-start" aria-hidden="true" />
                  Modifier le PIN
                </Button>
              </form>
            </SettingsSection>

            <SettingsSection
              description="Cette action ne supprime pas le carnet local. Elle arrête seulement le partage depuis cet appareil."
              title="Déconnexion"
            >
              <Button
                type="button"
                variant="outline"
                className="h-12 justify-start rounded-lg px-4 text-base text-muted-foreground"
                onClick={leaveOnDevice}
              >
                <LogOut data-icon="inline-start" aria-hidden="true" />
                Se déconnecter de cet appareil
              </Button>
            </SettingsSection>

            <SettingsSection
              description="Supprime le profil et les essais partagés pour tous les appareils connectés à cet espace."
              title="Zone sensible"
            >
              <Button
                type="button"
                variant="outline"
                className="h-12 justify-start rounded-lg px-4 text-base text-destructive hover:border-destructive/25 hover:bg-destructive/[0.08] hover:text-destructive"
                onClick={() => void deleteFamilySpace()}
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                Supprimer l’espace famille
              </Button>
            </SettingsSection>
          </>
        )}
      </div>
    </>
  )
}

function StatusPanel({
  accent,
  detail,
  title,
}: {
  accent: "muted" | "primary" | "warning"
  detail: string
  title: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        accent === "primary" && "border-primary/25 bg-primary/[0.08]",
        accent === "warning" && "border-accent/25 bg-accent/[0.08]",
        accent === "muted" && "bg-card/85",
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "warning" && "bg-accent/10 text-accent",
            accent === "muted" && "bg-muted text-muted-foreground",
          )}
        >
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  text,
  title,
}: {
  icon: typeof Smartphone
  text: string
  title: string
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Baby, Check, Link2, Plus, ShieldCheck, Smartphone, Users } from "lucide-react"
import { toast } from "sonner"
import { BabyAvatar, BabyAvatarPicker } from "@/components/BabyAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HeroPanel } from "@/components/primitives"
import {
  calculateAgeMonths,
  childNameMaxLength,
  defaultAvatarEmoji,
  familyCodeMaxLength,
  familyCodeMinLength,
  normalizeFamilyCode,
  normalizeProfilePin,
  profilePinLength,
  useBabyStore,
} from "@/lib/storage"
import { cn } from "@/lib/utils"

type OnboardingMode = "local" | "family"
type OnboardingStep = "choice" | "join" | "profile" | "mode"

export function OnboardingPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<OnboardingMode>("local")
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const [avatarEmoji, setAvatarEmoji] = useState(store.profile.avatarEmoji || defaultAvatarEmoji)
  const [familyCode, setFamilyCode] = useState(store.familySession?.familyCodeLabel ?? "")
  const [profilePin, setProfilePin] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedName = childName.trim()
  const normalizedFamilyCode = normalizeFamilyCode(familyCode)
  const normalizedPin = normalizeProfilePin(profilePin)
  const ageMonths = calculateAgeMonths(birthDate)
  const canContinueProfile = Boolean(normalizedName && birthDate && ageMonths !== null)
  const [step, setStep] = useState<OnboardingStep>("choice")
  const canSubmitFamily =
    normalizedFamilyCode.length >= familyCodeMinLength &&
    normalizedPin.length === profilePinLength &&
    store.isConfigured
  const canJoinFamily = canSubmitFamily

  function nextStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canContinueProfile) {
      toast.error("Renseigne le prénom et la date de naissance de bébé")
      return
    }

    setStep("mode")
  }

  async function startLocal() {
    if (isSubmitting || !canContinueProfile) return

    setIsSubmitting(true)
    const didSave = await store.completeLocalOnboarding({
      avatarEmoji,
      birthDate,
      childName: normalizedName,
    })
    setIsSubmitting(false)

    if (didSave) {
      toast.success("Espace local créé")
    } else {
      toast.warning("Profil enregistré sur cet appareil")
    }

    navigate("/")
  }

  async function startFamily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting || !canContinueProfile) return

    if (normalizedFamilyCode.length < familyCodeMinLength) {
      toast.error(`Choisis un code d’au moins ${familyCodeMinLength} caractères`)
      return
    }

    if (normalizedPin.length !== profilePinLength) {
      toast.error(`Choisis un PIN de ${profilePinLength} chiffres`)
      return
    }

    setIsSubmitting(true)
    const profile = {
      ageMonths: ageMonths ?? store.profile.ageMonths,
      avatarEmoji,
      birthDate,
      childName: normalizedName,
    }
    await store.updateProfile(profile)
    const didConnect = await store.connectFamily(normalizedFamilyCode, normalizedPin, profile)
    setIsSubmitting(false)

    if (didConnect) {
      store.finishOnboarding()
      setProfilePin("")
      toast.success("Espace famille activé")
      navigate("/")
    } else {
      toast.error(store.syncError ?? "Impossible d’activer l’espace famille")
    }
  }

  async function joinExistingFamily(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (normalizedFamilyCode.length < familyCodeMinLength) {
      toast.error(`Saisis un code d’au moins ${familyCodeMinLength} caractères`)
      return
    }

    if (normalizedPin.length !== profilePinLength) {
      toast.error(`Saisis un PIN de ${profilePinLength} chiffres`)
      return
    }

    setIsSubmitting(true)
    const didJoin = await store.joinFamily(normalizedFamilyCode, normalizedPin)
    setIsSubmitting(false)

    if (didJoin) {
      setProfilePin("")
      toast.success("Espace famille retrouvé")
      navigate("/")
    } else {
      toast.error(store.syncError ?? "Impossible de rejoindre cet espace famille")
    }
  }

  return (
    <>
      <HeroPanel icon={Baby} className="p-5">
        <div className="flex items-center gap-4">
          <BabyAvatar emoji={avatarEmoji} size={58} />
          <div className="min-w-0">
            <p className="eyebrow">Bienvenue</p>
            <h1 className="font-rounded text-[2.1rem] font-extrabold leading-none tracking-normal">
              Petitbout
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Retrouve un carnet existant ou commence un nouveau suivi.
            </p>
          </div>
        </div>
      </HeroPanel>

      {step === "choice" ? (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4">
            <p className="eyebrow">Démarrage</p>
            <h2 className="text-xl font-bold tracking-normal">Que veux-tu faire ?</h2>
          </div>

          <div className="grid gap-3">
            <StartChoiceButton
              icon={Users}
              title="Rejoindre un espace famille"
              description="J’ai déjà un code et un PIN."
              onClick={() => setStep("join")}
            />
            <StartChoiceButton
              icon={Plus}
              title="Créer un nouveau carnet"
              description="Profil bébé, puis local ou partagé."
              onClick={() => setStep("profile")}
            />
          </div>
        </section>
      ) : step === "join" ? (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4">
            <p className="eyebrow">Espace famille</p>
            <h2 className="text-xl font-bold tracking-normal">Rejoindre un carnet</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Saisis le code famille et le PIN transmis séparément.
            </p>
          </div>

          <form className="grid gap-3" onSubmit={(event) => void joinExistingFamily(event)}>
            <label className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Code famille</span>
              <Input
                autoComplete="off"
                className="h-12 bg-background/70"
                maxLength={familyCodeMaxLength}
                minLength={familyCodeMinLength}
                placeholder="Ex. famille-alba-2026"
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
            <Button type="submit" className="h-12 rounded-xl" disabled={isSubmitting || !canJoinFamily}>
              <Link2 data-icon="inline-start" aria-hidden="true" />
              {isSubmitting ? "Connexion..." : "Rejoindre l’espace famille"}
            </Button>
            {!store.isConfigured && (
              <p className="rounded-lg border bg-muted/65 p-3 text-sm leading-5 text-muted-foreground">
                Le serveur PetitBout n’est pas configuré sur cette installation.
              </p>
            )}
          </form>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 h-11 w-full text-muted-foreground"
            onClick={() => setStep("choice")}
          >
            Retour
          </Button>
        </section>
      ) : step === "profile" ? (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4">
            <p className="eyebrow">Nouveau carnet</p>
            <h2 className="text-xl font-bold tracking-normal">Profil de bébé</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ces informations adaptent les repères et suggestions.
            </p>
          </div>
          <form className="grid gap-4" onSubmit={nextStep}>
            <label className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Prénom</span>
              <Input
                className="h-12 bg-background/70"
                maxLength={childNameMaxLength}
                placeholder="Ex. Alba"
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
              />
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-medium">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Date de naissance</span>
              <Input
                className="h-12 min-w-0 max-w-full bg-background/70"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
              <span className="text-sm font-semibold text-muted-foreground">Âge</span>
              <span className="font-rounded text-base font-bold tabular-nums">
                {ageMonths === null ? "À compléter" : `${ageMonths} mois`}
              </span>
            </div>
            <BabyAvatarPicker value={avatarEmoji} onSelect={setAvatarEmoji} />
            <Button type="submit" className="h-12" disabled={!canContinueProfile}>
              <Check data-icon="inline-start" aria-hidden="true" />
              Continuer
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 h-11 w-full text-muted-foreground"
            onClick={() => setStep("choice")}
          >
            Retour
          </Button>
        </section>
      ) : (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Étape 2</p>
              <h2 className="text-xl font-bold tracking-normal">Où garder le carnet ?</h2>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              modifiable
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={mode === "local"}
              icon={Smartphone}
              title="Local"
              description="Sur ce téléphone"
              onClick={() => setMode("local")}
            />
            <ModeButton
              active={mode === "family"}
              icon={Users}
              title="Famille"
              description="Multi-appareil"
              onClick={() => setMode("family")}
            />
          </div>

          {mode === "local" ? (
            <div className="mt-4 grid gap-3">
              <SummaryStrip
                title="Privé par défaut"
                detail="Aucune synchro. Tu pourras partager plus tard."
              />
              <Button type="button" className="h-12 rounded-xl" onClick={() => void startLocal()} disabled={isSubmitting}>
                <Smartphone data-icon="inline-start" aria-hidden="true" />
                {isSubmitting ? "Création..." : "Commencer en local"}
              </Button>
            </div>
          ) : (
            <form className="mt-4 grid gap-3" onSubmit={(event) => void startFamily(event)}>
              <label className="grid gap-1.5 text-sm font-medium">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Code de connexion</span>
                <Input
                  autoComplete="off"
                  className="h-12 bg-background/70"
                  maxLength={familyCodeMaxLength}
                  minLength={familyCodeMinLength}
                  placeholder="Ex. famille-alba-2026"
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
              <Button type="submit" className="h-12 rounded-xl" disabled={isSubmitting || !canSubmitFamily}>
                <Link2 data-icon="inline-start" aria-hidden="true" />
                {isSubmitting ? "Activation..." : "Activer l’espace famille"}
              </Button>
              {!store.isConfigured && (
                <p className="rounded-lg border bg-muted/65 p-3 text-sm leading-5 text-muted-foreground">
                  Le serveur PetitBout n’est pas configuré sur cette installation. Choisis local pour commencer.
                </p>
              )}
            </form>
          )}

          <Button
            type="button"
            variant="ghost"
            className="mt-3 h-11 w-full text-muted-foreground"
            onClick={() => setStep("profile")}
          >
            Modifier le profil bébé
          </Button>
        </section>
      )}
    </>
  )
}

function StartChoiceButton({
  description,
  icon: Icon,
  onClick,
  title,
}: {
  description: string
  icon: typeof Users
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      className="flex min-h-[5.75rem] w-full items-center gap-3 rounded-2xl border bg-card/85 p-4 text-left shadow-sm transition-all duration-200 ease-out hover:border-primary/25 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={onClick}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function ModeButton({
  active,
  description,
  icon: Icon,
  onClick,
  title,
}: {
  active: boolean
  description: string
  icon: typeof Smartphone
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-32 w-full flex-col justify-between rounded-2xl border bg-card/85 p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? "border-primary/45 bg-primary/[0.08] shadow-card" : "hover:bg-card",
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 pt-3">
        <span className="flex items-center gap-1.5 font-semibold">
          {title}
          {active && <ShieldCheck className="size-4 text-primary" aria-hidden="true" />}
        </span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function SummaryStrip({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="rounded-xl border bg-primary/[0.06] px-4 py-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

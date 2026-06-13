import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Baby, Check, Link2, Lock, ShieldCheck, Smartphone, Users } from "lucide-react"
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
  const [step, setStep] = useState<"profile" | "mode">("profile")
  const canSubmitFamily =
    normalizedFamilyCode.length >= familyCodeMinLength &&
    normalizedPin.length === profilePinLength &&
    store.isConfigured

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

  return (
    <>
      <HeroPanel icon={Baby} className="p-5">
        <div className="flex flex-col gap-4">
          <BabyAvatar emoji={avatarEmoji} size={64} />
          <div>
            <p className="eyebrow">Bienvenue</p>
            <h1 className="font-rounded text-[2.35rem] font-extrabold leading-none tracking-normal">
              Petitbout
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Commence par créer le carnet de bébé. Tu peux le garder local sur ce téléphone ou activer l’espace famille pour le synchroniser.
            </p>
          </div>
        </div>
      </HeroPanel>

      {step === "profile" ? (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4">
            <p className="eyebrow">Étape 1</p>
            <h2 className="text-xl font-bold tracking-normal">Profil de bébé</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ces informations adaptent les repères et suggestions. Aucun compte n’est créé.
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
        </section>
      ) : (
        <section className="paper-surface soft-ring rounded-hero p-5">
          <div className="mb-4">
            <p className="eyebrow">Étape 2</p>
            <h2 className="text-xl font-bold tracking-normal">Mode de suivi</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Tu pourras changer d’avis plus tard depuis les réglages.
            </p>
          </div>

          <div className="grid gap-2">
            <ModeButton
              active={mode === "local"}
              icon={Smartphone}
              title="Espace local"
              description="Le carnet reste sur ce téléphone, sans synchro serveur."
              onClick={() => setMode("local")}
            />
            <ModeButton
              active={mode === "family"}
              icon={Users}
              title="Espace famille"
              description="Synchronise le carnet avec le serveur PetitBout pour le retrouver sur plusieurs appareils."
              onClick={() => setMode("family")}
            />
          </div>

          {mode === "local" ? (
            <div className="mt-4 grid gap-3">
              <div className="flex gap-3 rounded-lg border bg-card/85 p-4 text-sm leading-6 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-5" aria-hidden="true" />
                </span>
                <p className="text-muted-foreground">
                  Les données restent sur cet appareil. L’espace famille pourra être activé plus tard.
                </p>
              </div>
              <Button type="button" className="h-12" onClick={() => void startLocal()} disabled={isSubmitting}>
                <Smartphone data-icon="inline-start" aria-hidden="true" />
                {isSubmitting ? "Création..." : "Créer un espace local"}
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
              <Button type="submit" className="h-12" disabled={isSubmitting || !canSubmitFamily}>
                <Link2 data-icon="inline-start" aria-hidden="true" />
                {isSubmitting ? "Activation..." : "Créer ou rejoindre l’espace famille"}
              </Button>
              {!store.isConfigured && (
                <p className="rounded-lg border bg-muted/65 p-3 text-sm leading-5 text-muted-foreground">
                  Le serveur PetitBout n’est pas configuré sur cette installation. Choisis l’espace local pour commencer.
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
        "flex min-h-24 w-full gap-3 rounded-xl border bg-card/85 p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active ? "border-primary/45 bg-primary/[0.08]" : "hover:border-primary/25",
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
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold">
          {title}
          {active && <ShieldCheck className="size-4 text-primary" aria-hidden="true" />}
        </span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

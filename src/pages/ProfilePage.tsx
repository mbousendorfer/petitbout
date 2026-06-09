import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { calculateAgeMonths, useBabyStore } from "@/lib/storage"
import { BabyAvatar, BabyAvatarPicker } from "@/components/BabyAvatar"
import { SettingsSection } from "@/pages/SettingsPage"

// Éditeur de profil dédié — portage de BabyProfileEditorView (iOS).
export function ProfilePage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const navigate = useNavigate()
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const [avatarEmoji, setAvatarEmoji] = useState(store.profile.avatarEmoji)
  const [isSaving, setIsSaving] = useState(false)

  const displayName = childName.trim() ? childName.trim() : "bébé"
  const ageMonths = calculateAgeMonths(birthDate) ?? store.profile.ageMonths
  const hasChanges =
    childName.trim() !== store.profile.childName ||
    birthDate !== store.profile.birthDate ||
    avatarEmoji !== store.profile.avatarEmoji

  async function save() {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    const didSync = await store.updateProfile({ childName: childName.trim(), birthDate, avatarEmoji })
    setIsSaving(false)

    if (didSync) {
      toast.success("Profil enregistré")
    } else {
      toast.warning("Enregistré sur cet appareil, synchro à vérifier")
    }

    navigate("/settings")
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
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Profil de bébé</h1>
        </div>
      </header>

      <div className="grid gap-1">
        <SettingsSection
          description={`L'avatar de ${displayName} s'affiche sur l'accueil et la progression.`}
          title="Avatar"
        >
          <div className="flex items-center gap-3">
            <BabyAvatar emoji={avatarEmoji} size={56} />
            <p className="text-sm leading-5 text-muted-foreground">Aperçu de l'avatar choisi.</p>
          </div>
          <BabyAvatarPicker value={avatarEmoji} onSelect={setAvatarEmoji} />
        </SettingsSection>

        <SettingsSection
          description="Ces informations adaptent les repères et suggestions. Aucun compte n'est créé."
          title="Informations"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Prénom</span>
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
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
            <span className="text-sm font-semibold text-muted-foreground">Âge</span>
            <span className="font-rounded text-base font-bold tabular-nums">{ageMonths} mois</span>
          </div>
          <Button type="button" onClick={() => void save()} disabled={!hasChanges || isSaving}>
            <Check data-icon="inline-start" aria-hidden="true" />
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </SettingsSection>
      </div>
    </>
  )
}

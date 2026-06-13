import { useState } from "react"
import { Carrot, Lock, Sparkles, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBabyStore } from "@/lib/storage"
import { HeroPanel } from "@/components/primitives"

export function FamilySetup({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const [familyCode, setFamilyCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitFamilyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!familyCode.trim()) return

    setIsSubmitting(true)
    const didConnect = await store.connectFamily(familyCode)
    setIsSubmitting(false)

    if (didConnect) {
      toast.success("Espace famille connecté")
    } else {
      toast.error("Impossible de connecter l’espace famille")
    }
  }

  return (
    <>
      <HeroPanel icon={Carrot} className="p-5">
        <div className="flex flex-col gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm" aria-hidden="true">
            <Carrot className="size-8" />
          </span>
          <div>
            <h1 className="font-rounded text-[2.4rem] font-extrabold leading-none tracking-normal">
              Bienvenue dans Petitbout
            </h1>
            <p className="mt-3 text-lg leading-7 text-muted-foreground">
              Un carnet tout simple pour suivre les aliments de bébé, à ton rythme.
            </p>
          </div>
        </div>
      </HeroPanel>

      <div className="grid gap-2 px-1 text-sm font-medium text-muted-foreground">
        <p className="flex items-center gap-2">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          Tes données restent liées à ton espace famille.
        </p>
        <p className="flex items-center gap-2">
          <Users className="size-4 text-primary" aria-hidden="true" />
          Utilise le même code sur tes appareils.
        </p>
        <p className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          Des idées selon l'âge et la saison.
        </p>
      </div>

      <section className="paper-surface soft-ring rounded-hero p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-normal">Code famille</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ouvre ton espace partagé pour retrouver le même suivi.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={submitFamilyCode}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            <span className="text-xs font-bold uppercase text-muted-foreground">Code famille</span>
            <Input
              autoComplete="off"
              className="h-12 bg-background/70"
              placeholder="Ex. puree-carotte-2026"
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value)}
            />
          </label>
          <Button type="submit" className="h-12" disabled={isSubmitting || !familyCode.trim()}>
            {isSubmitting ? "Ouverture..." : "Ouvrir mon espace famille"}
          </Button>
        </form>
        {!store.isConfigured && (
          <p className="mt-4 rounded-xl border bg-muted/65 p-3 text-sm leading-5 text-muted-foreground">
            Les données seront gardées sur cet appareil. L’espace famille pourra être retrouvé sur plusieurs appareils après configuration du stockage partagé.
          </p>
        )}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Toute personne ayant ce code peut ouvrir le même suivi.
        </p>
      </section>
    </>
  )
}

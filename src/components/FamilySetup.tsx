import { useState } from "react"
import { LockKeyhole } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useBabyStore } from "@/lib/storage"
import { HeroPanel, Header } from "@/components/primitives"

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
      <Header eyebrow="Espace partagé" title="Diversibebs" />
      <HeroPanel icon={LockKeyhole}>
        <p className="eyebrow">Carnet de découvertes</p>
        <h2 className="mt-1.5 font-rounded text-2xl font-extrabold tracking-[-0.01em]">
          Un suivi doux, partagé et toujours sous la main.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Ouvre ton espace famille avec un code partagé pour retrouver le suivi sur tes appareils.
        </p>
      </HeroPanel>
      <Card className="paper-surface">
        <CardHeader>
          <CardTitle>Code famille</CardTitle>
          <CardDescription>
            Utilise le même code sur tes deux téléphones pour partager le suivi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submitFamilyCode}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Code famille
              <Input
                autoComplete="off"
                placeholder="Ex. puree-carotte-2026"
                value={familyCode}
                onChange={(event) => setFamilyCode(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={isSubmitting || !familyCode.trim()}>
              {isSubmitting ? "Ouverture..." : "Ouvrir mon espace famille"}
            </Button>
          </form>
          {!store.isConfigured && (
            <p className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              Les données seront gardées sur cet appareil. L’espace famille pourra être retrouvé sur
              plusieurs appareils après configuration du stockage partagé.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Utilise le même code sur tes appareils. Toute personne ayant ce code peut ouvrir le même suivi.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

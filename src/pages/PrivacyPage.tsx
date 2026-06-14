import { useNavigate } from "react-router-dom"
import { BarChart3, ChevronLeft, Database, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsSection } from "@/pages/SettingsPage"

const localItems = [
  {
    title: "Sans espace famille",
    description:
      "Le carnet reste sur l’appareil. Il peut fonctionner hors ligne et n’est pas envoyé au serveur PetitBout.",
  },
  {
    title: "Sauvegardes",
    description:
      "Quand tu télécharges une sauvegarde, le fichier est créé sur ton appareil. PetitBout ne le reçoit pas.",
  },
]

const familyItems = [
  {
    title: "Profil bébé",
    description:
      "Prénom, date de naissance, âge calculé et avatar sont synchronisés pour retrouver le même carnet ailleurs.",
  },
  {
    title: "Essais alimentaires",
    description:
      "Aliment, date, heure si renseignée, réaction et note libre sont partagés avec les appareils connectés au même espace famille.",
  },
  {
    title: "Code famille et PIN",
    description:
      "Le serveur garde une empreinte technique du code et du PIN pour reconnaître l’espace, pas le code ni le PIN lisibles.",
  },
]

const analyticsItems = [
  {
    title: "Pages consultées",
    description:
      "L’outil de mesure d’audience peut compter les écrans ouverts pour comprendre ce qui sert vraiment.",
  },
  {
    title: "Informations techniques limitées",
    description:
      "Comme la plupart des outils d’audience, il peut recevoir des informations de visite comme la page, le navigateur ou le type d’appareil.",
  },
  {
    title: "Pas le contenu du carnet",
    description:
      "Le profil de bébé, les aliments, les réactions, les notes, le code famille et le PIN ne sont pas envoyés à l’outil d’audience.",
  },
]

const notStoredItems = [
  "Aucune adresse email de compte",
  "Aucune donnée de paiement",
  "Aucun profil publicitaire",
  "Aucune vente de données",
]

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <>
      <header className="flex items-center gap-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground"
          onClick={() => navigate("/data-privacy")}
          aria-label="Retour à sauvegarde et données"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="eyebrow">Sauvegarde et données</p>
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-normal">
            Confidentialité
          </h1>
        </div>
      </header>

      <div className="grid gap-1">
        <SettingsSection
          description="Petitbout garde le carnet au minimum nécessaire. Le partage reste un choix."
          title="En bref"
        >
          <div className="rounded-lg border bg-card/85 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">Local par défaut, partagé seulement si tu l’actives</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Sans espace famille, le carnet reste sur cet appareil. Avec l’espace famille, les données utiles au
                  carnet sont synchronisées avec le serveur PetitBout pour les retrouver sur plusieurs appareils.
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          description="Ce mode ne demande pas de serveur PetitBout."
          title="Ce qui reste sur l’appareil"
        >
          <div className="grid gap-3">
            {localItems.map((item) => (
              <PrivacyCard key={item.title} icon={Smartphone} title={item.title}>
                {item.description}
              </PrivacyCard>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          description="Uniquement quand tu crées ou rejoins un espace famille."
          title="Ce qui est synchronisé"
        >
          <div className="grid gap-3">
            {familyItems.map((item) => (
              <PrivacyCard key={item.title} icon={Database} title={item.title}>
                {item.description}
              </PrivacyCard>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          description="Cela aide à améliorer l’app, sans lire le carnet."
          title="Mesure d’audience"
        >
          <div className="grid gap-3">
            {analyticsItems.map((item) => (
              <PrivacyCard key={item.title} icon={BarChart3} title={item.title}>
                {item.description}
              </PrivacyCard>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          description="Ces éléments ne font pas partie de Petitbout."
          title="Ce qui n’est pas collecté"
        >
          <div className="rounded-lg border bg-card/85 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-tested/10 text-status-tested">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </span>
              <p className="font-semibold">Pas de compte marketing autour du carnet</p>
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

function PrivacyCard({
  children,
  icon: Icon,
  title,
}: {
  children: string
  icon: typeof Smartphone
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

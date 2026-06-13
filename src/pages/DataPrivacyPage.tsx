import { useNavigate } from "react-router-dom"
import { ChevronLeft, Database, Eye, LockKeyhole, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      "Les aliments consultés, les réactions, le profil de bébé et le code famille ne sont pas envoyés à l’outil d’analyse.",
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
      "Hash SHA-256 du code famille, jamais le code en clair",
      "Date de dernière mise à jour du profil",
    ],
  },
  {
    title: "Profil de bébé",
    rows: [
      "Prénom renseigné dans le profil",
      "Date de naissance, si elle est renseignée",
      "Âge en mois, utilisé pour adapter les repères",
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
  "L’avatar choisi pour bébé dans l’app",
  "Une adresse email de compte utilisateur",
  "Une donnée de paiement ou de publicité",
]

export function DataPrivacyPage() {
  const navigate = useNavigate()

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
            Confidentialité des données
          </h1>
        </div>
      </header>

      <div className="grid gap-1">
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
          description="Ces informations sont synchronisées avec Supabase quand l’espace famille est connecté."
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

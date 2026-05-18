export type FoodSourceTheme =
  | "Âges"
  | "Allergènes"
  | "Aliments à éviter"
  | "Préparations"

export type FoodSourceReference = {
  accessedAt: string
  id: string
  organization: string
  title: string
  theme: FoodSourceTheme
  url: string
}

export const reviewedAt = "mai 2026"

export const foodSourceReferences: FoodSourceReference[] = [
  {
    id: "ameli-diversification",
    title: "La diversification alimentaire",
    organization: "Assurance Maladie",
    theme: "Âges",
    url: "https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/debut-diversification-alimentaire",
    accessedAt: "2026-05-18",
  },
  {
    id: "spf-guide-diversification",
    title: "La diversification alimentaire de votre enfant jusqu'à 3 ans",
    organization: "Santé publique France",
    theme: "Préparations",
    url: "https://www.santepubliquefrance.fr/content/download/804042/5008037?version=1",
    accessedAt: "2026-05-18",
  },
  {
    id: "ameli-repas-8-mois-3-ans",
    title: "De 8 mois à 3 ans : des repas équilibrés et bien répartis",
    organization: "Assurance Maladie",
    theme: "Aliments à éviter",
    url: "https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/repas-equilibres-repartis",
    accessedAt: "2026-05-18",
  },
  {
    id: "ameli-allergies",
    title: "Allergie alimentaire : traitement et prévention",
    organization: "Assurance Maladie",
    theme: "Allergènes",
    url: "https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/traitement-prevention",
    accessedAt: "2026-05-18",
  },
]

export function sourcesByTheme() {
  return foodSourceReferences.reduce<Record<FoodSourceTheme, FoodSourceReference[]>>(
    (groups, source) => {
      groups[source.theme].push(source)
      return groups
    },
    {
      "Âges": [],
      "Allergènes": [],
      "Aliments à éviter": [],
      "Préparations": [],
    },
  )
}


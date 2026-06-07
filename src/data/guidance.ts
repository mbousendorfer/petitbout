import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CupSoda,
  Droplet,
  Droplets,
  Eye,
  Flame,
  Hand,
  Octagon,
  RefreshCw,
  Thermometer,
  type LucideIcon,
} from "lucide-react"

// Repères de diversification — contenu porté depuis l'app iOS
// (Data/GuidanceContent.swift). Textes FR repris verbatim ; les SF Symbols
// sont mappés vers leurs équivalents Lucide.

export type GuidanceRule = {
  title: string
  detail: string
  icon: LucideIcon
}

export type GuidanceStage = {
  ageRange: string
  title: string
  principles: string[]
  texture: string
  milk: string
  watchPoints: string[]
}

export type GuidanceSource = {
  title: string
  publisher: string
  year: string
  url: string
}

export const guidanceRules: GuidanceRule[] = [
  {
    title: "Démarrer entre 4 et 6 mois",
    detail:
      "Pas avant 4 mois révolus, pas après 6 mois sans avis médical. Observer la tenue de tête, l'intérêt pour le repas et l'ouverture de bouche.",
    icon: CalendarClock,
  },
  {
    title: "Introduire les allergènes sans tarder",
    detail:
      "Une fois la diversification lancée, proposer progressivement oeuf bien cuit, arachide en purée fine, laitages, gluten, poisson, fruits à coque en purée et sésame.",
    icon: AlertTriangle,
  },
  {
    title: "Reproposer sans forcer",
    detail:
      "Un refus n'est pas définitif. Reproposer un aliment plusieurs fois, à différents moments, dans un cadre calme.",
    icon: RefreshCw,
  },
  {
    title: "Ajouter des matières grasses",
    detail:
      "Ajouter une petite quantité d'huile adaptée ou de beurre cru aux préparations maison, selon les habitudes familiales et les conseils reçus.",
    icon: Droplet,
  },
  {
    title: "Pas de sucre ni sel ajoutés",
    detail:
      "Laisser bébé découvrir le goût naturel des aliments. Éviter plats préparés salés, charcuterie, jus, sodas et produits très sucrés.",
    icon: Hand,
  },
  {
    title: "Le lait reste central",
    detail:
      "Le lait maternel ou infantile reste la base de l'alimentation pendant la diversification, surtout avant 1 an.",
    icon: Droplets,
  },
  {
    title: "Cuissons à coeur",
    detail:
      "Viande, poisson et oeuf doivent être bien cuits. Éviter les préparations crues ou peu cuites.",
    icon: Flame,
  },
  {
    title: "Surveiller chaque repas",
    detail:
      "Bébé mange assis, éveillé, sous surveillance. Adapter les textures et tailles pour limiter les risques de fausse route.",
    icon: Eye,
  },
]

export const guidanceStages: GuidanceStage[] = [
  {
    ageRange: "4-6 mois",
    title: "Le démarrage en douceur",
    principles: [
      "Une nouvelle saveur à la fois, en petite quantité.",
      "Tous les groupes peuvent être proposés progressivement.",
      "Ne pas saler, ne pas sucrer.",
      "Ajouter une matière grasse aux préparations maison.",
    ],
    texture: "Purée lisse, sans morceaux, proposée à la cuillère.",
    milk: "Lait maternel à la demande ou lait infantile majoritaire.",
    watchPoints: [
      "Ne pas démarrer avant 4 mois révolus.",
      "Ne pas attendre au-delà de 6 mois sans accompagnement.",
    ],
  },
  {
    ageRange: "6-9 mois",
    title: "On élargit, on apporte du fer",
    principles: [
      "Installer progressivement 4 moments de repas.",
      "Introduire viande, poisson, oeuf et légumineuses en petites quantités.",
      "Continuer à reproposer les aliments refusés.",
      "Faire évoluer les textures selon les capacités de bébé.",
    ],
    texture: "Purées plus épaisses, écrasés, puis petits morceaux fondants selon l'aisance.",
    milk: "Le lait reste important, avec adaptation progressive des repas.",
    watchPoints: [
      "Prioriser les aliments riches en fer.",
      "Rester attentif aux réactions et aux signes de satiété.",
    ],
  },
  {
    ageRange: "9-12 mois",
    title: "Textures et autonomie",
    principles: [
      "Proposer une grande variété de familles d'aliments.",
      "Encourager les morceaux fondants et l'exploration tactile.",
      "Garder des repas calmes, assis et surveillés.",
    ],
    texture: "Écrasé, haché fin, morceaux très fondants et adaptés.",
    milk: "Le lait reste présent, avec repas diversifiés plus structurés.",
    watchPoints: [
      "Adapter les tailles et formes pour éviter les aliments ronds, durs ou collants.",
      "Ne pas forcer à finir.",
    ],
  },
  {
    ageRange: "12-36 mois",
    title: "Vers les repas familiaux",
    principles: [
      "Se rapprocher progressivement des repas familiaux adaptés.",
      "Limiter produits sucrés, salés et ultra-transformés.",
      "Continuer à varier couleurs, textures et goûts.",
    ],
    texture: "Morceaux adaptés, textures familiales, toujours selon les capacités de mastication.",
    milk: "Apports lactés adaptés à l'âge et aux conseils du professionnel de santé.",
    watchPoints: [
      "Pas de miel avant 1 an.",
      "Attention aux aliments à risque de fausse route.",
    ],
  },
]

export const guidanceAvoid: GuidanceRule[] = [
  {
    title: "Miel avant 1 an",
    detail: "À éviter avant 12 mois en raison du risque de botulisme infantile.",
    icon: Octagon,
  },
  {
    title: "Aliments crus à risque",
    detail: "Éviter poisson cru, viande crue, oeuf cru ou peu cuit et produits non pasteurisés.",
    icon: Thermometer,
  },
  {
    title: "Petits aliments durs ou ronds",
    detail: "Adapter raisins, tomates cerises, noix entières, morceaux durs ou collants.",
    icon: Ban,
  },
  {
    title: "Boissons sucrées",
    detail: "Éviter jus, sodas et boissons sucrées. L'eau suffit en complément.",
    icon: CupSoda,
  },
]

export const guidanceSources: GuidanceSource[] = [
  {
    title: "Pas à pas, votre enfant mange comme un grand",
    publisher: "Santé publique France / PNNS",
    year: "2021",
    url: "https://www.mangerbouger.fr/manger-mieux/a-tout-age-et-a-chaque-etape-de-la-vie/enfants",
  },
  {
    title: "La diversification alimentaire",
    publisher: "Assurance Maladie",
    year: "2025",
    url: "https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/debut-diversification-alimentaire",
  },
  {
    title: "Avis relatif à la révision des repères alimentaires pour les enfants de moins de 3 ans",
    publisher: "HCSP",
    year: "2020",
    url: "https://www.hcsp.fr",
  },
  {
    title: "L'alimentation de 4 à 6 mois",
    publisher: "1000 premiers jours",
    year: "2023",
    url: "https://www.1000-premiers-jours.fr",
  },
  {
    title: "Complementary feeding guideline",
    publisher: "Organisation mondiale de la santé",
    year: "2023",
    url: "https://www.who.int/publications/i/item/9789240081864",
  },
  {
    title: "Complementary Feeding Position Paper",
    publisher: "ESPGHAN",
    year: "2017",
    url: "https://www.espghan.org",
  },
  {
    title: "Introduction précoce de l'arachide",
    publisher: "NEJM - LEAP",
    year: "2015",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1414850",
  },
  {
    title: "Introduction de plusieurs allergènes",
    publisher: "NEJM - EAT",
    year: "2016",
    url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1514210",
  },
]

export function guidanceStageIndexFor(ageInMonths: number): number {
  if (ageInMonths < 6) return 0
  if (ageInMonths < 9) return 1
  if (ageInMonths < 12) return 2
  return 3
}

export function guidanceStageFor(ageInMonths: number): GuidanceStage {
  return guidanceStages[guidanceStageIndexFor(ageInMonths)]
}

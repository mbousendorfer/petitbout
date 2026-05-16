export type FoodCategory =
  | "Légumes"
  | "Fruits"
  | "Féculents"
  | "Protéines"
  | "Produits laitiers"
  | "Allergènes"

export type RecommendationLevel = "conseillé" | "possible"

export type Food = {
  id: string
  name: string
  category: FoodCategory
  minAgeMonths: number
  seasonMonths: number[]
  preparation: string
  level: RecommendationLevel
  tags: string[]
}

export const foods: Food[] = [
  {
    id: "carotte",
    name: "Carotte",
    category: "Légumes",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
    preparation: "Cuire sans sel puis mixer finement en purée lisse.",
    level: "conseillé",
    tags: ["purée douce", "facile à préparer"],
  },
  {
    id: "courgette",
    name: "Courgette",
    category: "Légumes",
    minAgeMonths: 4,
    seasonMonths: [5, 6, 7, 8, 9],
    preparation: "Cuire à la vapeur sans sel, retirer les pépins si besoin, mixer.",
    level: "conseillé",
    tags: ["texture légère"],
  },
  {
    id: "haricot-vert",
    name: "Haricot vert",
    category: "Légumes",
    minAgeMonths: 4,
    seasonMonths: [6, 7, 8, 9, 10],
    preparation: "Cuire longuement sans sel puis mixer très finement.",
    level: "conseillé",
    tags: ["goût végétal"],
  },
  {
    id: "potiron",
    name: "Potiron",
    category: "Légumes",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 9, 10, 11, 12],
    preparation: "Cuire sans sel et mixer en purée lisse.",
    level: "conseillé",
    tags: ["purée douce"],
  },
  {
    id: "patate-douce",
    name: "Patate douce",
    category: "Féculents",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 9, 10, 11, 12],
    preparation: "Cuire sans sel, utiliser seule ou en petite quantité avec un légume.",
    level: "possible",
    tags: ["avec légumes"],
  },
  {
    id: "pomme-de-terre",
    name: "Pomme de terre",
    category: "Féculents",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Cuire sans sel et mélanger avec une purée de légumes.",
    level: "possible",
    tags: ["avec légumes"],
  },
  {
    id: "pomme",
    name: "Pomme",
    category: "Fruits",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 9, 10, 11, 12],
    preparation: "Cuire en compote sans sucre ajouté puis mixer.",
    level: "conseillé",
    tags: ["compote"],
  },
  {
    id: "poire",
    name: "Poire",
    category: "Fruits",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 8, 9, 10, 11, 12],
    preparation: "Cuire en compote sans sucre ajouté puis mixer.",
    level: "conseillé",
    tags: ["compote"],
  },
  {
    id: "banane",
    name: "Banane",
    category: "Fruits",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Proposer bien mûre, écrasée ou mixée, sans sucre ajouté.",
    level: "possible",
    tags: ["très mûre"],
  },
  {
    id: "farine-riz",
    name: "Farine de riz",
    category: "Féculents",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Préparer sous forme de bouillie adaptée, sans sucre ajouté.",
    level: "possible",
    tags: ["céréale"],
  },
  {
    id: "lentille-corail",
    name: "Lentille corail",
    category: "Féculents",
    minAgeMonths: 4,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Cuire longuement et proposer en très petite quantité, mixée avec des légumes.",
    level: "possible",
    tags: ["légumineuse", "petite quantité"],
  },
  {
    id: "yaourt-nature",
    name: "Yaourt nature",
    category: "Produits laitiers",
    minAgeMonths: 6,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "À introduire selon les recommandations suivies avec le professionnel de santé.",
    level: "possible",
    tags: ["sans sucre"],
  },
  {
    id: "oeuf",
    name: "Oeuf",
    category: "Allergènes",
    minAgeMonths: 6,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "À introduire cuit et en quantité adaptée selon les conseils reçus.",
    level: "possible",
    tags: ["allergène"],
  },
  {
    id: "poisson-blanc",
    name: "Poisson blanc",
    category: "Protéines",
    minAgeMonths: 6,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Bien cuire, vérifier les arêtes, mixer en petite quantité avec des légumes.",
    level: "possible",
    tags: ["protéine"],
  },
]

export const categories: FoodCategory[] = [
  "Légumes",
  "Fruits",
  "Féculents",
  "Protéines",
  "Produits laitiers",
  "Allergènes",
]


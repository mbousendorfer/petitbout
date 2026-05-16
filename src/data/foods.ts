export type FoodCategory =
  | "Légumes"
  | "Fruits"
  | "Féculents"
  | "Protéines"
  | "Produits laitiers"
  | "Allergènes"
  | "Divers"

export type RecommendationLevel = "conseillé" | "possible"

export type Food = {
  id: string
  name: string
  emoji: string
  category: FoodCategory
  minAgeMonths: number
  seasonMonths: number[]
  preparation: string
  level: RecommendationLevel
  tags: string[]
}

type FoodSource = {
  category: FoodCategory
  emoji: string
  level: RecommendationLevel
  minAgeMonths?: number
  name: string
  preparation?: string
  season?: string
  tags?: string[]
}

const allYear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const seasonByLabel: Record<string, number[]> = {
  "août et septembre": [8, 9],
  "août à octobre": [8, 9, 10],
  "août à septembre": [8, 9],
  "avril à juin": [4, 5, 6],
  "avril à juillet": [4, 5, 6, 7],
  "avril à juillet / décembre": [4, 5, 6, 7, 12],
  "avril à octobre": [4, 5, 6, 7, 8, 9, 10],
  "décembre à avril": [12, 1, 2, 3, 4],
  "décembre à mars": [12, 1, 2, 3],
  "fév. à sept. / nov. à déc.": [2, 3, 4, 5, 6, 7, 8, 9, 11, 12],
  "juillet à novembre": [7, 8, 9, 10, 11],
  "juillet à janvier": [7, 8, 9, 10, 11, 12, 1],
  "juillet à octobre": [7, 8, 9, 10],
  "juillet à septembre": [7, 8, 9],
  "juin": [6],
  "juin à août": [6, 7, 8],
  "juin à novembre": [6, 7, 8, 9, 10, 11],
  "juin à septembre": [6, 7, 8, 9],
  "mai à décembre": [5, 6, 7, 8, 9, 10, 11, 12],
  "mai à juin": [5, 6],
  "mai à septembre": [5, 6, 7, 8, 9],
  "mars à juin": [3, 4, 5, 6],
  "mars à novembre": [3, 4, 5, 6, 7, 8, 9, 10, 11],
  "mars à septembre": [3, 4, 5, 6, 7, 8, 9],
  "novembre à avril": [11, 12, 1, 2, 3, 4],
  "novembre à février": [11, 12, 1, 2],
  "novembre à janvier": [11, 12, 1],
  "octobre": [10],
  "octobre à avril": [10, 11, 12, 1, 2, 3, 4],
  "octobre à décembre": [10, 11, 12],
  "octobre à février": [10, 11, 12, 1, 2],
  "octobre à janvier": [10, 11, 12, 1],
  "octobre à mai": [10, 11, 12, 1, 2, 3, 4, 5],
  "octobre à mars": [10, 11, 12, 1, 2, 3],
  "octobre à novembre": [10, 11],
  "septembre à avril": [9, 10, 11, 12, 1, 2, 3, 4],
  "septembre à décembre": [9, 10, 11, 12],
  "septembre à juin": [9, 10, 11, 12, 1, 2, 3, 4, 5, 6],
  "septembre à mai": [9, 10, 11, 12, 1, 2, 3, 4, 5],
  "septembre à mars": [9, 10, 11, 12, 1, 2, 3],
  "septembre à novembre": [9, 10, 11],
  "septembre et octobre": [9, 10],
  "toute l’année": allYear,
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function preparationFor(source: FoodSource) {
  if (source.preparation) return source.preparation

  if (source.category === "Légumes") {
    return "Cuire sans sel ajouté puis proposer en texture adaptée à l’âge."
  }

  if (source.category === "Fruits") {
    return "Proposer sans sucre ajouté, en compote ou texture adaptée à l’âge."
  }

  if (source.category === "Féculents") {
    return "Préparer sans sel ajouté, en texture adaptée à l’âge."
  }

  if (source.category === "Protéines") {
    return "Bien cuire et proposer en quantité adaptée à l’âge."
  }

  if (source.category === "Produits laitiers") {
    return "Proposer occasionnellement, sans sucre ajouté."
  }

  return "Introduire en respectant l’âge indiqué par le tableau source."
}

function makeFood(source: FoodSource): Food {
  const tags = [...(source.tags ?? [])]
  if (source.level === "conseillé") tags.unshift("introduction conseillée")
  if (source.level === "possible") tags.unshift("introduction possible")

  return {
    id: slugify(source.name),
    name: source.name,
    emoji: source.emoji,
    category: source.category,
    minAgeMonths: source.minAgeMonths ?? 4,
    seasonMonths: source.season ? seasonByLabel[source.season] ?? allYear : allYear,
    preparation: preparationFor(source),
    level: source.level,
    tags,
  }
}

const vegetableSources: FoodSource[] = [
  { name: "Artichaut", emoji: "🌱", category: "Légumes", level: "possible", season: "mars à septembre" },
  { name: "Asperge", emoji: "🌱", category: "Légumes", level: "possible", season: "avril à juin" },
  { name: "Aubergine", emoji: "🍆", category: "Légumes", level: "conseillé", season: "juin à septembre" },
  { name: "Avocat", emoji: "🥑", category: "Légumes", level: "possible", season: "octobre à avril" },
  { name: "Blette", emoji: "🥬", category: "Légumes", level: "conseillé", season: "juin à novembre" },
  { name: "Betterave", emoji: "🟣", category: "Légumes", level: "conseillé", season: "octobre à mars" },
  { name: "Brocoli", emoji: "🥦", category: "Légumes", level: "conseillé", season: "juin à novembre" },
  { name: "Carotte", emoji: "🥕", category: "Légumes", level: "conseillé", season: "toute l’année" },
  { name: "Céleri-branche", emoji: "🌿", category: "Légumes", level: "possible", season: "juillet à janvier" },
  { name: "Céleri-rave", emoji: "🌿", category: "Légumes", level: "conseillé", season: "octobre à mars" },
  { name: "Champignon", emoji: "🍄", category: "Légumes", level: "possible", season: "toute l’année" },
  { name: "Chou blanc", emoji: "🥬", category: "Légumes", level: "possible", season: "octobre à avril" },
  { name: "Chou de Bruxelles", emoji: "🥬", category: "Légumes", level: "possible", season: "septembre à mars" },
  { name: "Chou rouge", emoji: "🥬", category: "Légumes", level: "possible", season: "octobre à avril" },
  { name: "Chou vert", emoji: "🥬", category: "Légumes", level: "possible", season: "octobre à avril" },
  { name: "Chou-fleur", emoji: "🥦", category: "Légumes", level: "possible", season: "septembre à avril" },
  { name: "Chou-rave", emoji: "🥬", category: "Légumes", level: "possible", season: "mars à novembre" },
  { name: "Citrouille", emoji: "🎃", category: "Légumes", level: "conseillé", season: "septembre à décembre" },
  { name: "Concombre", emoji: "🥒", category: "Légumes", level: "conseillé", season: "avril à octobre" },
  { name: "Courgette", emoji: "🥒", category: "Légumes", level: "conseillé", season: "mai à septembre" },
  { name: "Endive", emoji: "🥬", category: "Légumes", level: "conseillé", season: "octobre à avril" },
  { name: "Épinards", emoji: "🥬", category: "Légumes", level: "conseillé", season: "septembre à juin" },
  { name: "Fenouil", emoji: "🌿", category: "Légumes", level: "conseillé", season: "mai à décembre" },
  { name: "Haricots verts", emoji: "🫛", category: "Légumes", level: "conseillé", season: "juillet à septembre" },
  { name: "Navet", emoji: "🌱", category: "Légumes", level: "conseillé", season: "octobre à mai" },
  { name: "Oignon", emoji: "🧅", category: "Légumes", level: "possible", season: "septembre à avril" },
  { name: "Panais", emoji: "🥕", category: "Légumes", level: "conseillé", season: "octobre à février" },
  { name: "Patate douce", emoji: "🍠", category: "Féculents", level: "conseillé", season: "toute l’année", tags: ["légume du tableau"] },
  { name: "Pâtisson", emoji: "🎃", category: "Légumes", level: "possible", season: "juillet à novembre" },
  { name: "Petits pois", emoji: "🫛", category: "Féculents", level: "conseillé", season: "mai à juin", tags: ["légume du tableau"] },
  { name: "Poireau", emoji: "🌿", category: "Légumes", level: "conseillé", season: "septembre à avril" },
  { name: "Poivron", emoji: "🫑", category: "Légumes", level: "possible", season: "juin à septembre" },
  { name: "Potimarron", emoji: "🎃", category: "Légumes", level: "conseillé", season: "septembre à décembre" },
  { name: "Potiron", emoji: "🎃", category: "Légumes", level: "conseillé", season: "octobre à janvier" },
  { name: "Radis", emoji: "🌱", category: "Légumes", level: "possible", season: "mars à juin" },
  { name: "Rutabaga", emoji: "🌱", category: "Légumes", level: "conseillé", season: "octobre à avril" },
  { name: "Salade", emoji: "🥬", category: "Légumes", level: "conseillé", season: "toute l’année" },
  { name: "Salsifis", emoji: "🌱", category: "Légumes", level: "possible", season: "octobre à mars" },
  { name: "Tomate", emoji: "🍅", category: "Légumes", level: "possible", season: "mai à septembre" },
  { name: "Topinambour", emoji: "🌱", category: "Légumes", level: "conseillé", season: "novembre à avril" },
]

const fruitSources: FoodSource[] = [
  { name: "Abricot", emoji: "🍑", category: "Fruits", level: "conseillé", season: "juin à août" },
  { name: "Amande", emoji: "🌰", category: "Fruits", level: "possible", season: "septembre et octobre", tags: ["allergène"] },
  { name: "Ananas", emoji: "🍍", category: "Fruits", level: "possible", season: "octobre à avril" },
  { name: "Banane", emoji: "🍌", category: "Fruits", level: "conseillé", season: "toute l’année" },
  { name: "Cassis", emoji: "🫐", category: "Fruits", level: "possible", season: "août et septembre" },
  { name: "Cerise", emoji: "🍒", category: "Fruits", level: "possible", season: "juin" },
  { name: "Châtaigne", emoji: "🌰", category: "Fruits", level: "possible", season: "octobre" },
  { name: "Citron", emoji: "🍋", category: "Fruits", level: "conseillé", season: "fév. à sept. / nov. à déc." },
  { name: "Clémentine", emoji: "🍊", category: "Fruits", level: "conseillé", season: "novembre à janvier" },
  { name: "Coing", emoji: "🍐", category: "Fruits", level: "conseillé", season: "octobre" },
  { name: "Datte", emoji: "🌴", category: "Fruits", level: "possible", season: "octobre à décembre" },
  { name: "Figue", emoji: "🟣", category: "Fruits", level: "possible", season: "juillet à octobre" },
  { name: "Fraise", emoji: "🍓", category: "Fruits", level: "possible", season: "avril à juin" },
  { name: "Framboise", emoji: "🍓", category: "Fruits", level: "possible", season: "juillet à septembre" },
  { name: "Fruit de la passion", emoji: "🟠", category: "Fruits", level: "possible", season: "toute l’année" },
  { name: "Grenade", emoji: "🔴", category: "Fruits", level: "possible", season: "novembre à février" },
  { name: "Groseille", emoji: "🔴", category: "Fruits", level: "possible", season: "juin à septembre" },
  { name: "Kaki", emoji: "🟠", category: "Fruits", level: "conseillé", season: "octobre à janvier" },
  { name: "Kiwi", emoji: "🥝", category: "Fruits", level: "possible", season: "novembre à mai" },
  { name: "Litchi", emoji: "🍒", category: "Fruits", level: "possible", season: "novembre à janvier" },
  { name: "Mandarine", emoji: "🍊", category: "Fruits", level: "conseillé", season: "novembre à janvier" },
  { name: "Mangue", emoji: "🥭", category: "Fruits", level: "conseillé", season: "avril à juillet / décembre" },
  { name: "Melon", emoji: "🍈", category: "Fruits", level: "conseillé", season: "juin à septembre" },
  { name: "Mirabelle", emoji: "🟡", category: "Fruits", level: "conseillé", season: "août à septembre" },
  { name: "Mûre", emoji: "🫐", category: "Fruits", level: "possible", season: "juillet à octobre" },
  { name: "Myrtille", emoji: "🫐", category: "Fruits", level: "possible", season: "juin à septembre" },
  { name: "Nectarine", emoji: "🍑", category: "Fruits", level: "conseillé", season: "juin à août" },
  { name: "Noisette", emoji: "🌰", category: "Fruits", level: "possible", season: "septembre à novembre", tags: ["allergène"] },
  { name: "Noix", emoji: "🌰", category: "Fruits", level: "possible", season: "octobre à novembre", tags: ["allergène"] },
  { name: "Orange", emoji: "🍊", category: "Fruits", level: "conseillé", season: "décembre à avril" },
  { name: "Pamplemousse", emoji: "🍊", category: "Fruits", level: "conseillé", season: "décembre à mars" },
  { name: "Papaye", emoji: "🟠", category: "Fruits", level: "conseillé", season: "octobre à décembre" },
  { name: "Pastèque", emoji: "🍉", category: "Fruits", level: "conseillé", season: "juin à août" },
  { name: "Pêche", emoji: "🍑", category: "Fruits", level: "conseillé", season: "juin à août" },
  { name: "Poire", emoji: "🍐", category: "Fruits", level: "conseillé", season: "toute l’année" },
  { name: "Pomme", emoji: "🍎", category: "Fruits", level: "conseillé", season: "septembre à mai" },
  { name: "Prune", emoji: "🟣", category: "Fruits", level: "conseillé", season: "juillet à octobre" },
  { name: "Pruneau", emoji: "🟣", category: "Fruits", level: "conseillé", season: "toute l’année" },
  { name: "Quetsche", emoji: "🟣", category: "Fruits", level: "conseillé", season: "août à octobre" },
  { name: "Raisin", emoji: "🍇", category: "Fruits", level: "conseillé", season: "juillet à octobre" },
  { name: "Rhubarbe", emoji: "🌱", category: "Fruits", level: "possible", season: "avril à juillet" },
]

const starchSources: FoodSource[] = [
  { name: "Farine infantile", emoji: "🥣", category: "Féculents", level: "conseillé" },
  { name: "Avoine", emoji: "🌾", category: "Féculents", level: "possible" },
  { name: "Blé (farine)", emoji: "🌾", category: "Féculents", level: "possible", tags: ["allergène"] },
  { name: "Fèves", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Haricots blancs", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Haricots rouges", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Lentilles corail", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Lentilles vertes", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Maïs (doux)", emoji: "🌽", category: "Féculents", level: "conseillé" },
  { name: "Pain", emoji: "🥖", category: "Féculents", level: "possible", minAgeMonths: 6, tags: ["gluten"] },
  { name: "Pâtes", emoji: "🍝", category: "Féculents", level: "possible", minAgeMonths: 6, tags: ["gluten"] },
  { name: "Pois chiches", emoji: "🫘", category: "Féculents", level: "possible" },
  { name: "Polenta", emoji: "🌽", category: "Féculents", level: "possible" },
  { name: "Pomme de terre", emoji: "🥔", category: "Féculents", level: "conseillé" },
  { name: "Quinoa", emoji: "🌾", category: "Féculents", level: "possible" },
  { name: "Riz blanc", emoji: "🍚", category: "Féculents", level: "possible" },
  { name: "Riz semi-complet", emoji: "🍚", category: "Féculents", level: "possible", minAgeMonths: 6 },
  { name: "Sarrasin", emoji: "🌾", category: "Féculents", level: "possible" },
  { name: "Semoule, boulgour", emoji: "🌾", category: "Féculents", level: "possible", tags: ["gluten"] },
  { name: "Tapioca", emoji: "🥣", category: "Féculents", level: "possible" },
]

const animalProteinSources: FoodSource[] = [
  { name: "Viande blanche", emoji: "🍗", category: "Protéines", level: "possible", preparation: "Bien cuire. Repère du tableau : 10 g à 6 mois, 15 g à 9 mois, 20 g à 12 mois." },
  { name: "Viande rouge", emoji: "🥩", category: "Protéines", level: "possible", preparation: "Bien cuire. Repère du tableau : 10 g à 6 mois, 15 g à 9 mois, 20 g à 12 mois." },
  { name: "Poisson maigre", emoji: "🐟", category: "Protéines", level: "possible", preparation: "Bien cuire. Repère du tableau : 10 g à 6 mois, 15 g à 9 mois, 20 g à 12 mois." },
  { name: "Poisson gras", emoji: "🐟", category: "Protéines", level: "possible", preparation: "Bien cuire. Repère du tableau : 10 g à 6 mois, 15 g à 9 mois, 20 g à 12 mois." },
  { name: "Oeuf", emoji: "🥚", category: "Protéines", level: "possible", tags: ["allergène"], preparation: "Bien cuire. Repère du tableau : 1/4 à 6 mois, 1/4 à 9 mois, 1/3 à 12 mois." },
  { name: "Fruits de mer (cuits)", emoji: "🦐", category: "Protéines", level: "possible", tags: ["allergène"], preparation: "Bien cuire. Repère du tableau : 10 g à 6 mois, 15 g à 9 mois, 20 g à 12 mois." },
  { name: "Charcuterie", emoji: "🥓", category: "Protéines", level: "possible", minAgeMonths: 36, tags: ["pas avant 3 ans"], preparation: "Le tableau indique : pas avant 3 ans." },
]

const miscellaneousSources: FoodSource[] = [
  { name: "Miel", emoji: "🍯", category: "Divers", level: "possible", minAgeMonths: 12 },
  { name: "Yaourt", emoji: "🥛", category: "Produits laitiers", level: "possible", preparation: "Le lait maternel ou infantile reste le plus adapté ; le tableau indique que des laitages peuvent être proposés de temps en temps." },
  { name: "Fromage pasteurisé", emoji: "🧀", category: "Produits laitiers", level: "possible", preparation: "Le lait maternel ou infantile reste le plus adapté ; le tableau indique que des laitages peuvent être proposés de temps en temps." },
  { name: "Fromage au lait cru", emoji: "🧀", category: "Produits laitiers", level: "possible", minAgeMonths: 60, tags: ["pas avant 5 ans"], preparation: "Le tableau indique : pas avant 5 ans." },
  { name: "Herbes et épices", emoji: "🌿", category: "Divers", level: "conseillé", minAgeMonths: 6 },
  { name: "Chocolat", emoji: "🍫", category: "Divers", level: "possible", minAgeMonths: 12 },
]

const mergedSources = [
  ...vegetableSources,
  ...fruitSources,
  ...starchSources,
  ...animalProteinSources,
  ...miscellaneousSources,
]

export const foods: Food[] = mergedSources.map(makeFood)

export const categories: FoodCategory[] = [
  "Légumes",
  "Fruits",
  "Féculents",
  "Protéines",
  "Produits laitiers",
  "Allergènes",
  "Divers",
]

export type FoodCategory =
  | "Légumes"
  | "Fruits"
  | "Féculents"
  | "Protéines"
  | "Matières grasses"
  | "Produits laitiers"
  | "Divers"

export type RecommendationLevel = "conseillé" | "possible"

export type CautionLevel = "info" | "attention"

export type Food = {
  id: string
  name: string
  emoji: string
  category: FoodCategory
  minAgeMonths: number
  possibleAgeMonths?: number
  recommendedAgeMonths?: number
  seasonMonths: number[]
  preparation: string
  level: RecommendationLevel
  cautionLevel?: CautionLevel
  lastReviewedAt?: string
  sourceIds: string[]
  sourceNote?: string
  tags: string[]
}

type FoodSource = {
  category: FoodCategory
  emoji: string
  level: RecommendationLevel
  minAgeMonths?: number
  name: string
  possibleAgeMonths?: number
  preparation?: string
  recommendedAgeMonths?: number
  season?: string
  sourceIds?: string[]
  sourceNote?: string
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

const cerealNames = new Set([
  "Farine infantile",
  "Avoine",
  "Blé (farine)",
  "Maïs (doux)",
  "Pain",
  "Pâtes",
  "Polenta",
  "Quinoa",
  "Riz blanc",
  "Riz semi-complet",
  "Sarrasin",
  "Semoule, boulgour",
  "Tapioca",
])

const legumeNames = new Set([
  "Fèves",
  "Haricots blancs",
  "Haricots rouges",
  "Lentilles corail",
  "Lentilles vertes",
  "Pois chiches",
])

const nutNames = new Set(["Amande", "Noisette", "Noix"])

function preparationFor(source: FoodSource) {
  if (source.preparation) return source.preparation

  if (source.category === "Légumes") {
    return "Cuits et mixés. Faire évoluer les textures : cuits et mixés > moulinés, écrasés > petits morceaux mous, fondants."
  }

  if (source.category === "Fruits") {
    if (nutNames.has(source.name)) {
      return "En poudre ou en purée, mélangé à d’autres aliments, sans sel ajouté."
    }

    return "Cuits et mixés, puis cuits ou crus et bien mûrs : en compote, écrasés, en morceaux fondants."
  }

  if (source.category === "Féculents") {
    if (source.name === "Pomme de terre") {
      return "En purée avec des légumes, puis avec des légumes en alternant avec d’autres féculents."
    }

    if (legumeNames.has(source.name)) {
      return "En purée, en petite quantité. Puis en purée > écrasés > morceaux fondants, selon la tolérance digestive de l’enfant."
    }

    if (cerealNames.has(source.name)) {
      return "Farine ou bouillies, puis formes plus texturées : riz, semoule, pâtes, polenta, flocons d’avoine."
    }

    return "Avec des légumes, alterner avec d’autres féculents. Faire évoluer les textures selon les capacités de mastication."
  }

  if (source.category === "Protéines") {
    return "Très cuits et mixés, puis bien cuits et mixés ou hachés."
  }

  if (source.category === "Matières grasses") {
    return "Selon la diminution des apports en lait maternel ou infantile. Repère du tableau : 1 c. à café à chaque repas."
  }

  if (source.category === "Produits laitiers") {
    return "Laitages natures. Le lait maternel ou infantile reste mieux adapté ; ces produits viennent en complément."
  }

  return "Introduire en respectant l’âge indiqué par le tableau source."
}

function makeFood(source: FoodSource): Food {
  const tags = [...(source.tags ?? [])]
  if (source.level === "conseillé") tags.unshift("introduction conseillée")
  if (source.level === "possible") tags.unshift("introduction possible")
  const id = slugify(source.name)
  const sourceAges = sourceAgeByFoodId[id] ?? {}
  let possibleAgeMonths = source.possibleAgeMonths ?? sourceAges.possibleAgeMonths
  let recommendedAgeMonths = source.recommendedAgeMonths ?? sourceAges.recommendedAgeMonths
  const ageCandidates = [source.minAgeMonths, possibleAgeMonths, recommendedAgeMonths].filter(
    (age): age is number => typeof age === "number",
  )
  const minAgeMonths =
    ageCandidates.length > 0 ? Math.min(...ageCandidates) : 4
  if (source.level === "possible" && !possibleAgeMonths) possibleAgeMonths = minAgeMonths
  if (source.level === "conseillé" && !recommendedAgeMonths) recommendedAgeMonths = minAgeMonths
  const sourceIds = source.sourceIds ?? sourceIdsForFood(id, tags, minAgeMonths)
  const sourceNote = source.sourceNote ?? sourceNoteForFood(id, tags)

  return {
    id,
    name: source.name,
    emoji: source.emoji,
    category: source.category,
    minAgeMonths,
    possibleAgeMonths,
    recommendedAgeMonths,
    seasonMonths: source.season ? seasonByLabel[source.season] ?? allYear : allYear,
    preparation: preparationFor(source),
    level: source.level,
    cautionLevel: sourceNote ? "attention" : undefined,
    lastReviewedAt: sourceNote ? "mai 2026" : undefined,
    sourceIds,
    sourceNote,
    tags,
  }
}

function sourceIdsForFood(id: string, tags: string[], minAgeMonths: number) {
  const sourceIds = new Set<string>()
  if (tags.includes("allergène")) sourceIds.add("ameli-allergies")
  if (tags.includes("à éviter") || tags.includes("pas avant 3 ans") || tags.includes("pas avant 5 ans")) {
    sourceIds.add("ameli-repas-8-mois-3-ans")
  }
  if (minAgeMonths >= 12) sourceIds.add("ameli-diversification")
  if (["miel", "fromage-au-lait-cru", "sel-ajoute", "sucre-ajoute", "charcuterie", "jambon-blanc"].includes(id)) {
    sourceIds.add("ameli-repas-8-mois-3-ans")
  }
  if (["oeuf", "ble-farine", "amande", "noisette", "noix", "huile-de-noix", "fruits-de-mer-cuits"].includes(id)) {
    sourceIds.add("ameli-diversification")
  }

  return [...sourceIds]
}

function sourceNoteForFood(id: string, tags: string[]) {
  if (id === "miel") {
    return "Repère officiel : pas de miel avant 1 an, en raison du risque infectieux chez le nourrisson."
  }

  if (id === "fromage-au-lait-cru") {
    return "Repère officiel : éviter le lait cru et les fromages au lait cru chez les jeunes enfants, sauf exceptions à pâte pressée cuite."
  }

  if (id === "sel-ajoute") {
    return "Repère officiel : ne pas ajouter de sel dans les préparations et limiter les produits salés."
  }

  if (id === "sucre-ajoute") {
    return "Repère officiel : limiter les produits sucrés, qui ne sont pas nécessaires au début de l'alimentation."
  }

  if (id === "charcuterie" || id === "jambon-blanc") {
    return "Repère officiel : les charcuteries sont à éviter ou à garder exceptionnelles chez le jeune enfant."
  }

  if (tags.includes("allergène")) {
    return "Repère officiel : les allergènes majeurs peuvent être introduits sans retard une fois la diversification commencée, sauf avis médical particulier."
  }

  if (tags.includes("à éviter") || tags.includes("pas avant 3 ans") || tags.includes("pas avant 5 ans")) {
    return "Repère officiel : cet aliment demande une précaution particulière avant d'être proposé."
  }

  return undefined
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
  { name: "Courge butternut", emoji: "🎃", category: "Légumes", level: "conseillé" },
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
  { name: "Porridge", emoji: "🥣", category: "Féculents", level: "possible" },
  { name: "Pomme de terre", emoji: "🥔", category: "Féculents", level: "conseillé" },
  { name: "Quinoa", emoji: "🌾", category: "Féculents", level: "possible" },
  { name: "Riz blanc", emoji: "🍚", category: "Féculents", level: "possible" },
  { name: "Riz semi-complet", emoji: "🍚", category: "Féculents", level: "possible", minAgeMonths: 6 },
  { name: "Sarrasin", emoji: "🌾", category: "Féculents", level: "possible" },
  { name: "Semoule, boulgour", emoji: "🌾", category: "Féculents", level: "possible", tags: ["gluten"] },
  { name: "Tapioca", emoji: "🥣", category: "Féculents", level: "possible" },
]

const animalProteinSources: FoodSource[] = [
  { name: "Boeuf", emoji: "🥩", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Colin d’Alaska", emoji: "🐟", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Dinde", emoji: "🍗", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Veau", emoji: "🥩", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Viande blanche", emoji: "🍗", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Viande rouge", emoji: "🥩", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Poisson maigre", emoji: "🐟", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Poisson gras", emoji: "🐟", category: "Protéines", level: "possible", preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Oeuf", emoji: "🥚", category: "Protéines", level: "possible", tags: ["allergène"], preparation: "Oeuf dur mixé, puis 1/4 d’oeuf bien cuit, puis 1/3 d’oeuf bien cuit à 1 an." },
  { name: "Fruits de mer (cuits)", emoji: "🦐", category: "Protéines", level: "possible", tags: ["allergène"], preparation: "Très cuits et mixés, puis bien cuits et mixés ou hachés. Repère du tableau : 10 g par jour puis 20 g par jour à 1 an." },
  { name: "Jambon blanc", emoji: "🥓", category: "Protéines", level: "possible", minAgeMonths: 36, tags: ["charcuterie", "à éviter"], preparation: "Charcuteries : à éviter, sauf le jambon blanc ou exceptionnellement des charcuteries cuites." },
  { name: "Charcuterie", emoji: "🥓", category: "Protéines", level: "possible", minAgeMonths: 36, tags: ["pas avant 3 ans"], preparation: "Tableau détaillé : pas avant 3 ans. Tableau général : à éviter, sauf le jambon blanc ou exceptionnellement des charcuteries cuites." },
]

const fatSources: FoodSource[] = [
  { name: "Huile de colza", emoji: "🫒", category: "Matières grasses", level: "possible" },
  { name: "Huile de noix", emoji: "🫒", category: "Matières grasses", level: "possible", tags: ["allergène"] },
  { name: "Huile d’olive", emoji: "🫒", category: "Matières grasses", level: "possible" },
]

const miscellaneousSources: FoodSource[] = [
  { name: "Miel", emoji: "🍯", category: "Divers", level: "possible", minAgeMonths: 12 },
  { name: "Yaourt", emoji: "🥛", category: "Produits laitiers", level: "possible" },
  { name: "Brassé nature", emoji: "🥛", category: "Produits laitiers", level: "possible" },
  { name: "Fromage blanc", emoji: "🥛", category: "Produits laitiers", level: "possible" },
  { name: "Petit-suisse", emoji: "🥛", category: "Produits laitiers", level: "possible" },
  { name: "Fromage pasteurisé", emoji: "🧀", category: "Produits laitiers", level: "possible" },
  { name: "Fromage au lait cru", emoji: "🧀", category: "Produits laitiers", level: "possible", minAgeMonths: 60, tags: ["pas avant 5 ans"], preparation: "Le tableau indique : pas avant 5 ans." },
  { name: "Herbes et épices", emoji: "🌿", category: "Divers", level: "conseillé", minAgeMonths: 6 },
  { name: "Chocolat", emoji: "🍫", category: "Divers", level: "possible", minAgeMonths: 12 },
  { name: "Sel ajouté", emoji: "🧂", category: "Divers", level: "possible", minAgeMonths: 36, tags: ["à éviter"], preparation: "À éviter. Ne pas ajouter de sel dans les préparations, limiter les produits salés." },
  { name: "Sucre ajouté", emoji: "🍬", category: "Divers", level: "possible", minAgeMonths: 36, tags: ["à éviter"], preparation: "À éviter. Ne pas ajouter de sucre dans les préparations, limiter les produits sucrés." },
]

type SourceAge = {
  possibleAgeMonths?: number
  recommendedAgeMonths?: number
}

const possibleAt4RecommendedAt6 = [
  "artichaut",
  "avocat",
  "celeri-branche",
  "champignon",
  "patisson",
  "poivron",
  "radis",
  "salsifis",
  "tomate",
  "amande",
  "ananas",
  "cassis",
  "cerise",
  "chataigne",
  "figue",
  "fraise",
  "framboise",
  "fruit-de-la-passion",
  "grenade",
  "groseille",
  "kiwi",
  "litchi",
  "mure",
  "myrtille",
  "noisette",
  "noix",
  "rhubarbe",
  "avoine",
  "ble-farine",
  "yaourt",
  "brasse-nature",
  "fromage-blanc",
  "petit-suisse",
  "fromage-pasteurise",
]

const possibleAt4RecommendedAt9 = [
  "chou-blanc",
  "chou-de-bruxelles",
  "chou-rouge",
  "chou-vert",
  "chou-fleur",
  "chou-rave",
  "oignon",
  "polenta",
  "quinoa",
  "riz-blanc",
  "sarrasin",
  "semoule-boulgour",
  "tapioca",
]

const possibleAt4RecommendedAt12 = [
  "feves",
  "haricots-blancs",
  "haricots-rouges",
  "lentilles-corail",
  "lentilles-vertes",
  "pois-chiches",
]

const sourceAgeByFoodId: Record<string, SourceAge> = {
  ...Object.fromEntries(possibleAt4RecommendedAt6.map((id) => [id, { possibleAgeMonths: 4, recommendedAgeMonths: 6 }])),
  ...Object.fromEntries(possibleAt4RecommendedAt9.map((id) => [id, { possibleAgeMonths: 4, recommendedAgeMonths: 9 }])),
  ...Object.fromEntries(possibleAt4RecommendedAt12.map((id) => [id, { possibleAgeMonths: 4, recommendedAgeMonths: 12 }])),
  asperge: { possibleAgeMonths: 4, recommendedAgeMonths: 9 },
  datte: { possibleAgeMonths: 4, recommendedAgeMonths: 9 },
  pain: { possibleAgeMonths: 6, recommendedAgeMonths: 9 },
  pates: { possibleAgeMonths: 6, recommendedAgeMonths: 9 },
  "riz-semi-complet": { possibleAgeMonths: 6, recommendedAgeMonths: 9 },
  miel: { possibleAgeMonths: 12 },
  chocolat: { possibleAgeMonths: 12 },
  charcuterie: { possibleAgeMonths: 36 },
  "jambon-blanc": { possibleAgeMonths: 36 },
  "fromage-au-lait-cru": { possibleAgeMonths: 60 },
  "herbes-et-epices": { recommendedAgeMonths: 6 },
}

const mergedSources = [
  ...vegetableSources,
  ...fruitSources,
  ...starchSources,
  ...animalProteinSources,
  ...fatSources,
  ...miscellaneousSources,
]

export const foods: Food[] = mergedSources.map(makeFood)

export const categories: FoodCategory[] = [
  "Légumes",
  "Fruits",
  "Féculents",
  "Protéines",
  "Matières grasses",
  "Produits laitiers",
  "Divers",
]

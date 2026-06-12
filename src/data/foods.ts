import catalogCsv from "./FoodCatalog.csv?raw"

export type FoodCategory =
  | "Légumes"
  | "Fruits"
  | "Féculents"
  | "Protéines"
  | "Produits laitiers"
  | "Matières grasses"
  | "Allergènes"
  | "Autres"

export type RecommendationLevel = "conseillé" | "possible"

export type CautionLevel = "info" | "attention"

export type Food = {
  id: string
  name: string
  emoji: string
  category: FoodCategory
  sourceCategoryLabel: string
  minAgeMonths: number
  recommendedAgeInMonths: number
  recommendedAgeMonths: number
  possibleAgeMonths?: number
  possibleIntroductionMonths: number[]
  recommendedIntroductionMonths: number[]
  seasonMonths: number[]
  seasonText: string
  shortDescription: string
  preparation: string
  quantityNotes: string
  restrictionNotes: string
  isAllergen: boolean
  level: RecommendationLevel
  cautionLevel?: CautionLevel
  lastReviewedAt?: string
  sourceIds: string[]
  sourceNote?: string
  tags: string[]
}

type CatalogRow = {
  category?: string
  iconName?: string
  isAllergen?: string
  name?: string
  quantity4?: string
  quantity6?: string
  quantity9?: string
  quantity12?: string
  recommendedAgeInMonths?: string
  restriction?: string
  seasons?: string
  seasonText?: string
  shortDescription?: string
  sourceCategory?: string
  status4?: string
  status6?: string
  status9?: string
  status12?: string
}

const ageColumns: Array<[keyof CatalogRow, number]> = [
  ["status4", 4],
  ["status6", 6],
  ["status9", 9],
  ["status12", 12],
]

export const categories: FoodCategory[] = [
  "Légumes",
  "Fruits",
  "Féculents",
  "Protéines",
  "Produits laitiers",
  "Matières grasses",
  "Allergènes",
  "Autres",
]

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function catalogCategory(value: string | undefined): FoodCategory {
  switch (value) {
    case "vegetable":
      return "Légumes"
    case "fruit":
      return "Fruits"
    case "starch":
      return "Féculents"
    case "protein":
      return "Protéines"
    case "dairy":
      return "Produits laitiers"
    case "fat":
      return "Matières grasses"
    case "allergen":
      return "Allergènes"
    case "other":
    case "Divers":
      return "Autres"
    default:
      return "Autres"
  }
}

function parseCsv(content: string): CatalogRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const [headerLine, ...rows] = lines
  if (!headerLine) return []

  const headers = headerLine.split(";").map((header) => header.trim())

  return rows.map((line) => {
    const values = line.split(";").map((value) => value.trim())
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as CatalogRow
  })
}

function introductionMonths(row: CatalogRow, status: "possible" | "recommended") {
  return ageColumns.flatMap(([key, month]) => (row[key] === status ? [month] : []))
}

function parseMonths(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((month) => Number.parseInt(month.trim(), 10))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
}

function quantitySummary(row: CatalogRow) {
  return [
    ["4 mois", row.quantity4],
    ["6 mois", row.quantity6],
    ["9 mois", row.quantity9],
    ["12 mois", row.quantity12],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => `${label} : ${value}`)
    .join(" · ")
}

function sourceIdsForFood(food: Pick<Food, "id" | "isAllergen" | "minAgeMonths" | "restrictionNotes">) {
  const sourceIds = new Set<string>()
  const restriction = food.restrictionNotes.toLocaleLowerCase("fr")

  if (food.isAllergen) sourceIds.add("ameli-allergies")
  if (food.minAgeMonths >= 12 || restriction) sourceIds.add("ameli-repas-8-mois-3-ans")
  if (food.isAllergen || ["oeuf", "ble-farine", "huile-de-noix", "fruits-de-mer-cuits"].includes(food.id)) {
    sourceIds.add("ameli-diversification")
  }

  return [...sourceIds]
}

function sourceNoteForFood(food: Pick<Food, "id" | "isAllergen" | "restrictionNotes">) {
  if (food.id === "miel") {
    return "Repère officiel : pas de miel avant 1 an, en raison du risque infectieux chez le nourrisson."
  }

  if (food.id === "fromage-au-lait-cru") {
    return "Repère officiel : éviter le lait cru et les fromages au lait cru chez les jeunes enfants, sauf exceptions à pâte pressée cuite."
  }

  if (food.id === "sel-ajoute") {
    return "Repère officiel : ne pas ajouter de sel dans les préparations et limiter les produits salés."
  }

  if (food.id === "sucre-ajoute") {
    return "Repère officiel : limiter les produits sucrés, qui ne sont pas nécessaires au début de l'alimentation."
  }

  if (food.id === "charcuterie" || food.id === "jambon-blanc") {
    return "Repère officiel : les charcuteries sont à éviter ou à garder exceptionnelles chez le jeune enfant."
  }

  if (food.isAllergen) {
    return "Repère officiel : les allergènes majeurs peuvent être introduits sans retard une fois la diversification commencée, sauf avis médical particulier."
  }

  if (food.restrictionNotes) {
    return "Repère officiel : cet aliment demande une précaution particulière avant d'être proposé."
  }

  return undefined
}

function tagsForFood(food: Pick<Food, "isAllergen" | "level" | "restrictionNotes">) {
  const tags = [food.level === "conseillé" ? "introduction conseillée" : "introduction possible"]
  if (food.isAllergen) tags.push("allergène")
  if (food.restrictionNotes) tags.push("à éviter")
  return tags
}

function makeFood(row: CatalogRow): Food | null {
  const name = row.name?.trim()
  if (!name) return null

  const possibleIntroductionMonths = introductionMonths(row, "possible")
  const recommendedIntroductionMonths = introductionMonths(row, "recommended")
  const recommendedAgeInMonths =
    Number.parseInt(row.recommendedAgeInMonths ?? "", 10) ||
    Math.min(...recommendedIntroductionMonths, ...possibleIntroductionMonths) ||
    4
  const minAgeMonths = Math.min(
    recommendedAgeInMonths,
    ...(possibleIntroductionMonths.length ? possibleIntroductionMonths : [recommendedAgeInMonths]),
    ...(recommendedIntroductionMonths.length ? recommendedIntroductionMonths : [recommendedAgeInMonths]),
  )
  const isAllergen = row.isAllergen?.toLocaleLowerCase("fr") === "true"
  const level: RecommendationLevel =
    possibleIntroductionMonths.length > 0 && possibleIntroductionMonths[0] < recommendedAgeInMonths
      ? "possible"
      : "conseillé"
  const restrictionNotes = row.restriction ?? ""

  const draft = {
    id: slugify(name),
    isAllergen,
    level,
    minAgeMonths,
    restrictionNotes,
  }
  const sourceNote = sourceNoteForFood(draft)
  const tags = tagsForFood(draft)

  return {
    ...draft,
    name,
    emoji: row.iconName || "🌿",
    category: catalogCategory(row.category),
    sourceCategoryLabel: row.sourceCategory || catalogCategory(row.category),
    recommendedAgeInMonths,
    recommendedAgeMonths: recommendedAgeInMonths,
    possibleAgeMonths: possibleIntroductionMonths[0],
    possibleIntroductionMonths,
    recommendedIntroductionMonths,
    seasonMonths: parseMonths(row.seasons),
    seasonText: row.seasonText || "",
    shortDescription: row.shortDescription || "",
    preparation: row.shortDescription || "Introduire en respectant l'âge indiqué par les repères.",
    quantityNotes: quantitySummary(row),
    cautionLevel: sourceNote ? "attention" : undefined,
    lastReviewedAt: sourceNote ? "mai 2026" : undefined,
    sourceIds: sourceIdsForFood(draft),
    sourceNote,
    tags,
  }
}

export const foods: Food[] = parseCsv(catalogCsv)
  .map(makeFood)
  .filter((food): food is Food => Boolean(food))
  .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))

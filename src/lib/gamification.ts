import { categories, type Food } from "@/data/foods"
import { mealTimePresetFor } from "@/lib/formatting"
import type { FoodTest } from "@/lib/storage"

// Système de badges aligné sur l'app iOS (BadgeUnlockService.swift / ProgressView.swift).
// 4 catégories, repères doux qui avancent avec le carnet — rien à « réussir ».

export type BadgeCategory = "milestone" | "variety" | "story" | "rare"

export const badgeCategoryLabels: Record<BadgeCategory, string> = {
  milestone: "Grands jalons",
  variety: "Variété",
  story: "Histoire de bébé",
  rare: "Badges rares",
}

// Ordre stable des catégories pour le tri des badges débloqués (cf. tri iOS par rawValue).
export const badgeCategoryOrder: Record<BadgeCategory, number> = {
  milestone: 0,
  variety: 1,
  story: 2,
  rare: 3,
}

export type BadgeDefinition = {
  id: string
  title: string
  detail: string // texte état verrouillé
  unlockedDetail: string // texte état débloqué
  iconKey: string // mappé vers une icône Lucide dans la page
  iconLabel?: string // chiffre rendu à la place de l'icône ("5", "10")
  category: BadgeCategory
  target: number
  isRare?: boolean
}

export type DiscoveryBadge = BadgeDefinition & {
  progressCurrent: number
  progressTarget: number
  unlocked: boolean
  unlockedAt?: string
  fraction: number // min(current / target, 1)
  remaining: number // max(target - current, 0)
}

export type BadgeUnlockDates = Record<string, string>

export type GamificationContext = {
  foods: Food[]
  testedFoodIds: Set<string>
  testedFoods: Food[]
  testedCategories: Set<string>
  likedFoodIds: Set<string>
  mealMoments: Set<string>
  seasonalFoodIds: Set<string>
  foodColors: Set<string>
  hasObservation: boolean
  hasTextureNote: boolean
}

const badgeUnlockStorageKey = "diversibebs-badge-unlocks-v1"

// Définitions reprises de BadgeUnlockService.swift.
export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "first_food",
    title: "Premier aliment",
    detail: "Le carnet commence doucement.",
    unlockedDetail: "Un premier aliment est dans le carnet.",
    iconKey: "sparkles",
    category: "milestone",
    target: 1,
  },
  {
    id: "five_foods",
    title: "Petite ronde",
    detail: "Cinq aliments testés, à son rythme.",
    unlockedDetail: "Cinq aliments ont été testés.",
    iconKey: "number",
    iconLabel: "5",
    category: "milestone",
    target: 5,
  },
  {
    id: "ten_foods",
    title: "Dix saveurs",
    detail: "Un joli début de carnet.",
    unlockedDetail: "Dix aliments ont été testés.",
    iconKey: "number",
    iconLabel: "10",
    category: "milestone",
    target: 10,
  },
  {
    id: "half_catalog",
    title: "Demi-catalogue",
    detail: "La moitié des aliments ajoutée.",
    unlockedDetail: "La moitié du catalogue est découverte.",
    iconKey: "chart-pie",
    category: "milestone",
    target: 1,
  },
  {
    id: "three_categories",
    title: "Assiette variée",
    detail: "Trois familles d'aliments testées.",
    unlockedDetail: "Trois catégories sont représentées.",
    iconKey: "grid",
    category: "variety",
    target: 3,
  },
  {
    id: "first_fruit",
    title: "Premier fruit",
    detail: "Une première touche fruitée.",
    unlockedDetail: "Un fruit a été testé.",
    iconKey: "apple",
    category: "variety",
    target: 1,
  },
  {
    id: "three_vegetables",
    title: "Jardin doux",
    detail: "Trois légumes testés.",
    unlockedDetail: "Trois légumes sont dans le carnet.",
    iconKey: "leaf",
    category: "variety",
    target: 3,
  },
  {
    id: "first_allergen",
    title: "Allergène accompagné",
    detail: "Un allergène courant ajouté avec attention.",
    unlockedDetail: "Un allergène courant a été testé.",
    iconKey: "shield-alert",
    category: "variety",
    target: 1,
  },
  {
    id: "liked_three",
    title: "Petits favoris",
    detail: "Trois aliments aimés.",
    unlockedDetail: "Trois aliments ont été aimés.",
    iconKey: "heart",
    category: "story",
    target: 3,
  },
  {
    id: "reaction_noted",
    title: "Mémo utile",
    detail: "Une réaction ou une note renseignée.",
    unlockedDetail: "Une observation utile a été ajoutée.",
    iconKey: "note",
    category: "story",
    target: 1,
  },
  {
    id: "texture_note",
    title: "Texture repérée",
    detail: "Une texture ou quantité notée.",
    unlockedDetail: "Une texture est notée dans le carnet.",
    iconKey: "pen",
    category: "story",
    target: 1,
  },
  {
    id: "many_moments",
    title: "Moments de journée",
    detail: "Trois moments de repas utilisés.",
    unlockedDetail: "Plusieurs moments de journée sont représentés.",
    iconKey: "clock",
    category: "story",
    target: 3,
  },
  {
    id: "all_categories",
    title: "Tour complet",
    detail: "Toutes les familles ont au moins un aliment.",
    unlockedDetail: "Toutes les catégories sont présentes.",
    iconKey: "globe",
    category: "rare",
    target: categories.length,
    isRare: true,
  },
  {
    id: "rainbow_foods",
    title: "Arc-en-ciel",
    detail: "Cinq couleurs d'aliments différentes.",
    unlockedDetail: "Cinq couleurs sont dans le carnet.",
    iconKey: "palette",
    category: "rare",
    target: 5,
    isRare: true,
  },
  {
    id: "seasonal_variety",
    title: "Saison douce",
    detail: "Cinq aliments de saison testés.",
    unlockedDetail: "Cinq aliments de saison ont été testés.",
    iconKey: "sun",
    category: "rare",
    target: 5,
    isRare: true,
  },
  {
    id: "allergen_steps",
    title: "Repères allergènes",
    detail: "Trois allergènes courants suivis.",
    unlockedDetail: "Trois allergènes ont été ajoutés au carnet.",
    iconKey: "medical",
    category: "rare",
    target: 3,
    isRare: true,
  },
]

function isAllergen(food: Food) {
  return food.isAllergen || food.tags.includes("allergène")
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Portage de BadgeContext.colorFamily — mots-clés sur le nom de l'aliment, repli sur la catégorie.
function colorFamily(food: Food): string {
  const name = normalize(food.name)
  const has = (keywords: string[]) => keywords.some((keyword) => name.includes(keyword))

  if (has(["carotte", "patate douce", "courge"])) return "orange"
  if (has(["brocoli", "courgette", "lentilles", "olive", "colza"])) return "green"
  if (has(["pomme", "fraise"])) return "red"
  if (has(["banane", "semoule", "pomme de terre"])) return "yellow"
  if (has(["poire", "riz", "yaourt", "fromage", "poisson", "oeuf", "œuf"])) return "white"
  if (has(["amande", "poulet"])) return "brown"

  return food.category
}

const textureKeywords = [
  "texture",
  "lisse",
  "morceau",
  "morceaux",
  "puree",
  "quantite",
  "cuillere",
  "fondant",
  "cremeux",
]

function hasObservation(tests: FoodTest[]) {
  return tests.some((trial) => trial.reaction !== "Aucune" || trial.note.trim().length > 0)
}

function hasTextureNote(tests: FoodTest[]) {
  return tests.some((trial) => {
    const text = normalize(trial.note)
    return textureKeywords.some((keyword) => text.includes(keyword))
  })
}

export function createGamificationContext(foods: Food[], tests: FoodTest[]): GamificationContext {
  const testedFoodIds = new Set(tests.map((trial) => trial.foodId))
  const testedFoods = foods.filter((food) => testedFoodIds.has(food.id))
  const currentMonth = new Date().getMonth() + 1

  return {
    foods,
    testedFoodIds,
    testedFoods,
    testedCategories: new Set(testedFoods.map((food) => food.category)),
    likedFoodIds: new Set(tests.filter((trial) => trial.reaction === "Aime").map((trial) => trial.foodId)),
    mealMoments: new Set(tests.map((trial) => mealTimePresetFor(trial.mealTime))),
    seasonalFoodIds: new Set(
      testedFoods.filter((food) => food.seasonMonths.includes(currentMonth)).map((food) => food.id),
    ),
    foodColors: new Set(testedFoods.map(colorFamily)),
    hasObservation: hasObservation(tests),
    hasTextureNote: hasTextureNote(tests),
  }
}

// Portage de BadgeUnlockService.currentValue (switch sur l'id du badge).
function currentValue(badgeId: string, context: GamificationContext): number {
  switch (badgeId) {
    case "first_food":
    case "five_foods":
    case "ten_foods":
      return context.testedFoodIds.size
    case "half_catalog": {
      const target = Math.max(Math.ceil(context.foods.length * 0.5), 1)
      return context.testedFoodIds.size >= target ? 1 : 0
    }
    case "three_categories":
    case "all_categories":
      return context.testedCategories.size
    case "first_fruit":
      return context.testedFoods.some((food) => food.category === "Fruits") ? 1 : 0
    case "three_vegetables":
      return context.testedFoods.filter((food) => food.category === "Légumes").length
    case "first_allergen":
      return context.testedFoods.some(isAllergen) ? 1 : 0
    case "liked_three":
      return context.likedFoodIds.size
    case "reaction_noted":
      return context.hasObservation ? 1 : 0
    case "texture_note":
      return context.hasTextureNote ? 1 : 0
    case "many_moments":
      return context.mealMoments.size
    case "rainbow_foods":
      return context.foodColors.size
    case "seasonal_variety":
      return context.seasonalFoodIds.size
    case "allergen_steps":
      return context.testedFoods.filter(isAllergen).length
    default:
      return 0
  }
}

export function calculateBadges(
  foods: Food[],
  tests: FoodTest[],
  unlockDates: BadgeUnlockDates = {},
): DiscoveryBadge[] {
  const context = createGamificationContext(foods, tests)

  return badgeDefinitions.map((definition) => {
    const progressCurrent = Math.min(currentValue(definition.id, context), definition.target)
    const unlocked = progressCurrent >= definition.target

    return {
      ...definition,
      progressCurrent,
      progressTarget: definition.target,
      unlocked,
      unlockedAt: unlockDates[definition.id],
      fraction: definition.target === 0 ? 0 : Math.min(progressCurrent / definition.target, 1),
      remaining: Math.max(definition.target - progressCurrent, 0),
    }
  })
}

// Le repère le plus proche : non débloqué, non rare, trié par reste croissant puis progression décroissante.
export function nextBadge(badges: DiscoveryBadge[]): DiscoveryBadge | undefined {
  return badges
    .filter((badge) => !badge.unlocked && !badge.isRare)
    .sort((a, b) => (a.remaining !== b.remaining ? a.remaining - b.remaining : b.fraction - a.fraction))[0]
}

export function readBadgeUnlockDates(): BadgeUnlockDates {
  try {
    const stored = localStorage.getItem(badgeUnlockStorageKey)
    if (!stored) return {}

    const parsed = JSON.parse(stored) as BadgeUnlockDates
    if (!parsed || typeof parsed !== "object") return {}

    return parsed
  } catch {
    return {}
  }
}

export function writeBadgeUnlockDates(value: BadgeUnlockDates) {
  try {
    localStorage.setItem(badgeUnlockStorageKey, JSON.stringify(value))
  } catch {
    // Badge dates are nice-to-have metadata; badge state remains deterministic.
  }
}

export function progressPercent(current: number, target: number) {
  if (target <= 0) return 0
  return Math.round((Math.min(current, target) / target) * 100)
}

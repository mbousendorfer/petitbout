import type { Food } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"

export type BadgeCategory =
  | "first_steps"
  | "vegetables"
  | "fruits"
  | "textures"
  | "tracking"
  | "variety"
  | "seasonal"
  | "silly"

export type BadgeDefinition = {
  category: BadgeCategory
  description: string
  emoji: string
  id: string
  name: string
  target: number
  unlockCondition: string
  getProgress: (context: GamificationContext) => number
}

export type DiscoveryBadge = {
  category: BadgeCategory
  description: string
  emoji: string
  id: string
  name: string
  progressCurrent: number
  progressTarget: number
  unlocked: boolean
  unlockedAt?: string
  unlockCondition: string
}

export type Goal = {
  completed: boolean
  description: string
  id: string
  progressCurrent: number
  progressTarget: number
  title: string
}

export type GamificationProgress = {
  fruits: number
  notes: number
  reactions: number
  seasonalFoods: number
  testedFoods: number
  textures: number
  vegetables: number
}

export type BadgeUnlockDates = Record<string, string>

export type GamificationContext = {
  foodById: Map<string, Food>
  foods: Food[]
  latestTestsByFood: Map<string, FoodTest>
  noteFoodIds: Set<string>
  testedFoods: Food[]
  tests: FoodTest[]
}

export const badgeCategoryLabels: Record<BadgeCategory, string> = {
  first_steps: "Premiers pas",
  vegetables: "Potager",
  fruits: "Compotes",
  textures: "Textures",
  tracking: "Carnet",
  variety: "Variété",
  seasonal: "Saisons",
  silly: "Sourires",
}

const badgeUnlockStorageKey = "diversibebs-badge-unlocks-v1"

const greenVegetableIds = new Set([
  "asperge",
  "blette",
  "brocoli",
  "chou-blanc",
  "chou-de-bruxelles",
  "chou-fleur",
  "chou-rave",
  "chou-rouge",
  "chou-vert",
  "concombre",
  "courgette",
  "endive",
  "epinards",
  "fenouil",
  "haricots-verts",
  "poireau",
  "salade",
])

const squashIds = new Set(["citrouille", "courge-butternut", "patisson", "potimarron", "potiron"])
const redFruitIds = new Set(["cerise", "fraise", "framboise", "groseille", "mure", "myrtille"])
const orangeFoodIds = new Set(["abricot", "carotte", "courge-butternut", "patate-douce", "peche", "potimarron", "potiron"])

const springMonths = new Set([3, 4, 5])
const summerMonths = new Set([6, 7, 8])
const autumnMonths = new Set([9, 10, 11])
const winterMonths = new Set([12, 1, 2])

function cap(value: number, target: number) {
  return Math.min(value, target)
}

function countFoods(context: GamificationContext, predicate: (food: Food) => boolean) {
  return context.testedFoods.filter(predicate).length
}

function hasFood(context: GamificationContext, foodId: string) {
  return context.latestTestsByFood.has(foodId)
}

function notesCount(context: GamificationContext) {
  return context.tests.filter((test) => test.note.trim().length > 0).length
}

function reactionCount(context: GamificationContext) {
  return negativeReactionCount(context)
}

function negativeReactionCount(context: GamificationContext) {
  return context.tests.filter((test) => test.reaction && test.reaction !== "aucune réaction").length
}

function seasonalFoodCount(context: GamificationContext) {
  return countFoods(context, (food) => food.seasonMonths.length < 12)
}

function seasonalFoodCountForMonths(context: GamificationContext, months: Set<number>) {
  return countFoods(context, (food) => food.seasonMonths.some((month) => months.has(month)))
}

function textureStages(context: GamificationContext) {
  const stages = new Set<string>()

  context.testedFoods.forEach((food) => {
    const preparation = food.preparation.toLowerCase()
    if (preparation.includes("mix") || preparation.includes("purée")) stages.add("lisse")
    if (preparation.includes("écras") || preparation.includes("moulin")) stages.add("écrasé")
    if (preparation.includes("morceaux") || preparation.includes("fondants")) stages.add("morceaux")
    if (preparation.includes("hach")) stages.add("haché")
  })

  return stages
}

function colorForFood(food: Food) {
  const value = `${food.id} ${food.name} ${food.emoji}`.toLowerCase()

  if (/[🥬🥦🥒🌿🌱🫛]/u.test(value) || greenVegetableIds.has(food.id)) return "vert"
  if (/[🥕🎃🍠🍑🍊]/u.test(value) || orangeFoodIds.has(food.id)) return "orange"
  if (/[🍎🍓🍅🍒]/u.test(value) || redFruitIds.has(food.id)) return "rouge"
  if (/[🍌🌽🍋]/u.test(value)) return "jaune"
  if (/[🍆🟣🫐]/u.test(value)) return "violet"
  if (/[🥔🍐🧅]/u.test(value)) return "blanc"
  if (/[🌰🍄]/u.test(value)) return "brun"

  return "doux"
}

function testedColors(context: GamificationContext) {
  return new Set(context.testedFoods.map(colorForFood))
}

function testedCategories(context: GamificationContext) {
  return new Set(context.testedFoods.map((food) => food.category))
}

function pureeStyleCount(context: GamificationContext) {
  return countFoods(context, (food) => {
    const preparation = food.preparation.toLowerCase()
    return preparation.includes("purée") || preparation.includes("mix")
  })
}

export function createGamificationContext(foods: Food[], tests: FoodTest[]): GamificationContext {
  const foodById = new Map(foods.map((food) => [food.id, food]))
  const latestTestsByFood = new Map<string, FoodTest>()

  tests.forEach((test) => {
    const existing = latestTestsByFood.get(test.foodId)
    if (!existing || test.date > existing.date) latestTestsByFood.set(test.foodId, test)
  })

  const testedFoods = [...latestTestsByFood.keys()]
    .map((foodId) => foodById.get(foodId))
    .filter((food): food is Food => Boolean(food))

  const noteFoodIds = new Set(
    tests.filter((test) => test.note.trim().length > 0).map((test) => test.foodId),
  )

  return { foodById, foods, latestTestsByFood, noteFoodIds, testedFoods, tests }
}

export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: "first-spoon",
    name: "Première cuillère",
    emoji: "🥄",
    description: "La toute première page du carnet est ouverte.",
    category: "first_steps",
    target: 1,
    unlockCondition: "Tester 1 aliment",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "little-taster",
    name: "Petit goûteur",
    emoji: "👶",
    description: "Trois saveurs ont déjà rejoint l’aventure.",
    category: "first_steps",
    target: 3,
    unlockCondition: "Tester 3 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "a-table",
    name: "À table !",
    emoji: "🍽️",
    description: "Le rituel des découvertes prend doucement forme.",
    category: "first_steps",
    target: 5,
    unlockCondition: "Tester 5 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "first-note",
    name: "Début du carnet",
    emoji: "📖",
    description: "Une première petite observation est gardée au chaud.",
    category: "first_steps",
    target: 1,
    unlockCondition: "Ajouter une première note",
    getProgress: notesCount,
  },
  {
    id: "reaction-face",
    name: "Quelle tête !",
    emoji: "😮",
    description: "Une réaction est entrée dans le journal.",
    category: "first_steps",
    target: 1,
    unlockCondition: "Enregistrer une réaction",
    getProgress: reactionCount,
  },
  {
    id: "puree-explorer",
    name: "Explorateur des purées",
    emoji: "🥕",
    description: "Le potager commence à être bien exploré.",
    category: "vegetables",
    target: 5,
    unlockCondition: "Tester 5 légumes",
    getProgress: (context) => countFoods(context, (food) => food.category === "Légumes"),
  },
  {
    id: "green-brigade",
    name: "Brigade verte",
    emoji: "🥦",
    description: "Une petite collection toute verte se dessine.",
    category: "vegetables",
    target: 3,
    unlockCondition: "Tester 3 légumes verts",
    getProgress: (context) => countFoods(context, (food) => greenVegetableIds.has(food.id)),
  },
  {
    id: "squash-master",
    name: "Maître des courges",
    emoji: "🎃",
    description: "Les courges ont trouvé leur place dans l’album.",
    category: "vegetables",
    target: 3,
    unlockCondition: "Tester 3 courges",
    getProgress: (context) => countFoods(context, (food) => squashIds.has(food.id)),
  },
  {
    id: "team-potato",
    name: "Team patate",
    emoji: "🥔",
    description: "Patate ou patate douce, la base réconfort est là.",
    category: "vegetables",
    target: 1,
    unlockCondition: "Tester la pomme de terre ou la patate douce",
    getProgress: (context) => (hasFood(context, "pomme-de-terre") || hasFood(context, "patate-douce") ? 1 : 0),
  },
  {
    id: "legendary-pea",
    name: "Petit pois légendaire",
    emoji: "🫛",
    description: "Un classique minuscule, une grande découverte.",
    category: "vegetables",
    target: 1,
    unlockCondition: "Tester les petits pois",
    getProgress: (context) => (hasFood(context, "petits-pois") ? 1 : 0),
  },
  {
    id: "garden-adventurer",
    name: "Aventurier du potager",
    emoji: "🌱",
    description: "Le potager du carnet devient franchement vivant.",
    category: "vegetables",
    target: 10,
    unlockCondition: "Tester 10 légumes",
    getProgress: (context) => countFoods(context, (food) => food.category === "Légumes"),
  },
  {
    id: "compote-cruncher",
    name: "Croqueur de compotes",
    emoji: "🍎",
    description: "Les fruits installent leurs couleurs dans le carnet.",
    category: "fruits",
    target: 5,
    unlockCondition: "Tester 5 fruits",
    getProgress: (context) => countFoods(context, (food) => food.category === "Fruits"),
  },
  {
    id: "banana-unlocked",
    name: "Banane débloquée",
    emoji: "🍌",
    description: "La banane entre officiellement dans l’aventure.",
    category: "fruits",
    target: 1,
    unlockCondition: "Tester la banane",
    getProgress: (context) => (hasFood(context, "banane") ? 1 : 0),
  },
  {
    id: "fruit-collection",
    name: "Collection fruitée",
    emoji: "🍐",
    description: "Un joli panier de fruits se remplit doucement.",
    category: "fruits",
    target: 10,
    unlockCondition: "Tester 10 fruits",
    getProgress: (context) => countFoods(context, (food) => food.category === "Fruits"),
  },
  {
    id: "red-fruits",
    name: "Brigade vitaminée",
    emoji: "🍓",
    description: "Trois fruits rouges ont rejoint les stickers.",
    category: "fruits",
    target: 3,
    unlockCondition: "Tester 3 fruits rouges",
    getProgress: (context) => countFoods(context, (food) => redFruitIds.has(food.id)),
  },
  {
    id: "smooth-master",
    name: "Maître du lisse",
    emoji: "☁️",
    description: "Les textures toutes douces sont bien lancées.",
    category: "textures",
    target: 5,
    unlockCondition: "Tester 5 aliments en purée lisse",
    getProgress: pureeStyleCount,
  },
  {
    id: "puree-pro",
    name: "Purée pro",
    emoji: "🥣",
    description: "Encore une cuillère dans l’aventure.",
    category: "textures",
    target: 10,
    unlockCondition: "Tester 10 aliments façon purée",
    getProgress: pureeStyleCount,
  },
  {
    id: "texture-explorer",
    name: "Explorateur de textures",
    emoji: "🧩",
    description: "Le carnet commence à raconter des sensations différentes.",
    category: "textures",
    target: 3,
    unlockCondition: "Explorer 3 familles de textures",
    getProgress: (context) => textureStages(context).size,
  },
  {
    id: "future-chewer",
    name: "Futur mâchouilleur",
    emoji: "🦷",
    description: "Les textures plus épaisses pointent le bout du nez.",
    category: "textures",
    target: 1,
    unlockCondition: "Tester une texture écrasée ou avec morceaux fondants",
    getProgress: (context) => (textureStages(context).has("écrasé") || textureStages(context).has("morceaux") ? 1 : 0),
  },
  {
    id: "observing-parent",
    name: "Parent observateur",
    emoji: "📝",
    description: "Les petites notes rendent le carnet plus vivant.",
    category: "tracking",
    target: 5,
    unlockCondition: "Ajouter 5 notes",
    getProgress: notesCount,
  },
  {
    id: "reaction-detective",
    name: "Détective des réactions",
    emoji: "🔍",
    description: "Le suivi reste calme, précis, et utile.",
    category: "tracking",
    target: 5,
    unlockCondition: "Enregistrer 5 réactions",
    getProgress: reactionCount,
  },
  {
    id: "full-notebook",
    name: "Carnet bien rempli",
    emoji: "📔",
    description: "Les souvenirs de dégustation prennent de la place.",
    category: "tracking",
    target: 20,
    unlockCondition: "Ajouter 20 notes",
    getProgress: notesCount,
  },
  {
    id: "tasting-notes",
    name: "Notes de dégustation",
    emoji: "💬",
    description: "Dix aliments ont maintenant leur petit commentaire.",
    category: "tracking",
    target: 10,
    unlockCondition: "Ajouter une note à 10 aliments différents",
    getProgress: (context) => context.noteFoodIds.size,
  },
  {
    id: "rainbow-eater",
    name: "Mangeur arc-en-ciel",
    emoji: "🌈",
    description: "Les couleurs commencent à composer une assiette joyeuse.",
    category: "variety",
    target: 5,
    unlockCondition: "Tester des aliments de 5 couleurs",
    getProgress: (context) => testedColors(context).size,
  },
  {
    id: "market-tour",
    name: "Tour du marché",
    emoji: "🗺️",
    description: "Plusieurs rayons du marché sont déjà visités.",
    category: "variety",
    target: 5,
    unlockCondition: "Tester 5 catégories d’aliments",
    getProgress: (context) => testedCategories(context).size,
  },
  {
    id: "culinary-adventurer",
    name: "Aventurier culinaire",
    emoji: "🎒",
    description: "Le carnet d’exploration se remplit joliment.",
    category: "variety",
    target: 25,
    unlockCondition: "Tester 25 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "mini-explorer",
    name: "Mini explorateur",
    emoji: "🚀",
    description: "Cinquante découvertes, ça fait un bel album.",
    category: "variety",
    target: 50,
    unlockCondition: "Tester 50 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "spring-gourmand",
    name: "Printemps gourmand",
    emoji: "🌸",
    description: "Trois saveurs de printemps sont dans le carnet.",
    category: "seasonal",
    target: 3,
    unlockCondition: "Tester 3 aliments de saison printanière",
    getProgress: (context) => seasonalFoodCountForMonths(context, springMonths),
  },
  {
    id: "summer-eater",
    name: "Petit mangeur d’été",
    emoji: "☀️",
    description: "Les beaux jours apportent leurs découvertes.",
    category: "seasonal",
    target: 3,
    unlockCondition: "Tester 3 aliments de saison estivale",
    getProgress: (context) => seasonalFoodCountForMonths(context, summerMonths),
  },
  {
    id: "autumn-flavors",
    name: "Saveurs d’automne",
    emoji: "🍂",
    description: "L’automne a laissé quelques trésors dans l’album.",
    category: "seasonal",
    target: 3,
    unlockCondition: "Tester 3 aliments de saison automnale",
    getProgress: (context) => seasonalFoodCountForMonths(context, autumnMonths),
  },
  {
    id: "winter-vitamins",
    name: "Hiver vitaminé",
    emoji: "❄️",
    description: "Même l’hiver a ses petites découvertes.",
    category: "seasonal",
    target: 3,
    unlockCondition: "Tester 3 aliments de saison hivernale",
    getProgress: (context) => seasonalFoodCountForMonths(context, winterMonths),
  },
  {
    id: "market-harvest",
    name: "Récolte du marché",
    emoji: "🧺",
    description: "Dix aliments de saison, comme un panier bien choisi.",
    category: "seasonal",
    target: 10,
    unlockCondition: "Tester 10 aliments de saison",
    getProgress: seasonalFoodCount,
  },
  {
    id: "broccoli-brave",
    name: "Affronteur de brocoli",
    emoji: "🥦",
    description: "Le brocoli a eu droit à son moment de gloire.",
    category: "silly",
    target: 1,
    unlockCondition: "Tester le brocoli",
    getProgress: (context) => (hasFood(context, "brocoli") ? 1 : 0),
  },
  {
    id: "legendary-grimace",
    name: "Grimace légendaire",
    emoji: "😬",
    description: "Une réaction incertaine, une anecdote pour le carnet.",
    category: "silly",
    target: 1,
    unlockCondition: "Enregistrer une réaction autre que “aucune réaction”",
    getProgress: negativeReactionCount,
  },
  {
    id: "bib-puree",
    name: "Purée sur le bavoir",
    emoji: "🫠",
    description: "Dix découvertes, et sûrement quelques traces autour.",
    category: "silly",
    target: 10,
    unlockCondition: "Tester 10 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "compote-boom",
    name: "Explosion de compote",
    emoji: "💥",
    description: "Les fruits font leur petit feu d’artifice.",
    category: "silly",
    target: 5,
    unlockCondition: "Tester 5 fruits",
    getProgress: (context) => countFoods(context, (food) => food.category === "Fruits"),
  },
  {
    id: "high-chair",
    name: "Haute-chaise champion",
    emoji: "🪑",
    description: "Quinze aliments ont fait leur passage à table.",
    category: "silly",
    target: 15,
    unlockCondition: "Tester 15 aliments",
    getProgress: (context) => context.testedFoods.length,
  },
  {
    id: "mystery-puree",
    name: "Objet non identifié dans la purée",
    emoji: "🛸",
    description: "Une note longue, parfaite pour les archives familiales.",
    category: "silly",
    target: 1,
    unlockCondition: "Ajouter une note de plus de 100 caractères",
    getProgress: (context) => (context.tests.some((test) => test.note.trim().length > 100) ? 1 : 0),
  },
]

export function calculateBadges(
  foods: Food[],
  tests: FoodTest[],
  unlockDates: BadgeUnlockDates = {},
): DiscoveryBadge[] {
  const context = createGamificationContext(foods, tests)

  return badgeDefinitions.map((badge) => {
    const progressCurrent = cap(badge.getProgress(context), badge.target)
    const unlocked = progressCurrent >= badge.target

    return {
      category: badge.category,
      description: badge.description,
      emoji: badge.emoji,
      id: badge.id,
      name: badge.name,
      progressCurrent,
      progressTarget: badge.target,
      unlocked,
      unlockedAt: unlockDates[badge.id],
      unlockCondition: badge.unlockCondition,
    }
  })
}

export function calculateProgress(foods: Food[], tests: FoodTest[]): GamificationProgress {
  const context = createGamificationContext(foods, tests)

  return {
    fruits: countFoods(context, (food) => food.category === "Fruits"),
    notes: notesCount(context),
    reactions: reactionCount(context),
    seasonalFoods: seasonalFoodCount(context),
    testedFoods: context.testedFoods.length,
    textures: textureStages(context).size,
    vegetables: countFoods(context, (food) => food.category === "Légumes"),
  }
}

export function calculateGoals(foods: Food[], tests: FoodTest[]): Goal[] {
  const context = createGamificationContext(foods, tests)
  const goals: Array<Omit<Goal, "completed">> = [
    {
      id: "green-veggies-3",
      title: "Mini jardin vert",
      description: "Découvrir 3 légumes verts, juste pour voir pousser la collection.",
      progressCurrent: countFoods(context, (food) => greenVegetableIds.has(food.id)),
      progressTarget: 3,
    },
    {
      id: "fruits-5",
      title: "Panier de compotes",
      description: "Tester 5 fruits pour remplir un petit panier coloré.",
      progressCurrent: countFoods(context, (food) => food.category === "Fruits"),
      progressTarget: 5,
    },
    {
      id: "notes-5",
      title: "Carnet curieux",
      description: "Ajouter des notes à 5 dégustations qui méritent un souvenir.",
      progressCurrent: notesCount(context),
      progressTarget: 5,
    },
    {
      id: "seasonal-3",
      title: "Petit tour au marché",
      description: "Tester 3 aliments de saison, comme une promenade gourmande.",
      progressCurrent: seasonalFoodCount(context),
      progressTarget: 3,
    },
    {
      id: "orange-collection",
      title: "Collection orange",
      description: "Compléter 5 aliments orange pour une page très ensoleillée.",
      progressCurrent: countFoods(context, (food) => orangeFoodIds.has(food.id)),
      progressTarget: 5,
    },
    {
      id: "foods-10",
      title: "Dix petites découvertes",
      description: "Réunir 10 aliments différents dans le carnet.",
      progressCurrent: context.testedFoods.length,
      progressTarget: 10,
    },
    {
      id: "reactions-10",
      title: "Observations tranquilles",
      description: "Garder 10 réactions dans le journal, sans pression.",
      progressCurrent: reactionCount(context),
      progressTarget: 10,
    },
  ]

  return goals.map((goal) => ({
    ...goal,
    progressCurrent: cap(goal.progressCurrent, goal.progressTarget),
    completed: goal.progressCurrent >= goal.progressTarget,
  }))
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
  return Math.round((cap(current, target) / target) * 100)
}

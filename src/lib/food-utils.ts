import type { Food, FoodCategory } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"

export function currentMonth() {
  return new Date().getMonth() + 1
}

export function isInSeason(food: Food, month = currentMonth()) {
  return food.seasonMonths.includes(month)
}

export function isAgeReady(food: Food, ageMonths: number) {
  return food.minAgeMonths <= ageMonths
}

export function ageSummary(food: Food) {
  if (
    food.possibleAgeMonths &&
    food.recommendedAgeMonths &&
    food.possibleAgeMonths !== food.recommendedAgeMonths
  ) {
    return `possible dès ${food.possibleAgeMonths} mois · conseillé dès ${food.recommendedAgeMonths} mois`
  }

  if (food.recommendedAgeMonths) return `conseillé dès ${food.recommendedAgeMonths} mois`
  if (food.possibleAgeMonths) return `possible dès ${food.possibleAgeMonths} mois`
  return `dès ${food.minAgeMonths} mois`
}

export function getStatus(foodId: string, latestByFood: Map<string, FoodTest>) {
  const latest = latestByFood.get(foodId)
  if (!latest) return "non testé"
  if (latest.reaction === "aucune réaction") return "testé"
  return "réaction"
}

export function monthNames(months: number[]) {
  if (months.length === 12) return "Toute l'année"
  const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" })
  return months
    .map((month) => formatter.format(new Date(2024, month - 1, 1)).replace(".", ""))
    .join(", ")
}

export function weeklySuggestions(
  foods: Food[],
  ageMonths: number,
  testedFoodIds: Set<string>,
  month = currentMonth(),
) {
  const categoryCounts = new Map<FoodCategory, number>()
  const ranked = foods
    .filter((food) => isAgeReady(food, ageMonths))
    .filter((food) => !food.tags.includes("à éviter") && !food.tags.includes("pas avant 3 ans"))
    .filter((food) => !testedFoodIds.has(food.id))
    .sort((a, b) => {
      const score = (food: Food) =>
        (food.level === "conseillé" ? 30 : 0) +
        (isInSeason(food, month) ? 20 : 0)

      return score(b) - score(a) || a.category.localeCompare(b.category, "fr") || a.name.localeCompare(b.name, "fr")
    })

  const selected: Food[] = []

  ranked.forEach((food) => {
    if (selected.length >= 5) return
    if ((categoryCounts.get(food.category) ?? 0) >= 2) return
    selected.push(food)
    categoryCounts.set(food.category, (categoryCounts.get(food.category) ?? 0) + 1)
  })

  ranked.forEach((food) => {
    if (selected.length >= 5) return
    if (!selected.includes(food)) selected.push(food)
  })

  return selected
}

export function suggestionReasons(food: Food, month = currentMonth()) {
  const reasons = [ageSummary(food), "non encore testé"]
  if (food.level === "conseillé") reasons.push("aliment conseillé")
  if (isInSeason(food, month)) reasons.push("de saison")
  if (food.tags[0]) reasons.push(food.tags[0])
  return reasons
}

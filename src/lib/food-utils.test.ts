import { describe, expect, it } from "vitest"

import type { Food } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"
import {
  ageSummary,
  applyFoodFilters,
  countWithFilterChange,
  getStatus,
  hasActiveFoodFilters,
  initialFoodFilters,
  isAgeReady,
  isInSeason,
  weeklySuggestions,
  type FoodFilters,
} from "@/lib/food-utils"

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: "carotte",
    name: "Carotte",
    emoji: "🥕",
    category: "Légumes",
    sourceCategoryLabel: "Légumes",
    minAgeMonths: 4,
    possibleAgeMonths: 4,
    possibleIntroductionMonths: [4],
    recommendedAgeInMonths: 6,
    recommendedAgeMonths: 6,
    recommendedIntroductionMonths: [6],
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    seasonText: "toute l'année",
    shortDescription: "Douce et lisse.",
    preparation: "Cuite et écrasée.",
    quantityNotes: "",
    restrictionNotes: "",
    isAllergen: false,
    level: "conseillé",
    sourceIds: [],
    tags: [],
    ...overrides,
  }
}

function makeFilters(overrides: Partial<FoodFilters> = {}): FoodFilters {
  return { ...initialFoodFilters, ...overrides }
}

describe("isAgeReady", () => {
  it("returns true when baby is older than recommendedAgeInMonths", () => {
    expect(isAgeReady(makeFood({ recommendedAgeInMonths: 4, recommendedAgeMonths: 4 }), 6)).toBe(true)
  })

  it("returns false when baby is younger than recommendedAgeInMonths", () => {
    expect(isAgeReady(makeFood({ recommendedAgeInMonths: 8, recommendedAgeMonths: 8 }), 6)).toBe(false)
  })

  it("returns true at the boundary", () => {
    expect(isAgeReady(makeFood({ recommendedAgeInMonths: 6, recommendedAgeMonths: 6 }), 6)).toBe(true)
  })
})

describe("ageSummary", () => {
  it("describes both possible and recommended when they differ", () => {
    const food = makeFood({
      possibleAgeMonths: 4,
      possibleIntroductionMonths: [4],
      recommendedAgeInMonths: 8,
      recommendedAgeMonths: 8,
      recommendedIntroductionMonths: [8],
    })
    expect(ageSummary(food)).toBe("possible dès 4 mois · conseillé dès 8 mois")
  })

  it("uses recommended-only phrasing when only that is set", () => {
    const food = makeFood({
      possibleAgeMonths: undefined,
      possibleIntroductionMonths: [],
      recommendedAgeInMonths: 8,
      recommendedAgeMonths: 8,
      recommendedIntroductionMonths: [8],
    })
    expect(ageSummary(food)).toBe("conseillé dès 8 mois")
  })

  it("falls back to minAgeMonths when no detail is provided", () => {
    const food = makeFood({
      minAgeMonths: 12,
      possibleAgeMonths: undefined,
      possibleIntroductionMonths: [],
      recommendedAgeInMonths: 0,
      recommendedAgeMonths: undefined,
      recommendedIntroductionMonths: [],
    })
    expect(ageSummary(food)).toBe("dès 12 mois")
  })
})

describe("getStatus", () => {
  const carotte = makeFood({ id: "carotte" })

  function test(reaction: FoodTest["reaction"]): FoodTest {
    return {
      id: "t1",
      foodId: "carotte",
      date: "2026-05-01",
      mealTime: "midi",
      reaction,
      note: "",
    }
  }

  it("returns 'non testé' when no test exists", () => {
    expect(getStatus(carotte.id, new Map())).toBe("non testé")
  })

  it("returns 'testé' when latest reaction is 'aucune réaction'", () => {
    const map = new Map<string, FoodTest>([[carotte.id, test("Aucune")]])
    expect(getStatus(carotte.id, map)).toBe("testé")
  })

  it("returns 'réaction' when latest reaction is anything else", () => {
    const map = new Map<string, FoodTest>([[carotte.id, test("Allergie")]])
    expect(getStatus(carotte.id, map)).toBe("réaction")
  })
})

describe("isInSeason", () => {
  it("returns true when the month is in seasonMonths", () => {
    const food = makeFood({ seasonMonths: [3, 4, 5] })
    expect(isInSeason(food, 4)).toBe(true)
  })

  it("returns false when the month is not in seasonMonths", () => {
    const food = makeFood({ seasonMonths: [3, 4, 5] })
    expect(isInSeason(food, 12)).toBe(false)
  })
})

describe("weeklySuggestions", () => {
  const month = 6

  it("filters out foods the baby is too young for", () => {
    const tooOld = makeFood({ id: "noix", recommendedAgeInMonths: 12, recommendedAgeMonths: 12, name: "Noix" })
    const result = weeklySuggestions([tooOld], 6, new Set(), month)
    expect(result).toEqual([])
  })

  it("filters out tested foods", () => {
    const a = makeFood({ id: "a", name: "A" })
    const b = makeFood({ id: "b", name: "B" })
    const result = weeklySuggestions([a, b], 6, new Set(["a"]), month)
    expect(result.map((food) => food.id)).toEqual(["b"])
  })

  it("does not drop restricted foods when iOS age rules make them eligible", () => {
    const avoided = makeFood({ id: "sel", name: "Sel", tags: ["à éviter"] })
    const late = makeFood({ id: "noix", name: "Noix", tags: ["pas avant 3 ans"] })
    const ok = makeFood({ id: "carotte", name: "Carotte" })
    const result = weeklySuggestions([avoided, late, ok], 12, new Set(), month)
    expect(result.map((food) => food.id)).toEqual(["carotte", "noix", "sel"])
  })

  it("returns at most 6 suggestions", () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      makeFood({ id: `food-${index}`, name: `Food ${index}`, category: index % 2 === 0 ? "Légumes" : "Fruits" }),
    )
    const result = weeklySuggestions(items, 6, new Set(), month)
    expect(result).toHaveLength(6)
  })

  it("prefers in-season foods first", () => {
    const inSeason = makeFood({ id: "saison", name: "Saison", seasonMonths: [month] })
    const outOfSeason = makeFood({ id: "hors-saison", name: "Hors saison", seasonMonths: [1] })
    const result = weeklySuggestions([outOfSeason, inSeason], 6, new Set(), month)
    expect(result.map((food) => food.id)).toEqual(["saison", "hors-saison"])
  })

  it("prefers categories not yet tested after season", () => {
    const vegetable = makeFood({ id: "legume", name: "Légume", category: "Légumes" })
    const fruit = makeFood({ id: "fruit", name: "Fruit", category: "Fruits" })
    const testedVegetable = makeFood({ id: "tested", name: "Testé", category: "Légumes" })
    const result = weeklySuggestions([vegetable, fruit, testedVegetable], 6, new Set(["tested"]), month)
    expect(result.map((food) => food.id)).toEqual(["fruit", "legume"])
  })

  it("uses recommended age as final ranking tie-breaker", () => {
    const younger = makeFood({ id: "young", name: "Young", recommendedAgeInMonths: 4, recommendedAgeMonths: 4 })
    const older = makeFood({ id: "old", name: "Old", recommendedAgeInMonths: 6, recommendedAgeMonths: 6 })
    const result = weeklySuggestions([older, younger], 6, new Set(), month)
    expect(result.map((food) => food.id)).toEqual(["young", "old"])
  })
})

describe("applyFoodFilters", () => {
  function context(latestByFood: Map<string, FoodTest> = new Map()) {
    return { latestByFood }
  }

  function test(foodId: string, reaction: FoodTest["reaction"] = "Aucune"): FoodTest {
    return {
      id: `t-${foodId}`,
      foodId,
      date: "2026-05-01",
      mealTime: "midi",
      reaction,
      note: "",
    }
  }

  it("returns all foods when no filter is active, alphabetically", () => {
    const banane = makeFood({ id: "banane", name: "Banane" })
    const carotte = makeFood({ id: "carotte", name: "Carotte" })
    const result = applyFoodFilters([carotte, banane], makeFilters(), context())
    expect(result.map((food) => food.id)).toEqual(["banane", "carotte"])
  })

  it("filters by category", () => {
    const carotte = makeFood({ id: "carotte", category: "Légumes" })
    const banane = makeFood({ id: "banane", category: "Fruits" })
    const result = applyFoodFilters([carotte, banane], makeFilters({ category: "Fruits" }), context())
    expect(result.map((food) => food.id)).toEqual(["banane"])
  })

  it("filters by status 'non-testes'", () => {
    const carotte = makeFood({ id: "carotte" })
    const banane = makeFood({ id: "banane" })
    const latestByFood = new Map([["carotte", test("carotte")]])
    const result = applyFoodFilters(
      [carotte, banane],
      makeFilters({ status: "non-testes" }),
      context(latestByFood),
    )
    expect(result.map((food) => food.id)).toEqual(["banane"])
  })

  it("filters by status 'reaction'", () => {
    const carotte = makeFood({ id: "carotte" })
    const banane = makeFood({ id: "banane" })
    const latestByFood = new Map([
      ["carotte", test("carotte", "Allergie")],
      ["banane", test("banane")],
    ])
    const result = applyFoodFilters(
      [carotte, banane],
      makeFilters({ status: "reaction" }),
      context(latestByFood),
    )
    expect(result.map((food) => food.id)).toEqual(["carotte"])
  })

  it("filters by seasonOnly + category combined (AND semantics)", () => {
    const carotteSaison = makeFood({ id: "carotte", category: "Légumes", seasonMonths: [new Date().getMonth() + 1] })
    const courgette = makeFood({ id: "courgette", category: "Légumes", seasonMonths: [] })
    const banane = makeFood({ id: "banane", category: "Fruits", seasonMonths: [new Date().getMonth() + 1] })
    const result = applyFoodFilters(
      [carotteSaison, courgette, banane],
      makeFilters({ seasonOnly: true, category: "Légumes" }),
      context(),
    )
    expect(result.map((food) => food.id)).toEqual(["carotte"])
  })

  it("filters allergens from isAllergen even when the allergen tag is missing", () => {
    const allergen = makeFood({ id: "oeuf", name: "Oeuf", isAllergen: true, tags: [] })
    const tagged = makeFood({ id: "ble", name: "Blé", isAllergen: false, tags: ["allergène"] })
    const regular = makeFood({ id: "carotte", name: "Carotte", isAllergen: false, tags: [] })
    const result = applyFoodFilters(
      [regular, allergen, tagged],
      makeFilters({ allergensOnly: true }),
      context(),
    )
    expect(result.map((food) => food.id)).toEqual(["ble", "oeuf"])
  })

  it("returns an empty array when filters exclude everything", () => {
    const carotte = makeFood({ id: "carotte", category: "Légumes" })
    const result = applyFoodFilters(
      [carotte],
      makeFilters({ category: "Fruits" }),
      context(),
    )
    expect(result).toEqual([])
  })
})

describe("countWithFilterChange (intersectional counts)", () => {
  it("counts foods that would remain if a filter were toggled on, respecting other active filters", () => {
    const a = makeFood({ id: "a", category: "Légumes", tags: ["allergène"] })
    const b = makeFood({ id: "b", category: "Légumes", tags: [] })
    const c = makeFood({ id: "c", category: "Fruits", tags: ["allergène"] })
    const base = makeFilters({ category: "Légumes" })
    const context = { latestByFood: new Map<string, FoodTest>() }

    const allergenCount = countWithFilterChange([a, b, c], base, "allergensOnly", true, context)
    expect(allergenCount).toBe(1)
  })

  it("counts each status segment independently of the current status filter", () => {
    const a = makeFood({ id: "a" })
    const b = makeFood({ id: "b" })
    const c = makeFood({ id: "c" })
    const latestByFood = new Map<string, FoodTest>([
      [
        "a",
        {
          id: "t-a",
          foodId: "a",
          date: "2026-05-01",
          mealTime: "midi",
          reaction: "Aucune",
          note: "",
        },
      ],
    ])
    const context = { latestByFood }
    const base = makeFilters({ status: "non-testes" })

    expect(countWithFilterChange([a, b, c], base, "status", "tous", context)).toBe(3)
    expect(countWithFilterChange([a, b, c], base, "status", "testes", context)).toBe(1)
    expect(countWithFilterChange([a, b, c], base, "status", "non-testes", context)).toBe(2)
    expect(countWithFilterChange([a, b, c], base, "status", "reaction", context)).toBe(0)
  })
})

describe("hasActiveFoodFilters", () => {
  it("returns false for the initial filter state", () => {
    expect(hasActiveFoodFilters(initialFoodFilters)).toBe(false)
  })

  it("returns true when category is set", () => {
    expect(hasActiveFoodFilters(makeFilters({ category: "Fruits" }))).toBe(true)
  })

  it("returns true when seasonOnly is set", () => {
    expect(hasActiveFoodFilters(makeFilters({ seasonOnly: true }))).toBe(true)
  })
})

import { describe, expect, it } from "vitest"

import type { Food } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"
import {
  ageSummary,
  getStatus,
  isAgeReady,
  isInSeason,
  weeklySuggestions,
} from "@/lib/food-utils"

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: "carotte",
    name: "Carotte",
    emoji: "🥕",
    category: "Légumes",
    isPopoteEligible: false,
    minAgeMonths: 4,
    possibleAgeMonths: 4,
    recommendedAgeMonths: 6,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    preparation: "Cuite et écrasée.",
    level: "conseillé",
    sourceIds: [],
    tags: [],
    ...overrides,
  }
}

describe("isAgeReady", () => {
  it("returns true when baby is older than minAgeMonths", () => {
    expect(isAgeReady(makeFood({ minAgeMonths: 4 }), 6)).toBe(true)
  })

  it("returns false when baby is younger than minAgeMonths", () => {
    expect(isAgeReady(makeFood({ minAgeMonths: 8 }), 6)).toBe(false)
  })

  it("returns true at the boundary", () => {
    expect(isAgeReady(makeFood({ minAgeMonths: 6 }), 6)).toBe(true)
  })
})

describe("ageSummary", () => {
  it("describes both possible and recommended when they differ", () => {
    const food = makeFood({ possibleAgeMonths: 4, recommendedAgeMonths: 8 })
    expect(ageSummary(food)).toBe("possible dès 4 mois · conseillé dès 8 mois")
  })

  it("uses recommended-only phrasing when only that is set", () => {
    const food = makeFood({ possibleAgeMonths: undefined, recommendedAgeMonths: 8 })
    expect(ageSummary(food)).toBe("conseillé dès 8 mois")
  })

  it("falls back to minAgeMonths when no detail is provided", () => {
    const food = makeFood({
      minAgeMonths: 12,
      possibleAgeMonths: undefined,
      recommendedAgeMonths: undefined,
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
      isPopote: false,
      reaction,
      note: "",
    }
  }

  it("returns 'non testé' when no test exists", () => {
    expect(getStatus(carotte.id, new Map())).toBe("non testé")
  })

  it("returns 'testé' when latest reaction is 'aucune réaction'", () => {
    const map = new Map<string, FoodTest>([[carotte.id, test("aucune réaction")]])
    expect(getStatus(carotte.id, map)).toBe("testé")
  })

  it("returns 'réaction' when latest reaction is anything else", () => {
    const map = new Map<string, FoodTest>([[carotte.id, test("rougeur")]])
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
    const tooOld = makeFood({ id: "noix", minAgeMonths: 12, name: "Noix" })
    const result = weeklySuggestions([tooOld], 6, new Set(), month)
    expect(result).toEqual([])
  })

  it("filters out tested foods", () => {
    const a = makeFood({ id: "a", name: "A" })
    const b = makeFood({ id: "b", name: "B" })
    const result = weeklySuggestions([a, b], 6, new Set(["a"]), month)
    expect(result.map((food) => food.id)).toEqual(["b"])
  })

  it("filters out foods tagged 'à éviter' or 'pas avant 3 ans'", () => {
    const avoided = makeFood({ id: "sel", name: "Sel", tags: ["à éviter"] })
    const late = makeFood({ id: "noix", name: "Noix", tags: ["pas avant 3 ans"] })
    const ok = makeFood({ id: "carotte", name: "Carotte" })
    const result = weeklySuggestions([avoided, late, ok], 12, new Set(), month)
    expect(result.map((food) => food.id)).toEqual(["carotte"])
  })

  it("returns at most 5 suggestions", () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      makeFood({ id: `food-${index}`, name: `Food ${index}`, category: index % 2 === 0 ? "Légumes" : "Fruits" }),
    )
    const result = weeklySuggestions(items, 6, new Set(), month)
    expect(result).toHaveLength(5)
  })

  it("caps each category to two foods in the first pass", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      makeFood({ id: `legume-${index}`, name: `Légume ${index}`, category: "Légumes" }),
    )
    const result = weeklySuggestions(items, 6, new Set(), month)
    expect(result.length).toBeLessThanOrEqual(5)
    const legumes = result.filter((food) => food.category === "Légumes")
    expect(legumes.length).toBeGreaterThanOrEqual(2)
  })

  it("prefers 'conseillé' foods over 'possible' when both are in season", () => {
    const conseille = makeFood({ id: "c", name: "C", level: "conseillé", category: "Légumes" })
    const possible = makeFood({ id: "p", name: "P", level: "possible", category: "Fruits" })
    const result = weeklySuggestions([possible, conseille], 6, new Set(), month)
    expect(result[0].id).toBe("c")
  })
})

import { describe, expect, it } from "vitest"

import { categories, foods } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"
import { calculateBadges, nextBadge } from "@/lib/gamification"

function test(foodId: string, overrides: Partial<FoodTest> = {}): FoodTest {
  return {
    id: `t-${foodId}`,
    foodId,
    date: "2026-05-01",
    mealTime: "12:00",
    reaction: "Aucune",
    note: "",
    ...overrides,
  }
}

const aFruit = foods.find((food) => food.category === "Fruits")!
const anAllergen = foods.find((food) => food.tags.includes("allergène"))!

describe("calculateBadges", () => {
  it("returns the 15 iOS badges with progress and unlocked flags", () => {
    const badges = calculateBadges(foods, [])
    expect(badges).toHaveLength(15)
    badges.forEach((badge) => {
      expect(badge).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        category: expect.any(String),
        progressCurrent: expect.any(Number),
        progressTarget: expect.any(Number),
        unlocked: expect.any(Boolean),
      })
      expect(badge.progressCurrent).toBeLessThanOrEqual(badge.progressTarget)
    })
  })

  it("locks every badge when no tests are recorded", () => {
    const badges = calculateBadges(foods, [])
    expect(badges.every((badge) => !badge.unlocked)).toBe(true)
  })

  it("does not include the dropped 'liked' badge", () => {
    const badges = calculateBadges(foods, [])
    expect(badges.find((badge) => badge.id === "liked_three")).toBeUndefined()
  })

  it("unlocks 'first_food' as soon as one food is tested", () => {
    const badges = calculateBadges(foods, [test(aFruit.id)])
    expect(badges.find((badge) => badge.id === "first_food")?.unlocked).toBe(true)
  })

  it("unlocks 'first_fruit' when a fruit is tested", () => {
    const badges = calculateBadges(foods, [test(aFruit.id)])
    expect(badges.find((badge) => badge.id === "first_fruit")?.unlocked).toBe(true)
  })

  it("unlocks 'first_allergen' when an allergen food is tested", () => {
    const badges = calculateBadges(foods, [test(anAllergen.id)])
    expect(badges.find((badge) => badge.id === "first_allergen")?.unlocked).toBe(true)
  })

  it("targets every food family for the rare 'all_categories' badge", () => {
    const allCategories = calculateBadges(foods, []).find((badge) => badge.id === "all_categories")
    expect(allCategories?.progressTarget).toBe(categories.length)
    expect(allCategories?.isRare).toBe(true)
  })

  it("counts tested foods uniquely even with repeated tests", () => {
    const tests = [test(aFruit.id), test(aFruit.id, { id: "dup" }), test(anAllergen.id)]
    const fiveFoods = calculateBadges(foods, tests).find((badge) => badge.id === "five_foods")
    expect(fiveFoods?.progressCurrent).toBe(2)
  })

  it("treats a recorded reaction or note as an observation", () => {
    const tests = [test(aFruit.id, { reaction: "Allergie" })]
    expect(calculateBadges(foods, tests).find((badge) => badge.id === "reaction_noted")?.unlocked).toBe(true)
  })

  it("attaches unlockedAt when a badge is in the unlockDates map", () => {
    const badges = calculateBadges(foods, [], { first_food: "2026-05-01" })
    expect(badges.find((badge) => badge.id === "first_food")?.unlockedAt).toBe("2026-05-01")
  })
})

describe("nextBadge", () => {
  it("returns the closest non-rare locked badge", () => {
    const next = nextBadge(calculateBadges(foods, []))
    expect(next?.isRare).toBeFalsy()
    expect(next?.unlocked).toBe(false)
    // first_food only needs a single food — it ties for closest and comes first by definition order.
    expect(next?.remaining).toBe(1)
  })

  it("returns undefined when only rare badges remain locked", () => {
    const badges = calculateBadges(foods, []).map((badge) =>
      badge.isRare ? badge : { ...badge, unlocked: true, remaining: 0 },
    )
    expect(nextBadge(badges)).toBeUndefined()
  })
})

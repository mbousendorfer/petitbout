import { describe, expect, it } from "vitest"

import { foods } from "@/data/foods"
import type { FoodTest } from "@/lib/storage"
import { calculateBadges, calculateDiscoveryJourney, calculateGoals, calculateProgress } from "@/lib/gamification"

function test(foodId: string, overrides: Partial<FoodTest> = {}): FoodTest {
  return {
    id: `t-${foodId}`,
    foodId,
    date: "2026-05-01",
    mealTime: "midi",
    reaction: "aucune réaction",
    note: "",
    ...overrides,
  }
}

describe("calculateBadges", () => {
  it("returns a defined badge list with progress and unlocked flags", () => {
    const badges = calculateBadges(foods, [])
    expect(badges.length).toBeGreaterThan(0)
    badges.forEach((badge) => {
      expect(badge).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
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

  it("attaches unlockedAt when a badge is in the unlockDates map", () => {
    const badges = calculateBadges(foods, [], { "first-spoon": "2026-05-01" })
    const firstSpoon = badges.find((badge) => badge.id === "first-spoon")
    expect(firstSpoon?.unlockedAt).toBe("2026-05-01")
  })
})

describe("calculateDiscoveryJourney", () => {
  it("uses unique tested foods for a linear milestone path", () => {
    const journey = calculateDiscoveryJourney(foods, [
      test("carotte"),
      test("carotte", { id: "t-carotte-2" }),
      test("pomme"),
      test("banane"),
    ])

    expect(journey.current).toBe(3)
    expect(journey.milestones.map((milestone) => milestone.target)).toEqual([1, 3, 5, 10, 15, 25, 50])
    expect(journey.completedMilestones).toBe(2)
    expect(journey.nextMilestone?.target).toBe(5)
  })
})

describe("calculateProgress", () => {
  it("counts tested foods uniquely even with repeated tests", () => {
    const tests = [test("carotte"), test("carotte"), test("pomme")]
    const progress = calculateProgress(foods, tests)
    expect(progress.testedFoods).toBe(2)
  })

  it("counts reactions excluding 'aucune réaction'", () => {
    const tests = [
      test("carotte"),
      test("pomme", { reaction: "rougeur" }),
      test("kiwi", { reaction: "digestion difficile" }),
    ]
    const progress = calculateProgress(foods, tests)
    expect(progress.reactions).toBe(2)
  })

  it("counts notes only when a note is provided", () => {
    const tests = [
      test("carotte", { note: "premier essai" }),
      test("pomme"),
    ]
    const progress = calculateProgress(foods, tests)
    expect(progress.notes).toBe(1)
  })
})

describe("calculateGoals", () => {
  it("uses logged meals rather than negative reactions for the regular tracking goal", () => {
    const goals = calculateGoals(foods, [
      test("carotte"),
      test("carotte", { id: "t-carotte-2" }),
      test("pomme"),
    ])
    const regularGoal = goals.find((goal) => goal.id === "logged-meals-10")

    expect(regularGoal?.progressCurrent).toBe(3)
    expect(regularGoal?.progressTarget).toBe(10)
  })
})

import { describe, expect, it } from "vitest"

import type { FoodTest } from "@/lib/storage"
import {
  backupFileName,
  backupToJson,
  journalCsvFileName,
  testsToCsv,
} from "@/lib/backup"

function test(overrides: Partial<FoodTest> = {}): FoodTest {
  return {
    id: "t1",
    foodId: "carotte",
    date: "2026-05-01",
    mealTime: "midi",
    reaction: "Aucune",
    note: "",
    ...overrides,
  }
}

describe("backupFileName", () => {
  it("formats a date as diversibebs-sauvegarde-YYYY-MM-DD.json", () => {
    expect(backupFileName(new Date("2026-05-18T08:00:00Z"))).toBe(
      "diversibebs-sauvegarde-2026-05-18.json",
    )
  })
})

describe("journalCsvFileName", () => {
  it("formats a date as diversibebs-journal-YYYY-MM-DD.csv", () => {
    expect(journalCsvFileName(new Date("2026-05-18T08:00:00Z"))).toBe(
      "diversibebs-journal-2026-05-18.csv",
    )
  })
})

describe("backupToJson", () => {
  it("pretty-prints with a two-space indent", () => {
    const json = backupToJson({
      app: "diversibebs",
      version: 1,
      exportedAt: "2026-05-18T08:00:00.000Z",
      state: {
        profile: { ageMonths: 6, avatarEmoji: "👶", birthDate: "2025-11-01", childName: "Sam" },
        tests: [],
      },
      familySession: null,
    })
    expect(json).toContain('"app": "diversibebs"')
    expect(json).toMatch(/\n {2}"version": 1/)
  })
})

describe("testsToCsv", () => {
  it("starts with the header row", () => {
    const csv = testsToCsv([])
    expect(csv.split("\n")[0]).toBe(
      '"Date","Moment","Aliment","Catégorie","Réaction","Note"',
    )
  })

  it("escapes double quotes by doubling them", () => {
    const csv = testsToCsv([test({ note: 'avec "guillemets"' })])
    expect(csv).toContain('"avec ""guillemets"""')
  })
})

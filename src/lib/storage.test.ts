import { describe, expect, it } from "vitest"

import { parseBackupPayload } from "@/lib/storage"

describe("parseBackupPayload", () => {
  function validBackup() {
    return {
      app: "diversibebs",
      version: 1,
      state: {
        profile: { ageMonths: 7, birthDate: "2025-10-12", childName: "Lina" },
        tests: [],
      },
    }
  }

  it("accepts a valid v1 payload", () => {
    const result = parseBackupPayload(validBackup())
    expect(result.state.profile.childName).toBe("Lina")
    expect(result.state.profile.ageMonths).toBe(7)
    expect(result.familySession).toBeNull()
  })

  it("preserves a family session block when provided", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      familySession: { familyCodeHash: "abc123", familyCodeLabel: "puree-carotte" },
    })
    expect(result.familySession).toEqual({
      familyCodeHash: "abc123",
      familyCodeLabel: "puree-carotte",
    })
  })

  it("drops a malformed family session", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      familySession: { familyCodeHash: 42 },
    })
    expect(result.familySession).toBeNull()
  })

  it("rejects null", () => {
    expect(() => parseBackupPayload(null)).toThrow(
      /n’est pas une sauvegarde Diversibebs valide/,
    )
  })

  it("rejects a non-object payload", () => {
    expect(() => parseBackupPayload("nope")).toThrow(
      /n’est pas une sauvegarde Diversibebs valide/,
    )
  })

  it("rejects a payload with the wrong app key", () => {
    expect(() => parseBackupPayload({ ...validBackup(), app: "other" })).toThrow(
      /format de sauvegarde n’est pas reconnu/,
    )
  })

  it("rejects an unknown version", () => {
    expect(() => parseBackupPayload({ ...validBackup(), version: 99 })).toThrow(
      /format de sauvegarde n’est pas reconnu/,
    )
  })

  it("rejects a payload missing the state block", () => {
    expect(() =>
      parseBackupPayload({ app: "diversibebs", version: 1 }),
    ).toThrow(/format de sauvegarde n’est pas reconnu/)
  })

  it("normalizes test entries with missing optional fields", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      state: {
        profile: { ageMonths: 6, birthDate: "2025-11-01", childName: "Sam" },
        tests: [
          {
            id: "t-1",
            foodId: "carotte",
            date: "2026-05-01",
            reaction: "Aucune",
          },
        ],
      },
    })
    expect(result.state.tests).toHaveLength(1)
    expect(result.state.tests[0].mealTime).toBe("")
    expect(result.state.tests[0].note).toBe("")
  })

  it("preserves repeated tests for the same food and sorts them by date and time", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      state: {
        profile: { ageMonths: 6, birthDate: "2025-11-01", childName: "Sam" },
        tests: [
          {
            id: "t-older",
            foodId: "carotte",
            date: "2026-05-01",
            mealTime: "12:00",
            reaction: "Aucune",
          },
          {
            id: "t-newer",
            foodId: "carotte",
            date: "2026-05-03",
            mealTime: "08:00",
            reaction: "Allergie",
          },
          {
            id: "t-same-day-later",
            foodId: "carotte",
            date: "2026-05-03",
            mealTime: "18:30",
            reaction: "Aucune",
          },
        ],
      },
    })

    expect(result.state.tests.map((test) => test.id)).toEqual([
      "t-same-day-later",
      "t-newer",
      "t-older",
    ])
  })

  it("drops test entries that lack required identifiers", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      state: {
        profile: { ageMonths: 6, birthDate: "2025-11-01", childName: "Sam" },
        tests: [{ foodId: "carotte" }],
      },
    })
    expect(result.state.tests).toEqual([])
  })
})

import { describe, expect, it } from "vitest"

import {
  childNameMaxLength,
  noteMaxLength,
  parseBackupPayload,
  parseRemoteState,
  reactionDetailMaxLength,
} from "@/lib/storage"

describe("parseBackupPayload", () => {
  function validBackup() {
    return {
      app: "petitbout",
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
    expect(result.state.profile.ageMonths).toBe(8)
    expect(result.familySession).toBeNull()
  })

  it("accepts a pre-rebrand v1 payload", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      app: ["diversi", "bebs"].join(""),
    })
    expect(result.state.profile.childName).toBe("Lina")
  })

  it("preserves a family session block when provided", () => {
    const familyCodeHash = "a".repeat(64)
    const result = parseBackupPayload({
      ...validBackup(),
      familySession: { familyCodeHash, familyCodeLabel: "  puree-carotte  " },
    })
    expect(result.familySession).toEqual({
      familyCodeHash,
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
      /n’est pas une sauvegarde Petitbout valide/,
    )
  })

  it("rejects a non-object payload", () => {
    expect(() => parseBackupPayload("nope")).toThrow(
      /n’est pas une sauvegarde Petitbout valide/,
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
      parseBackupPayload({ app: "petitbout", version: 1 }),
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

  it("bounds imported profile and note fields", () => {
    const result = parseBackupPayload({
      ...validBackup(),
      state: {
        profile: {
          ageMonths: 999,
          birthDate: "not-a-date",
          childName: "A".repeat(childNameMaxLength + 10),
        },
        tests: [
          {
            id: "t-1",
            foodId: "carotte",
            date: "2026-05-01",
            reaction: "Autre",
            note: "x".repeat(noteMaxLength + reactionDetailMaxLength),
          },
        ],
      },
    })

    expect(result.state.profile.ageMonths).toBe(36)
    expect(result.state.profile.birthDate).toBe("")
    expect(result.state.profile.childName).toHaveLength(childNameMaxLength)
    expect(result.state.tests[0].note).toHaveLength(noteMaxLength)
  })

  it("normalizes remote state before it reaches local storage", () => {
    const result = parseRemoteState(
      {
        profile: {
          ageMonths: -3,
          birthDate: "2026-02-30",
          childName: "  Sam  ",
        },
        tests: [
          {
            id: "remote-1",
            foodId: "banane",
            date: "2026-05-03",
            mealTime: "99:99",
            reaction: "rougeur",
            note: "ok",
          },
          {
            id: "remote-2",
            foodId: "poire",
            date: "invalid",
            reaction: "Aucune",
          },
        ],
      },
      parseBackupPayload(validBackup()).state,
    )

    expect(result.profile.ageMonths).toBe(0)
    expect(result.profile.birthDate).toBe("")
    expect(result.profile.childName).toBe("Sam")
    expect(result.tests).toHaveLength(1)
    expect(result.tests[0]).toMatchObject({
      foodId: "banane",
      mealTime: "",
      reaction: "Allergie",
    })
  })
})

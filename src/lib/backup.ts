import { foods } from "@/data/foods"
import type { BabyBackup, FoodTest, StoredState } from "@/lib/storage"

const csvHeaders = ["Date", "Moment", "Aliment", "Catégorie", "Réaction", "Note"]

function csvCell(value: string | number | boolean) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function backupFileName(date = new Date()) {
  return `petitbout-sauvegarde-${date.toISOString().slice(0, 10)}.json`
}

export function journalCsvFileName(date = new Date()) {
  return `petitbout-journal-${date.toISOString().slice(0, 10)}.csv`
}

export function backupToJson(backup: BabyBackup) {
  return JSON.stringify(backup, null, 2)
}

export function testsToCsv(tests: FoodTest[]) {
  const rows = tests.map((test) => {
    const food = foods.find((item) => item.id === test.foodId)
    return [
      test.date,
      test.mealTime,
      food?.name ?? test.foodId,
      food?.category ?? "",
      test.reaction,
      test.note,
    ]
  })

  return [csvHeaders, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")
}

export function stateSummary(state: StoredState) {
  return {
    childName: state.profile.childName,
    testsCount: state.tests.length,
    testedFoodsCount: new Set(state.tests.map((test) => test.foodId)).size,
  }
}


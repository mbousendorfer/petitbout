import { Clock, Coffee, Cookie, Moon, Utensils } from "lucide-react"
import { type FoodTest, type Reaction } from "@/lib/storage"

export type MealTimePresetId = "breakfast" | "lunch" | "snack" | "dinner" | "custom"
export const mealTimePresets: Array<{
  icon: typeof Clock
  id: Exclude<MealTimePresetId, "custom">
  label: string
  time: string
}> = [
  { icon: Coffee, id: "breakfast", label: "Petit déjeuner", time: "08:00" },
  { icon: Utensils, id: "lunch", label: "Déjeuner", time: "12:00" },
  { icon: Cookie, id: "snack", label: "Goûter", time: "16:00" },
  { icon: Moon, id: "dinner", label: "Dîner", time: "19:00" },
]

export const defaultMealTimePreset = mealTimePresets[1]

export const reactionLabels: Record<Reaction, string> = {
  "aucune réaction": "RAS",
  "digestion difficile": "Digestion",
  rougeur: "Rougeur",
  vomissement: "Vomissement",
  autre: "Autre",
}

export const reactionDisplay: Record<Reaction, { emoji: string; label: string }> = {
  "aucune réaction": { emoji: "😊", label: "RAS" },
  "digestion difficile": { emoji: "😣", label: "Digestion" },
  rougeur: { emoji: "🔴", label: "Rougeur" },
  vomissement: { emoji: "🤢", label: "Vomi" },
  autre: { emoji: "✍️", label: "Autre" },
}
export function mealTimePresetFor(time: string): MealTimePresetId {
  return mealTimePresets.find((preset) => preset.time === time)?.id ?? "custom"
}

export function mealTimeLabel(time: string) {
  if (!time) return ""

  const preset = mealTimePresets.find((item) => item.time === time)
  return preset ? preset.label.toLowerCase() : time
}

export function testDateTimeLabel(test: FoodTest) {
  const date = new Date(`${test.date}T00:00:00`).toLocaleDateString("fr-FR")
  const time = mealTimeLabel(test.mealTime)

  return time ? `${date} · ${time}` : date
}

export function historyDateLabel(date: string) {
  const eventDate = new Date(`${date}T00:00:00`)
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterday = new Date(todayDate)
  yesterday.setDate(todayDate.getDate() - 1)

  if (eventDate.getTime() === todayDate.getTime()) return "Aujourd’hui"
  if (eventDate.getTime() === yesterday.getTime()) return "Hier"

  return eventDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function historyDateDetailLabel(date: string) {
  const eventDate = new Date(`${date}T00:00:00`)
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterday = new Date(todayDate)
  yesterday.setDate(todayDate.getDate() - 1)

  if (eventDate.getTime() !== todayDate.getTime() && eventDate.getTime() !== yesterday.getTime()) {
    return eventDate.toLocaleDateString("fr-FR", { weekday: "long" })
  }

  return eventDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function historyEventTimeParts(test: FoodTest) {
  if (!test.mealTime) return { time: "—", moment: "Moment non renseigné" }

  const label = mealTimeLabel(test.mealTime)
  return label === test.mealTime ? { time: test.mealTime, moment: "" } : { time: test.mealTime, moment: label }
}

export function groupTestsByDate(tests: FoodTest[]) {
  const groups: Array<{ date: string; tests: FoodTest[] }> = []
  const groupByDate = new Map<string, FoodTest[]>()

  tests.forEach((test) => {
    const dateTests = groupByDate.get(test.date)
    if (dateTests) {
      dateTests.push(test)
      return
    }

    const nextTests = [test]
    groupByDate.set(test.date, nextTests)
    groups.push({ date: test.date, tests: nextTests })
  })

  return groups
}

export function downloadTextFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

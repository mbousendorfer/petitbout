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
  Aucune: "Aucune",
  Aime: "Aime",
  "Aime pas": "Aime pas",
  Allergie: "Allergie",
  Vomi: "Vomi",
  Digestion: "Digestion",
  Autre: "Autre",
}

export const reactionDisplay: Record<Reaction, { emoji: string; label: string }> = {
  Aucune: { emoji: "😊", label: "Aucune" },
  Aime: { emoji: "❤️", label: "Aime" },
  "Aime pas": { emoji: "💔", label: "Aime pas" },
  Allergie: { emoji: "⚠️", label: "Allergie" },
  Vomi: { emoji: "🤢", label: "Vomi" },
  Digestion: { emoji: "😣", label: "Digestion" },
  Autre: { emoji: "✍️", label: "Autre" },
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

export function downloadTextFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

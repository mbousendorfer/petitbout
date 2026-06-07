import { type Food, type FoodCategory } from "@/data/foods"
import { cn } from "@/lib/utils"

const categoryEmojiTile: Record<FoodCategory, string> = {
  Légumes: "bg-category-vegetable/[0.16] border-category-vegetable/[0.22]",
  Fruits: "bg-category-fruit/[0.16] border-category-fruit/[0.22]",
  Féculents: "bg-category-starch/[0.16] border-category-starch/[0.22]",
  Protéines: "bg-category-protein/[0.16] border-category-protein/[0.22]",
  "Produits laitiers": "bg-category-dairy/[0.16] border-category-dairy/[0.22]",
  "Matières grasses": "bg-category-fat/[0.16] border-category-fat/[0.22]",
  Divers: "bg-primary/[0.14] border-primary/[0.20]",
}

export function FoodEmoji({ food, size = "md" }: { food: Food; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border",
        categoryEmojiTile[food.category],
        size === "sm" && "size-10",
        size === "md" && "size-12",
        size === "lg" && "size-14",
      )}
      aria-hidden="true"
    >
      <span className={cn(size === "sm" ? "text-xl" : "text-2xl")}>{food.emoji}</span>
    </span>
  )
}

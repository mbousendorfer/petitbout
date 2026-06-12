import { AlertTriangle, Apple, Carrot, Droplet, Egg, Ellipsis, Milk, Wheat, type LucideIcon } from "lucide-react"

import type { FoodCategory } from "@/data/foods"

// Teinte éditoriale Argile + icône par famille d'aliment (cf. FoodCategory.tint /
// symbolName côté iOS). Classes Tailwind complètes pour rester sûres au purge.
type CategoryMeta = {
  icon: LucideIcon
  text: string
  tile: string
  border: string
  gradientFrom: string
}

export const categoryMeta: Record<FoodCategory, CategoryMeta> = {
  Légumes: {
    icon: Carrot,
    text: "text-category-vegetable",
    tile: "bg-category-vegetable/12",
    border: "border-category-vegetable/20",
    gradientFrom: "from-category-vegetable/25",
  },
  Fruits: {
    icon: Apple,
    text: "text-category-fruit",
    tile: "bg-category-fruit/12",
    border: "border-category-fruit/20",
    gradientFrom: "from-category-fruit/25",
  },
  Féculents: {
    icon: Wheat,
    text: "text-category-starch",
    tile: "bg-category-starch/12",
    border: "border-category-starch/20",
    gradientFrom: "from-category-starch/25",
  },
  Protéines: {
    icon: Egg,
    text: "text-category-protein",
    tile: "bg-category-protein/12",
    border: "border-category-protein/20",
    gradientFrom: "from-category-protein/25",
  },
  "Matières grasses": {
    icon: Droplet,
    text: "text-category-fat",
    tile: "bg-category-fat/12",
    border: "border-category-fat/20",
    gradientFrom: "from-category-fat/25",
  },
  "Produits laitiers": {
    icon: Milk,
    text: "text-category-dairy",
    tile: "bg-category-dairy/12",
    border: "border-category-dairy/20",
    gradientFrom: "from-category-dairy/25",
  },
  Allergènes: {
    icon: AlertTriangle,
    text: "text-destructive",
    tile: "bg-destructive/12",
    border: "border-destructive/20",
    gradientFrom: "from-destructive/20",
  },
  Autres: {
    icon: Ellipsis,
    text: "text-muted-foreground",
    tile: "bg-muted",
    border: "border-border",
    gradientFrom: "from-muted/60",
  },
}

export function isAllergenFood(food: { isAllergen?: boolean; tags: string[] }): boolean {
  return Boolean(food.isAllergen) || food.tags.includes("allergène")
}

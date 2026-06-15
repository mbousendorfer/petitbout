import { type ReactNode } from "react"
import { AlertTriangle, Calendar, Leaf } from "lucide-react"

import { type Food } from "@/data/foods"
import { isInSeason } from "@/lib/food-utils"
import { cn } from "@/lib/utils"
import { categoryMeta, isAllergenFood } from "@/components/food/categoryMeta"

// Carte hero d'un aliment (cf. FoodHeroCard iOS) — emoji centré, dégradé teinté
// par famille, badge catégorie, nom, description, pills âge + saison.
// Réutilisée par le carousel « Idées du moment » et l'entête du panneau aliment.
export function FoodHeroCard({
  className,
  food,
  footer,
  nameClassName = "text-xl",
}: {
  className?: string
  food: Food
  footer?: ReactNode
  // Taille du nom : text-xl par défaut (carte du carrousel) ; le panneau le passe
  // plus grand car il y sert de titre.
  nameClassName?: string
}) {
  const meta = categoryMeta[food.category]
  const CategoryIcon = meta.icon
  const inSeason = isInSeason(food)
  const recommendedAge = food.recommendedAgeInMonths

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2.5 overflow-hidden rounded-hero border bg-card p-5 text-center",
        meta.border,
        className,
      )}
    >
      <div
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent", meta.gradientFrom)}
        aria-hidden="true"
      />

      <div className="relative flex h-20 w-full items-center justify-center">
        <span className="text-[3.25rem] leading-none" aria-hidden="true">{food.emoji}</span>
        {isAllergenFood(food) && (
          <span className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-eyebrow font-bold text-destructive shadow-sm">
            <AlertTriangle className="size-3" aria-hidden="true" />
            Allergène
          </span>
        )}
      </div>

      <span className={cn("relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", meta.tile, meta.text)}>
        <CategoryIcon className="size-3" aria-hidden="true" />
        {food.category}
      </span>

      <p className={cn("relative line-clamp-2 font-rounded font-extrabold leading-tight tracking-[-0.01em]", nameClassName)}>{food.name}</p>
      <p className="relative line-clamp-2 text-sm leading-5 text-muted-foreground">{food.shortDescription}</p>

      <div className="relative mt-auto flex w-full flex-col gap-2.5 pt-2">
        <div className="flex items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <Calendar className="size-3" aria-hidden="true" />
            {recommendedAge}+ mois
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              inSeason ? "bg-status-season/15 text-status-season" : "bg-muted text-muted-foreground",
            )}
          >
            <Leaf className="size-3" aria-hidden="true" />
            {inSeason ? "Saison" : food.seasonText || "Hors saison"}
          </span>
        </div>
        {footer}
      </div>
    </div>
  )
}

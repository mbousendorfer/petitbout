import { useState, memo } from "react"
import { AlertTriangle } from "lucide-react"

import { type Food } from "@/data/foods"
import { getStatus } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { FoodEmoji } from "@/components/food/FoodEmoji"
import { FoodTestDrawer } from "@/components/food/FoodPanel"
import { categoryMeta, isAllergenFood } from "@/components/food/categoryMeta"

export const FoodCard = memo(function FoodCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const status = getStatus(food.id, store.latestByFood)
  const meta = categoryMeta[food.category]
  const CategoryIcon = meta.icon
  const [open, setOpen] = useState(false)

  const statusLabel = status === "non testé" ? "À tester" : status === "réaction" ? "Réaction" : "Testé"
  const statusClass =
    status === "non testé"
      ? "bg-muted text-muted-foreground"
      : status === "réaction"
        ? "bg-status-reaction/12 text-status-reaction"
        : "bg-status-tested/12 text-status-tested"

  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-card border bg-card/90 p-3 text-left shadow-soft transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpen(true)}
        aria-label={`Ajouter une prise de ${food.name}`}
      >
        <FoodEmoji food={food} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-base font-semibold leading-tight">{food.name}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", meta.tile, meta.text)}>
              <CategoryIcon className="size-3" aria-hidden="true" />
              {food.category}
            </span>
            {isAllergenFood(food) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2 py-0.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="size-3" aria-hidden="true" />
                Allergène
              </span>
            )}
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", statusClass)}>{statusLabel}</span>
      </button>
      {open && <FoodTestDrawer food={food} store={store} initialTab="add" open={open} onOpenChange={setOpen} />}
    </>
  )
})

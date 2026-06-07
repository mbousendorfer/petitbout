import { useState, memo } from "react"
import { Leaf, PackageCheck, type LucideIcon } from "lucide-react"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { isFoodInPack, type Food } from "@/data/foods"
import { getStatus, isInSeason } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useAppOptions } from "@/app/AppOptions"
import { FoodEmoji } from "@/components/food/FoodEmoji"
import { FoodTestDrawer } from "@/components/food/FoodPanel"

export function FoodCardAgeSummary({ food }: { food: Food }) {
  if (
    food.possibleAgeMonths &&
    food.recommendedAgeMonths &&
    food.possibleAgeMonths !== food.recommendedAgeMonths
  ) {
    return (
      <>
        possible dès {food.possibleAgeMonths} mois ·{" "}
        <span className="font-semibold text-foreground">conseillé dès {food.recommendedAgeMonths} mois</span>
      </>
    )
  }

  if (food.recommendedAgeMonths) {
    return <span className="font-semibold text-foreground">conseillé dès {food.recommendedAgeMonths} mois</span>
  }

  if (food.possibleAgeMonths) return <>possible dès {food.possibleAgeMonths} mois</>

  return <>dès {food.minAgeMonths} mois</>
}

export function FoodCardSignal({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon
  label: string
  tone: "season" | "popote"
}) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full border shadow-sm",
        tone === "season" && "border-status-season/25 bg-status-season text-status-season-foreground",
        tone === "popote" && "border-accent/35 bg-accent text-accent-foreground",
      )}
      aria-label={label}
      role="img"
      title={label}
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  )
}

export const FoodCard = memo(function FoodCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const { activePopotePackId } = useAppOptions()
  const status = getStatus(food.id, store.latestByFood)
  const inSeason = isInSeason(food)
  const inActivePopotePack = isFoodInPack(food, activePopotePackId)

  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="block h-24 w-full touch-manipulation rounded-[1.375rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpen(true)}
        aria-label={`Ajouter une prise de ${food.name}`}
      >
        <Card
          className={cn(
            "paper-surface pointer-events-none h-full overflow-hidden rounded-[1.375rem] transition-colors hover:border-primary/35",
            status === "testé" && "border-status-tested/45 bg-status-tested/10",
            status === "réaction" && "border-status-reaction/45 bg-status-reaction/10",
          )}
        >
          <div className="flex h-full min-w-0 items-center gap-3 p-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <FoodEmoji food={food} size="sm" />
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{food.name}</CardTitle>
                <CardDescription className="mt-1 truncate text-sm leading-5">
                  {food.category} · <FoodCardAgeSummary food={food} />
                </CardDescription>
              </div>
            </div>
            <div className="flex w-16 shrink-0 justify-end gap-1" aria-hidden={!inSeason && !inActivePopotePack}>
              {inActivePopotePack ? (
                <FoodCardSignal icon={PackageCheck} label="Popote possible" tone="popote" />
              ) : (
                <span className="size-7" />
              )}
              {inSeason ? <FoodCardSignal icon={Leaf} label="De saison" tone="season" /> : <span className="size-7" />}
            </div>
          </div>
        </Card>
      </button>
      {open && <FoodTestDrawer food={food} store={store} initialTab="add" open={open} onOpenChange={setOpen} />}
    </>
  )
})

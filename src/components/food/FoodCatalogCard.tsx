import { useState } from "react"
import { AlertTriangle, Check, Plus } from "lucide-react"

import { type Food } from "@/data/foods"
import { getStatus } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { FoodHeroCard } from "@/components/food/FoodHeroCard"
import { FoodTestDrawer, type FoodPanelTab } from "@/components/food/FoodPanel"

// Carte visuelle du catalogue (desktop) : réutilise la carte hero de la home,
// avec un pied de carte qui reflète le statut de l'aliment.
export function FoodCatalogCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const status = getStatus(food.id, store.latestByFood)
  const [openTab, setOpenTab] = useState<FoodPanelTab | null>(null)
  const tested = status !== "non testé"

  const footer =
    status === "non testé" ? (
      <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
        <Plus className="size-4" aria-hidden="true" />
        Ajouter
      </span>
    ) : status === "réaction" ? (
      <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-status-reaction/12 font-bold text-status-reaction">
        <AlertTriangle className="size-4" aria-hidden="true" />
        Réaction
      </span>
    ) : (
      <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-status-tested/12 font-bold text-status-tested">
        <Check className="size-4" aria-hidden="true" />
        Testé
      </span>
    )

  return (
    <>
      <button
        type="button"
        className="group rounded-hero text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpenTab(tested ? "infos" : "add")}
        aria-label={tested ? `Voir ${food.name}` : `Ajouter une prise de ${food.name}`}
      >
        <FoodHeroCard
          food={food}
          className={cn(
            "h-full min-h-[20rem] w-full shadow-card transition-colors group-hover:border-primary/30",
          )}
          footer={footer}
        />
      </button>
      {openTab && (
        <FoodTestDrawer
          food={food}
          store={store}
          initialTab={openTab}
          open
          onOpenChange={(next) => {
            if (!next) setOpenTab(null)
          }}
        />
      )}
    </>
  )
}

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { categories, foods, type FoodCategory } from "@/data/foods"
import { getStatus, isAgeReady } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { EmptyState, Header } from "@/components/primitives"
import { FoodCard } from "@/components/food/FoodCard"
import { FoodCatalogCard } from "@/components/food/FoodCatalogCard"

type CategoryFilter = FoodCategory | "all"
type StatusFilter = "all" | "untested" | "tested"

const statusOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "untested", label: "Non testé" },
  { id: "tested", label: "Testé" },
]

export function FoodsPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const normalizedQuery = query.toLowerCase().trim()

  const ageReadyFoods = useMemo(
    () =>
      foods
        .filter((food) => isAgeReady(food, store.profile.ageMonths))
        .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
    [store.profile.ageMonths],
  )

  const filteredFoods = useMemo(
    () =>
      ageReadyFoods.filter((food) => {
        const matchesQuery = food.name.toLowerCase().includes(normalizedQuery)
        const matchesCategory = category === "all" || food.category === category
        const status = getStatus(food.id, store.latestByFood)
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "untested" && status === "non testé") ||
          (statusFilter === "tested" && status !== "non testé")
        return matchesQuery && matchesCategory && matchesStatus
      }),
    [ageReadyFoods, normalizedQuery, category, statusFilter, store.latestByFood],
  )

  return (
    <>
      <Header eyebrow="Catalogue" title="Aliments" />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          className="pl-10"
          aria-label="Rechercher un aliment"
          placeholder="Chercher un aliment"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          <CategoryChip label="Tout" active={category === "all"} onClick={() => setCategory("all")} />
          {categories.map((item) => (
            <CategoryChip key={item} label={item} active={category === item} onClick={() => setCategory(item)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1" role="tablist" aria-label="Filtrer par statut">
        {statusOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === option.id}
            className={cn(
              "flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              statusFilter === option.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setStatusFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredFoods.length > 0 ? (
        <>
          {/* Mobile / tablette : liste compacte, scannable */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} store={store} />
            ))}
          </div>
          {/* Desktop : grille de cartes visuelles (cf. cartes « À explorer ») */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-3 xl:grid-cols-4">
            {filteredFoods.map((food) => (
              <FoodCatalogCard key={food.id} food={food} store={store} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={Search} title="Aucun aliment trouvé">
          Essaie une autre recherche ou enlève un filtre.
        </EmptyState>
      )}
    </>
  )
}

function CategoryChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

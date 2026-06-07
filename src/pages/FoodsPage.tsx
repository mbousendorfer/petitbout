import { useState, useEffect, useMemo, type ReactNode } from "react"
import { ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { categories, foods } from "@/data/foods"
import { applyFoodFilters, countWithFilterChange, hasActiveFoodFilters, initialFoodFilters, isAgeReady, type FoodCategoryFilter, type FoodFilters, type FoodStatusFilter, type IntroductionFilter } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useAppOptions } from "@/app/AppOptions"
import { AnimatedList, AnimatedListItem, EmptyState, Header } from "@/components/primitives"
import { FoodCard } from "@/components/food/FoodCard"

const statusFilterLabels: Record<FoodStatusFilter, string> = {
  tous: "Tous",
  "non-testes": "À tester",
  testes: "Testés",
  reaction: "Réactions",
}

const statusFilterOrder: FoodStatusFilter[] = ["tous", "non-testes", "testes", "reaction"]


const introductionFilterLabels: Record<IntroductionFilter, string> = {
  toutes: "Toutes",
  conseillee: "Conseillée",
  possible: "Possible",
}
export function FoodsPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const { activePopotePackId } = useAppOptions()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<FoodFilters>(initialFoodFilters)
  const normalizedQuery = query.toLowerCase().trim()

  useEffect(() => {
    if (activePopotePackId === null && filters.popoteOnly) updateFilters({ popoteOnly: false })
  }, [filters.popoteOnly, activePopotePackId])

  function updateFilters(nextFilters: Partial<FoodFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }))
  }

  function resetFilters() {
    setFilters(initialFoodFilters)
  }

  const ageReadyFoods = useMemo(
    () => foods.filter((food) => isAgeReady(food, store.profile.ageMonths)),
    [store.profile.ageMonths],
  )

  const searchableFoods = useMemo(
    () => ageReadyFoods.filter((food) => food.name.toLowerCase().includes(normalizedQuery)),
    [ageReadyFoods, normalizedQuery],
  )

  const filterContext = useMemo(
    () => ({ latestByFood: store.latestByFood, activePopotePackId }),
    [store.latestByFood, activePopotePackId],
  )

  const filteredFoods = useMemo(
    () => applyFoodFilters(searchableFoods, filters, filterContext),
    [searchableFoods, filters, filterContext],
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<FoodCategoryFilter, number>()
    ;(["Toutes", ...categories] as FoodCategoryFilter[]).forEach((category) => {
      counts.set(category, countWithFilterChange(searchableFoods, filters, "category", category, filterContext))
    })
    return counts
  }, [searchableFoods, filters, filterContext])

  const statusCounts = useMemo(() => {
    const counts = new Map<FoodStatusFilter, number>()
    statusFilterOrder.forEach((status) => {
      counts.set(status, countWithFilterChange(searchableFoods, filters, "status", status, filterContext))
    })
    return counts
  }, [searchableFoods, filters, filterContext])

  const introductionCounts = useMemo(() => {
    const counts = new Map<IntroductionFilter, number>()
    ;(Object.keys(introductionFilterLabels) as IntroductionFilter[]).forEach((value) => {
      counts.set(value, countWithFilterChange(searchableFoods, filters, "introduction", value, filterContext))
    })
    return counts
  }, [searchableFoods, filters, filterContext])

  const togglePillCounts = useMemo(
    () => ({
      season: countWithFilterChange(searchableFoods, filters, "seasonOnly", true, filterContext),
      allergens: countWithFilterChange(searchableFoods, filters, "allergensOnly", true, filterContext),
      popote:
        activePopotePackId === null
          ? 0
          : countWithFilterChange(searchableFoods, filters, "popoteOnly", true, filterContext),
    }),
    [searchableFoods, filters, filterContext, activePopotePackId],
  )

  const hasActiveFilters = hasActiveFoodFilters(filters)

  return (
    <>
      <Header eyebrow="Catalogue" title="Aliments adaptés" />
      <p className="text-sm leading-6 text-muted-foreground">
        Retrouvez vite les idées adaptées à l’âge, au statut de test et à la saison.
      </p>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            className="pl-10"
            aria-label="Rechercher un aliment"
            placeholder="Rechercher un aliment"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <StatusSegment
          counts={statusCounts}
          onChange={(status) => updateFilters({ status })}
          status={filters.status}
        />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CategoryPill
            categoryCounts={categoryCounts}
            onChange={(category) => updateFilters({ category })}
            value={filters.category}
          />
          <IntroductionPill
            introductionCounts={introductionCounts}
            onChange={(introduction) => updateFilters({ introduction })}
            value={filters.introduction}
          />
          <FilterPill
            active={filters.seasonOnly}
            count={togglePillCounts.season}
            label="De saison"
            onClick={() => updateFilters({ seasonOnly: !filters.seasonOnly })}
          />
          <FilterPill
            active={filters.allergensOnly}
            count={togglePillCounts.allergens}
            label="Allergènes"
            onClick={() => updateFilters({ allergensOnly: !filters.allergensOnly })}
          />
          {activePopotePackId !== null && (
            <FilterPill
              active={filters.popoteOnly}
              count={togglePillCounts.popote}
              label="Popote"
              onClick={() => updateFilters({ popoteOnly: !filters.popoteOnly })}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{filteredFoods.length} aliment(s)</span>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Tout effacer
            </Button>
          )}
        </div>
      </div>

      {filteredFoods.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun aliment trouvé"
          action={hasActiveFilters && (
            <Button type="button" variant="outline" onClick={resetFilters}>
              Enlever les filtres
            </Button>
          )}
        >
          Essayez d’enlever un filtre ou de modifier la recherche.
        </EmptyState>
      ) : (
        <AnimatedList className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredFoods.map((food) => (
            <AnimatedListItem key={food.id}>
              <FoodCard food={food} store={store} />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}

    </>
  )
}

export function StatusSegment({
  counts,
  onChange,
  status,
}: {
  counts: Map<FoodStatusFilter, number>
  onChange: (status: FoodStatusFilter) => void
  status: FoodStatusFilter
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Statut de test"
      className="grid grid-cols-4 gap-1.5 rounded-lg bg-muted/70 p-1.5"
    >
      {statusFilterOrder.map((value) => {
        const active = status === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(value)}
            className={cn(
              "flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{statusFilterLabels[value]}</span>
            <span className={cn("text-[10px] font-medium", active ? "text-muted-foreground" : "text-muted-foreground/80")}>
              {counts.get(value) ?? 0}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function FilterPill({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count?: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-card/80 text-muted-foreground hover:border-primary/25 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={cn("text-xs font-medium", active ? "text-foreground/70" : "text-muted-foreground/70")}>
          · {count}
        </span>
      )}
    </button>
  )
}

export function PickerPill({
  active,
  label,
  value,
  onOpenChange,
  open,
  children,
}: {
  active: boolean
  label: string
  value: string
  onOpenChange: (open: boolean) => void
  open: boolean
  children: ReactNode
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border bg-card/80 text-muted-foreground hover:border-primary/25 hover:text-foreground",
        )}
      >
        <span>{label}</span>
        <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground/80")}>· {value}</span>
        <ChevronRight aria-hidden="true" className="size-3.5 rotate-90" />
      </button>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent side="bottom" className="flex max-h-[70svh] flex-col gap-0 p-0 lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(560px,calc(100vh-4rem))] lg:w-[min(420px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border">
          <DrawerHeader className="shrink-0 px-6 pb-4 pt-6">
            <DrawerTitle>{label}</DrawerTitle>
            <DrawerDescription className="sr-only">Choisir une valeur de {label.toLowerCase()}.</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="min-h-0 flex-1 px-6">
            <div className="flex flex-col gap-2 pb-6">{children}</div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export function PickerOption({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count?: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-transparent bg-muted/55 hover:bg-muted/80",
      )}
    >
      <span>{label}</span>
      <span className="flex items-center gap-3">
        {typeof count === "number" && <span className="text-xs text-muted-foreground">{count}</span>}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
            active ? "border-primary" : "border-muted-foreground/40",
          )}
        >
          {active && <span className="size-2.5 rounded-full bg-primary" />}
        </span>
      </span>
    </button>
  )
}

export function CategoryPill({
  categoryCounts,
  onChange,
  value,
}: {
  categoryCounts: Map<FoodCategoryFilter, number>
  onChange: (category: FoodCategoryFilter) => void
  value: FoodCategoryFilter
}) {
  const [open, setOpen] = useState(false)
  return (
    <PickerPill
      active={value !== "Toutes"}
      label="Catégorie"
      value={value}
      open={open}
      onOpenChange={setOpen}
    >
      {(["Toutes", ...categories] as FoodCategoryFilter[]).map((category) => (
        <PickerOption
          key={category}
          active={value === category}
          count={categoryCounts.get(category)}
          label={category}
          onClick={() => {
            onChange(category)
            setOpen(false)
          }}
        />
      ))}
    </PickerPill>
  )
}

export function IntroductionPill({
  introductionCounts,
  onChange,
  value,
}: {
  introductionCounts: Map<IntroductionFilter, number>
  onChange: (introduction: IntroductionFilter) => void
  value: IntroductionFilter
}) {
  const [open, setOpen] = useState(false)
  return (
    <PickerPill
      active={value !== "toutes"}
      label="Introduction"
      value={introductionFilterLabels[value].toLowerCase()}
      open={open}
      onOpenChange={setOpen}
    >
      {(Object.keys(introductionFilterLabels) as IntroductionFilter[]).map((option) => (
        <PickerOption
          key={option}
          active={value === option}
          count={introductionCounts.get(option)}
          label={introductionFilterLabels[option]}
          onClick={() => {
            onChange(option)
            setOpen(false)
          }}
        />
      ))}
    </PickerPill>
  )
}

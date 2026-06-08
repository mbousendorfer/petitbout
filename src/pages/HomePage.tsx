import { useState, useMemo } from "react"
import { NavLink } from "react-router-dom"
import { ArrowRight, Baby, BadgeCheck, Carrot, Check, ChevronRight, CircleCheck, FileSearch, Plus, Sparkles, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { foods, type Food } from "@/data/foods"
import { guidanceStageFor } from "@/data/guidance"
import { isAgeReady } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { SectionHeader, EmptyState, Disclaimer } from "@/components/primitives"
import { FoodHeroCard } from "@/components/food/FoodHeroCard"
import { FoodTestDrawer, type FoodPanelTab } from "@/components/food/FoodPanel"

export function HomePage({
  store,
  suggestions,
}: {
  store: ReturnType<typeof useBabyStore>
  suggestions: Food[]
}) {
  const { ageMonths, childName } = store.profile
  const displayName = childName.trim() ? childName.trim() : "bébé"
  const testedCount = store.testedFoodIds.size
  const remainingCount = useMemo(
    () => foods.filter((food) => isAgeReady(food, ageMonths) && !store.testedFoodIds.has(food.id)).length,
    [ageMonths, store.testedFoodIds],
  )
  const stage = guidanceStageFor(ageMonths)

  const heroMessage =
    testedCount === 0
      ? "Tu peux commencer avec un premier aliment."
      : `Déjà ${testedCount} aliment${testedCount > 1 ? "s" : ""} ajouté${testedCount > 1 ? "s" : ""}. Continue à ton rythme.`

  return (
    <>
      <TodayHero
        displayName={displayName}
        ageMonths={ageMonths}
        message={heroMessage}
        testedCount={testedCount}
        remainingCount={remainingCount}
      />

      <section className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Idées du moment"
          title={suggestions.length > 0 ? "À explorer" : "Tout est prêt"}
        />
        {suggestions.length > 0 ? (
          <TodayFoodCarousel foods={suggestions} store={store} />
        ) : (
          <EmptyState
            icon={Check}
            title="Tout est prêt"
            action={
              <Button asChild variant="outline">
                <NavLink to="/foods">
                  <Carrot data-icon="inline-start" aria-hidden="true" />
                  Voir les aliments
                </NavLink>
              </Button>
            }
          >
            Aucune suggestion immédiate. Tu peux parcourir le catalogue pour choisir un aliment.
          </EmptyState>
        )}
      </section>

      <TodayGuidancePreview stage={stage} />

      <Disclaimer compact />
    </>
  )
}

export function TodayHero({
  ageMonths,
  displayName,
  message,
  remainingCount,
  testedCount,
}: {
  ageMonths: number
  displayName: string
  message: string
  remainingCount: number
  testedCount: number
}) {
  return (
    <section className="paper-surface soft-ring overflow-hidden rounded-hero p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-rounded text-2xl font-extrabold tracking-[-0.01em]">Aujourd'hui</h1>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-status-reaction/12 px-3 py-1 text-xs font-bold text-status-reaction">
          <Baby className="size-3.5" aria-hidden="true" />
          {ageMonths} mois
        </span>
      </div>
      <p className="mt-3 text-lg font-bold tracking-[-0.01em]">Bonjour {displayName}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <TodayHeroStat icon={BadgeCheck} value={testedCount} label="testés" tone="tested" />
        <TodayHeroStat icon={Sparkles} value={remainingCount} label="à explorer" tone="accent" />
      </div>
    </section>
  )
}

export function TodayHeroStat({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  tone: "tested" | "accent"
  value: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-2">
      <Icon
        aria-hidden="true"
        className={cn("size-4 shrink-0", tone === "tested" ? "text-status-tested" : "text-accent-foreground")}
      />
      <span className="font-rounded text-base font-extrabold tracking-tight">{value}</span>
      <span className="truncate text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}

export function TodayFoodCarousel({ foods: items, store }: { foods: Food[]; store: ReturnType<typeof useBabyStore> }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex snap-x snap-mandatory gap-3">
        {items.map((food) => (
          <TodayFoodHeroCard key={food.id} food={food} store={store} />
        ))}
        <NavLink
          to="/foods"
          className="flex w-[16rem] shrink-0 snap-start flex-col justify-between gap-4 rounded-hero border border-primary/20 bg-primary/[0.06] p-5 shadow-card transition-colors hover:border-primary/35"
        >
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary"
          >
            <Carrot className="size-7" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-[-0.01em]">Voir tout</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Parcourir le catalogue complet.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            Ouvrir
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </NavLink>
      </div>
    </div>
  )
}

export function TodayFoodHeroCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const [openTab, setOpenTab] = useState<FoodPanelTab | null>(null)

  return (
    <>
      <button
        type="button"
        className="group w-[16rem] shrink-0 snap-start rounded-hero text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpenTab("add")}
        aria-label={`Ajouter une prise de ${food.name}`}
      >
        <FoodHeroCard
          food={food}
          className="min-h-[21rem] w-full shadow-card transition-colors group-hover:border-primary/30"
          footer={
            <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary font-bold text-primary-foreground shadow-sm">
              <Plus className="size-4" aria-hidden="true" />
              Ajouter
            </span>
          }
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

export function TodayGuidancePreview({ stage }: { stage: ReturnType<typeof guidanceStageFor> }) {
  return (
    <NavLink
      to="/guidance"
      className="flex flex-col gap-3 rounded-card border bg-card/85 p-4 shadow-soft transition-colors hover:border-status-tested/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-status-tested/12 text-status-tested"
        >
          <FileSearch className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-status-tested">Repère {stage.ageRange}</p>
          <p className="font-semibold leading-tight">{stage.title}</p>
        </div>
        <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{stage.texture}</p>
      <ul className="grid gap-1.5">
        {stage.principles.slice(0, 2).map((principle, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-status-tested" aria-hidden="true" />
            <span className="leading-5">{principle}</span>
          </li>
        ))}
      </ul>
    </NavLink>
  )
}

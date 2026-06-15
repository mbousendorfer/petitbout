import { useState, useMemo } from "react"
import { NavLink } from "react-router-dom"
import { ArrowRight, BadgeCheck, Cake, Carrot, Check, Plus, Sparkles, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { foods, type Food } from "@/data/foods"
import { guidanceStageFor, guidanceStageIndexFor } from "@/data/guidance"
import { isAgeReady } from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { SectionHeader, EmptyState, Disclaimer } from "@/components/primitives"
import { BabyAvatar } from "@/components/BabyAvatar"
import { GuidanceStageHeroCard } from "@/components/GuidanceStageHeroCard"
import { FoodHeroCard } from "@/components/food/FoodHeroCard"
import { FoodTestDrawer, type FoodPanelTab } from "@/components/food/FoodPanel"

export function HomePage({
  store,
  suggestions,
}: {
  store: ReturnType<typeof useBabyStore>
  suggestions: Food[]
}) {
  const { ageMonths, avatarEmoji, childName } = store.profile
  const displayName = childName.trim() ? childName.trim() : "bébé"
  const testedCount = store.testedFoodIds.size
  const remainingCount = useMemo(
    () => foods.filter((food) => isAgeReady(food, ageMonths) && !store.testedFoodIds.has(food.id)).length,
    [ageMonths, store.testedFoodIds],
  )
  const stage = guidanceStageFor(ageMonths)
  const currentStageIndex = guidanceStageIndexFor(ageMonths)

  const heroMessage =
    testedCount === 0
      ? "Tu peux commencer avec un premier aliment."
      : `Déjà ${testedCount} aliment${testedCount > 1 ? "s" : ""} ajouté${testedCount > 1 ? "s" : ""}. Continue à ton rythme.`

  return (
    <>
      <TodayHero
        displayName={displayName}
        ageMonths={ageMonths}
        avatarEmoji={avatarEmoji}
        message={heroMessage}
        testedCount={testedCount}
        remainingCount={remainingCount}
      />

      <section className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Idées du moment"
          title={
            suggestions.length > 0
              ? "Choisis un aliment à ajouter au carnet."
              : "Tout est prêt pour choisir un prochain aliment."
          }
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

      <TodayGuidancePreview
        ageMonths={ageMonths}
        childName={displayName}
        stage={stage}
        currentStageIndex={currentStageIndex}
      />

      <Disclaimer compact />
    </>
  )
}

export function TodayHero({
  ageMonths,
  avatarEmoji,
  displayName,
  message,
  remainingCount,
  testedCount,
}: {
  ageMonths: number
  avatarEmoji: string
  displayName: string
  message: string
  remainingCount: number
  testedCount: number
}) {
  return (
    <section className="paper-surface soft-ring overflow-hidden rounded-hero p-5">
      <div className="flex items-center gap-3">
        <BabyAvatar emoji={avatarEmoji} size={48} />
        <div className="min-w-0 flex-1">
          <h1 className="font-rounded text-2xl font-extrabold tracking-normal">Aujourd'hui</h1>
          <p className="truncate text-base font-semibold">Bonjour {displayName}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-bold text-foreground/75 ring-1 ring-border/35">
          <Cake className="size-3.5" aria-hidden="true" />
          {ageMonths} mois
        </span>
      </div>
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

export function TodayGuidancePreview({
  ageMonths,
  childName,
  stage,
  currentStageIndex,
}: {
  ageMonths: number
  childName: string
  stage: ReturnType<typeof guidanceStageFor>
  currentStageIndex: number
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader eyebrow="Repère actuel" title="Où en est la diversification ?" />
      <GuidanceStageHeroCard
        ageMonths={ageMonths}
        childName={childName}
        currentStageIndex={currentStageIndex}
        stage={stage}
        to="/guidance"
      />
    </section>
  )
}

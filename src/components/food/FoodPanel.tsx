import { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { BookOpen, CalendarClock, ChevronDown, CircleCheck, Clock, CrossIcon, FileSearch, Leaf, LoaderCircle, PencilLine, Plus, ShieldCheck, Trash2, Utensils, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type Food } from "@/data/foods"
import { guidanceStageFor } from "@/data/guidance"
import { foodSourceReferences } from "@/data/sources"
import { ageSummary, getStatus, isInSeason, monthNames } from "@/lib/food-utils"
import { reactions, useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { mealTimePresets, defaultMealTimePreset, reactionLabels, reactionDisplay, mealTimePresetFor, testDateTimeLabel, type MealTimePresetId } from "@/lib/formatting"
import { FoodHeroCard } from "@/components/food/FoodHeroCard"
import { StatusBadge, SeasonBadge, IntroductionBadge, SeasonMonthsGrid } from "@/components/food/FoodBadges"

export type FoodPanelTab = "infos" | "add"
export function FoodTestDrawer({
  food,
  initialTab,
  onOpenChange,
  open,
  store,
  test,
}: {
  food: Food
  initialTab?: FoodPanelTab
  onOpenChange: (open: boolean) => void
  open: boolean
  store: ReturnType<typeof useBabyStore>
  test?: FoodTest
}) {
  const foodTests = useMemo(() => store.tests.filter((item) => item.foodId === food.id), [food.id, store.tests])
  const latestFoodTest = foodTests[0]
  const [selectedTab, setSelectedTab] = useState<FoodPanelTab>(() => initialTab ?? "add")
  const [selectedTest, setSelectedTest] = useState<FoodTest | null>(() => test ?? null)
  const isEditing = Boolean(selectedTest)
  const [date, setDate] = useState(() => selectedTest?.date ?? new Date().toISOString().slice(0, 10))
  const [mealTime, setMealTime] = useState(() => selectedTest?.mealTime || defaultMealTimePreset.time)
  const [mealTimePreset, setMealTimePreset] = useState<MealTimePresetId>(() =>
    selectedTest?.mealTime ? mealTimePresetFor(selectedTest.mealTime) : defaultMealTimePreset.id,
  )
  const [reaction, setReaction] = useState<Reaction>(() => selectedTest?.reaction ?? "aucune réaction")
  const [note, setNote] = useState(() => selectedTest?.note ?? "")
  const [showReaction, setShowReaction] = useState(
    () => Boolean(selectedTest && selectedTest.reaction !== "aucune réaction"),
  )
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const status = getStatus(food.id, store.latestByFood)
  const reactionSummary = reaction === "aucune réaction" ? "Rien à signaler" : reactionLabels[reaction]
  const reactionIsSevere = reaction === "vomissement" || reaction === "rougeur"

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  useEffect(() => {
    if (!confirmingRemovalId) return
    const timeout = window.setTimeout(() => setConfirmingRemovalId(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [confirmingRemovalId])

  function resetFormForNewTest() {
    setSelectedTest(null)
    setDate(new Date().toISOString().slice(0, 10))
    setMealTime(defaultMealTimePreset.time)
    setMealTimePreset(defaultMealTimePreset.id)
    setReaction("aucune réaction")
    setNote("")
    setShowReaction(false)
    setConfirmingRemovalId(null)
  }

  function editTest(nextTest: FoodTest) {
    setSelectedTab("add")
    setSelectedTest(nextTest)
    setDate(nextTest.date)
    setMealTime(nextTest.mealTime || defaultMealTimePreset.time)
    setMealTimePreset(nextTest.mealTime ? mealTimePresetFor(nextTest.mealTime) : defaultMealTimePreset.id)
    setReaction(nextTest.reaction)
    setNote(nextTest.note)
    setShowReaction(nextTest.reaction !== "aucune réaction")
    setConfirmingRemovalId(null)
  }

  async function saveTest() {
    if (isSaving) return

    const nextTest = {
      foodId: food.id,
      date,
      mealTime,
      reaction,
      note,
    }

    setIsSaving(true)
    try {
      if (selectedTest) {
        await store.updateTest(selectedTest.id, nextTest)
        toast.success(`Prise de ${food.name} mise à jour`)
      } else {
        await store.addTest(nextTest)
        toast.success(`Nouvelle prise de ${food.name} ajoutée`)
      }
    } finally {
      setIsSaving(false)
    }

    onOpenChange(false)
  }

  function selectMealTimePreset(presetId: MealTimePresetId) {
    setMealTimePreset(presetId)

    if (presetId === "custom") return

    const preset = mealTimePresets.find((item) => item.id === presetId)
    if (preset) setMealTime(preset.time)
  }

  async function removeTrackedTest(testToRemove: FoodTest) {
    if (confirmingRemovalId !== testToRemove.id) {
      setConfirmingRemovalId(testToRemove.id)
      return
    }

    await store.deleteTest(testToRemove.id)
    toast.success(`${food.name} retiré du journal`)
    setConfirmingRemovalId(null)

    if (selectedTest?.id === testToRemove.id) {
      resetFormForNewTest()
    }
  }

  if (!open) return null

  return createPortal(
    <>
      <div
        className="sheet-overlay fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
        data-state="open"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={food.name}
        className="sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[84svh] min-h-[58svh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-t-2xl border-t bg-background shadow-lg lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:max-h-[min(820px,calc(100vh-4rem))] lg:w-[min(760px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border"
        data-side="bottom"
        data-state="open"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-card/85 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpenChange(false)}
          aria-label="Fermer"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-3 pt-4">
            <FoodHeroCard food={food} />
          </div>
          <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 px-5 pb-3 pt-1 backdrop-blur">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1" role="tablist" aria-label="Vue de la fiche">
              {([
                { id: "add", label: isEditing ? "Modifier" : "Ajouter" },
                { id: "infos", label: "Infos" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedTab === tab.id}
                  className={cn(
                    "flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setSelectedTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 px-5 pb-4 pt-4">
            {selectedTab === "infos" && (
            <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={status} />
              {isInSeason(food) && <SeasonBadge />}
              <IntroductionBadge level={food.level} />
              <SeasonMonthsGrid activeMonths={food.seasonMonths} />
            </div>
            <FoodPanelGuidanceCard ageMonths={store.profile.ageMonths} />
            <FoodPanelReferenceCard food={food} />
            <p className="rounded-xl bg-muted/65 p-4 text-sm leading-6">{food.preparation}</p>
            <FoodSourceNote food={food} />
            {foodTests.length > 0 && (
              <div className="rounded-xl border bg-card/85 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Suivi</p>
                    <p className="mt-1 text-sm font-medium">
                      {foodTests.length} prise{foodTests.length > 1 ? "s" : ""} enregistrée{foodTests.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  {latestFoodTest && (
                    <Badge variant="outline" className="h-auto max-w-[52%] justify-start px-2 py-1 text-left text-xs leading-4">
                      Dernière : {testDateTimeLabel(latestFoodTest)}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid gap-2">
                  {foodTests.slice(0, 4).map((trackedTest) => {
                    const isSelectedTest = selectedTest?.id === trackedTest.id
                    const isConfirmingRemoval = confirmingRemovalId === trackedTest.id

                    return (
                      <div
                        key={trackedTest.id}
                        className={cn(
                          "flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-background/55 px-3 py-2",
                          isSelectedTest && "border-primary/35 bg-secondary/45",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{testDateTimeLabel(trackedTest)}</p>
                          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <span aria-hidden="true">{reactionDisplay[trackedTest.reaction].emoji}</span>
                            <span className="truncate">{reactionLabels[trackedTest.reaction]}</span>
                          </p>
                        </div>
                        <div className="flex min-h-8 shrink-0 items-center gap-1">
                          {isConfirmingRemoval ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => setConfirmingRemovalId(null)}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive"
                                onClick={() => removeTrackedTest(trackedTest)}
                              >
                                <Trash2 data-icon="inline-start" aria-hidden="true" />
                                Confirmer
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground"
                                onClick={() => editTest(trackedTest)}
                                aria-label={`Modifier la prise de ${food.name} du ${testDateTimeLabel(trackedTest)}`}
                                title="Modifier"
                              >
                                <PencilLine aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeTrackedTest(trackedTest)}
                                aria-label={`Retirer cette prise de ${food.name}`}
                                title="Retirer"
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            </div>
            )}
            {selectedTab === "add" && (
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-[-0.01em]">{isEditing ? "Modifier" : "Ajouter un aliment"}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Date et moment du repas.</p>
                </div>
                {isEditing && (
                  <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={resetFormForNewTest}>
                    <Plus data-icon="inline-start" aria-hidden="true" />
                    Nouvelle prise
                  </Button>
                )}
              </div>

              <label className="grid min-w-0 gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Date</span>
                <Input
                  className="h-11 min-w-0 max-w-full bg-background/70 px-3 shadow-none"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>

              <div className="flex min-w-0 flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Moment</p>
                  {mealTimePreset === "custom" && <p className="text-xs text-muted-foreground">{mealTime}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mealTimePresets.map((preset) => {
                    const isSelected = mealTimePreset === preset.id
                    const Icon = preset.icon

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(
                          "flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary/35 bg-primary/10 text-foreground shadow-sm"
                            : "border-border bg-background/50 text-foreground hover:bg-muted",
                        )}
                        onClick={() => selectMealTimePreset(preset.id)}
                        aria-pressed={isSelected}
                      >
                        <Icon className={cn("size-5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                        <span className="truncate text-sm font-semibold">{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors",
                    mealTimePreset === "custom"
                      ? "border-primary/35 bg-primary/10"
                      : "border-border bg-background/50",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    onClick={() => selectMealTimePreset("custom")}
                    aria-pressed={mealTimePreset === "custom"}
                  >
                    <Clock className={cn("size-4 shrink-0", mealTimePreset === "custom" ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                    <span className="truncate text-sm font-medium">Entrer l’heure</span>
                  </button>
                  <Input
                    className="h-9 w-[7.5rem] shrink-0 bg-background/70"
                    type="time"
                    value={mealTime}
                    aria-label="Heure de la prise"
                    onChange={(event) => {
                      setMealTime(event.target.value)
                      setMealTimePreset("custom")
                    }}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-2.5">
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-[-0.01em]">Détails optionnels</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Une note suffit si quelque chose mérite d’être gardé.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border bg-card/80 p-4 shadow-sm">
                  <Textarea
                    placeholder="Notes, texture, quantité..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />

                  <button
                    type="button"
                    className="flex min-h-12 items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setShowReaction((value) => !value)}
                    aria-expanded={showReaction}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-base",
                        reaction === "aucune réaction" ? "bg-muted" : "bg-status-reaction/15",
                      )}
                    >
                      {reactionDisplay[reaction].emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Réaction</span>
                      <span className="block truncate text-sm font-semibold">{reactionSummary}</span>
                    </span>
                    <ChevronDown
                      className={cn("size-4 shrink-0 text-muted-foreground transition-transform", showReaction && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>

                  {showReaction && (
                    <div className="flex flex-col gap-2.5">
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                        {reactions.map((reactionOption) => {
                          const isSelected = reaction === reactionOption
                          const display = reactionDisplay[reactionOption]

                          return (
                            <button
                              key={reactionOption}
                              type="button"
                              className={cn(
                                "flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isSelected
                                  ? reactionOption === "aucune réaction"
                                    ? "border-status-tested/30 bg-status-tested/12 text-status-tested"
                                    : "border-status-reaction/30 bg-status-reaction/12 text-status-reaction"
                                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setReaction(reactionOption)}
                              aria-pressed={isSelected}
                              aria-label={reactionLabels[reactionOption]}
                            >
                              <span className="shrink-0 leading-none" aria-hidden="true">{display.emoji}</span>
                              <span className="truncate">{display.label}</span>
                            </button>
                          )
                        })}
                      </div>
                      {reactionIsSevere && (
                        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                          <CrossIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          Symptôme important : demandez un avis médical.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
        {selectedTab === "add" && (
        <div className="shrink-0 border-t bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur lg:pb-4">
          <div className="grid gap-2">
            <Button type="button" className="h-12 w-full" onClick={saveTest} disabled={isSaving}>
              {isSaving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {isSaving ? "Sauvegarde..." : isEditing ? "Sauvegarder les changements" : "Ajouter cette prise"}
            </Button>
          </div>
        </div>
        )}
      </div>
    </>,
    document.body,
  )
}

// Carte « Repères bébé » du panneau aliment — porte FoodBabyGuidanceCard (iOS).
export function FoodPanelGuidanceCard({ ageMonths }: { ageMonths: number }) {
  const stage = guidanceStageFor(ageMonths)

  return (
    <div className="rounded-card border border-status-tested/20 bg-gradient-to-br from-card to-status-tested/[0.07] p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-status-tested/12 text-status-tested"
        >
          <FileSearch className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-status-tested">Repères bébé</p>
          <p className="text-sm font-medium text-muted-foreground">{stage.ageRange}</p>
        </div>
      </div>
      <p className="mt-3 font-semibold leading-tight">{stage.title}</p>
      <ul className="mt-2 grid gap-1.5">
        {[stage.texture, stage.milk].map((text, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-status-tested" aria-hidden="true" />
            <span className="leading-5">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Carte « Repères aliment » du panneau aliment — porte FoodReferenceCard (iOS).
export function FoodPanelReferenceCard({ food }: { food: Food }) {
  return (
    <div className="rounded-card border bg-card/85 p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold text-muted-foreground">Repères aliment</p>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-md border border-primary/15 bg-primary/[0.08] p-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary"
        >
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Introduction</p>
          <p className="mt-0.5 text-sm font-medium leading-5">{ageSummary(food)}</p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <FoodReferenceChip icon={Utensils} title="Famille" value={food.category} />
        <FoodReferenceChip icon={Leaf} title="Saison" value={monthNames(food.seasonMonths)} />
      </div>
    </div>
  )
}

export function FoodReferenceChip({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon
  title: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/55 p-3">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-background/70 text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-0.5 text-sm font-semibold leading-5">{value}</p>
      </div>
    </div>
  )
}

export function FoodSourceNote({ food }: { food: Food }) {
  const cautionTags = food.tags.filter((tag) =>
    ["allergène", "gluten", "à éviter", "pas avant 3 ans", "pas avant 5 ans"].includes(tag),
  )
  const primarySource = food.sourceIds
    .map((id) => foodSourceReferences.find((source) => source.id === id))
    .find((source): source is (typeof foodSourceReferences)[number] => Boolean(source))

  if (cautionTags.length === 0 && !food.sourceNote && !food.cautionLevel) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/85 p-4 text-sm leading-6 shadow-sm",
        food.cautionLevel === "attention" && "border-status-attention/25 bg-status-attention/10",
      )}
    >
      {cautionTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cautionTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
                food.cautionLevel === "attention"
                  ? "border-status-attention/25 bg-status-attention/15 text-status-attention-foreground dark:text-status-attention"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {food.sourceNote && (
        <p
          className={cn(
            "flex items-start gap-2 leading-6",
            cautionTags.length > 0 && "mt-3",
            food.cautionLevel === "attention"
              ? "text-status-attention-foreground dark:text-amber-100"
              : "text-foreground",
          )}
        >
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{food.sourceNote}</span>
        </p>
      )}
      {primarySource && (
        <p className="mt-2 text-xs text-muted-foreground">
          Source :{" "}
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={primarySource.url}
            rel="noreferrer"
            target="_blank"
          >
            {primarySource.organization}
          </a>
          {food.lastReviewedAt && <> · vérifié en {food.lastReviewedAt}</>}
        </p>
      )}
    </div>
  )
}

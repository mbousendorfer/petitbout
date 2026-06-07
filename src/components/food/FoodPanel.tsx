import { useState, useEffect, useMemo, useId } from "react"
import { createPortal } from "react-dom"
import { BookOpen, CalendarClock, CircleCheck, Clock, FileSearch, Leaf, LoaderCircle, PackageCheck, PencilLine, Plus, ShieldCheck, Trash2, Utensils, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isFoodInPack, type Food } from "@/data/foods"
import { guidanceStageFor } from "@/data/guidance"
import { foodSourceReferences } from "@/data/sources"
import { ageSummary, getStatus, isInSeason, monthNames } from "@/lib/food-utils"
import { reactions, useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { mealTimePresets, defaultMealTimePreset, reactionLabels, reactionDisplay, mealTimePresetFor, testDateTimeLabel, type MealTimePresetId } from "@/lib/formatting"
import { useAppOptions } from "@/app/AppOptions"
import { FoodEmoji } from "@/components/food/FoodEmoji"
import { StatusBadge, SeasonBadge, IntroductionBadge, PopoteBadge, SeasonMonthsGrid } from "@/components/food/FoodBadges"

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
  const { activePopotePackId } = useAppOptions()
  const foodTests = useMemo(() => store.tests.filter((item) => item.foodId === food.id), [food.id, store.tests])
  const latestFoodTest = foodTests[0]
  const [selectedTab, setSelectedTab] = useState<FoodPanelTab>(() => initialTab ?? (test ? "add" : "infos"))
  const [selectedTest, setSelectedTest] = useState<FoodTest | null>(() => test ?? null)
  const isEditing = Boolean(selectedTest)
  const [date, setDate] = useState(() => selectedTest?.date ?? new Date().toISOString().slice(0, 10))
  const [mealTime, setMealTime] = useState(() => selectedTest?.mealTime || defaultMealTimePreset.time)
  const [mealTimePreset, setMealTimePreset] = useState<MealTimePresetId>(() =>
    selectedTest?.mealTime ? mealTimePresetFor(selectedTest.mealTime) : defaultMealTimePreset.id,
  )
  const [isPopote, setIsPopote] = useState(() => selectedTest?.isPopote ?? false)
  const [reaction, setReaction] = useState<Reaction>(() => selectedTest?.reaction ?? "aucune réaction")
  const [note, setNote] = useState(() => selectedTest?.note ?? "")
  const [showNote, setShowNote] = useState(() => Boolean(selectedTest?.note))
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const titleId = useId()
  const status = getStatus(food.id, store.latestByFood)

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
    setIsPopote(false)
    setReaction("aucune réaction")
    setNote("")
    setShowNote(false)
    setConfirmingRemovalId(null)
  }

  function editTest(nextTest: FoodTest) {
    setSelectedTab("add")
    setSelectedTest(nextTest)
    setDate(nextTest.date)
    setMealTime(nextTest.mealTime || defaultMealTimePreset.time)
    setMealTimePreset(nextTest.mealTime ? mealTimePresetFor(nextTest.mealTime) : defaultMealTimePreset.id)
    setIsPopote(nextTest.isPopote)
    setReaction(nextTest.reaction)
    setNote(nextTest.note)
    setShowNote(Boolean(nextTest.note))
    setConfirmingRemovalId(null)
  }

  async function saveTest() {
    if (isSaving) return

    const nextTest = {
      foodId: food.id,
      date,
      mealTime,
      isPopote: isFoodInPack(food, activePopotePackId) ? isPopote : selectedTest?.isPopote ?? false,
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
        aria-labelledby={titleId}
        className="sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[84svh] min-h-[58svh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-t-2xl border-t bg-background shadow-lg lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:max-h-[min(820px,calc(100vh-4rem))] lg:w-[min(760px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border"
        data-side="bottom"
        data-state="open"
      >
        <div className="relative flex shrink-0 items-start gap-3 px-5 pb-3 pt-5">
          <FoodEmoji food={food} size="sm" />
          <div className="min-w-0 flex-1 pr-10">
            <h2 id={titleId} className="truncate text-lg font-semibold text-foreground">
              {food.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{food.category}</p>
          </div>
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="shrink-0 px-5 pb-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1" role="tablist" aria-label="Vue de la fiche">
            {([
              { id: "infos", label: "Infos" },
              { id: "add", label: isEditing ? "Modifier" : "Ajouter" },
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="flex min-w-0 flex-col gap-4 pb-4">
            {selectedTab === "infos" && (
            <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={status} />
              {isInSeason(food) && <SeasonBadge />}
              <IntroductionBadge level={food.level} />
              {isFoodInPack(food, activePopotePackId) && <PopoteBadge label="Popote possible" />}
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
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {isEditing ? "Modifier la prise" : "Nouvelle prise"}
                </p>
                {isEditing && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetFormForNewTest}>
                    <Plus data-icon="inline-start" aria-hidden="true" />
                    Nouvelle prise
                  </Button>
                )}
              </div>
              <div className="grid gap-4">
                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Date</span>
                  <Input
                    className="h-11 min-w-0 max-w-full bg-background/70 px-3 shadow-none"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>

                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Moment</p>
                    <p className="text-xs text-muted-foreground">{mealTime}</p>
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
                            "flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? "border-primary/25 bg-secondary text-secondary-foreground shadow-sm"
                              : "border-border bg-background/50 text-foreground hover:bg-muted",
                          )}
                          onClick={() => selectMealTimePreset(preset.id)}
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{preset.label}</span>
                            <span className="block text-xs text-muted-foreground">{preset.time}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      mealTimePreset === "custom"
                        ? "border-primary/25 bg-secondary text-secondary-foreground shadow-sm"
                        : "border-border bg-background/50 hover:bg-muted",
                    )}
                    onClick={() => selectMealTimePreset("custom")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate text-sm font-medium">Entrer l’heure</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{mealTimePreset === "custom" ? mealTime : "Libre"}</span>
                  </button>
                  {mealTimePreset === "custom" && (
                    <Input
                      className="h-11 min-w-0 max-w-full bg-background/70"
                      type="time"
                      value={mealTime}
                      onChange={(event) => setMealTime(event.target.value)}
                    />
                  )}
                </div>
              </div>
              {isFoodInPack(food, activePopotePackId) && (
                <label className="flex items-center justify-between gap-3 rounded-xl border bg-card/80 p-3 text-sm font-medium">
                  <span className="flex min-w-0 items-center gap-2">
                    <PackageCheck aria-hidden="true" />
                    Testé via une gourde Popote
                  </span>
                  <input
                    className="size-5 accent-primary"
                    type="checkbox"
                    checked={isPopote}
                    onChange={(event) => setIsPopote(event.target.checked)}
                  />
                </label>
              )}
              <div className="grid gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Réaction observée</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {reactions.map((reactionOption) => {
                    const isSelected = reaction === reactionOption
                    const display = reactionDisplay[reactionOption]

                    return (
                      <button
                        key={reactionOption}
                        type="button"
                        className={cn(
                          "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-center text-[0.625rem] font-semibold leading-none transition-colors sm:min-h-16 sm:px-1.5 sm:py-2 sm:text-[0.68rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? reactionOption === "aucune réaction"
                              ? "border-status-tested/35 bg-status-tested/12 text-status-tested shadow-sm"
                              : "border-status-reaction/35 bg-status-reaction/12 text-status-reaction shadow-sm"
                            : "border-border bg-card/70 text-muted-foreground hover:bg-muted/65 hover:text-foreground",
                        )}
                        onClick={() => setReaction(reactionOption)}
                        aria-pressed={isSelected}
                        aria-label={reactionLabels[reactionOption]}
                      >
                        <span className="text-lg leading-none" aria-hidden="true">{display.emoji}</span>
                        <span className="max-w-full truncate">{display.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  En cas de doute ou de symptôme important, demandez un avis médical.
                </p>
              </div>
              {showNote ? (
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Note
                  <Textarea
                    autoFocus
                    placeholder="Quantité, texture, contexte du repas..."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
              ) : (
                <Button type="button" variant="outline" onClick={() => setShowNote(true)}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Ajouter une note
                </Button>
              )}
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

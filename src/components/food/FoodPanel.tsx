import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, BookOpen, Calendar, CalendarClock, ChevronDown, CircleCheck, Clock, CrossIcon, FileSearch, Leaf, LoaderCircle, Plus, Scale, ShieldCheck, Utensils, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type Food } from "@/data/foods"
import { guidanceStageFor } from "@/data/guidance"
import { foodSourceReferences } from "@/data/sources"
import { ageSummary, isInSeason, monthNames } from "@/lib/food-utils"
import { noteMaxLength, reactionDetailMaxLength, reactions, useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { mealTimePresets, defaultMealTimePreset, reactionLabels, reactionDisplay, mealTimePresetFor, type MealTimePresetId } from "@/lib/formatting"
import { SeasonMonthsGrid } from "@/components/food/FoodBadges"
import { categoryMeta, isAllergenFood } from "@/components/food/categoryMeta"

export type FoodPanelTab = "add"
export function FoodTestDrawer({
  food,
  initialTab: _initialTab,
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
  const [selectedTest, setSelectedTest] = useState<FoodTest | null>(() => test ?? null)
  const isEditing = Boolean(selectedTest)
  const [date, setDate] = useState(() => selectedTest?.date ?? new Date().toISOString().slice(0, 10))
  const [mealTime, setMealTime] = useState(() => selectedTest?.mealTime || defaultMealTimePreset.time)
  const [mealTimePreset, setMealTimePreset] = useState<MealTimePresetId>(() =>
    selectedTest?.mealTime ? mealTimePresetFor(selectedTest.mealTime) : defaultMealTimePreset.id,
  )
  const [reaction, setReaction] = useState<Reaction>(() => selectedTest?.reaction ?? "Aucune")
  const [reactionDetail, setReactionDetail] = useState(() => selectedTest?.reaction === "Autre" ? selectedTest.note : "")
  const [note, setNote] = useState(() => selectedTest?.note ?? "")
  const [showReaction, setShowReaction] = useState(
    () => Boolean(selectedTest && selectedTest.reaction !== "Aucune"),
  )
  const [isSaving, setIsSaving] = useState(false)
  const reactionSummary = reaction === "Aucune" ? "Rien à signaler" : reactionLabels[reaction]
  const reactionIsSevere = reaction === "Allergie" || reaction === "Vomi"

  function currentTimeValue() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }

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

  function resetFormForNewTest() {
    setSelectedTest(null)
    setDate(new Date().toISOString().slice(0, 10))
    setMealTime(defaultMealTimePreset.time)
    setMealTimePreset(defaultMealTimePreset.id)
    setReaction("Aucune")
    setReactionDetail("")
    setNote("")
    setShowReaction(false)
  }

  async function saveTest() {
    if (isSaving) return

    const cleanNote = note.trim()
    const cleanReactionDetail = reaction === "Autre" ? reactionDetail.trim() : ""
    const nextTest = {
      foodId: food.id,
      date,
      mealTime,
      reaction,
      note: cleanReactionDetail && !cleanNote.includes(cleanReactionDetail)
        ? [cleanNote, cleanReactionDetail].filter(Boolean).join(" · ")
        : cleanNote,
    }

    setIsSaving(true)
    let didSave: boolean
    try {
      if (selectedTest) {
        didSave = await store.updateTest(selectedTest.id, nextTest)
      } else {
        didSave = await store.addTest(nextTest)
      }

      if (didSave) {
        toast.success(selectedTest ? `Prise de ${food.name} mise à jour` : `Nouvelle prise de ${food.name} ajoutée`)
      } else {
        toast.error("La synchronisation a échoué. La modification n’a pas été enregistrée.")
      }
    } finally {
      setIsSaving(false)
    }

    if (!didSave) return

    onOpenChange(false)
  }

  function selectMealTimePreset(presetId: MealTimePresetId) {
    const wasCustom = mealTimePreset === "custom"
    setMealTimePreset(presetId)

    if (presetId === "custom") {
      if (!wasCustom) setMealTime(currentTimeValue())
      return
    }

    const preset = mealTimePresets.find((item) => item.id === presetId)
    if (preset) setMealTime(preset.time)
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
        className="sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[84svh] min-h-[58svh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border-t bg-background shadow-lg lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:min-h-0 lg:max-h-[min(820px,calc(100vh-4rem))] lg:w-[min(760px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[1.75rem] lg:border"
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
          <div className="px-3 pb-3 pt-3">
            <FoodPanelOverview food={food} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 px-5 pb-4 pt-2">
            <div className="flex min-w-0 flex-col gap-5">
              {food.isAllergen && <FoodPanelAllergenCard />}
              <FoodInfoInlineNotes food={food} />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold tracking-[-0.01em]">{isEditing ? "Modifier" : "Ajouter un aliment"}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Date et moment du repas.</p>
                </div>
                {isEditing && (
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={resetFormForNewTest}>
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
                {mealTimePreset === "custom" ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 transition-colors">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate text-sm font-semibold">Heure</span>
                    </div>
                    <Input
                      className="h-9 w-[7.5rem] shrink-0 bg-background/80"
                      type="time"
                      value={mealTime}
                      aria-label="Heure de la prise"
                      onChange={(event) => setMealTime(event.target.value)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => selectMealTimePreset("custom")}
                  >
                    <Clock className="size-4 shrink-0" aria-hidden="true" />
                    Définir l’heure
                  </button>
                )}
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
                    maxLength={noteMaxLength}
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
                        reaction === "Aucune" ? "bg-muted" : "bg-status-reaction/15",
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
                                  ? reactionOption === "Aucune"
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
                          Symptôme important : demande un avis médical.
                        </p>
                      )}
                      {reaction === "Autre" && (
                        <Input
                          className="h-10 bg-background/70"
                          maxLength={reactionDetailMaxLength}
                          placeholder="Précise en quelques mots"
                          value={reactionDetail}
                          onChange={(event) => setReactionDetail(event.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur lg:pb-4">
          <div className="grid gap-2">
            <Button type="button" className="h-12 w-full" onClick={saveTest} disabled={isSaving}>
              {isSaving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {isSaving ? "Enregistrement…" : isEditing ? "Enregistrer les modifications" : "Ajouter"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

function FoodPanelOverview({ food }: { food: Food }) {
  const meta = categoryMeta[food.category]
  const CategoryIcon = meta.icon
  const inSeason = isInSeason(food)
  const seasonText = food.seasonText || monthNames(food.seasonMonths)
  const isAvailableYearRound = food.seasonMonths.length === 12

  return (
    <section className={cn("relative overflow-hidden rounded-hero border bg-card shadow-card", meta.border)}>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b to-transparent", meta.gradientFrom)}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full border border-card/70 bg-card/35"
      />

      <div className="relative p-4 sm:p-6">
        <div className="flex items-start gap-3 pr-10 sm:gap-5 sm:pr-0">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card/90 text-[2.25rem] leading-none shadow-soft ring-1 ring-border/40 sm:size-20 sm:text-[3.15rem]"
          >
            {food.emoji}
          </span>

          <div className="min-w-0 flex-1">
            <p className="break-words font-rounded text-[2rem] font-extrabold leading-none tracking-[-0.01em] text-foreground sm:text-4xl">
              {food.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border bg-card/80 px-2.5 py-1 text-xs font-bold shadow-[0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                  meta.border,
                  meta.text,
                )}
              >
                <CategoryIcon className="size-3.5 sm:size-4" aria-hidden="true" />
                {food.category}
              </span>
              {isAllergenFood(food) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-1 text-xs font-bold text-destructive shadow-sm shadow-destructive/10 ring-1 ring-destructive/10 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm">
                  <AlertTriangle className="size-3.5 sm:size-4" aria-hidden="true" />
                  Allergène
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm">
                <Calendar className="size-3.5 sm:size-4" aria-hidden="true" />
                {food.recommendedAgeInMonths}+ mois
              </span>
            </div>
          </div>
        </div>

        <div className={cn("mt-6 border-t border-border/45 pt-5", isAvailableYearRound && "pb-0")}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-status-season/10 text-status-season">
                <Leaf className="size-4" aria-hidden="true" />
              </span>
              <h3 className="truncate text-label font-bold uppercase tracking-[0.08em] text-status-season">Calendrier de saison</h3>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-label font-bold",
                inSeason ? "bg-status-season/12 text-status-season" : "bg-muted/65 text-muted-foreground",
              )}
            >
              {inSeason && <CircleCheck className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
              {seasonText}
            </span>
          </div>
          {!isAvailableYearRound && <SeasonMonthsGrid activeMonths={food.seasonMonths} />}
        </div>
      </div>
    </section>
  )
}

function FoodPanelAllergenCard() {
  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/10 p-4 shadow-soft">
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        Repère allergène
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Les repères actuels recommandent de ne pas retarder les allergènes courants une fois la diversification lancée. Introduire progressivement, en petite quantité, sous une forme adaptée à l'âge.
      </p>
      <ul className="mt-3 grid gap-1.5 text-sm leading-5 text-muted-foreground">
        {[
          "Proposer quand bébé va bien, sur un repas calme.",
          "Éviter les formes dures, entières ou collantes.",
          "En cas de terrain allergique connu, demander un avis médical.",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FoodInfoInlineNotes({ food }: { food: Food }) {
  if (!food.quantityNotes && !food.restrictionNotes) return null

  return (
    <div className="grid gap-3 px-1">
      {food.quantityNotes && (
        <FoodInfoInlineNote icon={Scale} title="Quantités" value={food.quantityNotes} />
      )}
      {food.restrictionNotes && (
        <FoodInfoInlineNote icon={AlertTriangle} title="À noter" value={food.restrictionNotes} tone="destructive" />
      )}
    </div>
  )
}

function FoodInfoInlineNote({
  icon: Icon,
  title,
  tone = "muted",
  value,
}: {
  icon: LucideIcon
  title: string
  tone?: "destructive" | "muted"
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className={cn("mt-0.5 size-5 shrink-0", tone === "destructive" ? "text-destructive" : "text-muted-foreground")}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className={cn("text-xs font-bold uppercase", tone === "destructive" ? "text-destructive" : "text-muted-foreground")}>
          {title}
        </p>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{value}</p>
      </div>
    </div>
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

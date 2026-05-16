import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useState } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import {
  Baby,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Home,
  Leaf,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  NotebookText,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { categories, foods, type Food } from "@/data/foods"
import {
  getStatus,
  isAgeReady,
  isInSeason,
  monthNames,
  suggestionReasons,
  weeklySuggestions,
} from "@/lib/food-utils"
import { useBabyStore } from "@/lib/storage"
import { cn } from "@/lib/utils"

const disclaimer =
  "Cette application est un outil personnel de suivi. Elle ne remplace pas les conseils d’un pédiatre ou professionnel de santé."

type FoodStatusFilter = "tous" | "non-testes" | "testes" | "reaction"
type IntroductionFilter = "toutes" | "conseillee" | "possible"

type FoodFilters = {
  allergensOnly: boolean
  category: FoodCategoryFilter
  introduction: IntroductionFilter
  popoteOnly: boolean
  seasonOnly: boolean
  status: FoodStatusFilter
}

type FoodCategoryFilter = "Toutes" | (typeof categories)[number]

const initialFoodFilters: FoodFilters = {
  allergensOnly: false,
  category: "Toutes",
  introduction: "toutes",
  popoteOnly: false,
  seasonOnly: false,
  status: "tous",
}

const statusFilterLabels: Record<FoodStatusFilter, string> = {
  tous: "Tous",
  "non-testes": "Non testés",
  testes: "Testés",
  reaction: "Réaction",
}

const introductionFilterLabels: Record<IntroductionFilter, string> = {
  toutes: "Toutes",
  conseillee: "Conseillée",
  possible: "Possible",
}

type ThemeMode = "light" | "system" | "dark"

const themeStorageKey = "diversibebs-theme-v1"

function App() {
  const store = useBabyStore()
  const [theme, setTheme] = useTheme()
  const suggestions = weeklySuggestions(foods, store.profile.ageMonths, store.testedFoodIds)
  const recentTests = store.tests.slice(0, 4)

  if (!store.familySession) {
    return (
      <div className="safe-shell soft-surface">
        <main className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-5">
          <FamilySetup store={store} />
        </main>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="safe-shell soft-surface">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-5">
        <Routes>
          <Route path="/" element={<HomePage store={store} suggestions={suggestions} recentTests={recentTests} />} />
          <Route path="/foods" element={<FoodsPage store={store} />} />
          <Route path="/week" element={<WeekPage suggestions={suggestions} store={store} />} />
          <Route path="/history" element={<HistoryPage store={store} />} />
          <Route path="/settings" element={<SettingsPage store={store} theme={theme} setTheme={setTheme} />} />
        </Routes>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}

function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(themeStorageKey)
    if (stored === "light" || stored === "system" || stored === "dark") return stored
    return "system"
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function applyTheme() {
      const prefersDark = mediaQuery.matches
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark))
    }

    localStorage.setItem(themeStorageKey, theme)
    applyTheme()
    mediaQuery.addEventListener("change", applyTheme)

    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme])

  return [theme, setTheme] as const
}

function FamilySetup({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const [familyCode, setFamilyCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitFamilyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!familyCode.trim()) return

    setIsSubmitting(true)
    const didConnect = await store.connectFamily(familyCode)
    setIsSubmitting(false)

    if (didConnect) {
      toast.success("Espace famille connecté")
    } else {
      toast.error("Impossible de connecter l’espace famille")
    }
  }

  return (
    <>
      <Header eyebrow="Espace partagé" title="Diversibebs" />
      <Card className="bg-card/95">
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary">
            <LockKeyhole aria-hidden="true" />
          </div>
          <CardTitle>Code famille</CardTitle>
          <CardDescription>
            Utilisez le même code sur vos deux téléphones pour partager le suivi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submitFamilyCode}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Code secret partagé
              <Input
                autoComplete="off"
                placeholder="Ex. purée-carotte-2026"
                value={familyCode}
                onChange={(event) => setFamilyCode(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={isSubmitting || !familyCode.trim() || !store.isConfigured}>
              {isSubmitting ? "Connexion..." : "Ouvrir l’espace famille"}
            </Button>
          </form>
          {!store.isConfigured && (
            <p className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              Supabase n’est pas encore configuré. Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
              dans un fichier `.env.local`.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Le code n’est pas envoyé en clair : l’app envoie uniquement son hash. Toute personne ayant ce
            code peut accéder au même suivi.
          </p>
        </CardContent>
      </Card>
      <Disclaimer />
    </>
  )
}

function HomePage({
  store,
  suggestions,
  recentTests,
}: {
  store: ReturnType<typeof useBabyStore>
  suggestions: Food[]
  recentTests: ReturnType<typeof useBabyStore>["tests"]
}) {
  return (
    <>
      <Header eyebrow="Diversification" title="Diversibebs" />
      <Card className="overflow-hidden border-primary/10 bg-card/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">
                {store.profile.childName ? `${store.profile.childName} a` : "Bébé a"} {store.profile.ageMonths} mois
              </CardTitle>
              <CardDescription>
                {store.testedFoodIds.size} aliment(s) déjà testé(s)
                {store.profile.birthDate && ` · né(e) le ${new Date(`${store.profile.birthDate}T00:00:00`).toLocaleDateString("fr-FR")}`}
              </CardDescription>
            </div>
            <div className="rounded-full bg-secondary p-3">
              <Baby aria-hidden="true" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-primary/20 bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" />
            <CardTitle>Cette semaine</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/75">
            3 à 5 idées adaptées à l’âge, non testées, avec priorité à la saison.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {suggestions.slice(0, 3).map((food) => (
            <FoodRow key={food.id} food={food} store={store} inverted />
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Derniers tests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {recentTests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun aliment marqué comme testé pour le moment.</p>
          ) : (
            recentTests.map((test) => {
              const food = foods.find((item) => item.id === test.foodId)
              if (!food) return null
              return (
                <div key={test.id} className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-medium">{food.emoji} {food.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">{new Date(test.date).toLocaleDateString("fr-FR")}</p>
                      {test.isPopote && <PopoteBadge />}
                    </div>
                  </div>
                  <StatusBadge status={test.reaction === "aucune réaction" ? "testé" : "réaction"} />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Disclaimer />
    </>
  )
}

function FoodsPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<FoodFilters>(initialFoodFilters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const normalizedQuery = query.toLowerCase().trim()

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

  const categoryCounts = useMemo(() => {
    const counts = new Map<FoodCategoryFilter, number>([["Toutes", searchableFoods.length]])
    categories.forEach((category) => {
      counts.set(category, searchableFoods.filter((food) => food.category === category).length)
    })
    return counts
  }, [searchableFoods])

  const presetCounts = useMemo(
    () => ({
      allergens: searchableFoods.filter((food) => food.tags.includes("allergène")).length,
      popote: searchableFoods.filter((food) => food.isPopoteEligible).length,
      season: searchableFoods.filter((food) => isInSeason(food)).length,
      untested: searchableFoods.filter((food) => getStatus(food.id, store.latestByFood) === "non testé").length,
    }),
    [searchableFoods, store.latestByFood],
  )

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: keyof FoodFilters; label: string; reset: Partial<FoodFilters> }> = []
    if (filters.category !== "Toutes") chips.push({ key: "category", label: filters.category, reset: { category: "Toutes" } })
    if (filters.status !== "tous") chips.push({ key: "status", label: statusFilterLabels[filters.status], reset: { status: "tous" } })
    if (filters.introduction !== "toutes") chips.push({ key: "introduction", label: `Introduction ${introductionFilterLabels[filters.introduction].toLowerCase()}`, reset: { introduction: "toutes" } })
    if (filters.seasonOnly) chips.push({ key: "seasonOnly", label: "De saison", reset: { seasonOnly: false } })
    if (filters.allergensOnly) chips.push({ key: "allergensOnly", label: "Allergènes", reset: { allergensOnly: false } })
    if (filters.popoteOnly) chips.push({ key: "popoteOnly", label: "Popote", reset: { popoteOnly: false } })
    return chips
  }, [filters])

  const hasActiveFilters = activeFilterChips.length > 0

  const filteredFoods = useMemo(() => {
    return searchableFoods
      .filter((food) => {
        const status = getStatus(food.id, store.latestByFood)
        const matchesCategory = filters.category === "Toutes" || food.category === filters.category
        const matchesStatus =
          filters.status === "tous" ||
          (filters.status === "non-testes" && status === "non testé") ||
          (filters.status === "testes" && status === "testé") ||
          (filters.status === "reaction" && status === "réaction")
        const matchesIntroduction =
          filters.introduction === "toutes" ||
          (filters.introduction === "conseillee" && food.level === "conseillé") ||
          (filters.introduction === "possible" && food.level === "possible")
        const matchesSeason = !filters.seasonOnly || isInSeason(food)
        const matchesAllergens = !filters.allergensOnly || food.tags.includes("allergène")
        const matchesPopote = !filters.popoteOnly || food.isPopoteEligible

        return matchesCategory && matchesStatus && matchesIntroduction && matchesSeason && matchesAllergens && matchesPopote
      })
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
  }, [filters, searchableFoods, store.latestByFood])

  return (
    <>
      <Header eyebrow="Catalogue" title="Aliments adaptés" />
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              className="pl-10"
              placeholder="Rechercher un aliment"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button type="button" variant={hasActiveFilters ? "default" : "outline"} onClick={() => setIsFiltersOpen(true)}>
            <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
            Filtres
            {activeFilterChips.length > 0 && <span className="rounded-full bg-background/20 px-1.5 text-xs">{activeFilterChips.length}</span>}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickFilterButton
            active={filters.status === "non-testes"}
            count={presetCounts.untested}
            label="À tester"
            onClick={() => updateFilters({ status: filters.status === "non-testes" ? "tous" : "non-testes" })}
          />
          <QuickFilterButton
            active={filters.seasonOnly}
            count={presetCounts.season}
            label="De saison"
            onClick={() => updateFilters({ seasonOnly: !filters.seasonOnly })}
          />
          <QuickFilterButton
            active={filters.popoteOnly}
            count={presetCounts.popote}
            label="Popote"
            onClick={() => updateFilters({ popoteOnly: !filters.popoteOnly })}
          />
          <QuickFilterButton
            active={filters.allergensOnly}
            count={presetCounts.allergens}
            label="Allergènes"
            onClick={() => updateFilters({ allergensOnly: !filters.allergensOnly })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{filteredFoods.length} aliment(s)</span>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-1 rounded-full px-3"
                onClick={() => updateFilters(chip.reset)}
              >
                {chip.label}
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {filteredFoods.length === 0 ? (
        <Card className="bg-card/90">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-full bg-secondary p-3">
              <Search aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">Aucun aliment trouvé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Essayez d’enlever un filtre ou de modifier la recherche.
              </p>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Enlever les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredFoods.map((food) => (
            <FoodCard key={food.id} food={food} store={store} />
          ))}
        </div>
      )}

      <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DrawerContent side="bottom" className="flex h-[88svh] max-h-[88svh] flex-col gap-0 p-0">
          <DrawerHeader className="shrink-0 px-6 pb-4 pt-6">
            <DrawerTitle>Filtres</DrawerTitle>
            <DrawerDescription>Croisez les critères pour trouver le prochain aliment à tester.</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="min-h-0 flex-1 px-6">
            <div className="flex flex-col gap-5 pb-6 pr-3">
              <FilterSection title="Catégorie">
                <div className="grid grid-cols-2 gap-2">
                  {(["Toutes", ...categories] as FoodCategoryFilter[]).map((category) => (
                    <FilterChoice
                      key={category}
                      active={filters.category === category}
                      count={categoryCounts.get(category) ?? 0}
                      label={category}
                      onClick={() => updateFilters({ category })}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Statut de test">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(statusFilterLabels) as FoodStatusFilter[]).map((status) => (
                    <FilterChoice
                      key={status}
                      active={filters.status === status}
                      label={statusFilterLabels[status]}
                      onClick={() => updateFilters({ status })}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Introduction">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(introductionFilterLabels) as IntroductionFilter[]).map((introduction) => (
                    <FilterChoice
                      key={introduction}
                      active={filters.introduction === introduction}
                      label={introductionFilterLabels[introduction]}
                      onClick={() => updateFilters({ introduction })}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Options">
                <div className="grid grid-cols-1 gap-2">
                  <FilterToggle active={filters.seasonOnly} count={presetCounts.season} label="De saison" onClick={() => updateFilters({ seasonOnly: !filters.seasonOnly })} />
                  <FilterToggle active={filters.allergensOnly} count={presetCounts.allergens} label="Allergènes" onClick={() => updateFilters({ allergensOnly: !filters.allergensOnly })} />
                  <FilterToggle active={filters.popoteOnly} count={presetCounts.popote} label="Popote" onClick={() => updateFilters({ popoteOnly: !filters.popoteOnly })} />
                </div>
              </FilterSection>
            </div>
          </ScrollArea>
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <Button type="button" variant="outline" onClick={resetFilters} disabled={!hasActiveFilters}>
              Réinitialiser
            </Button>
            <Button type="button" onClick={() => setIsFiltersOpen(false)}>
              Voir {filteredFoods.length}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function QuickFilterButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className={cn("h-auto justify-between px-3 py-2", active && "shadow-sm")}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-background/20" : "bg-muted text-muted-foreground")}>
        {count}
      </span>
    </Button>
  )
}

function FilterSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function FilterChoice({
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
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className="h-auto justify-between whitespace-normal px-3 py-2 text-left"
      onClick={onClick}
    >
      <span className="min-w-0 truncate">{label}</span>
      {typeof count === "number" && (
        <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-background/20" : "bg-muted text-muted-foreground")}>
          {count}
        </span>
      )}
    </Button>
  )
}

function FilterToggle({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-3 text-left text-sm font-medium transition-colors",
        active && "border-primary bg-primary/10 text-primary",
      )}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        <span className={cn("size-5 rounded-full border", active && "border-primary bg-primary shadow-inner")} aria-hidden="true" />
      </span>
    </button>
  )
}

function WeekPage({
  suggestions,
  store,
}: {
  suggestions: Food[]
  store: ReturnType<typeof useBabyStore>
}) {
  const [discardedSuggestionIds, setDiscardedSuggestionIds] = useState<string[]>([])
  const visibleSuggestions = suggestions.filter((food) => !discardedSuggestionIds.includes(food.id))
  const topFood = visibleSuggestions[0]
  const alternatives = visibleSuggestions.slice(1, 3)
  const weeklyPlan = visibleSuggestions.slice(1)

  function postponeTopFood() {
    if (!topFood) return
    setDiscardedSuggestionIds((current) => [...current, topFood.id])
    toast.info(`${topFood.name} proposé plus tard`)
  }

  return (
    <>
      <Header eyebrow="Conseil" title="Cette semaine" />
      {topFood ? (
        <>
          <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/10">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-primary-foreground/80">
                    <Sparkles className="size-4" aria-hidden="true" />
                    À tester en priorité
                  </div>
                  <CardTitle className="text-3xl">{topFood.emoji} {topFood.name}</CardTitle>
                  <CardDescription className="mt-2 text-primary-foreground/75">
                    Le meilleur choix maintenant : adapté à l’âge, non testé, et priorisé par saison / introduction.
                  </CardDescription>
                </div>
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-foreground/14 text-4xl" aria-hidden="true">
                  {topFood.emoji}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-md bg-primary-foreground/10 p-4 text-sm leading-6 text-primary-foreground/85">
                {topFood.preparation}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="h-8 bg-primary-foreground text-primary px-3">priorité n°1</Badge>
                {isInSeason(topFood) && <SeasonBadge />}
                <IntroductionBadge level={topFood.level} />
                {topFood.isPopoteEligible && <PopoteBadge label="Popote possible" />}
              </div>
              <div className="grid gap-3 rounded-md bg-primary-foreground/10 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-sm text-primary-foreground/80">
                  Faites-le simple : un petit test, puis notez seulement si quelque chose mérite d’être retenu.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button type="button" variant="ghost" className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={postponeTopFood}>
                    Plus tard
                  </Button>
                  <FoodDetail food={topFood} store={store} inverted />
                </div>
              </div>
            </CardContent>
          </Card>

          {alternatives.length > 0 && (
            <Card className="bg-card/90">
              <CardHeader className="pb-3">
                <CardTitle>Options aussi pertinentes</CardTitle>
                <CardDescription>À garder sous la main si le repas du jour s’y prête mieux.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {alternatives.map((food) => (
                  <FoodRow key={food.id} food={food} store={store} />
                ))}
              </CardContent>
            </Card>
          )}

          {weeklyPlan.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan léger</p>
                  <h2 className="text-xl font-semibold">Le reste de la semaine</h2>
                </div>
                <Badge variant="secondary" className="h-8 px-3">{weeklyPlan.length} idées</Badge>
              </div>
              {weeklyPlan.map((food) => (
                <WeekSuggestionCard key={food.id} food={food} store={store} />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="bg-card/90">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-full bg-secondary p-3">
              <Check aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">Tout est à jour</p>
              <p className="mt-1 text-sm text-muted-foreground">Aucune suggestion nouvelle pour cette semaine.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function WeekSuggestionCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  return (
    <Card className="bg-card/90">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{food.emoji} {food.name}</CardTitle>
            <CardDescription>{food.preparation}</CardDescription>
          </div>
          <FoodDetail food={food} store={store} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {suggestionReasons(food).map((reason) =>
          reason === "de saison" ? (
            <SeasonBadge key={reason} />
          ) : reason.startsWith("introduction") ? (
            <IntroductionBadge key={reason} level={food.level} />
          ) : (
            <Badge key={reason} variant="secondary" className="h-8 px-3">
              {reason}
            </Badge>
          ),
        )}
      </CardContent>
    </Card>
  )
}

function HistoryPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  return (
    <>
      <Header eyebrow="Journal" title="Historique" />
      <Card className="bg-card/90">
        <CardContent className="flex flex-col gap-4 pt-5">
          {store.tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Les tests ajoutés apparaîtront ici par ordre récent.</p>
          ) : (
            store.tests.map((test, index) => {
              const food = foods.find((item) => item.id === test.foodId)
              if (!food) return null
              return (
                <div key={test.id} className="grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 rounded-full bg-primary p-1.5 text-primary-foreground">
                      <Check aria-hidden="true" />
                    </span>
                    {index < store.tests.length - 1 && <span className="min-h-10 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{food.emoji} {food.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(test.date).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <p className="text-sm text-muted-foreground">{test.reaction}</p>
                      {test.isPopote && <PopoteBadge />}
                    </div>
                    {test.note && <p className="mt-2 rounded-md bg-muted p-3 text-sm">{test.note}</p>}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </>
  )
}

function SettingsPage({
  store,
  theme,
  setTheme,
}: {
  store: ReturnType<typeof useBabyStore>
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const familyCodeLabel = store.familySession?.familyCodeLabel ?? ""
  const shouldShowSyncStatus = ["loading", "syncing", "offline", "error"].includes(store.syncStatus)

  useEffect(() => {
    setChildName(store.profile.childName)
    setBirthDate(store.profile.birthDate)
  }, [store.profile.birthDate, store.profile.childName])

  async function copyFamilyCode() {
    if (!familyCodeLabel) {
      toast.error("Code famille indisponible sur cet appareil")
      return
    }

    await navigator.clipboard.writeText(familyCodeLabel)
    toast.success("Code famille copié")
  }

  function saveName() {
    if (childName.trim() === store.profile.childName) return
    void store.updateProfile({ childName: childName.trim() })
  }

  function saveBirthDate(value: string) {
    setBirthDate(value)
    void store.updateProfile({ birthDate: value })
  }

  return (
    <>
      <Header eyebrow="Préférences" title="Réglages" />

      {shouldShowSyncStatus && (
        <p className="rounded-md border bg-card/80 p-3 text-sm text-muted-foreground">
          {store.syncStatus === "loading" && "Chargement des données partagées..."}
          {store.syncStatus === "syncing" && "Synchronisation en cours..."}
          {store.syncStatus === "offline" && "Hors ligne, cache local affiché."}
          {store.syncStatus === "error" && "La synchronisation est à vérifier."}
        </p>
      )}

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Enfant</CardTitle>
          <CardDescription>Ces informations sont partagées dans l’espace famille.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nom de l’enfant
            <Input
              placeholder="Ex. Alba"
              value={childName}
              onBlur={saveName}
              onChange={(event) => setChildName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Date de naissance
            <Input type="date" value={birthDate} onChange={(event) => saveBirthDate(event.target.value)} />
          </label>
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Espace famille</CardTitle>
          <CardDescription>
            {familyCodeLabel || "Le code original n’est pas disponible sur cet appareil."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button type="button" variant="outline" onClick={copyFamilyCode} disabled={!familyCodeLabel}>
            <Copy data-icon="inline-start" aria-hidden="true" />
            Copier l’identifiant
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={() => void store.refresh()}>
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Rafraîchir
            </Button>
            <Button type="button" variant="ghost" onClick={() => store.disconnectFamily()}>
              <LogOut data-icon="inline-start" aria-hidden="true" />
              Changer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>Le thème reste propre à cet appareil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-1">
            <ThemeButton active={theme === "light"} icon={Sun} label="Clair" onClick={() => setTheme("light")} />
            <ThemeButton active={theme === "system"} icon={Monitor} label="Système" onClick={() => setTheme("system")} />
            <ThemeButton active={theme === "dark"} icon={Moon} label="Sombre" onClick={() => setTheme("dark")} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Sun
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} className="h-12 flex-col gap-1 px-2 text-xs" onClick={onClick}>
      <Icon aria-hidden="true" />
      {label}
    </Button>
  )
}

function FoodCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const status = getStatus(food.id, store.latestByFood)

  const [open, setOpen] = useState(false)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <Card
        className="cursor-pointer bg-card/90 transition-colors hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl" aria-hidden="true">
                {food.emoji}
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate">{food.name}</CardTitle>
                <CardDescription>{food.category} · dès {food.minAgeMonths} mois</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                setOpen(true)
              }}
              aria-label={`Marquer ${food.name} comme testé`}
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Tester
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <StatusBadge status={status} />
          {isInSeason(food) && <SeasonBadge />}
          <IntroductionBadge level={food.level} />
          {food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
        </CardContent>
      </Card>
      <FoodTestDrawer food={food} store={store} open={open} onOpenChange={setOpen} />
    </>
  )
}

function FoodRow({
  food,
  store,
  inverted = false,
}: {
  food: Food
  store: ReturnType<typeof useBabyStore>
  inverted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-background/12 p-3">
      <div className="min-w-0">
        <p className={cn("font-medium", inverted && "text-primary-foreground")}>
          <span aria-hidden="true">{food.emoji}</span> {food.name}
        </p>
        <p className={cn("truncate text-sm text-muted-foreground", inverted && "text-primary-foreground/70")}>
          {suggestionReasons(food).slice(0, 2).join(" · ")}
        </p>
      </div>
      <FoodDetail food={food} store={store} compact inverted={inverted} />
    </div>
  )
}

function FoodDetail({
  food,
  store,
  compact = false,
  inverted = false,
}: {
  food: Food
  store: ReturnType<typeof useBabyStore>
  compact?: boolean
  inverted?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant={inverted ? "secondary" : compact ? "outline" : "default"}
        size={compact ? "icon" : "sm"}
        onClick={() => setOpen(true)}
        aria-label={compact ? `Voir ${food.name}` : `Marquer ${food.name} comme testé`}
      >
        {compact ? <ChevronRight aria-hidden="true" /> : <><Plus data-icon="inline-start" aria-hidden="true" /> Tester</>}
      </Button>
      <FoodTestDrawer food={food} store={store} open={open} onOpenChange={setOpen} />
    </>
  )
}

function FoodTestDrawer({
  food,
  onOpenChange,
  open,
  store,
}: {
  food: Food
  onOpenChange: (open: boolean) => void
  open: boolean
  store: ReturnType<typeof useBabyStore>
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isPopote, setIsPopote] = useState(false)
  const [note, setNote] = useState("")
  const [showNote, setShowNote] = useState(false)
  const status = getStatus(food.id, store.latestByFood)

  async function saveTest() {
    await store.addTest({ foodId: food.id, date, isPopote: food.isPopoteEligible && isPopote, reaction: "aucune réaction", note })
    toast.success(`${food.name} ajouté à l’historique`)
    onOpenChange(false)
    setIsPopote(false)
    setNote("")
    setShowNote(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent side="bottom" className="flex h-[90svh] max-h-[90svh] flex-col gap-0 p-0">
          <DrawerHeader className="shrink-0 px-6 pb-4 pt-6">
            <DrawerTitle>{food.emoji} {food.name}</DrawerTitle>
            <DrawerDescription>
              {food.category} · adapté dès {food.minAgeMonths} mois
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="min-h-0 flex-1 px-6">
            <div className="flex flex-col gap-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pr-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={status} />
                {isInSeason(food) && <SeasonBadge />}
                <IntroductionBadge level={food.level} />
                {food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
                <Badge variant="outline" className="h-8 max-w-full gap-1.5 truncate px-3">
                  {monthNames(food.seasonMonths)}
                </Badge>
              </div>
              <p className="rounded-md bg-muted p-4 text-sm leading-6">{food.preparation}</p>
              <Separator />
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Date
                  <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </label>
                {food.isPopoteEligible && (
                  <label className="flex items-center justify-between gap-3 rounded-md border bg-card p-3 text-sm font-medium">
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
                <Button type="button" onClick={saveTest}>
                  Marquer comme testé
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "réaction") return <Badge variant="destructive" className="h-8 px-3">réaction</Badge>
  if (status === "testé") return <Badge className="h-8 px-3">testé</Badge>
  return <Badge variant="outline" className="h-8 px-3">non testé</Badge>
}

function SeasonBadge() {
  return (
    <Badge className="h-8 gap-1.5 border-emerald-500/25 bg-emerald-500 px-3 text-white shadow-sm shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950">
      <Leaf className="size-4" aria-hidden="true" />
      de saison
    </Badge>
  )
}

function IntroductionBadge({ level }: { level: Food["level"] }) {
  const label = level === "conseillé" ? "introduction conseillée" : "introduction possible"

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-8 px-3",
        level === "conseillé"
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
      )}
    >
      {label}
    </Badge>
  )
}

function PopoteBadge({ label = "Popote" }: { label?: string }) {
  return (
    <Badge variant="outline" className="h-8 gap-1.5 border-sky-500/25 bg-sky-500/10 px-3 text-sky-800 dark:text-sky-200">
      <PackageCheck className="size-4" aria-hidden="true" />
      {label}
    </Badge>
  )
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="flex flex-col gap-1 pt-2">
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
    </header>
  )
}

function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={cn("rounded-md border bg-card/80 p-4 text-sm leading-6 text-muted-foreground", compact && "p-3 text-xs")}>
      {disclaimer}
    </p>
  )
}

function BottomNav() {
  const items = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/foods", label: "Aliments", icon: Leaf },
    { to: "/week", label: "Semaine", icon: CalendarDays },
    { to: "/history", label: "Journal", icon: NotebookText },
    { to: "/settings", label: "Réglages", icon: Settings },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-xl border-t bg-background/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground",
                isActive && "bg-secondary text-secondary-foreground",
              )
            }
          >
            <item.icon aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default App

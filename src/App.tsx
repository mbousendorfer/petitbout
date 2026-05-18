import { createContext, lazy, memo, Suspense, type ReactNode, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom"
import {
  Baby,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Cookie,
  Copy,
  Download,
  Home,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  NotebookText,
  Award,
  PackageCheck,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InstallPrompt } from "@/components/InstallPrompt"
import { PwaStatus } from "@/components/PwaStatus"
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
import { foodSourceReferences, reviewedAt, sourcesByTheme } from "@/data/sources"
import {
  getStatus,
  ageSummary,
  isAgeReady,
  isInSeason,
  monthNames,
  weeklySuggestions,
} from "@/lib/food-utils"
import {
  calculateBadges,
  readBadgeUnlockDates,
  writeBadgeUnlockDates,
  type BadgeUnlockDates,
} from "@/lib/gamification"
import { reactions, useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"

const disclaimer =
  "Cette application est un outil personnel de suivi. Elle ne remplace pas les conseils d’un pédiatre ou professionnel de santé."

const DiscoveriesPage = lazy(() =>
  import("@/components/DiscoveriesPage").then((module) => ({ default: module.DiscoveriesPage })),
)

type FoodStatusFilter = "tous" | "non-testes" | "testes" | "reaction"
type IntroductionFilter = "toutes" | "conseillee" | "possible"
type MealTimePresetId = "breakfast" | "lunch" | "snack" | "dinner" | "custom"

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
const appOptionsStorageKey = "diversibebs-options-v1"

const mealTimePresets: Array<{
  icon: typeof Clock
  id: Exclude<MealTimePresetId, "custom">
  label: string
  time: string
}> = [
  { icon: Coffee, id: "breakfast", label: "Petit déjeuner", time: "08:00" },
  { icon: Utensils, id: "lunch", label: "Déjeuner", time: "12:00" },
  { icon: Cookie, id: "snack", label: "Goûter", time: "16:00" },
  { icon: Moon, id: "dinner", label: "Dîner", time: "19:00" },
]

const defaultMealTimePreset = mealTimePresets[1]

const reactionLabels: Record<Reaction, string> = {
  "aucune réaction": "RAS",
  "digestion difficile": "Digestion",
  rougeur: "Rougeur",
  vomissement: "Vomissement",
  autre: "Autre",
}

const reactionDisplay: Record<Reaction, { emoji: string; label: string }> = {
  "aucune réaction": { emoji: "😊", label: "RAS" },
  "digestion difficile": { emoji: "😣", label: "Digestion" },
  rougeur: { emoji: "🔴", label: "Rougeur" },
  vomissement: { emoji: "🤢", label: "Vomi" },
  autre: { emoji: "✍️", label: "Autre" },
}

type AppOptions = {
  popoteEnabled: boolean
  setPopoteEnabled: (enabled: boolean) => void
}

const AppOptionsContext = createContext<AppOptions | null>(null)

function App() {
  const store = useBabyStore()
  useScrollToTopOnRoute(store.familySession?.familyCodeHash ?? "")
  const [theme, setTheme] = useTheme()
  const appOptions = useStoredAppOptions()
  const badgeUnlockDates = useBadgeUnlockDates(store.tests, store.syncStatus)
  const suggestions = weeklySuggestions(foods, store.profile.ageMonths, store.testedFoodIds)
  const recentTests = store.tests.slice(0, 4)

  if (!store.familySession) {
    return (
      <AppOptionsContext.Provider value={appOptions}>
        <div className="safe-shell soft-surface">
          <main className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col justify-center gap-5 px-4 py-5 sm:px-6">
            <FamilySetup store={store} />
          </main>
          <Toaster />
        </div>
      </AppOptionsContext.Provider>
    )
  }

  return (
    <AppOptionsContext.Provider value={appOptions}>
      <div className="safe-shell soft-surface lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <DesktopNav />
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5 sm:px-6 lg:mx-0 lg:max-w-6xl lg:px-0 lg:py-8">
          <PwaStatus />
          <Routes>
            <Route path="/" element={<HomePage store={store} suggestions={suggestions} recentTests={recentTests} />} />
            <Route path="/foods" element={<FoodsPage store={store} />} />
            <Route path="/week" element={<Navigate to="/" replace />} />
            <Route path="/history" element={<HistoryPage store={store} />} />
            <Route
              path="/discoveries"
              element={
                <Suspense fallback={<PageLoading label="Découvertes" />}>
                  <DiscoveriesPage tests={store.tests} badgeUnlockDates={badgeUnlockDates} />
                </Suspense>
              }
            />
            <Route path="/settings" element={<SettingsPage store={store} theme={theme} setTheme={setTheme} />} />
          </Routes>
        </main>
        <BottomNav />
        <Toaster />
      </div>
    </AppOptionsContext.Provider>
  )
}

function useScrollToTopOnRoute(sessionKey: string) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, sessionKey])
}

function PageLoading({ label }: { label: string }) {
  return (
    <>
      <Header eyebrow="Chargement" title={label} />
      <Card className="paper-surface">
        <CardContent className="py-8 text-sm text-muted-foreground" aria-live="polite">
          Préparation de la page...
        </CardContent>
      </Card>
    </>
  )
}

function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(themeStorageKey)
      if (stored === "light" || stored === "system" || stored === "dark") return stored
    } catch {
      return "system"
    }
    return "system"
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function applyTheme() {
      const prefersDark = mediaQuery.matches
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark))
    }

    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Theme persistence is a local preference; keep the session usable if storage is unavailable.
    }
    applyTheme()
    mediaQuery.addEventListener("change", applyTheme)

    return () => mediaQuery.removeEventListener("change", applyTheme)
  }, [theme])

  return [theme, setTheme] as const
}

function useStoredAppOptions() {
  const [popoteEnabled, setPopoteEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(appOptionsStorageKey)
      if (!stored) return true

      const parsed = JSON.parse(stored) as Partial<Pick<AppOptions, "popoteEnabled">>
      return parsed.popoteEnabled !== false
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(appOptionsStorageKey, JSON.stringify({ popoteEnabled }))
    } catch {
      // Local display preference; the app remains usable without persistence.
    }
  }, [popoteEnabled])

  return useMemo(() => ({ popoteEnabled, setPopoteEnabled }), [popoteEnabled])
}

function useAppOptions() {
  const options = useContext(AppOptionsContext)
  if (!options) throw new Error("AppOptionsContext is missing")
  return options
}

function mealTimePresetFor(time: string): MealTimePresetId {
  return mealTimePresets.find((preset) => preset.time === time)?.id ?? "custom"
}

function mealTimeLabel(time: string) {
  if (!time) return ""

  const preset = mealTimePresets.find((item) => item.time === time)
  return preset ? preset.label.toLowerCase() : time
}

function testDateTimeLabel(test: FoodTest) {
  const date = new Date(`${test.date}T00:00:00`).toLocaleDateString("fr-FR")
  const time = mealTimeLabel(test.mealTime)

  return time ? `${date} · ${time}` : date
}

function useBadgeUnlockDates(
  tests: ReturnType<typeof useBabyStore>["tests"],
  syncStatus: ReturnType<typeof useBabyStore>["syncStatus"],
) {
  const [unlockDates, setUnlockDates] = useState<BadgeUnlockDates>(() => readBadgeUnlockDates())
  const hasCheckedExistingBadges = useRef(false)

  useEffect(() => {
    if (syncStatus === "loading") return

    const badges = calculateBadges(foods, tests, unlockDates)
    const newlyUnlocked = badges.filter((badge) => badge.unlocked && !unlockDates[badge.id])

    if (newlyUnlocked.length === 0) {
      hasCheckedExistingBadges.current = true
      return
    }

    const unlockedAt = new Date().toISOString()
    const nextUnlockDates = { ...unlockDates }
    newlyUnlocked.forEach((badge) => {
      nextUnlockDates[badge.id] = unlockedAt
    })

    setUnlockDates(nextUnlockDates)
    writeBadgeUnlockDates(nextUnlockDates)

    if (hasCheckedExistingBadges.current) {
      newlyUnlocked.slice(0, 3).forEach((badge) => {
        toast.success(`Badge débloqué : ${badge.name}`)
      })
    }

    hasCheckedExistingBadges.current = true
  }, [syncStatus, tests, unlockDates])

  return unlockDates
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
      <HeroPanel icon={LockKeyhole}>
        <p className="text-sm font-semibold text-muted-foreground">Carnet de découvertes</p>
        <h2 className="mt-1 text-2xl font-semibold">Un suivi doux, partagé et toujours sous la main.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Connectez l’espace famille ou continuez en local pour noter les essais simplement.
        </p>
      </HeroPanel>
      <Card className="paper-surface">
        <CardHeader>
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
            <Button type="submit" disabled={isSubmitting || !familyCode.trim()}>
              {isSubmitting ? "Connexion..." : store.isConfigured ? "Ouvrir l’espace famille" : "Continuer en local"}
            </Button>
          </form>
          {!store.isConfigured && (
            <p className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              Mode local disponible. Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
              dans `.env.local` pour activer le partage entre appareils.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Le code n’est pas envoyé en clair : l’app envoie uniquement son hash. Toute personne ayant ce
            code peut accéder au même suivi.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("stagger-list", className)}>
      {children}
    </div>
  )
}

function AnimatedListItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("stagger-list-item", className)}>
      {children}
    </div>
  )
}

function HeroPanel({
  children,
  className,
  icon: Icon,
}: {
  children: ReactNode
  className?: string
  icon: LucideIcon
}) {
  return (
    <section className={cn("paper-surface soft-ring overflow-hidden rounded-2xl p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm" aria-hidden="true">
          <Icon className="size-5" />
        </span>
      </div>
    </section>
  )
}

function SectionHeader({
  action,
  eyebrow,
  title,
}: {
  action?: ReactNode
  eyebrow?: string
  title: string
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-semibold text-muted-foreground">{eyebrow}</p>}
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function EmptyState({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <Card className="paper-surface">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{children}</p>
        </div>
        {action}
      </CardContent>
    </Card>
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
  const { popoteEnabled } = useAppOptions()
  const [discardedSuggestionIds, setDiscardedSuggestionIds] = useState<string[]>([])
  const visibleSuggestions = suggestions.filter((food) => !discardedSuggestionIds.includes(food.id))
  const topFood = visibleSuggestions[0]
  const weeklyPlan = visibleSuggestions.slice(1)

  function postponeTopFood() {
    if (!topFood) return
    setDiscardedSuggestionIds((current) => [...current, topFood.id])
    toast.info(`${topFood.name} proposé plus tard`)
  }

  return (
    <>
      <Header eyebrow="Diversification" title="Cette semaine" />
      <Disclaimer compact />
      <HeroPanel icon={Baby}>
        <p className="text-sm font-semibold text-muted-foreground">
          {store.profile.childName ? `${store.profile.childName}, ${store.profile.ageMonths} mois` : `Bébé, ${store.profile.ageMonths} mois`}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal">Le prochain aliment à tester</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {store.testedFoodIds.size} aliment(s) déjà noté(s). Chaque bébé avance à son rythme.
          {store.profile.birthDate && ` Né(e) le ${new Date(`${store.profile.birthDate}T00:00:00`).toLocaleDateString("fr-FR")}.`}
        </p>
      </HeroPanel>

      {topFood ? (
        <>
          <div className="flex flex-col gap-3">
            <SectionHeader
              eyebrow="Priorité douce"
              title="À tester en priorité"
              action={<Button type="button" variant="outline" size="sm" onClick={postponeTopFood}>
                <RefreshCw data-icon="inline-start" aria-hidden="true" />
                Plus tard
              </Button>}
            />
            <FoodCard food={topFood} store={store} />
          </div>

          {weeklyPlan.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionHeader
                eyebrow="Plan léger"
                title="Le reste de la semaine"
                action={<Badge variant="secondary" className="h-8 px-3">{weeklyPlan.length} idées</Badge>}
              />
              <AnimatedList className="grid gap-3 lg:grid-cols-2">
                {weeklyPlan.map((food) => (
                  <AnimatedListItem key={food.id}>
                    <FoodCard food={food} store={store} />
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Check} title="Tout est à jour">
          Aucune suggestion nouvelle pour cette semaine. Continuez tranquillement avec les aliments déjà repérés.
        </EmptyState>
      )}

      <Card className="paper-surface">
        <CardHeader>
          <CardTitle>Derniers tests</CardTitle>
          <CardDescription>Notez simplement ce que vous observez, sans chercher la perfection.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {recentTests.length === 0 ? (
            <p className="rounded-lg bg-muted/55 p-3 text-sm leading-5 text-muted-foreground">
              Aucun aliment marqué comme testé pour le moment.
            </p>
          ) : (
            <AnimatedList className="grid gap-3 lg:grid-cols-2">
              {recentTests.map((test) => {
              const food = foods.find((item) => item.id === test.foodId)
              if (!food) return null
              return (
                <AnimatedListItem key={test.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">{testDateTimeLabel(test)}</p>
                      {popoteEnabled && test.isPopote && <PopoteBadge />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={test.reaction === "aucune réaction" ? "testé" : "réaction"} />
                    <FoodDetail food={food} store={store} test={test} compact />
                  </div>
                </AnimatedListItem>
              )
            })}
            </AnimatedList>
          )}
        </CardContent>
      </Card>

    </>
  )
}

function FoodsPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const { popoteEnabled } = useAppOptions()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<FoodFilters>(initialFoodFilters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const normalizedQuery = query.toLowerCase().trim()

  useEffect(() => {
    if (!popoteEnabled && filters.popoteOnly) updateFilters({ popoteOnly: false })
  }, [filters.popoteOnly, popoteEnabled])

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
      popote: popoteEnabled ? searchableFoods.filter((food) => food.isPopoteEligible).length : 0,
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
    if (popoteEnabled && filters.popoteOnly) chips.push({ key: "popoteOnly", label: "Popote", reset: { popoteOnly: false } })
    return chips
  }, [filters, popoteEnabled])

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
        const matchesPopote = !popoteEnabled || !filters.popoteOnly || food.isPopoteEligible

        return matchesCategory && matchesStatus && matchesIntroduction && matchesSeason && matchesAllergens && matchesPopote
      })
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
  }, [filters, popoteEnabled, searchableFoods, store.latestByFood])

  return (
    <>
      <Header eyebrow="Catalogue" title="Aliments adaptés" />
      <p className="text-sm leading-6 text-muted-foreground">
        Retrouvez vite les idées adaptées à l’âge, au statut de test et à la saison.
      </p>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
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
          <Button
            type="button"
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={() => setIsFiltersOpen(true)}
            aria-haspopup="dialog"
          >
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
          {popoteEnabled && (
            <QuickFilterButton
              active={filters.popoteOnly}
              count={presetCounts.popote}
              label="Popote"
              onClick={() => updateFilters({ popoteOnly: !filters.popoteOnly })}
            />
          )}
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
        <AnimatedList className="grid gap-3 lg:grid-cols-2">
          {filteredFoods.map((food) => (
            <AnimatedListItem key={food.id}>
              <FoodCard food={food} store={store} />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      )}

      <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DrawerContent side="bottom" className="flex h-[88svh] max-h-[88svh] flex-col gap-0 p-0 lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:h-auto lg:max-h-[min(760px,calc(100vh-4rem))] lg:w-[min(720px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border">
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
                  {popoteEnabled && <FilterToggle active={filters.popoteOnly} count={presetCounts.popote} label="Popote" onClick={() => updateFilters({ popoteOnly: !filters.popoteOnly })} />}
                </div>
              </FilterSection>
            </div>
          </ScrollArea>
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pb-4">
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
      className={cn("h-auto min-h-12 justify-between rounded-xl px-3 py-2", active && "shadow-sm")}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-background/20" : "bg-muted/80 text-muted-foreground")}>
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
      className="h-auto min-h-11 justify-between whitespace-normal rounded-xl px-3 py-2 text-left"
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
      role="switch"
      aria-checked={active}
      className={cn(
        "flex min-h-12 touch-manipulation items-center justify-between gap-3 rounded-xl border bg-card/80 px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "border-primary/35 bg-secondary text-secondary-foreground",
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

function HistoryPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const { popoteEnabled } = useAppOptions()

  return (
    <>
      <Header eyebrow="Journal" title="Historique" />
      {store.tests.length === 0 ? (
        <EmptyState icon={NotebookText} title="Journal encore vide">
          Les tests ajoutés apparaîtront ici par ordre récent, avec vos notes et réactions.
        </EmptyState>
      ) : (
        <AnimatedList className="grid gap-3 lg:grid-cols-2">
          {store.tests.map((test) => {
              const food = foods.find((item) => item.id === test.foodId)
              if (!food) return null
              const status = test.reaction === "aucune réaction" ? "testé" : "réaction"
              return (
                <AnimatedListItem key={test.id}>
                  <Card className="paper-surface overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FoodEmoji food={food} />
                        <div className="min-w-0">
                          <CardTitle className="truncate">{food.name}</CardTitle>
                          <CardDescription>{food.category} · {ageSummary(food)}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={status} />
                        {isInSeason(food) && <SeasonBadge />}
                        <IntroductionBadge level={food.level} />
                        {popoteEnabled && test.isPopote && <PopoteBadge />}
                      </div>
                      <div className="mt-3 rounded-xl border bg-muted/35 p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Dernier test</p>
                        <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Clock className="size-4" aria-hidden="true" />
                            <span>{testDateTimeLabel(test)}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span aria-hidden="true">{reactionDisplay[test.reaction].emoji}</span>
                            <span>{reactionLabels[test.reaction]}</span>
                          </p>
                        </div>
                      </div>
                      {test.note && <p className="mt-3 rounded-xl bg-muted/65 p-3 text-sm leading-5">{test.note}</p>}
                      <HistoryTestActions food={food} store={store} test={test} />
                    </CardContent>
                  </Card>
                </AnimatedListItem>
              )
            })}
        </AnimatedList>
      )}
    </>
  )
}

function HistoryTestActions({
  food,
  store,
  test,
}: {
  food: Food
  store: ReturnType<typeof useBabyStore>
  test: FoodTest
}) {
  const [open, setOpen] = useState(false)
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)

  async function removeTest() {
    if (!confirmingRemoval) {
      setConfirmingRemoval(true)
      return
    }

    await store.deleteTest(test.id)
    toast.success(`${food.name} retiré du journal`)
    setConfirmingRemoval(false)
  }

  useEffect(() => {
    if (!confirmingRemoval) return
    const timeout = window.setTimeout(() => setConfirmingRemoval(false), 3500)
    return () => window.clearTimeout(timeout)
  }, [confirmingRemoval])

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="default"
          className="h-11 min-h-11 w-full px-3"
          onClick={() => setOpen(true)}
          aria-label={`Modifier le test de ${food.name}`}
        >
          <PencilLine data-icon="inline-start" aria-hidden="true" />
          Modifier
        </Button>
        <Button
          type="button"
          variant={confirmingRemoval ? "destructive" : "outline"}
          className="h-11 min-h-11 w-full px-3"
          onClick={removeTest}
          aria-label={confirmingRemoval ? `Confirmer le retrait de ${food.name}` : `Retirer ${food.name} du journal`}
        >
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          {confirmingRemoval ? "Confirmer" : "Retirer"}
        </Button>
      </div>
      {open && <FoodTestDrawer food={food} store={store} test={test} open={open} onOpenChange={setOpen} />}
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
  const { popoteEnabled, setPopoteEnabled } = useAppOptions()
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const [isSavingChildProfile, setIsSavingChildProfile] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const familyCodeLabel = store.familySession?.familyCodeLabel ?? ""
  const shouldShowSyncStatus = ["loading", "syncing", "offline", "error", "not-configured"].includes(store.syncStatus)
  const hasChildProfileChanges =
    childName.trim() !== store.profile.childName || birthDate !== store.profile.birthDate

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

  async function saveChildProfile() {
    if (!hasChildProfileChanges) return

    setIsSavingChildProfile(true)
    const didSync = await store.updateProfile({ childName: childName.trim(), birthDate })
    setIsSavingChildProfile(false)

    if (didSync) {
      toast.success("Profil enfant sauvegardé")
    } else {
      toast.warning("Sauvegardé sur cet appareil, synchro à vérifier")
    }
  }

  function exportBackup() {
    const backup = store.exportBackup()
    const backupJson = JSON.stringify(backup, null, 2)
    const blob = new Blob([backupJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `diversibebs-sauvegarde-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Sauvegarde exportée")
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const confirmed = window.confirm(
        "Importer cette sauvegarde remplacera les données locales de cet appareil. Continuer ?",
      )

      if (!confirmed) return

      store.importBackup(parsed)
      toast.success("Sauvegarde importée")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’importer cette sauvegarde")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <>
      <Header eyebrow="Préférences" title="Réglages" />

      {shouldShowSyncStatus && (
        <p className="rounded-lg border bg-card/85 p-3 text-sm text-muted-foreground shadow-sm">
          {store.syncStatus === "loading" && "Chargement des données partagées..."}
          {store.syncStatus === "syncing" && "Synchronisation en cours..."}
          {store.syncStatus === "offline" && "Hors ligne, cache local affiché."}
          {store.syncStatus === "error" && "La synchronisation est à vérifier."}
          {store.syncStatus === "not-configured" && "Mode local actif : le partage entre appareils sera disponible après configuration Supabase."}
        </p>
      )}

      <div className="grid gap-1 lg:grid-cols-2 lg:gap-4">
        <section className="paper-surface soft-ring relative rounded-2xl p-4">
          <SectionHeader title="Enfant" eyebrow="Profil partagé" action={
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm" aria-hidden="true">
              <Baby className="size-5" />
            </span>
          } />
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Ces informations sont partagées dans l’espace famille.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Nom de l’enfant</span>
              <Input
                className="h-11 bg-background/70"
                placeholder="Ex. Alba"
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
              />
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-medium">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Date de naissance</span>
              <Input
                className="h-11 min-w-0 max-w-full bg-background/70"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <Button
              type="button"
              onClick={() => void saveChildProfile()}
              disabled={!hasChildProfileChanges || isSavingChildProfile}
            >
              <Check data-icon="inline-start" aria-hidden="true" />
              {isSavingChildProfile ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </section>

        <section className="border-t border-border/60 py-4 first:border-t-0">
          <h2 className="font-semibold">Espace famille</h2>
          <div className="mt-3 flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold tracking-normal text-foreground">
                {familyCodeLabel || "Code indisponible"}
              </p>
              {!familyCodeLabel && (
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Le code original n’est pas disponible sur cet appareil.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 px-3"
              onClick={copyFamilyCode}
              disabled={!familyCodeLabel}
            >
              <Copy data-icon="inline-start" aria-hidden="true" />
              Copier
            </Button>
          </div>
        </section>

        <SettingsSection description="Le thème reste propre à cet appareil." title="Apparence">
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/70 p-1.5">
            <ThemeButton active={theme === "light"} icon={Sun} label="Clair" onClick={() => setTheme("light")} />
            <ThemeButton active={theme === "system"} icon={Monitor} label="Système" onClick={() => setTheme("system")} />
            <ThemeButton active={theme === "dark"} icon={Moon} label="Sombre" onClick={() => setTheme("dark")} />
          </div>
        </SettingsSection>

        <SettingsSection description="Affichez uniquement les informations utiles à votre suivi." title="Options">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/55 p-3 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setPopoteEnabled(!popoteEnabled)}
            aria-pressed={popoteEnabled}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold">Option Popote</span>
              <span className="text-xs font-normal leading-5 text-muted-foreground">
                Afficher les filtres, badges et choix liés aux gourdes Popote.
              </span>
            </span>
            <span
              className={cn(
                "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors",
                popoteEnabled ? "bg-primary" : "bg-muted",
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "size-5 rounded-full bg-background shadow-sm transition-transform",
                  popoteEnabled && "translate-x-5",
                )}
              />
            </span>
          </button>
        </SettingsSection>

        <SettingsSection description="Gardez une copie ou migrez vers un autre appareil." title="Sauvegarde locale">
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={exportBackup}>
            <Download data-icon="inline-start" aria-hidden="true" />
            Exporter les données
          </Button>
          <input
            ref={importInputRef}
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={(event) => void importBackup(event)}
          />
          <Button type="button" variant="secondary" className="h-11 justify-start" onClick={() => importInputRef.current?.click()}>
            <Upload data-icon="inline-start" aria-hidden="true" />
            Importer une sauvegarde
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            L’import demande confirmation avant de remplacer les données locales.
          </p>
        </SettingsSection>

        <SourcesSettingsSection />

        <section className="border-t border-border/60 py-4 lg:col-span-2">
          <Button type="button" variant="ghost" className="h-11 w-full justify-start text-muted-foreground sm:w-auto" onClick={() => store.disconnectFamily()}>
            <LogOut data-icon="inline-start" aria-hidden="true" />
            Se déconnecter
          </Button>
        </section>
      </div>

      <InstallPrompt />
    </>
  )
}

function SourcesSettingsSection() {
  const groups = sourcesByTheme()
  const themes = Object.entries(groups).filter(([, items]) => items.length > 0)

  return (
    <SettingsSection
      description={`Les repères s’appuient sur des sources officielles. Repères vérifiés en ${reviewedAt}.`}
      title="Sources & repères"
    >
      <ul className="grid gap-3">
        {themes.map(([theme, items]) => (
          <li key={theme} className="rounded-lg border bg-card/85 p-3 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen aria-hidden="true" className="size-4 text-muted-foreground" />
              {theme}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-5 text-muted-foreground">
              {items.map((source) => (
                <li key={source.id}>
                  <a
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.title}
                  </a>
                  <span className="block text-xs text-muted-foreground">
                    {source.organization} · consulté le {source.accessedAt}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4" />
        {foodSourceReferences.length} références suivies, à revérifier régulièrement.
      </p>
    </SettingsSection>
  )
}

function SettingsSection({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <section className="border-t border-border/60 py-4 first:border-t-0">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
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
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "h-14 flex-col gap-1 px-2 text-xs shadow-none",
        active && "bg-background text-foreground shadow-sm",
      )}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
      {label}
    </Button>
  )
}

function FoodEmoji({ food, size = "md" }: { food: Food; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm",
        size === "sm" && "size-10",
        size === "md" && "size-12",
        size === "lg" && "size-14",
      )}
      aria-hidden="true"
    >
      <span className={cn(size === "sm" ? "text-xl" : "text-2xl")}>{food.emoji}</span>
    </span>
  )
}

const FoodCard = memo(function FoodCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const { popoteEnabled } = useAppOptions()
  const status = getStatus(food.id, store.latestByFood)
  const existingTest = store.latestByFood.get(food.id)

  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="block w-full touch-manipulation rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpen(true)}
        aria-label={`${existingTest ? "Modifier" : "Tester"} ${food.name}`}
      >
        <Card className="paper-surface pointer-events-none overflow-hidden transition-colors hover:border-primary/35">
          <CardHeader className="pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <FoodEmoji food={food} />
              <div className="min-w-0">
                <CardTitle className="truncate">{food.name}</CardTitle>
                <CardDescription>{food.category} · {ageSummary(food)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            <StatusBadge status={status} />
            {isInSeason(food) && <SeasonBadge />}
            <IntroductionBadge level={food.level} />
            {popoteEnabled && food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
          </CardContent>
        </Card>
      </button>
      {open && <FoodTestDrawer food={food} store={store} test={existingTest} open={open} onOpenChange={setOpen} />}
    </>
  )
})

function FoodDetail({
  food,
  store,
  test,
  compact = false,
  inverted = false,
}: {
  food: Food
  store: ReturnType<typeof useBabyStore>
  test?: FoodTest
  compact?: boolean
  inverted?: boolean
}) {
  const [open, setOpen] = useState(false)
  const existingTest = test ?? store.latestByFood.get(food.id)

  return (
    <>
      <Button
        type="button"
        variant={inverted ? "secondary" : compact ? "outline" : "default"}
        size={compact ? "icon" : "sm"}
        className={cn(!compact && "h-10")}
        onClick={() => setOpen(true)}
        aria-label={
          compact
            ? `${existingTest ? "Modifier" : "Tester"} ${food.name}`
            : `${existingTest ? "Modifier le test de" : "Marquer"} ${food.name}`
        }
      >
        {compact ? (
          <ChevronRight aria-hidden="true" />
        ) : (
          <>
            <Plus data-icon="inline-start" aria-hidden="true" />
            {existingTest ? "Modifier" : "Tester"}
          </>
        )}
      </Button>
      {open && <FoodTestDrawer food={food} store={store} test={test} open={open} onOpenChange={setOpen} />}
    </>
  )
}

function FoodTestDrawer({
  food,
  onOpenChange,
  open,
  store,
  test,
}: {
  food: Food
  onOpenChange: (open: boolean) => void
  open: boolean
  store: ReturnType<typeof useBabyStore>
  test?: FoodTest
}) {
  const { popoteEnabled } = useAppOptions()
  const existingTest = test ?? store.latestByFood.get(food.id)
  const isEditing = Boolean(existingTest)
  const [date, setDate] = useState(() => existingTest?.date ?? new Date().toISOString().slice(0, 10))
  const [mealTime, setMealTime] = useState(() => existingTest?.mealTime || defaultMealTimePreset.time)
  const [mealTimePreset, setMealTimePreset] = useState<MealTimePresetId>(() =>
    existingTest?.mealTime ? mealTimePresetFor(existingTest.mealTime) : defaultMealTimePreset.id,
  )
  const [isPopote, setIsPopote] = useState(() => existingTest?.isPopote ?? false)
  const [reaction, setReaction] = useState<Reaction>(() => existingTest?.reaction ?? "aucune réaction")
  const [note, setNote] = useState(() => existingTest?.note ?? "")
  const [showNote, setShowNote] = useState(() => Boolean(existingTest?.note))
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)
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

  async function saveTest() {
    if (isSaving) return

    const nextTest = {
      foodId: food.id,
      date,
      mealTime,
      isPopote: popoteEnabled && food.isPopoteEligible ? isPopote : existingTest?.isPopote ?? false,
      reaction,
      note,
    }

    setIsSaving(true)
    try {
      if (existingTest) {
        await store.updateTest(existingTest.id, nextTest)
        toast.success(`${food.name} mis à jour`)
      } else {
        await store.addTest(nextTest)
        toast.success(`${food.name} ajouté à l’historique`)
      }
    } finally {
      setIsSaving(false)
    }

    onOpenChange(false)
    setIsPopote(false)
    setReaction("aucune réaction")
    setMealTime(defaultMealTimePreset.time)
    setMealTimePreset(defaultMealTimePreset.id)
    setNote("")
    setShowNote(false)
  }

  function selectMealTimePreset(presetId: MealTimePresetId) {
    setMealTimePreset(presetId)

    if (presetId === "custom") return

    const preset = mealTimePresets.find((item) => item.id === presetId)
    if (preset) setMealTime(preset.time)
  }

  async function removeTest() {
    if (!existingTest) return
    if (!confirmingRemoval) {
      setConfirmingRemoval(true)
      return
    }

    await store.deleteTest(existingTest.id)
    toast.success(`${food.name} retiré du journal`)
    onOpenChange(false)
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
            <p className="mt-1 text-sm text-muted-foreground">
              {food.category} · {isEditing ? "test déjà enregistré" : ageSummary(food)}
            </p>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="flex min-w-0 flex-col gap-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={status} />
              {isInSeason(food) && <SeasonBadge />}
              <IntroductionBadge level={food.level} />
              {popoteEnabled && food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
              <SeasonMonthsGrid activeMonths={food.seasonMonths} />
            </div>
            <p className="rounded-xl bg-muted/65 p-4 text-sm leading-6">{food.preparation}</p>
            <Separator />
            <div className="flex min-w-0 flex-col gap-4">
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
              {popoteEnabled && food.isPopoteEligible && (
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
          </div>
        </div>
        <div className="shrink-0 border-t bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur lg:pb-4">
          <div className="grid gap-2">
            <Button type="button" className="h-12 w-full" onClick={saveTest} disabled={isSaving}>
              {isSaving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {isSaving ? "Sauvegarde..." : isEditing ? "Sauvegarder les changements" : "Marquer comme testé"}
            </Button>
            {existingTest && (
              <Button type="button" variant="outline" className="h-11 w-full text-destructive" onClick={removeTest} disabled={isSaving}>
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                {confirmingRemoval ? "Confirmer le retrait" : "Retirer ce test"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "réaction") {
    return (
      <Badge className="h-8 gap-1.5 border-transparent bg-status-reaction px-3 text-status-reaction-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
        réaction
      </Badge>
    )
  }

  if (status === "testé") {
    return (
      <Badge className="h-8 gap-1.5 border-transparent bg-status-tested px-3 text-status-tested-foreground">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        testé
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="h-8 gap-1.5 border-border bg-status-untested px-3 text-status-untested-foreground">
      <Clock className="size-3.5" aria-hidden="true" />
      à tester
    </Badge>
  )
}

function SeasonBadge() {
  return (
    <Badge className="h-8 gap-1.5 border-transparent bg-status-season px-3 text-status-season-foreground shadow-sm shadow-primary/10">
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
          : "border-status-attention/25 bg-status-attention/15 text-amber-900 dark:text-amber-200",
      )}
    >
      {label}
    </Badge>
  )
}

function PopoteBadge({ label = "Popote" }: { label?: string }) {
  return (
    <Badge variant="outline" className="h-8 gap-1.5 border-accent/80 bg-accent/55 px-3 text-accent-foreground">
      <PackageCheck className="size-4" aria-hidden="true" />
      {label}
    </Badge>
  )
}

const seasonMonthAbbreviations = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"]

function SeasonMonthsGrid({ activeMonths }: { activeMonths: number[] }) {
  const activeMonthSet = new Set(activeMonths)

  return (
    <div
      className="grid w-full grid-cols-12 gap-1"
      aria-label={`Mois de saison : ${monthNames(activeMonths)}`}
    >
      {seasonMonthAbbreviations.map((month, index) => {
        const monthNumber = index + 1
        const isActive = activeMonthSet.has(monthNumber)

        return (
          <span
            key={month}
            className={cn(
              "flex h-7 min-w-0 items-center justify-center rounded-sm border px-0.5 text-[0.625rem] font-semibold leading-none",
              isActive
                ? "border-status-season-month bg-status-season-month text-status-season-month-foreground shadow-sm"
                : "border-border bg-muted/45 text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {month}
          </span>
        )
      })}
    </div>
  )
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="flex flex-col gap-1 pt-2">
      <p className="text-sm font-semibold text-muted-foreground">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-normal text-foreground">{title}</h1>
    </header>
  )
}

function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={cn("rounded-xl border bg-card/80 p-4 text-sm leading-6 text-muted-foreground shadow-sm", compact && "p-3 text-xs")}>
      {disclaimer}
    </p>
  )
}

const navigationItems = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/foods", label: "Aliments", icon: Leaf },
  { to: "/history", label: "Journal", icon: NotebookText },
  { to: "/discoveries", label: "Badges", icon: Award },
  { to: "/settings", label: "Réglages", icon: Settings },
]

function DesktopNav() {
  return (
    <aside className="sticky top-0 hidden h-dvh py-8 lg:block">
      <nav
        aria-label="Navigation principale"
        className="paper-surface soft-ring flex h-full flex-col rounded-2xl p-3"
      >
        <div className="mb-5 px-3 pt-2">
          <p className="text-lg font-semibold tracking-normal">Diversibebs</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Suivi doux de diversification</p>
        </div>
        <div className="grid gap-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive && "bg-secondary text-secondary-foreground shadow-sm",
                )
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}

function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-2xl border-t bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 shadow-nav backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive && "bg-secondary text-secondary-foreground shadow-sm",
              )
            }
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default App

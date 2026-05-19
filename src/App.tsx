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
  ExternalLink,
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { categories, foods, isFoodInPack, popotePacks, type Food } from "@/data/foods"
import { foodSourceReferences, reviewedAt, sourcesByTheme } from "@/data/sources"
import { backupFileName, backupToJson } from "@/lib/backup"
import {
  ageSummary,
  applyFoodFilters,
  countWithFilterChange,
  getStatus,
  hasActiveFoodFilters,
  initialFoodFilters,
  isAgeReady,
  isInSeason,
  currentMonth,
  monthNames,
  weeklySuggestions,
  type FoodCategoryFilter,
  type FoodFilters,
  type FoodStatusFilter,
  type IntroductionFilter,
} from "@/lib/food-utils"
import {
  calculateBadges,
  calculateProgress,
  readBadgeUnlockDates,
  writeBadgeUnlockDates,
  type BadgeUnlockDates,
} from "@/lib/gamification"
import { reactions, useBabyStore, type FoodTest, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"

const disclaimer =
  "Diversibebs garde des repères de suivi. En cas de doute, de réaction importante ou de question médicale, demandez l’avis d’un professionnel de santé."

const DiscoveriesPage = lazy(() =>
  import("@/components/DiscoveriesPage").then((module) => ({ default: module.DiscoveriesPage })),
)

type MealTimePresetId = "breakfast" | "lunch" | "snack" | "dinner" | "custom"

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
  activePopotePackId: string | null
  setActivePopotePackId: (packId: string | null) => void
}

const defaultPopotePackId = popotePacks[0]?.id ?? null
const popotePackIdSet = new Set(popotePacks.map((pack) => pack.id))

type StoredAppOptions = {
  activePopotePackId?: string | null
  popoteEnabled?: boolean
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
  const [activePopotePackId, setActivePopotePackId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(appOptionsStorageKey)
      if (!stored) return defaultPopotePackId

      const parsed = JSON.parse(stored) as StoredAppOptions

      if (typeof parsed.activePopotePackId === "string") {
        return popotePackIdSet.has(parsed.activePopotePackId) ? parsed.activePopotePackId : null
      }
      if (parsed.activePopotePackId === null) return null

      if (typeof parsed.popoteEnabled === "boolean") {
        return parsed.popoteEnabled ? defaultPopotePackId : null
      }

      return defaultPopotePackId
    } catch {
      return defaultPopotePackId
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(appOptionsStorageKey, JSON.stringify({ activePopotePackId }))
    } catch {
      // Local display preference; the app remains usable without persistence.
    }
  }, [activePopotePackId])

  return useMemo(
    () => ({ activePopotePackId, setActivePopotePackId }),
    [activePopotePackId],
  )
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

function downloadTextFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
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
          Ouvrez votre espace famille avec un code partagé pour retrouver le suivi sur vos appareils.
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
              Code famille
              <Input
                autoComplete="off"
                placeholder="Ex. puree-carotte-2026"
                value={familyCode}
                onChange={(event) => setFamilyCode(event.target.value)}
              />
            </label>
            <Button type="submit" disabled={isSubmitting || !familyCode.trim()}>
              {isSubmitting ? "Ouverture..." : "Ouvrir mon espace famille"}
            </Button>
          </form>
          {!store.isConfigured && (
            <p className="mt-4 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              Les données seront gardées sur cet appareil. L’espace famille pourra être retrouvé sur
              plusieurs appareils après configuration du stockage partagé.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Utilisez le même code sur vos appareils. Toute personne ayant ce code peut ouvrir le même suivi.
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
      <CardContent className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:px-5 sm:py-10">
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

function nextMonthlyMilestone(birthDate: string): { months: number; daysAway: number } | null {
  if (!birthDate) return null
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthsLived =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth()) -
    (today.getDate() < birth.getDate() ? 1 : 0)
  const nextMonths = monthsLived + 1
  const nextDate = new Date(birth)
  nextDate.setMonth(birth.getMonth() + nextMonths)
  const daysAway = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysAway < 0 || daysAway > 14) return null
  return { months: nextMonths, daysAway }
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
  const { activePopotePackId } = useAppOptions()
  const [discardedSuggestionIds, setDiscardedSuggestionIds] = useState<string[]>([])
  const visibleSuggestions = suggestions.filter((food) => !discardedSuggestionIds.includes(food.id))
  const topFood = visibleSuggestions[0]
  const weeklyPlan = visibleSuggestions.slice(1)

  const progress = useMemo(() => calculateProgress(foods, store.tests), [store.tests])
  const uniqueCategoriesCount = useMemo(
    () =>
      new Set(
        store.tests.flatMap((test) => {
          const food = foods.find((item) => item.id === test.foodId)
          return food ? [food.category] : []
        }),
      ).size,
    [store.tests],
  )
  const notesCount = useMemo(
    () => store.tests.filter((test) => test.note.trim().length > 0).length,
    [store.tests],
  )
  const milestone = useMemo(
    () => nextMonthlyMilestone(store.profile.birthDate),
    [store.profile.birthDate],
  )

  function postponeTopFood() {
    if (!topFood) return
    setDiscardedSuggestionIds((current) => [...current, topFood.id])
    toast.info(`${topFood.name} proposé plus tard`)
  }

  return (
    <>
      <BabyHero
        ageMonths={store.profile.ageMonths}
        birthDate={store.profile.birthDate}
        childName={store.profile.childName}
        milestone={milestone}
      />

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

      <div className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Carnet"
          title="Où en suis-je"
          action={
            <NavLink
              to="/discoveries"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Voir tout
            </NavLink>
          }
        />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <HomeStatTile icon={Sparkles} label="aliments goûtés" value={progress.testedFoods} />
          <HomeStatTile icon={Leaf} label="catégories" value={uniqueCategoriesCount} />
          <HomeStatTile icon={PencilLine} label="notes" value={notesCount} />
        </div>
      </div>

      {recentTests.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader
            eyebrow="Journal"
            title="Derniers tests"
            action={
              <NavLink
                to="/history"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Voir tout
              </NavLink>
            }
          />
          <AnimatedList className="grid gap-3 lg:grid-cols-2">
            {recentTests.slice(0, 3).map((test) => {
              const food = foods.find((item) => item.id === test.foodId)
              if (!food) return null
              return (
                <AnimatedListItem
                  key={test.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card/80 px-3 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{food.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">{testDateTimeLabel(test)}</p>
                      {activePopotePackId !== null && test.isPopote && <PopoteBadge />}
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
        </div>
      )}

      <SourcesSection />

      <Disclaimer compact />
    </>
  )
}

function BabyHero({
  ageMonths,
  birthDate,
  childName,
  milestone,
}: {
  ageMonths: number
  birthDate: string
  childName: string
  milestone: { months: number; daysAway: number } | null
}) {
  const displayName = childName.trim() ? childName.trim() : "Bébé"
  const formattedBirth = birthDate
    ? new Date(`${birthDate}T00:00:00`).toLocaleDateString("fr-FR")
    : null

  return (
    <section className="paper-surface soft-ring relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm"
        >
          <Baby className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted-foreground">Bonjour</p>
          <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">
            {displayName}, {ageMonths} mois
          </h1>
          {formattedBirth && (
            <p className="mt-0.5 text-xs text-muted-foreground">Né(e) le {formattedBirth}</p>
          )}
        </div>
        {milestone && (
          <span className="hidden shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
            {milestone.months} mois dans {milestone.daysAway} j
          </span>
        )}
      </div>
      {milestone && (
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground sm:hidden">
          Bientôt {milestone.months} mois — dans {milestone.daysAway} jour{milestone.daysAway > 1 ? "s" : ""}.
        </p>
      )}
    </section>
  )
}

function HomeStatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <NavLink
      to="/discoveries"
      className="flex flex-col items-center gap-1 rounded-xl border bg-card/85 px-2 py-3 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      <span className="text-xl font-semibold tracking-tight">{value}</span>
      <span className="text-xs leading-tight text-muted-foreground">{label}</span>
    </NavLink>
  )
}

function FoodsPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
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
        <AnimatedList className="grid gap-3 lg:grid-cols-2">
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

function StatusSegment({
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

function FilterPill({
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

function PickerPill({
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

function PickerOption({
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

function CategoryPill({
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

function IntroductionPill({
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

function HistoryPage({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const { activePopotePackId } = useAppOptions()

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
                        {activePopotePackId !== null && test.isPopote && <PopoteBadge />}
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
      <div className="mt-3 flex items-center justify-end gap-1">
        {confirmingRemoval ? (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingRemoval(false)}>
              Annuler
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={removeTest}>
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
              className="size-9 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(true)}
              aria-label={`Modifier le test de ${food.name}`}
              title="Modifier"
            >
              <PencilLine aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              onClick={removeTest}
              aria-label={`Retirer ${food.name} du journal`}
              title="Retirer"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        )}
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
  const { activePopotePackId, setActivePopotePackId } = useAppOptions()
  const [childName, setChildName] = useState(store.profile.childName)
  const [birthDate, setBirthDate] = useState(store.profile.birthDate)
  const [isSavingChildProfile, setIsSavingChildProfile] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const familyCodeLabel = store.familySession?.familyCodeLabel ?? ""
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
    downloadTextFile(backupToJson(backup), backupFileName(), "application/json")
    toast.success("Sauvegarde exportée")
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const confirmed = window.confirm(
        "Importer cette sauvegarde remplacera le suivi sur cet appareil. Une sauvegarde de sécurité va d’abord être téléchargée. Continuer ?",
      )

      if (!confirmed) return

      downloadTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
      store.importBackup(parsed)
      toast.success("Sauvegarde importée")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’importer cette sauvegarde")
    } finally {
      event.target.value = ""
    }
  }

  function clearDeviceData() {
    const confirmed = window.confirm(
      "Supprimer le suivi de cet appareil ? Les données partagées ne sont pas supprimées pour les autres appareils.",
    )

    if (!confirmed) return

    downloadTextFile(backupToJson(store.exportBackup()), backupFileName(), "application/json")
    store.clearDeviceData()
    toast.success("Données supprimées de cet appareil")
  }

  return (
    <>
      <Header eyebrow="Préférences" title="Réglages" />

      <div className="grid gap-1 lg:grid-cols-2 lg:gap-4">
        <SettingsSection
          description="Profil et code partagés entre vos appareils."
          title="Espace famille"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Code famille</span>
            <div className="flex min-w-0 items-stretch gap-2">
              <Input
                readOnly
                aria-label="Code famille"
                className="h-11 min-w-0 flex-1 bg-background/70 font-medium"
                placeholder="Code indisponible"
                value={familyCodeLabel}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 px-3"
                onClick={copyFamilyCode}
                disabled={!familyCodeLabel}
              >
                <Copy data-icon="inline-start" aria-hidden="true" />
                Copier
              </Button>
            </div>
            {!familyCodeLabel && (
              <span className="text-xs text-muted-foreground">
                Le code original n’est pas disponible sur cet appareil.
              </span>
            )}
          </label>
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
        </SettingsSection>

        <SettingsSection description="Le thème reste propre à cet appareil." title="Apparence">
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/70 p-1.5">
            <ThemeButton active={theme === "light"} icon={Sun} label="Clair" onClick={() => setTheme("light")} />
            <ThemeButton active={theme === "system"} icon={Monitor} label="Système" onClick={() => setTheme("system")} />
            <ThemeButton active={theme === "dark"} icon={Moon} label="Sombre" onClick={() => setTheme("dark")} />
          </div>
        </SettingsSection>

        <SettingsSection description="Activez l’option pour afficher les filtres, badges et choix liés à un pack Popote." title="Option Popote">
          <PopoteToggle
            enabled={activePopotePackId !== null}
            onToggle={(enabled) =>
              setActivePopotePackId(enabled ? popotePacks[0]?.id ?? null : null)
            }
          />
          {activePopotePackId !== null && popotePacks.length > 0 && (
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pack utilisé
              </p>
              {popotePacks.map((pack) => (
                <PopotePackOption
                  key={pack.id}
                  description={`${pack.foodIds.size} aliments inclus.`}
                  label={pack.name}
                  selected={activePopotePackId === pack.id}
                  onSelect={() => setActivePopotePackId(pack.id)}
                />
              ))}
            </div>
          )}
        </SettingsSection>

        <InstallHelpSection />

        <SettingsSection description="Gardez une copie, restaurez le suivi ou préparez un rendez-vous." title="Sauvegarde">
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
          <Button type="button" variant="ghost" className="h-11 justify-start text-destructive" onClick={clearDeviceData}>
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Supprimer les données
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            L’import demande confirmation et télécharge une sauvegarde de sécurité avant remplacement.
          </p>
        </SettingsSection>

        <section className="flex justify-center border-t border-border/60 py-6 lg:col-span-2">
          <Button type="button" variant="ghost" className="h-11 px-6 text-muted-foreground" onClick={() => store.disconnectFamily()}>
            <LogOut data-icon="inline-start" aria-hidden="true" />
            Se déconnecter
          </Button>
        </section>
      </div>
    </>
  )
}

type ThemeAccent = { icon: LucideIcon; bg: string; text: string }

const sourceThemeAccents: Record<string, ThemeAccent> = {
  "Âges": {
    icon: Clock,
    bg: "bg-amber-100/80 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  "Allergènes": {
    icon: ShieldCheck,
    bg: "bg-rose-100/80 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
  },
  "Aliments à éviter": {
    icon: LockKeyhole,
    bg: "bg-violet-100/80 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
  },
  "Préparations": {
    icon: Utensils,
    bg: "bg-emerald-100/80 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
}

const defaultThemeAccent: ThemeAccent = {
  icon: BookOpen,
  bg: "bg-muted",
  text: "text-muted-foreground",
}

function SourcesSection() {
  const groups = sourcesByTheme()
  const themes = Object.entries(groups).filter(([, items]) => items.length > 0)

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        eyebrow="Confiance"
        title="Sources & repères"
        action={
          <span className="text-xs text-muted-foreground">Vérifié en {reviewedAt}</span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {themes.map(([theme, items]) => {
          const accent = sourceThemeAccents[theme] ?? defaultThemeAccent
          const Icon = accent.icon
          return (
            <article
              key={theme}
              className="flex flex-col gap-3 rounded-2xl border bg-card/85 p-4 shadow-sm transition-colors hover:border-primary/25"
            >
              <header className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    accent.bg,
                  )}
                >
                  <Icon className={cn("size-4", accent.text)} />
                </span>
                <p className="font-semibold tracking-tight">{theme}</p>
              </header>
              <ul className="grid gap-3">
                {items.map((source) => (
                  <li key={source.id} className="grid gap-0.5">
                    <a
                      className="group inline-flex items-start gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="leading-5">{source.title}</span>
                      <ExternalLink
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                      />
                    </a>
                    <span className="text-xs text-muted-foreground">
                      {source.organization} · consulté le {source.accessedAt}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
      <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="size-4" />
        {foodSourceReferences.length} références suivies, à revérifier régulièrement.
      </p>
    </section>
  )
}

function InstallHelpSection() {
  return (
    <SettingsSection
      description="Installez Diversibebs sur l’écran d’accueil pour y revenir d’un geste, hors connexion."
      title="Installation"
    >
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Home aria-hidden="true" className="size-4 text-muted-foreground" />
          iPhone et iPad
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvrez l’app dans Safari.</li>
          <li>Touchez le bouton Partager (icône en forme de flèche).</li>
          <li>Choisissez « Sur l’écran d’accueil » puis Ajouter.</li>
        </ol>
      </div>
      <div className="rounded-lg border bg-card/85 p-3 text-sm leading-6 shadow-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Home aria-hidden="true" className="size-4 text-muted-foreground" />
          Android
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-5 text-muted-foreground">
          <li>Ouvrez l’app dans Chrome.</li>
          <li>Touchez le menu (trois points) en haut à droite.</li>
          <li>Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».</li>
        </ol>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Une fois installée, Diversibebs s’ouvre comme une app, garde le suivi récent disponible hors connexion et propose les raccourcis Semaine et Aliments.
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

function PopoteToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/55 p-3 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold">Option Popote</span>
        <span className="text-xs font-normal leading-5 text-muted-foreground">
          {enabled
            ? "Filtres, badges et choix Popote affichés."
            : "Garder l’app minimale, sans filtres Popote."}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-background shadow-sm transition-transform",
            enabled && "translate-x-5",
          )}
        />
      </span>
    </button>
  )
}

function PopotePackOption({
  description,
  label,
  onSelect,
  selected,
}: {
  description: string
  label: string
  onSelect: () => void
  selected: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary/40 bg-primary/10"
          : "border-transparent bg-muted/55 hover:bg-muted/80",
      )}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs font-normal leading-5 text-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
    </button>
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
  const { activePopotePackId } = useAppOptions()
  const status = getStatus(food.id, store.latestByFood)

  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="block w-full touch-manipulation rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpen(true)}
        aria-label={`Ajouter une prise de ${food.name}`}
      >
        <Card
          className={cn(
            "paper-surface pointer-events-none overflow-hidden transition-colors hover:border-primary/35",
            status === "testé" && "border-status-tested/40 bg-status-tested/10",
            status === "réaction" && "border-status-reaction/40 bg-status-reaction/10",
          )}
        >
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
            {status !== "non testé" && <StatusBadge status={status} />}
            {isInSeason(food) && <SeasonBadge />}
            <IntroductionBadge level={food.level} />
            {isFoodInPack(food, activePopotePackId) && <PopoteBadge label="Popote possible" />}
          </CardContent>
        </Card>
      </button>
      {open && <FoodTestDrawer food={food} store={store} open={open} onOpenChange={setOpen} />}
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
  const { activePopotePackId } = useAppOptions()
  const foodTests = useMemo(() => store.tests.filter((item) => item.foodId === food.id), [food.id, store.tests])
  const latestFoodTest = foodTests[0]
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
            <p className="mt-1 text-sm text-muted-foreground">
              {food.category} · {isEditing ? "Modifier la prise" : "Nouvelle prise"}
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
              {isFoodInPack(food, activePopotePackId) && <PopoteBadge label="Popote possible" />}
              <SeasonMonthsGrid activeMonths={food.seasonMonths} />
            </div>
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
                        <div className="flex shrink-0 items-center gap-1">
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
                            className={cn(
                              "size-8",
                              isConfirmingRemoval ? "text-destructive" : "text-muted-foreground hover:text-destructive",
                            )}
                            onClick={() => removeTrackedTest(trackedTest)}
                            aria-label={
                              isConfirmingRemoval
                                ? `Confirmer le retrait de la prise de ${food.name}`
                                : `Retirer cette prise de ${food.name}`
                            }
                            title={isConfirmingRemoval ? "Confirmer le retrait" : "Retirer"}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <Separator />
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
          </div>
        </div>
        <div className="shrink-0 border-t bg-background/95 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur lg:pb-4">
          <div className="grid gap-2">
            <Button type="button" className="h-12 w-full" onClick={saveTest} disabled={isSaving}>
              {isSaving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {isSaving ? "Sauvegarde..." : isEditing ? "Sauvegarder les changements" : "Ajouter cette prise"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

function FoodSourceNote({ food }: { food: Food }) {
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
    <div className="rounded-xl border bg-card/85 p-4 text-sm leading-6 shadow-sm">
      {cautionTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cautionTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
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
            food.cautionLevel === "attention" && "text-status-reaction-foreground",
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
  const currentSeasonMonth = currentMonth()

  return (
    <div
      className="grid w-full grid-cols-12 gap-1"
      aria-label={`Mois de saison : ${monthNames(activeMonths)}`}
    >
      {seasonMonthAbbreviations.map((month, index) => {
        const monthNumber = index + 1
        const isActive = activeMonthSet.has(monthNumber)
        const isCurrentMonth = monthNumber === currentSeasonMonth

        return (
          <span
            key={month}
            className={cn(
              "flex h-7 min-w-0 items-center justify-center rounded-sm border px-0.5 text-[0.625rem] font-semibold leading-none",
              isActive
                ? "border-status-season-month bg-status-season-month text-status-season-month-foreground shadow-sm"
                : "border-border bg-muted/45 text-muted-foreground",
              isCurrentMonth && (
                isActive
                  ? "border-[hsl(21_70%_34%)] bg-[hsl(21_70%_34%)] text-status-season-month-foreground dark:border-[hsl(24_70%_44%)] dark:bg-[hsl(24_70%_44%)] dark:text-white"
                  : "border-foreground/30 bg-muted text-foreground"
              ),
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

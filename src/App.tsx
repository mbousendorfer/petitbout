import { useEffect, useMemo, useState } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import {
  Baby,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Home,
  Leaf,
  ListFilter,
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
  Sparkles,
  Sun,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { reactions, useBabyStore, type Reaction } from "@/lib/storage"
import { cn } from "@/lib/utils"

const disclaimer =
  "Cette application est un outil personnel de suivi. Elle ne remplace pas les conseils d’un pédiatre ou professionnel de santé."

type Filter =
  | "Tous"
  | "Testés"
  | "Non testés"
  | "De saison"
  | (typeof categories)[number]

const allFilters: Filter[] = ["Tous", ...categories, "Testés", "Non testés", "De saison"]

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
        <CardContent className="flex flex-col gap-4">
          {!store.profile.birthDate && (
            <Select
              value={String(store.profile.ageMonths)}
              onValueChange={(value) => void store.updateAge(Number(value))}
            >
              <SelectTrigger aria-label="Âge du bébé">
                <SelectValue placeholder="Âge du bébé" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((age) => (
                    <SelectItem key={age} value={String(age)}>
                      {age} mois
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </CardContent>
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
  const [filter, setFilter] = useState<Filter>("Tous")

  const filteredFoods = useMemo(() => {
    return foods
      .filter((food) => {
        const status = getStatus(food.id, store.latestByFood)
        const matchesQuery = food.name.toLowerCase().includes(query.toLowerCase().trim())
        const matchesFilter =
          filter === "Tous" ||
          food.category === filter ||
          (filter === "Allergènes" && food.tags.includes("allergène")) ||
          (filter === "Testés" && status !== "non testé") ||
          (filter === "Non testés" && status === "non testé") ||
          (filter === "De saison" && isInSeason(food))
        return matchesQuery && matchesFilter && isAgeReady(food, store.profile.ageMonths)
      })
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
  }, [filter, query, store.latestByFood, store.profile.ageMonths])

  return (
    <>
      <Header eyebrow="Catalogue" title="Aliments adaptés" />
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            className="pl-10"
            placeholder="Rechercher un aliment"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {allFilters.map((item) => (
              <Button
                key={item}
                type="button"
                variant={filter === item ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(item)}
              >
                {item === "Tous" && <ListFilter data-icon="inline-start" aria-hidden="true" />}
                {item}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col gap-3">
        {filteredFoods.map((food) => (
          <FoodCard key={food.id} food={food} store={store} />
        ))}
      </div>
    </>
  )
}

function WeekPage({
  suggestions,
  store,
}: {
  suggestions: Food[]
  store: ReturnType<typeof useBabyStore>
}) {
  return (
    <>
      <Header eyebrow="Suggestions" title="Cette semaine" />
      <div className="flex flex-col gap-3">
        {suggestions.map((food) => (
          <Card key={food.id} className="bg-card/90">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{food.emoji} {food.name}</CardTitle>
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
                  <Badge key={reason} variant="secondary">
                    {reason}
                  </Badge>
                ),
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
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

  return (
    <Card className="bg-card/90">
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
          <FoodDetail food={food} store={store} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <StatusBadge status={status} />
        {isInSeason(food) && <SeasonBadge />}
        <IntroductionBadge level={food.level} />
        {food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
      </CardContent>
    </Card>
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isPopote, setIsPopote] = useState(false)
  const [reaction, setReaction] = useState<Reaction>("aucune réaction")
  const [note, setNote] = useState("")
  const tests = store.tests.filter((test) => test.foodId === food.id)
  const status = getStatus(food.id, store.latestByFood)

  async function saveTest() {
    await store.addTest({ foodId: food.id, date, isPopote: food.isPopoteEligible && isPopote, reaction, note })
    toast.success(`${food.name} ajouté à l’historique`)
    setOpen(false)
    setIsPopote(false)
    setNote("")
    setReaction("aucune réaction")
  }

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
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side="bottom" className="max-h-[90svh]">
          <DrawerHeader>
            <DrawerTitle>{food.emoji} {food.name}</DrawerTitle>
            <DrawerDescription>
              {food.category} · adapté dès {food.minAgeMonths} mois
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[68svh] pr-3">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={status} />
                {isInSeason(food) && <SeasonBadge />}
                <IntroductionBadge level={food.level} />
                {food.isPopoteEligible && <PopoteBadge label="Popote possible" />}
                <Badge variant="outline">{monthNames(food.seasonMonths)}</Badge>
              </div>
              <p className="rounded-md bg-muted p-4 text-sm leading-6">{food.preparation}</p>
              <Separator />
              <Tabs defaultValue="test">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="test">Test</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="test" className="flex flex-col gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Date
                    <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Réaction
                    <Select value={reaction} onValueChange={(value) => setReaction(value as Reaction)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {reactions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Note libre
                    <Textarea
                      placeholder="Quantité, texture, contexte du repas..."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </label>
                  <Button type="button" onClick={saveTest}>
                    Marquer comme testé
                  </Button>
                </TabsContent>
                <TabsContent value="history" className="flex flex-col gap-3">
                  {tests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun test enregistré pour cet aliment.</p>
                  ) : (
                    tests.map((test) => (
                      <div key={test.id} className="rounded-md border bg-card p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{test.reaction}</p>
                          <p className="text-xs text-muted-foreground">{new Date(test.date).toLocaleDateString("fr-FR")}</p>
                        </div>
                        {test.isPopote && <div className="mt-2"><PopoteBadge /></div>}
                        {test.note && <p className="mt-2 text-sm text-muted-foreground">{test.note}</p>}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
              <Disclaimer compact />
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "réaction") return <Badge variant="destructive">réaction</Badge>
  if (status === "testé") return <Badge>testé</Badge>
  return <Badge variant="outline">non testé</Badge>
}

function SeasonBadge() {
  return (
    <Badge className="border-emerald-500/25 bg-emerald-500 text-white shadow-sm shadow-emerald-900/10 dark:bg-emerald-400 dark:text-emerald-950">
      <Leaf data-icon="inline-start" aria-hidden="true" />
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
    <Badge variant="outline" className="border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200">
      <PackageCheck data-icon="inline-start" aria-hidden="true" />
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

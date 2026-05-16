import { useMemo, useState } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import {
  Baby,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Home,
  Leaf,
  ListFilter,
  LockKeyhole,
  NotebookText,
  RefreshCw,
  Search,
  Sparkles,
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

function App() {
  const store = useBabyStore()
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
        <SyncBanner store={store} />
        <Routes>
          <Route path="/" element={<HomePage store={store} suggestions={suggestions} recentTests={recentTests} />} />
          <Route path="/foods" element={<FoodsPage store={store} />} />
          <Route path="/week" element={<WeekPage suggestions={suggestions} store={store} />} />
          <Route path="/history" element={<HistoryPage store={store} />} />
        </Routes>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
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

function SyncBanner({ store }: { store: ReturnType<typeof useBabyStore> }) {
  const isAttentionNeeded = store.syncStatus === "error" || store.syncStatus === "offline"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card/80 px-3 py-2 text-sm text-muted-foreground",
        isAttentionNeeded && "border-destructive/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {isAttentionNeeded ? <CloudOff aria-hidden="true" /> : <Cloud aria-hidden="true" />}
        <span className="truncate">
          {store.syncStatus === "loading" && "Chargement partagé..."}
          {store.syncStatus === "syncing" && "Synchronisation..."}
          {store.syncStatus === "offline" && "Hors ligne, cache local affiché"}
          {store.syncStatus === "error" && "Synchronisation à vérifier"}
          {(store.syncStatus === "idle" || store.syncStatus === "not-configured") && "Espace famille partagé"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => store.refresh()} aria-label="Rafraîchir">
          <RefreshCw aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => store.disconnectFamily()}>
          Changer
        </Button>
      </div>
    </div>
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
              <CardTitle className="text-2xl">Bébé a {store.profile.ageMonths} mois</CardTitle>
              <CardDescription>{store.testedFoodIds.size} aliment(s) déjà testé(s)</CardDescription>
            </div>
            <div className="rounded-full bg-secondary p-3">
              <Baby aria-hidden="true" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-muted-foreground">{new Date(test.date).toLocaleDateString("fr-FR")}</p>
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
    return foods.filter((food) => {
      const status = getStatus(food.id, store.latestByFood)
      const matchesQuery = food.name.toLowerCase().includes(query.toLowerCase().trim())
      const matchesFilter =
        filter === "Tous" ||
        food.category === filter ||
        (filter === "Testés" && status !== "non testé") ||
        (filter === "Non testés" && status === "non testé") ||
        (filter === "De saison" && isInSeason(food))
      return matchesQuery && matchesFilter && isAgeReady(food, store.profile.ageMonths)
    })
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
                  <CardTitle>{food.name}</CardTitle>
                  <CardDescription>{food.preparation}</CardDescription>
                </div>
                <FoodDetail food={food} store={store} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {suggestionReasons(food).map((reason) => (
                <Badge key={reason} variant="secondary">
                  {reason}
                </Badge>
              ))}
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
                      <p className="font-medium">{food.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(test.date).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{test.reaction}</p>
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

function FoodCard({ food, store }: { food: Food; store: ReturnType<typeof useBabyStore> }) {
  const status = getStatus(food.id, store.latestByFood)

  return (
    <Card className="bg-card/90">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{food.name}</CardTitle>
            <CardDescription>{food.category} · dès {food.minAgeMonths} mois</CardDescription>
          </div>
          <FoodDetail food={food} store={store} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <StatusBadge status={status} />
        {isInSeason(food) && <Badge variant="secondary">de saison</Badge>}
        <Badge variant="outline">{food.level}</Badge>
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
        <p className={cn("font-medium", inverted && "text-primary-foreground")}>{food.name}</p>
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
  const [reaction, setReaction] = useState<Reaction>("aucune réaction")
  const [note, setNote] = useState("")
  const tests = store.tests.filter((test) => test.foodId === food.id)
  const status = getStatus(food.id, store.latestByFood)

  async function saveTest() {
    await store.addTest({ foodId: food.id, date, reaction, note })
    toast.success(`${food.name} ajouté à l’historique`)
    setOpen(false)
    setNote("")
    setReaction("aucune réaction")
  }

  return (
    <>
      <Button
        type="button"
        variant={inverted ? "secondary" : compact ? "outline" : "ghost"}
        size={compact ? "icon" : "sm"}
        onClick={() => setOpen(true)}
        aria-label={`Voir ${food.name}`}
      >
        {compact ? <ChevronRight aria-hidden="true" /> : "Détail"}
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent side="bottom" className="max-h-[90svh]">
          <DrawerHeader>
            <DrawerTitle>{food.name}</DrawerTitle>
            <DrawerDescription>
              {food.category} · adapté dès {food.minAgeMonths} mois
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="max-h-[68svh] pr-3">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={status} />
                {isInSeason(food) && <Badge variant="secondary">de saison</Badge>}
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
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-xl border-t bg-background/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
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

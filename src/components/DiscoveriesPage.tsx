import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Apple,
  Award,
  BadgeCheck,
  CalendarDays,
  Carrot,
  ChartPie,
  Check,
  Droplet,
  Egg,
  Leaf,
  LockKeyhole,
  Medal,
  Milk,
  NotebookPen,
  Palette,
  Sparkles,
  Sprout,
  Star,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import { Badge as UiBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { categories, foods, type FoodCategory } from "@/data/foods"
import {
  badgeCategoryLabels,
  calculateBadges,
  calculateProgress,
  progressPercent,
  type BadgeCategory,
  type BadgeUnlockDates,
  type DiscoveryBadge,
} from "@/lib/gamification"
import type { FoodTest } from "@/lib/storage"
import { cn } from "@/lib/utils"

type DiscoveriesPageProps = {
  badgeUnlockDates: BadgeUnlockDates
  childName: string
  tests: FoodTest[]
}

const categoryIcons: Record<BadgeCategory, LucideIcon> = {
  first_steps: Sprout,
  vegetables: Leaf,
  fruits: Sparkles,
  textures: Palette,
  tracking: NotebookPen,
  variety: Star,
  seasonal: CalendarDays,
  silly: Award,
}

const categoryFilters: Array<BadgeCategory | "all"> = [
  "all",
  "first_steps",
  "vegetables",
  "fruits",
  "textures",
  "tracking",
  "variety",
  "seasonal",
  "silly",
]

// Teinte éditoriale Argile par famille d'aliment (cf. ProgressView iOS).
// Classes complètes (non interpolées) pour rester sûres au purge Tailwind.
const foodCategoryMeta: Record<FoodCategory, { icon: LucideIcon; text: string; bar: string; tile: string }> = {
  Légumes: { icon: Carrot, text: "text-category-vegetable", bar: "bg-category-vegetable", tile: "bg-category-vegetable/12" },
  Fruits: { icon: Apple, text: "text-category-fruit", bar: "bg-category-fruit", tile: "bg-category-fruit/12" },
  Féculents: { icon: Wheat, text: "text-category-starch", bar: "bg-category-starch", tile: "bg-category-starch/12" },
  Protéines: { icon: Egg, text: "text-category-protein", bar: "bg-category-protein", tile: "bg-category-protein/12" },
  "Matières grasses": { icon: Droplet, text: "text-category-fat", bar: "bg-category-fat", tile: "bg-category-fat/12" },
  "Produits laitiers": { icon: Milk, text: "text-category-dairy", bar: "bg-category-dairy", tile: "bg-category-dairy/12" },
  Divers: { icon: Utensils, text: "text-primary", bar: "bg-primary", tile: "bg-primary/12" },
}

const containerMotion = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const cardMotion = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function DiscoveriesPage({ badgeUnlockDates, childName, tests }: DiscoveriesPageProps) {
  const [badgeFilter, setBadgeFilter] = useState<BadgeCategory | "all">("all")
  const badges = useMemo(() => calculateBadges(foods, tests, badgeUnlockDates), [badgeUnlockDates, tests])
  const progress = useMemo(() => calculateProgress(foods, tests), [tests])
  const testedFoodIds = useMemo(() => new Set(tests.map((test) => test.foodId)), [tests])

  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const catalogPercent = foods.length === 0 ? 0 : Math.round((progress.testedFoods / foods.length) * 100)

  const nextBadge = useMemo(
    () =>
      badges
        .filter((badge) => !badge.unlocked && badge.progressCurrent > 0)
        .sort(
          (a, b) =>
            progressPercent(b.progressCurrent, b.progressTarget) - progressPercent(a.progressCurrent, a.progressTarget) ||
            a.progressTarget - b.progressTarget ||
            a.name.localeCompare(b.name, "fr"),
        )[0],
    [badges],
  )

  const filteredBadges = badges
    .filter((badge) => badgeFilter === "all" || badge.category === badgeFilter)
    .sort(
      (a, b) =>
        Number(b.unlocked) - Number(a.unlocked) ||
        progressPercent(b.progressCurrent, b.progressTarget) - progressPercent(a.progressCurrent, a.progressTarget) ||
        a.progressTarget - b.progressTarget ||
        a.name.localeCompare(b.name, "fr"),
    )

  const displayName = childName.trim() ? childName.trim() : "bébé"
  const heroMessage =
    progress.testedFoods === 0
      ? "Les badges apparaîtront au fil des aliments ajoutés. Rien à réussir, juste un carnet qui se remplit."
      : `${progress.testedFoods} aliment${progress.testedFoods > 1 ? "s" : ""} testé${progress.testedFoods > 1 ? "s" : ""}, ${catalogPercent}% du catalogue découvert.`

  return (
    <>
      <header className="flex flex-col gap-1.5 pt-2">
        <p className="eyebrow">Carnet</p>
        <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Progression</h1>
      </header>

      <ProgressHero
        childName={displayName}
        message={heroMessage}
        testedFoods={progress.testedFoods}
        catalogPercent={catalogPercent}
        unlockedBadges={unlockedBadges.length}
      />

      {nextBadge && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="Prochain badge" subtitle="Le repère le plus proche, sans objectif imposé." />
          <NextBadgeCard badge={nextBadge} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title="Familles d'aliments" subtitle="Un coup d'œil aux univers déjà rencontrés." />
        <Card className="paper-surface overflow-hidden">
          <CardContent className="grid gap-0 p-4 sm:p-5">
            {categories.map((category, index) => {
              const total = foods.filter((food) => food.category === category).length
              const tested = foods.filter((food) => food.category === category && testedFoodIds.has(food.id)).length

              return (
                <div key={category}>
                  {index > 0 && <div className="ml-8 border-t border-border/40" />}
                  <CategoryRow category={category} tested={tested} total={total} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Badges" subtitle="De petits repères qui avancent avec le carnet." />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((category) => (
            <Button
              key={category}
              type="button"
              variant={badgeFilter === category ? "secondary" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => setBadgeFilter(category)}
            >
              {category === "all" ? "Tous" : badgeCategoryLabels[category]}
            </Button>
          ))}
        </div>
        <motion.div
          variants={containerMotion}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </motion.div>
      </section>
    </>
  )
}

function ProgressHero({
  catalogPercent,
  childName,
  message,
  testedFoods,
  unlockedBadges,
}: {
  catalogPercent: number
  childName: string
  message: string
  testedFoods: number
  unlockedBadges: number
}) {
  return (
    <Card className="paper-surface soft-ring overflow-hidden rounded-hero">
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-[-0.01em]">Carnet de {childName}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
          </div>
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-status-season-month/15 text-status-season-month"
          >
            <Sparkles className="size-6" />
          </span>
        </div>
        <Progress value={catalogPercent} aria-label={`${catalogPercent}% du catalogue découvert`} />
        <div className="grid grid-cols-3 gap-2.5">
          <SummaryTile icon={BadgeCheck} value={`${testedFoods}`} label="aliments testés" tone="primary" />
          <SummaryTile icon={ChartPie} value={`${catalogPercent}%`} label="catalogue" tone="dairy" />
          <SummaryTile icon={Medal} value={`${unlockedBadges}`} label="badges" tone="honey" />
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  tone: "primary" | "dairy" | "honey"
  value: string
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "dairy"
        ? "text-category-dairy"
        : "text-status-season-month"

  return (
    <div className="flex flex-col gap-2 rounded-card border bg-card/70 p-3 shadow-soft">
      <Icon aria-hidden="true" className={cn("size-4", toneClass)} />
      <span className="font-rounded text-2xl font-extrabold tracking-tight">{value}</span>
      <span className="text-xs font-semibold leading-tight text-muted-foreground">{label}</span>
    </div>
  )
}

function SectionTitle({ subtitle, title }: { subtitle?: string; title: string }) {
  return (
    <div className="min-w-0">
      <h2 className="text-xl font-bold tracking-[-0.01em]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function CategoryRow({ category, tested, total }: { category: FoodCategory; tested: number; total: number }) {
  const meta = foodCategoryMeta[category]
  const Icon = meta.icon
  const percent = total === 0 ? 0 : Math.round((tested / total) * 100)

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", meta.tile, meta.text)} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{category}</span>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
        {total === 0 ? "0" : `${tested}/${total}`}
      </span>
      <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className={cn("block h-full rounded-full", meta.bar)} style={{ width: `${percent}%` }} />
      </span>
      <span className={cn("w-9 shrink-0 text-right text-xs font-bold tabular-nums", total === 0 ? "text-muted-foreground" : meta.text)}>
        {total === 0 ? "—" : `${percent}%`}
      </span>
    </div>
  )
}

function NextBadgeCard({ badge }: { badge: DiscoveryBadge }) {
  const percent = progressPercent(badge.progressCurrent, badge.progressTarget)

  return (
    <Card className="paper-surface overflow-hidden rounded-card">
      <CardContent className="flex items-center gap-4 p-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted text-3xl text-muted-foreground"
        >
          {badge.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">{badge.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{badge.description}</p>
          <Progress className="mt-2 h-2" value={percent} aria-label={`${badge.progressCurrent} sur ${badge.progressTarget}`} />
        </div>
        <span className="shrink-0 self-start rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary">
          {badge.progressCurrent}/{badge.progressTarget}
        </span>
      </CardContent>
    </Card>
  )
}

function AnimatedProgress({ current, target }: { current: number; target: number }) {
  return (
    <motion.div initial={{ opacity: 0.5, scaleX: 0.98 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.35 }}>
      <Progress value={progressPercent(current, target)} aria-label={`${current} sur ${target}`} />
    </motion.div>
  )
}

function BadgeCard({ badge }: { badge: DiscoveryBadge }) {
  const shouldReduceMotion = useReducedMotion()
  const CategoryIcon = categoryIcons[badge.category]
  const percent = progressPercent(badge.progressCurrent, badge.progressTarget)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          variants={cardMotion}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "paper-surface group w-full overflow-hidden rounded-2xl border p-0 text-left shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            badge.unlocked ? "border-primary/25 bg-primary/5" : "border-border/70",
          )}
        >
          <div className="flex min-h-36 flex-col">
            <div className="flex items-start justify-between gap-3 p-4 pb-3">
              <div className="flex items-start gap-3">
                <motion.span
                  aria-hidden="true"
                  animate={!shouldReduceMotion && badge.unlocked ? { rotate: [0, -5, 5, 0], scale: [1, 1.08, 1] } : { scale: 1 }}
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] border text-3xl shadow-soft",
                    badge.unlocked
                      ? "border-primary/20 bg-secondary"
                      : "border-border/70 bg-muted text-muted-foreground grayscale",
                  )}
                  transition={{ duration: 0.5 }}
                >
                  {badge.unlocked ? badge.emoji : <LockKeyhole className="size-6" />}
                </motion.span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CategoryIcon className="size-3.5" aria-hidden="true" />
                    <span>{badgeCategoryLabels[badge.category]}</span>
                  </div>
                  <h2 className="mt-1 font-semibold leading-tight">{badge.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{badge.description}</p>
                </div>
              </div>
              {badge.unlocked ? (
                <UiBadge className="h-7 shrink-0 gap-1">
                  <Check className="size-3.5" aria-hidden="true" />
                  gagné
                </UiBadge>
              ) : (
                <UiBadge variant="outline" className="h-7 shrink-0 gap-1">
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  {percent}%
                </UiBadge>
              )}
            </div>
            <div className="mt-auto border-t border-border/60 bg-background/45 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{badge.unlocked ? "Badge débloqué" : badge.unlockCondition}</span>
                <span className="font-medium text-foreground">{badge.progressCurrent}/{badge.progressTarget}</span>
              </div>
              <AnimatedProgress current={badge.progressCurrent} target={badge.progressTarget} />
            </div>
          </div>
        </motion.button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div
            className={cn(
              "mb-2 flex size-16 items-center justify-center rounded-[1.35rem] border bg-secondary text-3xl text-primary shadow-soft",
              !badge.unlocked && "bg-muted text-muted-foreground grayscale",
            )}
          >
            {badge.unlocked ? badge.emoji : <LockKeyhole className="size-7" />}
          </div>
          <DialogTitle>{badge.name}</DialogTitle>
          <DialogDescription>{badge.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-muted/70 p-3 text-sm">
            <p className="font-medium">Comment le débloquer</p>
            <p className="mt-1 text-muted-foreground">{badge.unlockCondition}</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Progression</span>
              <span>{badge.progressCurrent}/{badge.progressTarget}</span>
            </div>
            <AnimatedProgress current={badge.progressCurrent} target={badge.progressTarget} />
          </div>
          {badge.unlockedAt && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              Débloqué le {new Date(badge.unlockedAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

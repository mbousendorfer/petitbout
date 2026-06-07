import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  Award,
  CalendarDays,
  Check,
  CircleCheckBig,
  Flag,
  Leaf,
  LockKeyhole,
  NotebookPen,
  Palette,
  Sparkles,
  Sprout,
  Star,
  Target,
  Trophy,
} from "lucide-react"

import { Badge as UiBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { foods } from "@/data/foods"
import {
  badgeCategoryLabels,
  calculateBadges,
  calculateDiscoveryJourney,
  calculateGoals,
  calculateProgress,
  progressPercent,
  type BadgeCategory,
  type BadgeUnlockDates,
  type DiscoveryJourney,
  type DiscoveryBadge,
  type Goal,
} from "@/lib/gamification"
import type { FoodTest } from "@/lib/storage"
import { cn } from "@/lib/utils"

type DiscoveriesPageProps = {
  badgeUnlockDates: BadgeUnlockDates
  tests: FoodTest[]
}

type ProgressCard = {
  current: number
  description: string
  icon: typeof Sparkles
  target: number
  title: string
}

const categoryIcons: Record<BadgeCategory, typeof Sparkles> = {
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

export function DiscoveriesPage({ badgeUnlockDates, tests }: DiscoveriesPageProps) {
  const shouldReduceMotion = useReducedMotion()
  const [badgeFilter, setBadgeFilter] = useState<BadgeCategory | "all">("all")
  const badges = useMemo(() => calculateBadges(foods, tests, badgeUnlockDates), [badgeUnlockDates, tests])
  const goals = useMemo(() => calculateGoals(foods, tests), [tests])
  const journey = useMemo(() => calculateDiscoveryJourney(foods, tests), [tests])
  const progress = useMemo(() => calculateProgress(foods, tests), [tests])
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const nextBadges = badges
    .filter((badge) => !badge.unlocked)
    .sort(
      (a, b) =>
        progressPercent(b.progressCurrent, b.progressTarget) - progressPercent(a.progressCurrent, a.progressTarget) ||
        a.progressTarget - b.progressTarget ||
        a.name.localeCompare(b.name, "fr"),
    )
    .slice(0, 3)
  const filteredBadges = badges
    .filter((badge) => badgeFilter === "all" || badge.category === badgeFilter)
    .sort(
      (a, b) =>
        Number(b.unlocked) - Number(a.unlocked) ||
        progressPercent(b.progressCurrent, b.progressTarget) - progressPercent(a.progressCurrent, a.progressTarget) ||
        a.progressTarget - b.progressTarget ||
        a.name.localeCompare(b.name, "fr"),
    )

  const progressCards: ProgressCard[] = [
    {
      title: "Aliments découverts",
      description: "Le carnet d’exploration se remplit.",
      icon: Sparkles,
      current: progress.testedFoods,
      target: Math.min(50, foods.length),
    },
    {
      title: "Légumes",
      description: "Le potager commence à être bien exploré.",
      icon: Check,
      current: progress.vegetables,
      target: foods.filter((food) => food.category === "Légumes").length,
    },
    {
      title: "Fruits",
      description: "Une page de compotes et de couleurs.",
      icon: Sparkles,
      current: progress.fruits,
      target: foods.filter((food) => food.category === "Fruits").length,
    },
    {
      title: "Textures explorées",
      description: "Lisse, écrasé, fondant, haché...",
      icon: CalendarDays,
      current: progress.textures,
      target: 4,
    },
    {
      title: "Réactions observées",
      description: "Uniquement les signaux à surveiller, sans les chercher.",
      icon: Target,
      current: progress.reactions,
      target: 5,
    },
    {
      title: "Notes ajoutées",
      description: "Les souvenirs de dégustation prennent forme.",
      icon: Check,
      current: progress.notes,
      target: 10,
    },
    {
      title: "Aliments de saison",
      description: "Un petit panier inspiré du marché.",
      icon: Sparkles,
      current: progress.seasonalFoods,
      target: 10,
    },
  ]

  return (
    <>
      <header className="flex flex-col gap-1.5 pt-2">
        <p className="eyebrow">Carnet d’exploration</p>
        <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Découvertes</h1>
      </header>

      <JourneyHero
        journey={journey}
        nextBadges={nextBadges}
        shouldReduceMotion={shouldReduceMotion}
        unlockedBadges={unlockedBadges.length}
      />

      <Tabs defaultValue="progression" className="flex flex-col gap-4">
        <TabsList className="grid h-auto grid-cols-3">
          <TabsTrigger value="progression">Parcours</TabsTrigger>
          <TabsTrigger value="badges">Stickers</TabsTrigger>
          <TabsTrigger value="goals">Idées</TabsTrigger>
        </TabsList>

        <TabsContent value="progression" className="mt-0">
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="grid gap-4">
            <MilestonePath journey={journey} />
            <div className="grid gap-3 lg:grid-cols-2">
              {progressCards.map((card) => (
                <ProgressionCard key={card.title} card={card} />
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="badges" className="mt-0">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
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
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="goals" className="mt-0">
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </>
  )
}

function JourneyHero({
  journey,
  nextBadges,
  shouldReduceMotion,
  unlockedBadges,
}: {
  journey: DiscoveryJourney
  nextBadges: DiscoveryBadge[]
  shouldReduceMotion: boolean | null
  unlockedBadges: number
}) {
  const percent = progressPercent(journey.current, journey.target)
  const remaining = Math.max((journey.nextMilestone?.target ?? journey.target) - journey.current, 0)

  return (
    <Card className="paper-surface soft-ring overflow-hidden border-primary/15">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-2xl">Carte des découvertes</CardTitle>
            <CardDescription className="mt-2 leading-6">
              Un parcours simple : chaque aliment différent fait avancer l’album. Les stickers restent des surprises
              secondaires.
            </CardDescription>
          </div>
          <motion.div
            aria-hidden="true"
            animate={shouldReduceMotion ? undefined : { rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] }}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-soft"
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Trophy className="size-6" />
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 pt-0">
        <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/60 p-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div
            className="flex size-28 items-center justify-center rounded-full border border-primary/20 bg-background shadow-soft"
            style={{ backgroundImage: `conic-gradient(hsl(var(--primary)) ${percent}%, hsl(var(--muted)) ${percent}% 100%)` }}
            aria-label={`${journey.current} aliments découverts sur ${journey.target}`}
            role="img"
          >
            <div className="flex size-20 flex-col items-center justify-center rounded-full bg-card text-center">
              <span className="font-rounded text-2xl font-extrabold leading-none">{journey.current}</span>
              <span className="mt-1 text-[0.6875rem] font-medium leading-none text-muted-foreground">aliments</span>
            </div>
          </div>
          <div className="min-w-0 self-center">
            <p className="eyebrow">Prochain jalon</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.01em]">
              {journey.nextMilestone ? journey.nextMilestone.description : "Grand album complété"}
            </h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {journey.nextMilestone
                ? `${remaining} aliment${remaining > 1 ? "s" : ""} encore pour atteindre ce jalon.`
                : "Le parcours principal est complet, les stickers peuvent encore raconter les détails."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <HeroStat icon={Flag} label="jalons" value={`${journey.completedMilestones}/${journey.milestones.length}`} />
              <HeroStat icon={Award} label="stickers" value={`${unlockedBadges}`} />
            </div>
          </div>
        </div>
        {nextBadges.length > 0 && (
          <div className="grid gap-2">
            <p className="eyebrow">Presque débloqués</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nextBadges.map((badge) => (
                <NextBadgePill key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-muted/70 p-3">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function NextBadgePill({ badge }: { badge: DiscoveryBadge }) {
  const percent = progressPercent(badge.progressCurrent, badge.progressTarget)

  return (
    <div className="min-w-[11rem] rounded-xl border border-border/70 bg-card/80 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg" aria-hidden="true">
          {badge.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{badge.name}</p>
          <p className="text-xs text-muted-foreground">{percent}%</p>
        </div>
      </div>
      <Progress className="mt-2 h-2" value={percent} aria-label={`${badge.name}, ${badge.progressCurrent} sur ${badge.progressTarget}`} />
    </div>
  )
}

function MilestonePath({ journey }: { journey: DiscoveryJourney }) {
  return (
    <Card className="paper-surface overflow-hidden">
      <CardContent className="grid gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Parcours principal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Linéaire, basé uniquement sur les aliments différents.</p>
          </div>
          <UiBadge variant="outline" className="h-8 shrink-0 gap-1">
            <Target className="size-3.5" aria-hidden="true" />
            {journey.current}/{journey.target}
          </UiBadge>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {journey.milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex flex-col items-center gap-2 text-center">
              {index < journey.milestones.length - 1 && (
                <span
                  className={cn(
                    "absolute left-1/2 top-4 h-1 w-full rounded-full",
                    milestone.completed ? "bg-primary" : "bg-muted",
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm",
                  milestone.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
                title={milestone.description}
              >
                {milestone.completed ? <CircleCheckBig className="size-4" aria-hidden="true" /> : milestone.label}
              </span>
              <span className="text-[0.6875rem] font-medium leading-none text-muted-foreground">{milestone.target}</span>
            </div>
          ))}
        </div>
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

function ProgressionCard({ card }: { card: ProgressCard }) {
  const Icon = card.icon

  return (
    <motion.div variants={cardMotion}>
      <Card className="paper-surface overflow-hidden">
        <CardContent className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-2xl shadow-soft" aria-hidden="true">
              <Icon className="size-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold leading-tight">{card.title}</h2>
              <p className="text-sm leading-5 text-muted-foreground">{card.description}</p>
            </div>
            <p className="shrink-0 text-sm font-medium text-muted-foreground">
              {card.current}/{card.target}
            </p>
          </div>
          <AnimatedProgress current={card.current} target={card.target} />
        </CardContent>
      </Card>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <UiBadge variant="outline" className="h-7 shrink-0 gap-1">
                        <LockKeyhole className="size-3.5" aria-hidden="true" />
                        {percent}%
                      </UiBadge>
                    </TooltipTrigger>
                    <TooltipContent>{badge.unlockCondition}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="mt-auto border-t border-border/60 bg-background/45 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{badge.unlocked ? "Sticker ajouté à l’album" : badge.unlockCondition}</span>
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

function GoalCard({ goal }: { goal: Goal }) {
  return (
    <motion.div variants={cardMotion}>
      <Card className={cn("paper-surface", goal.completed && "border-primary/25 bg-primary/5")}>
        <CardContent className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                <h2 className="font-semibold">{goal.title}</h2>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{goal.description}</p>
            </div>
            {goal.completed && <UiBadge>terminé</UiBadge>}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{goal.completed ? "Petite victoire du jour." : "Suggestion douce, à votre rythme."}</span>
            <span>{goal.progressCurrent}/{goal.progressTarget}</span>
          </div>
          <AnimatedProgress current={goal.progressCurrent} target={goal.progressTarget} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CalendarDays, Check, LockKeyhole, Sparkles } from "lucide-react"

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
  calculateGoals,
  calculateProgress,
  progressPercent,
  type BadgeCategory,
  type BadgeUnlockDates,
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
  accent: string
  current: number
  description: string
  icon: typeof Sparkles
  target: number
  title: string
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
  const progress = useMemo(() => calculateProgress(foods, tests), [tests])
  const unlockedBadges = badges.filter((badge) => badge.unlocked)
  const filteredBadges = badges
    .filter((badge) => badgeFilter === "all" || badge.category === badgeFilter)
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.name.localeCompare(b.name, "fr"))

  const progressCards: ProgressCard[] = [
    {
      title: "Aliments découverts",
      description: "Le carnet d’exploration se remplit.",
      icon: Sparkles,
      current: progress.testedFoods,
      target: Math.min(50, foods.length),
      accent: "from-primary/10 to-secondary/35",
    },
    {
      title: "Légumes",
      description: "Le potager commence à être bien exploré.",
      icon: Check,
      current: progress.vegetables,
      target: foods.filter((food) => food.category === "Légumes").length,
      accent: "from-status-season/15 to-secondary/25",
    },
    {
      title: "Fruits",
      description: "Une page de compotes et de couleurs.",
      icon: Sparkles,
      current: progress.fruits,
      target: foods.filter((food) => food.category === "Fruits").length,
      accent: "from-secondary/60 to-status-attention/10",
    },
    {
      title: "Textures explorées",
      description: "Lisse, écrasé, fondant, haché...",
      icon: CalendarDays,
      current: progress.textures,
      target: 4,
      accent: "from-accent/70 to-card/75",
    },
    {
      title: "Réactions gardées",
      description: "Des observations tranquilles, utiles plus tard.",
      icon: LockKeyhole,
      current: progress.reactions,
      target: 10,
      accent: "from-accent/70 to-secondary/25",
    },
    {
      title: "Notes ajoutées",
      description: "Les souvenirs de dégustation prennent forme.",
      icon: Check,
      current: progress.notes,
      target: 10,
      accent: "from-status-attention/15 to-secondary/35",
    },
    {
      title: "Aliments de saison",
      description: "Un petit panier inspiré du marché.",
      icon: Sparkles,
      current: progress.seasonalFoods,
      target: 10,
      accent: "from-status-season/10 to-status-attention/10",
    },
  ]

  return (
    <>
      <header className="flex flex-col gap-1 pt-2">
        <p className="text-sm font-semibold text-muted-foreground">Carnet d’exploration</p>
        <h1 className="text-3xl font-semibold tracking-normal">Découvertes</h1>
      </header>

      <Card className="paper-surface soft-ring overflow-hidden border-primary/15">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-secondary/45 to-accent/35">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Album des petites victoires</CardTitle>
              <CardDescription className="mt-2 leading-6">
                Badges, objectifs doux et progrès visibles, sans pression ni compétition.
              </CardDescription>
            </div>
            <motion.div
              aria-hidden="true"
              animate={shouldReduceMotion ? undefined : { rotate: [0, -4, 4, 0], scale: [1, 1.04, 1] }}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-primary shadow-soft"
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="size-6" />
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 p-4">
          <MiniStat label="testés" value={progress.testedFoods} />
          <MiniStat label="badges" value={unlockedBadges.length} />
          <MiniStat label="objectifs" value={goals.filter((goal) => goal.completed).length} />
        </CardContent>
      </Card>

      <Tabs defaultValue="progression" className="flex flex-col gap-4">
        <TabsList className="grid h-auto grid-cols-3">
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="goals">Objectifs</TabsTrigger>
        </TabsList>

        <TabsContent value="progression" className="mt-0">
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="flex flex-col gap-3">
            {progressCards.map((card) => (
              <ProgressionCard key={card.title} card={card} />
            ))}
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
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="grid grid-cols-1 gap-3">
            {filteredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="goals" className="mt-0">
          <motion.div variants={containerMotion} initial="hidden" animate="show" className="flex flex-col gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/70 p-3 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
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
      <Card className={cn("paper-surface overflow-hidden", `bg-gradient-to-br ${card.accent}`)}>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/70 text-2xl shadow-soft" aria-hidden="true">
              <Icon className="size-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{card.title}</h2>
                  <p className="text-sm leading-5 text-muted-foreground">{card.description}</p>
                </div>
                <p className="shrink-0 text-sm font-medium text-muted-foreground">
                  {card.current}/{card.target}
                </p>
              </div>
              <div className="mt-3">
                <AnimatedProgress current={card.current} target={card.target} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BadgeCard({ badge }: { badge: DiscoveryBadge }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          variants={cardMotion}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "paper-surface w-full rounded-2xl border p-4 text-left shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            badge.unlocked ? "border-primary/20" : "opacity-60 grayscale-[0.35]",
          )}
        >
          <div className="flex items-start gap-3">
            <motion.span
              aria-hidden="true"
              animate={!shouldReduceMotion && badge.unlocked ? { scale: [0.96, 1.08, 1] } : { scale: 1 }}
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-soft",
                badge.unlocked ? "bg-secondary" : "bg-muted",
              )}
              transition={{ duration: 0.45 }}
            >
              {badge.unlocked ? <Sparkles className="size-5 text-primary" /> : <LockKeyhole className="size-5 text-muted-foreground" />}
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{badge.name}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{badge.description}</p>
                </div>
                {badge.unlocked ? (
                  <UiBadge className="h-7 shrink-0 gap-1">
                    <Check className="size-3.5" aria-hidden="true" />
                    débloqué
                  </UiBadge>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <UiBadge variant="outline" className="h-7 shrink-0 gap-1">
                          <LockKeyhole className="size-3.5" aria-hidden="true" />
                          caché
                        </UiBadge>
                      </TooltipTrigger>
                      <TooltipContent>{badge.unlockCondition}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{badgeCategoryLabels[badge.category]}</span>
                  <span>{badge.progressCurrent}/{badge.progressTarget}</span>
                </div>
                <AnimatedProgress current={badge.progressCurrent} target={badge.progressTarget} />
              </div>
            </div>
          </div>
        </motion.button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            {badge.unlocked ? <Sparkles className="size-6" /> : <LockKeyhole className="size-6" />}
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
        <CardContent className="flex flex-col gap-3 p-4">
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

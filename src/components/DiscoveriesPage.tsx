import { useMemo } from "react"
import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Apple,
  BadgeCheck,
  BriefcaseMedical,
  Carrot,
  ChartPie,
  Check,
  ChevronRight,
  Clock,
  Droplet,
  Egg,
  Globe,
  Grid3x3,
  HelpCircle,
  Heart,
  Leaf,
  Medal,
  Milk,
  NotebookPen,
  Palette,
  PenLine,
  ShieldAlert,
  Sparkles,
  Sun,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BabyAvatar } from "@/components/BabyAvatar"
import { categories, foods, type FoodCategory } from "@/data/foods"
import {
  badgeCategoryOrder,
  calculateBadges,
  nextBadge,
  progressPercent,
  type BadgeCategory,
  type BadgeUnlockDates,
  type DiscoveryBadge,
} from "@/lib/gamification"
import type { FoodTest } from "@/lib/storage"
import { cn } from "@/lib/utils"

type DiscoveriesPageProps = {
  avatarEmoji: string
  badgeUnlockDates: BadgeUnlockDates
  childName: string
  tests: FoodTest[]
}

// Icône Lucide par clé de badge (cf. SF Symbols iOS dans BadgeUnlockService.swift).
const badgeIcons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "chart-pie": ChartPie,
  grid: Grid3x3,
  apple: Apple,
  leaf: Leaf,
  "shield-alert": ShieldAlert,
  heart: Heart,
  note: NotebookPen,
  pen: PenLine,
  clock: Clock,
  globe: Globe,
  palette: Palette,
  sun: Sun,
  medical: BriefcaseMedical,
}

// Teinte éditoriale « Argile » par catégorie de badge (cf. tints iOS honey/leaf/coral/berry).
// Classes complètes (jamais interpolées) pour rester sûres au purge Tailwind.
const badgeCategoryMeta: Record<BadgeCategory, { text: string; fill: string }> = {
  milestone: { text: "text-category-starch", fill: "bg-category-starch" }, // honey
  variety: { text: "text-category-vegetable", fill: "bg-category-vegetable" }, // leaf
  story: { text: "text-category-fruit", fill: "bg-category-fruit" }, // coral
  rare: { text: "text-category-protein", fill: "bg-category-protein" }, // berry
}

// Teinte par famille d'aliment pour la section « Familles d'aliments ».
const foodCategoryMeta: Record<FoodCategory, { icon: LucideIcon; text: string; bar: string; tile: string }> = {
  Légumes: { icon: Carrot, text: "text-category-vegetable", bar: "bg-category-vegetable", tile: "bg-category-vegetable/12" },
  Fruits: { icon: Apple, text: "text-category-fruit", bar: "bg-category-fruit", tile: "bg-category-fruit/12" },
  Féculents: { icon: Wheat, text: "text-category-starch", bar: "bg-category-starch", tile: "bg-category-starch/12" },
  Protéines: { icon: Egg, text: "text-category-protein", bar: "bg-category-protein", tile: "bg-category-protein/12" },
  "Matières grasses": { icon: Droplet, text: "text-category-fat", bar: "bg-category-fat", tile: "bg-category-fat/12" },
  "Produits laitiers": { icon: Milk, text: "text-category-dairy", bar: "bg-category-dairy", tile: "bg-category-dairy/12" },
  Allergènes: { icon: ShieldAlert, text: "text-destructive", bar: "bg-destructive", tile: "bg-destructive/12" },
  Autres: { icon: Utensils, text: "text-primary", bar: "bg-primary", tile: "bg-primary/12" },
}

const containerMotion = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const cardMotion = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export function DiscoveriesPage({ avatarEmoji, badgeUnlockDates, childName, tests }: DiscoveriesPageProps) {
  const badges = useMemo(() => calculateBadges(foods, tests, badgeUnlockDates), [badgeUnlockDates, tests])
  const testedFoodIds = useMemo(() => new Set(tests.map((test) => test.foodId)), [tests])

  const testedCount = testedFoodIds.size
  const catalogPercent = foods.length === 0 ? 0 : Math.round((testedCount / foods.length) * 100)
  const unlockedBadges = badges.filter((badge) => badge.unlocked)

  const next = useMemo(() => nextBadge(badges), [badges])

  const sortedUnlocked = useMemo(
    () => [...unlockedBadges].sort((a, b) => badgeCategoryOrder[a.category] - badgeCategoryOrder[b.category]),
    [unlockedBadges],
  )

  const soonBadges = useMemo(
    () =>
      badges
        .filter((badge) => !badge.unlocked && !badge.isRare && badge.progressCurrent > 0)
        .sort((a, b) => (a.remaining !== b.remaining ? a.remaining - b.remaining : b.fraction - a.fraction))
        .slice(0, 6),
    [badges],
  )

  const rareBadges = useMemo(() => badges.filter((badge) => badge.isRare), [badges])

  const displayName = childName.trim() ? childName.trim() : "bébé"
  const heroMessage =
    testedCount === 0
      ? "Les badges apparaîtront au fil des aliments ajoutés. Rien à réussir, juste un carnet qui se remplit."
      : `${testedCount} aliment${testedCount > 1 ? "s" : ""} testé${testedCount > 1 ? "s" : ""}, ${catalogPercent}% du catalogue découvert.`

  return (
    <>
      <header className="flex flex-col gap-2 pt-2">
        <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Progression</h1>
        <p className="text-base leading-6 text-muted-foreground">{heroMessage}</p>
      </header>

      <ProgressHero
        avatarEmoji={avatarEmoji}
        childName={displayName}
        testedFoods={testedCount}
        catalogPercent={catalogPercent}
        unlockedBadges={unlockedBadges.length}
      />

      {next && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="Prochain badge" subtitle="Le repère le plus proche, sans objectif imposé." />
          <NextBadgeCard badge={next} />
        </section>
      )}

      {sortedUnlocked.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="Badges débloqués" />
          <BadgeGrid badges={sortedUnlocked} variant="unlocked" />
        </section>
      )}

      {soonBadges.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle title="Bientôt débloqués" subtitle="Des petits repères qui avancent avec le carnet." />
          <BadgeGrid badges={soonBadges} variant="locked" />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle title="Badges rares" subtitle="Quelques surprises à découvrir tranquillement." />
        <BadgeGrid badges={rareBadges} variant="rare" />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Familles d'aliments" subtitle="Un coup d'oeil aux univers déjà rencontrés." />
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
    </>
  )
}

function ProgressHero({
  avatarEmoji,
  catalogPercent,
  childName,
  testedFoods,
  unlockedBadges,
}: {
  avatarEmoji: string
  catalogPercent: number
  childName: string
  testedFoods: number
  unlockedBadges: number
}) {
  return (
    <Card className="paper-surface soft-ring overflow-hidden rounded-hero">
      <CardContent className="grid gap-4 p-5 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-xl font-bold tracking-[-0.01em]">Carnet de {childName}</h2>
          <BabyAvatar emoji={avatarEmoji} size={48} />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <SummaryTile icon={BadgeCheck} value={`${testedFoods}`} label="aliments testés" tone="primary" />
          <SummaryTile icon={ChartPie} value={`${catalogPercent}%`} label="catalogue" tone="dairy" />
          <SummaryTile icon={Medal} value={`${unlockedBadges}`} label="badges" tone="honey" />
        </div>
        <Progress value={catalogPercent} aria-label={`${catalogPercent}% du catalogue découvert`} />
        <div className="border-t border-border/40 pt-3">
          <JournalRow />
        </div>
      </CardContent>
    </Card>
  )
}

function JournalRow() {
  return (
    <NavLink
      to="/journal"
      className="-m-1 flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary"
      >
        <NotebookPen className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Journal</span>
        <span className="block text-sm leading-5 text-muted-foreground">Les aliments ajoutés, jour après jour</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/65" aria-hidden="true" />
    </NavLink>
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
    tone === "primary" ? "text-primary" : tone === "dairy" ? "text-category-dairy" : "text-status-season-month"

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

type BadgeVariant = "unlocked" | "locked" | "rare"

// Anneau de progression + icône en pastille (portage de BadgeIcon, ProgressView.swift:545-630).
function BadgeIcon({ badge, variant, size }: { badge: DiscoveryBadge; variant: BadgeVariant; size: number }) {
  const isUnlocked = badge.unlocked
  const isRareHidden = variant === "rare" && !isUnlocked

  const meta = badgeCategoryMeta[badge.category]
  const tintText = isRareHidden ? "text-muted-foreground" : meta.text

  const stroke = Math.max(5, size * 0.07)
  const radius = (size - stroke) / 2 - 1
  const circumference = 2 * Math.PI * radius
  const fraction = Math.max(0.04, badge.fraction)
  const center = size / 2

  const Icon = badgeIcons[badge.iconKey]

  return (
    <div className="relative shrink-0" style={{ width: size + 10, height: size + 10 }}>
      <div className={cn("relative", tintText)} style={{ width: size, height: size, margin: 5 }}>
        {/* Pastille de fond */}
        <div
          className={cn("absolute inset-0 rounded-full", isUnlocked ? meta.fill : "bg-muted")}
          style={{ boxShadow: isUnlocked ? "0 5px 12px -4px currentColor" : undefined }}
        />
        {/* Anneau de progression */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden="true">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="text-border/50"
            stroke="currentColor"
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
          />
        </svg>
        {/* Icône / chiffre centré */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-rounded font-bold",
            isUnlocked ? "text-white" : tintText,
          )}
          style={{ fontSize: size * 0.3 }}
        >
          {isRareHidden ? (
            <HelpCircle style={{ width: size * 0.34, height: size * 0.34 }} />
          ) : badge.iconLabel ? (
            <span>{badge.iconLabel}</span>
          ) : Icon ? (
            <Icon style={{ width: size * 0.34, height: size * 0.34 }} />
          ) : null}
        </div>
      </div>
      {/* Overlay bas-droite : check si débloqué, sinon pastille « X/Y » */}
      {isUnlocked ? (
        <span
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-category-vegetable text-white ring-2 ring-card"
          style={{ width: size * 0.3, height: size * 0.3 }}
          aria-hidden="true"
        >
          <Check style={{ width: size * 0.18, height: size * 0.18 }} strokeWidth={3} />
        </span>
      ) : (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border bg-card px-1.5 py-0.5 text-eyebrow font-bold tabular-nums text-muted-foreground">
          {badge.progressCurrent}/{badge.progressTarget}
        </span>
      )}
    </div>
  )
}

function NextBadgeCard({ badge }: { badge: DiscoveryBadge }) {
  const meta = badgeCategoryMeta[badge.category]

  return (
    <Card className="paper-surface overflow-hidden rounded-hero">
      <CardContent className="flex items-center gap-4 p-4 sm:p-4">
        <BadgeIcon badge={badge} variant="locked" size={72} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight">{badge.title}</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{badge.detail}</p>
          <Progress className="mt-2 h-2" value={progressPercent(badge.progressCurrent, badge.progressTarget)} />
        </div>
        <span className={cn("shrink-0 self-start rounded-full bg-muted px-2.5 py-1 text-xs font-bold", meta.text)}>
          {badge.progressCurrent}/{badge.progressTarget}
        </span>
      </CardContent>
    </Card>
  )
}

function BadgeGrid({ badges, variant }: { badges: DiscoveryBadge[]; variant: BadgeVariant }) {
  return (
    <motion.div
      variants={containerMotion}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} variant={variant} />
      ))}
    </motion.div>
  )
}

function BadgeCard({ badge, variant }: { badge: DiscoveryBadge; variant: BadgeVariant }) {
  const isRareHidden = variant === "rare" && !badge.unlocked
  const title = isRareHidden ? "Badge rare" : badge.title
  const detail = badge.unlocked ? badge.unlockedDetail : badge.detail
  const meta = badgeCategoryMeta[badge.category]

  return (
    <motion.div
      variants={cardMotion}
      className={cn(
        "paper-surface flex min-h-[13.5rem] flex-col items-center gap-2 rounded-card border p-4 text-center shadow-card",
        badge.unlocked ? "border-border/40" : "border-border/60",
      )}
    >
      <BadgeIcon badge={badge} variant={variant} size={96} />
      <h3 className="line-clamp-2 text-sm font-bold leading-tight">{title}</h3>
      <p className="line-clamp-3 text-xs leading-4 text-muted-foreground">{detail}</p>
      {!badge.unlocked &&
        (isRareHidden ? (
          <span className="mt-auto rounded-full bg-category-protein/12 px-2 py-0.5 text-label font-bold text-category-protein">
            Rare
          </span>
        ) : (
          <span className={cn("mt-auto rounded-full bg-muted px-2 py-0.5 text-label font-bold tabular-nums", meta.text)}>
            {badge.progressCurrent}/{badge.progressTarget}
          </span>
        ))}
    </motion.div>
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

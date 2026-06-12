import { useEffect, type CSSProperties } from "react"
import {
  Apple,
  BriefcaseMedical,
  ChartPie,
  Check,
  Clock,
  Globe,
  Grid3x3,
  Heart,
  Leaf,
  NotebookPen,
  Palette,
  PenLine,
  ShieldAlert,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react"
import type { BadgeCategory, DiscoveryBadge } from "@/lib/gamification"
import { cn } from "@/lib/utils"

type BadgeUnlockCelebrationProps = {
  badge: DiscoveryBadge | null
  onDismiss: () => void
}

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

const badgeCategoryMeta: Record<BadgeCategory, { fill: string; glow: string; text: string }> = {
  milestone: {
    fill: "bg-category-starch",
    glow: "shadow-category-starch/30",
    text: "text-category-starch",
  },
  variety: {
    fill: "bg-category-vegetable",
    glow: "shadow-category-vegetable/30",
    text: "text-category-vegetable",
  },
  story: {
    fill: "bg-category-fruit",
    glow: "shadow-category-fruit/30",
    text: "text-category-fruit",
  },
  rare: {
    fill: "bg-category-protein",
    glow: "shadow-category-protein/30",
    text: "text-category-protein",
  },
}

const confettiPieces = [
  ["8%", "-8%", "-34deg", "bg-category-starch"],
  ["18%", "14%", "18deg", "bg-category-fruit"],
  ["30%", "-14%", "42deg", "bg-category-vegetable"],
  ["42%", "12%", "-18deg", "bg-primary"],
  ["55%", "-10%", "24deg", "bg-category-dairy"],
  ["68%", "15%", "-42deg", "bg-category-protein"],
  ["80%", "-12%", "30deg", "bg-status-season-month"],
  ["91%", "10%", "-22deg", "bg-category-fat"],
] as const

export function BadgeUnlockCelebration({ badge, onDismiss }: BadgeUnlockCelebrationProps) {
  useEffect(() => {
    if (!badge) return

    const timeout = window.setTimeout(onDismiss, 5200)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [badge, onDismiss])

  if (!badge) return null

  const Icon = badgeIcons[badge.iconKey]
  const meta = badgeCategoryMeta[badge.category]

  return (
    <section
      className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center px-5 py-8"
      aria-live="polite"
      aria-label={`Badge débloqué : ${badge.title}`}
    >
      <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="badge-confetti absolute inset-x-4 top-[18%] mx-auto h-44 max-w-md" aria-hidden="true">
        {confettiPieces.map(([left, top, rotate, color], index) => (
          <span
            key={`${left}-${top}`}
            className={cn("badge-confetti-piece absolute h-3 w-1.5 rounded-full", color)}
            style={
              {
                "--confetti-left": left,
                "--confetti-top": top,
                "--confetti-rotate": rotate,
                "--confetti-delay": `${index * 65}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div
        className="badge-celebration-card pointer-events-auto relative w-full max-w-sm rounded-2xl border bg-card/95 p-5 text-center shadow-lg shadow-foreground/10"
        role="status"
      >
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onDismiss}
          aria-label="Fermer la célébration"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="mx-auto mb-4 flex size-28 items-center justify-center rounded-full bg-muted/55">
          <div className={cn("relative flex size-20 items-center justify-center rounded-full text-white shadow-xl", meta.fill, meta.glow)}>
            {badge.iconLabel ? (
              <span className="font-rounded text-2xl font-extrabold leading-none">{badge.iconLabel}</span>
            ) : Icon ? (
              <Icon className="size-8" aria-hidden="true" />
            ) : (
              <Sparkles className="size-8" aria-hidden="true" />
            )}
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-category-vegetable text-white ring-4 ring-card">
              <Check className="size-4" strokeWidth={3} aria-hidden="true" />
            </span>
          </div>
        </div>

        <p className={cn("text-xs font-bold uppercase tracking-wide", meta.text)}>Badge débloqué</p>
        <h2 className="mt-1 font-rounded text-2xl font-extrabold tracking-[-0.01em]">{badge.title}</h2>
        <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-5 text-muted-foreground">{badge.unlockedDetail}</p>
      </div>
    </section>
  )
}

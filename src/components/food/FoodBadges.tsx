import { BadgeCheck, Clock, Leaf } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Food } from "@/data/foods"
import { currentMonth, monthNames } from "@/lib/food-utils"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: string }) {
  if (status !== "non testé") {
    return (
      <Badge className="h-8 gap-1.5 border-transparent bg-status-tested px-3 text-status-tested-foreground">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Testé
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="h-8 gap-1.5 border-border bg-status-untested px-3 text-status-untested-foreground">
      <Clock className="size-3.5" aria-hidden="true" />
      Non testé
    </Badge>
  )
}

export function SeasonBadge() {
  return (
    <Badge className="h-8 gap-1.5 border-transparent bg-status-season px-3 text-status-season-foreground shadow-sm shadow-primary/10">
      <Leaf className="size-4" aria-hidden="true" />
      de saison
    </Badge>
  )
}

export function IntroductionBadge({ level }: { level: Food["level"] }) {
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

const seasonMonthAbbreviations = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"]

export function SeasonMonthsGrid({ activeMonths }: { activeMonths: number[] }) {
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
                  ? "border-[hsl(38_66%_38%)] bg-[hsl(38_66%_38%)] text-white dark:border-[hsl(43_72%_64%)] dark:bg-[hsl(43_72%_64%)] dark:text-[hsl(30_25%_12%)]"
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

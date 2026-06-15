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
      className="grid w-full grid-cols-12 gap-1.5"
      aria-label={`Mois de saison : ${monthNames(activeMonths)}`}
    >
      {seasonMonthAbbreviations.map((month, index) => {
        const monthNumber = index + 1
        const isActive = activeMonthSet.has(monthNumber)
        const isCurrentMonth = monthNumber === currentSeasonMonth

        return (
          <span
            key={month}
            // Pastilles rondes type sélecteur de jours iOS, deux canaux distincts :
            // — DE SAISON : disque sauge plein vs cercle fantôme (contour fin, vide).
            // — MOIS COURANT : anneau clay DÉTACHÉ (ring + offset couleur-fond), façon
            //   « aujourd'hui » d'un calendrier — l'anneau flotte autour du disque sans
            //   toucher le fond, donc pas de clash orange/vert. Toujours visible qu'on
            //   soit de saison ou non.
            className={cn(
              "flex aspect-square min-w-0 items-center justify-center rounded-full text-eyebrow font-bold uppercase leading-none",
              isActive
                ? "bg-status-season text-status-season-foreground shadow-sm"
                : isCurrentMonth
                  ? "text-foreground"
                  : "border-2 border-border text-muted-foreground",
              isCurrentMonth && "ring-2 ring-status-season ring-offset-2 ring-offset-card",
            )}
            aria-label={isCurrentMonth ? `${month} (mois actuel)` : undefined}
            aria-hidden={isCurrentMonth ? undefined : true}
          >
            {month.charAt(0)}
          </span>
        )
      })}
    </div>
  )
}

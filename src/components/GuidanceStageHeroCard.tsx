import { NavLink } from "react-router-dom"
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Hand,
  Leaf,
  ListChecks,
  Milk,
  ShieldAlert,
  Soup,
  Utensils,
  type LucideIcon,
} from "lucide-react"

import { StageProgressStrip } from "@/components/StageProgressStrip"
import { type GuidanceStage } from "@/data/guidance"
import { cn } from "@/lib/utils"

export const stageMeta: Array<{ icon: LucideIcon; text: string; iconBg: string; iconBgCurrent: string }> = [
  { icon: Calendar, text: "text-category-fat", iconBg: "bg-category-fat/10", iconBgCurrent: "bg-category-fat/20" },
  { icon: Leaf, text: "text-status-tested", iconBg: "bg-status-tested/10", iconBgCurrent: "bg-status-tested/20" },
  { icon: Hand, text: "text-category-dairy", iconBg: "bg-category-dairy/10", iconBgCurrent: "bg-category-dairy/20" },
  { icon: Utensils, text: "text-category-protein", iconBg: "bg-category-protein/10", iconBgCurrent: "bg-category-protein/20" },
]

// Ligne « fait » à plat (Texture, Lait) — icône colorée + libellé + valeur,
// sans conteneur ni puce, pour alléger la carte. Partagée avec le carrousel
// d'étapes de la page Repères.
export function StageFact({ icon: Icon, label, tint, value }: { icon: LucideIcon; label: string; tint: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("mt-0.5 size-[1.15rem] shrink-0", tint)} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-foreground/85">{value}</p>
      </div>
    </div>
  )
}

// Intitulé de section à plat — petite icône colorée + libellé en capitales.
function StageSectionLabel({ icon: Icon, tint, children }: { icon: LucideIcon; tint: string; children: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-4 shrink-0", tint)} aria-hidden="true" />
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{children}</p>
    </div>
  )
}

export function GuidanceStageHeroCard({
  ageMonths,
  childName,
  className,
  currentStageIndex,
  stage,
  to,
}: {
  ageMonths: number
  childName: string
  className?: string
  currentStageIndex: number
  stage: GuidanceStage
  to?: string
}) {
  const meta = stageMeta[currentStageIndex] ?? stageMeta[0]
  const Icon = meta.icon
  const cardClassName = cn(
    "group block overflow-hidden rounded-hero border bg-card text-left shadow-soft transition-[transform,box-shadow,border-color] duration-200",
    to &&
      "hover:-translate-y-0.5 hover:border-status-tested/50 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  )
  const divider = <div className="my-4 h-px bg-border/45" aria-hidden="true" />
  const content = (
    <>
      {/* En-tête héro — bandeau teinté par l'étape, avec l'âge et le titre mis en avant. */}
      <div className={cn("relative overflow-hidden px-4 pb-5 pt-4 sm:px-5", meta.iconBgCurrent)}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-card/30 to-transparent"
        />

        <div className="relative flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border/40 sm:size-[3.25rem]",
              meta.text,
            )}
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("text-[0.7rem] font-bold uppercase tracking-[0.1em]", meta.text)}>
                Étape {currentStageIndex + 1}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-0.5 text-[0.7rem] font-bold text-status-tested ring-1 ring-status-tested/15">
                <span className="size-1.5 rounded-full bg-status-tested" aria-hidden="true" />
                Actuel
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground/65">
              {childName} · {ageMonths} mois
            </p>
          </div>
          {to && (
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card/70 text-muted-foreground transition-colors group-hover:text-status-tested"
            >
              <ChevronRight className="size-5" />
            </span>
          )}
        </div>

        <div className="relative mt-4">
          <p className={cn("font-rounded text-[1.75rem] font-extrabold leading-none tracking-[-0.01em] sm:text-3xl", meta.text)}>
            {stage.ageRange}
          </p>
          <p className="mt-1.5 text-lg font-bold leading-snug tracking-[-0.01em] text-foreground sm:text-xl">
            {stage.title}
          </p>
        </div>
      </div>

      {/* Corps — sections à plat, séparées par de simples filets. */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3.5">
          <StageFact icon={Soup} label="Texture" value={stage.texture} tint={meta.text} />
          <StageFact icon={Milk} label="Lait" value={stage.milk} tint={meta.text} />
        </div>

        {divider}

        <StageSectionLabel icon={ListChecks} tint={meta.text}>
          À retenir
        </StageSectionLabel>
        <ul className="mt-2.5 flex flex-col gap-2">
          {stage.principles.map((principle) => (
            <li key={principle} className="flex items-start gap-2.5 text-sm leading-5 text-foreground/85">
              <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", meta.text)} aria-hidden="true" />
              <span>{principle}</span>
            </li>
          ))}
        </ul>

        {divider}

        <StageSectionLabel icon={ShieldAlert} tint="text-status-attention">
          À surveiller
        </StageSectionLabel>
        <ul className="mt-2.5 flex flex-col gap-2">
          {stage.watchPoints.map((watchPoint) => (
            <li key={watchPoint} className="flex items-start gap-2.5 text-sm font-medium leading-5 text-foreground/80">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-status-attention" aria-hidden="true" />
              <span>{watchPoint}</span>
            </li>
          ))}
        </ul>

        {divider}

        <StageProgressStrip currentStageIndex={currentStageIndex} />
      </div>
    </>
  )

  if (to) {
    return (
      <NavLink
        to={to}
        className={cardClassName}
        aria-label={`Ouvrir les repères de diversification pour ${stage.ageRange}`}
      >
        {content}
      </NavLink>
    )
  }

  return <section className={cardClassName}>{content}</section>
}

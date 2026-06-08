import {
  BadgeCheck,
  Calendar,
  CircleCheck,
  Cross,
  ExternalLink,
  FileSearch,
  ShieldAlert,
  Sparkles,
  Star,
  Waypoints,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
  guidanceAvoid,
  guidanceRules,
  guidanceSources,
  guidanceStageFor,
  guidanceStageIndexFor,
  guidanceStages,
  type GuidanceRule,
  type GuidanceStage,
} from "@/data/guidance"
import { cn } from "@/lib/utils"

type GuidancePageProps = {
  ageMonths: number
  childName: string
}

export function GuidancePage({ ageMonths, childName }: GuidancePageProps) {
  const displayName = childName.trim() ? childName.trim() : "bébé"
  const currentStage = guidanceStageFor(ageMonths)
  const currentStageIndex = guidanceStageIndexFor(ageMonths)

  return (
    <>
      <GuidanceHero
        ageMonths={ageMonths}
        childName={displayName}
        stage={currentStage}
        currentStageIndex={currentStageIndex}
      />
      <GuidanceEssentials childName={displayName} stage={currentStage} />
      <GuidanceStagesCarousel currentStageIndex={currentStageIndex} />
      <GuidanceRules />
      <GuidanceAvoid />
      <GuidanceSources />
      <GuidanceDisclaimer />
    </>
  )
}

function GuidanceHero({
  ageMonths,
  childName,
  stage,
  currentStageIndex,
}: {
  ageMonths: number
  childName: string
  stage: GuidanceStage
  currentStageIndex: number
}) {
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 pt-2">
        <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Repères</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Des repères simples pour suivre la diversification, sans remplacer un avis médical.
        </p>
      </header>

      <Card className="paper-surface soft-ring overflow-hidden rounded-hero">
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-status-tested/15 text-status-tested"
            >
              <Sparkles className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-status-tested">Repère actuel</p>
              <p className="mt-1 font-rounded text-2xl font-extrabold tracking-[-0.01em]">{stage.ageRange}</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {childName} · {ageMonths} mois
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-bold tracking-[-0.01em]">{stage.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{stage.texture}</p>
            <p className="text-sm leading-6 text-muted-foreground">{stage.milk}</p>
          </div>

          <StageProgressStrip currentStageIndex={currentStageIndex} />
        </CardContent>
      </Card>
    </section>
  )
}

function StageProgressStrip({ currentStageIndex }: { currentStageIndex: number }) {
  return (
    <div className="flex items-end gap-2" aria-hidden="true">
      {guidanceStages.map((stage, index) => {
        const reached = index <= currentStageIndex
        const isCurrent = index === currentStageIndex

        return (
          <div key={stage.ageRange} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={cn("rounded-full transition-colors", isCurrent ? "h-2" : "h-1.5", reached ? "bg-status-tested" : "bg-border")}
            />
            <span
              className={cn(
                "truncate text-[0.625rem] font-semibold leading-none",
                isCurrent ? "text-status-tested" : "text-muted-foreground",
              )}
            >
              {stage.ageRange}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function GuidanceSectionHeader({
  icon: Icon,
  subtitle,
  title,
}: {
  icon: LucideIcon
  subtitle?: string
  title: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-status-tested/12 text-status-tested"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

function GuidanceEssentials({ childName, stage }: { childName: string; stage: GuidanceStage }) {
  const highlights = stage.principles.slice(0, 3)

  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={BadgeCheck}
        title="À retenir maintenant"
        subtitle={`Les points utiles pour l'âge de ${childName}.`}
      />
      <div className="grid gap-2.5">
        <InsightCard title="Texture" detail={stage.texture} prominent />
        {highlights.map((principle, index) => (
          <InsightCard key={index} title={`Repère ${index + 1}`} detail={principle} />
        ))}
      </div>
    </section>
  )
}

function InsightCard({
  detail,
  prominent = false,
  title,
}: {
  detail: string
  prominent?: boolean
  title: string
}) {
  const Icon = prominent ? Sparkles : CircleCheck

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border bg-card/85 p-4 shadow-soft",
        prominent && "border-status-tested/25 bg-status-tested/[0.06]",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-status-tested/12 text-status-tested"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-bold",
            prominent ? "text-status-tested" : "text-xs uppercase tracking-wide text-muted-foreground",
          )}
        >
          {title}
        </p>
        <p className={cn("mt-1 leading-6", prominent ? "text-base font-semibold" : "text-sm")}>{detail}</p>
      </div>
    </div>
  )
}

function GuidanceStagesCarousel({ currentStageIndex }: { currentStageIndex: number }) {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={Waypoints}
        title="Étapes"
        subtitle="Une progression souple, à adapter au rythme de bébé."
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="flex snap-x snap-mandatory gap-3">
          {guidanceStages.map((stage, index) => (
            <StageCarouselCard key={stage.ageRange} stage={stage} isCurrent={index === currentStageIndex} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StageCarouselCard({ isCurrent, stage }: { isCurrent: boolean; stage: GuidanceStage }) {
  const Icon = isCurrent ? Sparkles : Calendar

  return (
    <div
      className={cn(
        "flex min-h-[15rem] w-[16rem] shrink-0 snap-start flex-col gap-3 rounded-hero border bg-card p-4 shadow-soft",
        isCurrent ? "border-status-tested/30" : "border-border",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-rounded text-xl font-extrabold tracking-[-0.01em]">{stage.ageRange}</p>
        {isCurrent && (
          <span className="rounded-full bg-status-tested/12 px-2 py-0.5 text-xs font-bold text-status-tested">Actuel</span>
        )}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 items-center justify-center rounded-md",
          isCurrent ? "bg-status-tested/12 text-status-tested" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="line-clamp-2 font-semibold leading-tight">{stage.title}</p>
      <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">{stage.texture}</p>
    </div>
  )
}

function GuidanceRules() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={Star}
        title="Règles d'or"
        subtitle="Des repères simples, pensés pour guider sans pression."
      />
      <div className="grid gap-2.5">
        {guidanceRules.map((rule, index) => (
          <RuleCard key={rule.title} rule={rule} index={index} />
        ))}
      </div>
    </section>
  )
}

function RuleCard({ index, rule }: { index: number; rule: GuidanceRule }) {
  const Icon = rule.icon
  const accent = index === 1 ? "primary" : "tested"

  return (
    <div className="flex items-start gap-3 rounded-card border bg-card/85 p-4 shadow-soft">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-md",
          accent === "primary" ? "bg-primary/12 text-primary" : "bg-status-tested/12 text-status-tested",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-xs font-bold", accent === "primary" ? "text-primary" : "text-status-tested")}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-semibold leading-tight">{rule.title}</h3>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{rule.detail}</p>
      </div>
    </div>
  )
}

function GuidanceAvoid() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={ShieldAlert}
        title="À éviter"
        subtitle="Quelques limites importantes à garder en tête."
      />
      <div className="grid gap-2.5">
        {guidanceAvoid.map((item) => (
          <CautionCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}

function CautionCard({ item }: { item: GuidanceRule }) {
  const Icon = item.icon

  return (
    <div className="flex items-start gap-3 rounded-card border border-destructive/20 bg-destructive/[0.07] p-4 shadow-soft">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/12 text-destructive"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold leading-tight">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
      </div>
    </div>
  )
}

function GuidanceSources() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={FileSearch}
        title="Sources utilisées"
        subtitle="Les ressources publiques derrière les repères."
      />
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {guidanceSources.map((source) => (
          <li key={source.url}>
            <a
              className="group flex h-full flex-col gap-1 rounded-card border bg-card/85 p-4 shadow-soft transition-colors hover:border-primary/25"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              <span className="inline-flex items-start gap-1.5 text-sm font-semibold text-foreground underline-offset-4 group-hover:underline">
                <span className="leading-5">{source.title}</span>
                <ExternalLink
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {source.publisher} · {source.year}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GuidanceDisclaimer() {
  return (
    <div className="flex items-start gap-2 px-1">
      <Cross className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
      <p className="text-xs leading-5 text-muted-foreground">
        Repères généraux, pas diagnostic. En cas de doute, de réaction ou de situation particulière, demande conseil
        à un professionnel de santé.
      </p>
    </div>
  )
}

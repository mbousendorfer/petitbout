import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseMedical,
  Calendar,
  CircleCheck,
  Cross,
  FileSearch,
  FileText,
  Globe,
  Hand,
  Landmark,
  Leaf,
  ShieldAlert,
  Sparkles,
  Star,
  Utensils,
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
  type GuidanceSource,
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
        <div className="flex snap-x snap-mandatory gap-4">
          {guidanceStages.map((stage, index) => (
            <StageCarouselCard
              key={stage.ageRange}
              stage={stage}
              index={index}
              isCurrent={index === currentStageIndex}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Teinte + icône par étape (cf. iOS GuidanceStageCarouselCard : olive / leaf / sky / berry).
// Classes littérales complètes pour rester sûres au purge Tailwind.
const stageMeta: Array<{ icon: LucideIcon; text: string; iconBg: string; iconBgCurrent: string }> = [
  { icon: Calendar, text: "text-category-fat", iconBg: "bg-category-fat/10", iconBgCurrent: "bg-category-fat/20" },
  { icon: Leaf, text: "text-status-tested", iconBg: "bg-status-tested/10", iconBgCurrent: "bg-status-tested/20" },
  { icon: Hand, text: "text-category-dairy", iconBg: "bg-category-dairy/10", iconBgCurrent: "bg-category-dairy/20" },
  { icon: Utensils, text: "text-category-protein", iconBg: "bg-category-protein/10", iconBgCurrent: "bg-category-protein/20" },
]

function StageCarouselCard({ index, isCurrent, stage }: { index: number; isCurrent: boolean; stage: GuidanceStage }) {
  const meta = stageMeta[index] ?? stageMeta[0]
  const Icon = meta.icon
  const keyPoint = stage.principles[0] ?? stage.texture

  return (
    <div
      className={cn(
        "flex h-[16.5rem] w-[17rem] shrink-0 snap-start flex-col gap-4 rounded-hero border bg-card p-5",
        isCurrent ? "border-status-tested/40" : "border-border shadow-soft",
      )}
      style={isCurrent ? { boxShadow: "0 10px 26px -14px hsl(var(--status-tested) / 0.55)" } : undefined}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-card",
            isCurrent ? meta.iconBgCurrent : meta.iconBg,
            meta.text,
          )}
        >
          <Icon className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-xs font-bold uppercase tracking-wide", meta.text)}>Étape {index + 1}</span>
            {isCurrent && (
              <span className="rounded-full bg-status-tested/12 px-2 py-0.5 text-[11px] font-bold text-status-tested">
                Actuel
              </span>
            )}
          </div>
          <p className="font-rounded text-2xl font-extrabold leading-none tracking-[-0.01em]">{stage.ageRange}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="line-clamp-2 font-bold leading-tight">{stage.title}</p>
        <p className="line-clamp-2 text-sm font-medium leading-5 text-muted-foreground">{stage.texture}</p>
      </div>

      <div className="mt-auto flex items-start gap-2 border-t border-border/30 pt-3">
        <CircleCheck aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", meta.text)} />
        <p className="line-clamp-2 text-xs font-semibold leading-5 text-foreground/70">{keyPoint}</p>
      </div>
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
      <div className="overflow-hidden rounded-card border bg-card/85 shadow-soft">
        {guidanceRules.map((rule, index) => (
          <RuleRow key={rule.title} rule={rule} index={index} last={index === guidanceRules.length - 1} />
        ))}
      </div>
    </section>
  )
}

function RuleRow({ index, last, rule }: { index: number; last: boolean; rule: GuidanceRule }) {
  const Icon = rule.icon
  const accent = index === 1 ? "primary" : "tested"

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3.5", !last && "border-b border-border/40")}>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          accent === "primary" ? "bg-primary/12 text-primary" : "bg-status-tested/12 text-status-tested",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold leading-snug">{rule.title}</h3>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{rule.detail}</p>
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
    <div className="flex items-start gap-3.5 rounded-card border border-destructive/20 bg-destructive/[0.06] p-4 shadow-soft">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/[0.12] text-destructive"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-bold leading-tight">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
      </div>
    </div>
  )
}

// Icône contextuelle par éditeur (cf. iOS sourceIcon(for:)).
function sourceIconFor(publisher: string): LucideIcon {
  const value = publisher.toLowerCase()
  if (value.includes("assurance")) return BriefcaseMedical
  if (value.includes("oms") || value.includes("organisation")) return Globe
  if (value.includes("nejm")) return FileText
  if (value.includes("hcsp")) return Landmark
  return FileSearch
}

function GuidanceSources() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={FileSearch}
        title="Sources utilisées"
        subtitle="Les ressources publiques derrière les repères."
      />
      <div className="overflow-hidden rounded-card border bg-card/85 shadow-soft">
        {guidanceSources.map((source, index) => (
          <SourceRow key={source.url} source={source} last={index === guidanceSources.length - 1} />
        ))}
      </div>
    </section>
  )
}

function SourceRow({ last, source }: { last: boolean; source: GuidanceSource }) {
  const Icon = sourceIconFor(source.publisher)

  return (
    <a
      className={cn(
        "group flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-status-tested/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-tested/60",
        !last && "border-b border-border/40",
      )}
      href={source.url}
      rel="noreferrer"
      target="_blank"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-tested/[0.09] text-status-tested"
      >
        <Icon className="size-[1.05rem]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-xs font-semibold text-muted-foreground">{source.publisher}</span>
          <span className="shrink-0 text-[0.6875rem] font-medium text-muted-foreground/70">{source.year}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-5 text-foreground underline-offset-4 group-hover:underline">
          {source.title}
        </p>
      </div>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 self-start text-status-tested/45 transition-colors group-hover:text-status-tested"
      />
    </a>
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

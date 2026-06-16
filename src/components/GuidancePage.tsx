import {
  FileSearch,
  ShieldAlert,
  Star,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { GuidanceStageCard } from "@/components/GuidanceStageCard"
import { Disclaimer } from "@/components/primitives"
import { Button } from "@/components/ui/button"
import {
  guidanceAvoid,
  guidanceRules,
  guidanceStageIndexFor,
  guidanceStages,
  type GuidanceRule,
} from "@/data/guidance"
import { cn } from "@/lib/utils"

type GuidancePageProps = {
  ageMonths: number
  childName: string
}

export function GuidancePage({ ageMonths }: GuidancePageProps) {
  const currentStageIndex = guidanceStageIndexFor(ageMonths)

  return (
    <>
      <GuidanceHero />
      <GuidanceStagesCarousel currentStageIndex={currentStageIndex} />
      <GuidanceRules />
      <GuidanceAvoid />
      <GuidanceSourcesLink />
      <Disclaimer />
    </>
  )
}

function GuidanceHero() {
  return (
    <header className="flex flex-col gap-2 pt-2">
      <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em]">Repères</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Des repères simples pour suivre la diversification, sans remplacer un avis médical.
      </p>
    </header>
  )
}

function GuidanceSectionHeader({
  icon: Icon,
  subtitle,
  title,
  tint = "tested",
}: {
  icon: LucideIcon
  subtitle?: string
  title: string
  tint?: "tested" | "destructive"
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          tint === "destructive" ? "bg-destructive/12 text-destructive" : "bg-status-tested/12 text-status-tested",
        )}
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
            <GuidanceStageCard
              key={stage.ageRange}
              stage={stage}
              index={index}
              currentStageIndex={currentStageIndex}
              fixedWidth
            />
          ))}
        </div>
      </div>
    </section>
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
        tint="destructive"
      />
      <div className="overflow-hidden rounded-card border border-destructive/20 bg-card/85 shadow-soft">
        {guidanceAvoid.map((item, index) => (
          <AvoidRow key={item.title} item={item} last={index === guidanceAvoid.length - 1} />
        ))}
      </div>
    </section>
  )
}

function AvoidRow({ item, last }: { item: GuidanceRule; last: boolean }) {
  const Icon = item.icon

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3.5", !last && "border-b border-destructive/15")}>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/12 text-destructive"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold leading-snug">{item.title}</h3>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{item.detail}</p>
      </div>
    </div>
  )
}

function GuidanceSourcesLink() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={FileSearch}
        title="Sources utilisées"
        subtitle="Ressources publiques des repères."
      />
      <Button asChild variant="outline" className="w-full justify-between">
        <NavLink to="/guidance/sources">
          Voir les sources
          <FileSearch className="size-4" aria-hidden="true" />
        </NavLink>
      </Button>
    </section>
  )
}

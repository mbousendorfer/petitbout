import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseMedical,
  CircleCheck,
  Cross,
  FileSearch,
  FileText,
  Globe,
  Landmark,
  ListChecks,
  Milk,
  ShieldAlert,
  Soup,
  Star,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { GuidanceStageHeroCard, StageFact, stageMeta } from "@/components/GuidanceStageHeroCard"
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

      <GuidanceStageHeroCard
        ageMonths={ageMonths}
        childName={childName}
        currentStageIndex={currentStageIndex}
        stage={stage}
        className="paper-surface soft-ring"
      />
    </section>
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

function StageCarouselCard({ index, isCurrent, stage }: { index: number; isCurrent: boolean; stage: GuidanceStage }) {
  const [flipped, setFlipped] = useState(false)
  const reduceMotion = useReducedMotion()
  const meta = stageMeta[index] ?? stageMeta[0]
  const Icon = meta.icon

  const faceBase = cn(
    "absolute inset-0 flex flex-col overflow-hidden rounded-hero border bg-card [backface-visibility:hidden]",
    isCurrent ? "border-status-tested/40" : "border-border shadow-soft",
  )
  const faceStyle = isCurrent ? { boxShadow: "0 10px 26px -14px hsl(var(--status-tested) / 0.55)" } : undefined
  const toggleClassName =
    "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="relative h-[23.5rem] w-[17rem] shrink-0 snap-start [perspective:1400px]">
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
      >
        {/* Recto — en-tête teinté + infos de l'étape */}
        <div className={faceBase} style={faceStyle} aria-hidden={flipped}>
          <div className={cn("relative overflow-hidden p-4", isCurrent ? meta.iconBgCurrent : meta.iconBg)}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-card/30 to-transparent"
            />
            <div className="relative flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border/40",
                  meta.text,
                )}
              >
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn("text-[0.7rem] font-bold uppercase tracking-[0.1em]", meta.text)}>
                    Étape {index + 1}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[0.7rem] font-bold text-status-tested ring-1 ring-status-tested/15">
                      <span className="size-1.5 rounded-full bg-status-tested" aria-hidden="true" />
                      Actuel
                    </span>
                  )}
                </div>
                <p className={cn("mt-0.5 font-rounded text-2xl font-extrabold leading-none tracking-[-0.01em]", meta.text)}>
                  {stage.ageRange}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4 pt-3.5">
            <p className="line-clamp-2 text-base font-bold leading-snug tracking-[-0.01em]">{stage.title}</p>
            <div className="flex flex-col gap-3">
              <StageFact icon={Soup} label="Texture" value={stage.texture} tint={meta.text} />
              <StageFact icon={Milk} label="Lait" value={stage.milk} tint={meta.text} />
            </div>

            <button
              type="button"
              className={cn(toggleClassName, "mt-auto")}
              onClick={() => setFlipped(true)}
              aria-expanded={flipped}
              tabIndex={flipped ? -1 : 0}
              aria-label={`Voir les ${stage.principles.length} repères à retenir pour ${stage.ageRange}`}
            >
              <ListChecks className={cn("size-4", meta.text)} aria-hidden="true" />
              À retenir · {stage.principles.length}
            </button>
          </div>
        </div>

        {/* Verso — les repères à retenir de l'étape */}
        <div className={cn(faceBase, "gap-4 p-5 [transform:rotateY(180deg)]")} style={faceStyle} aria-hidden={!flipped}>
          <div className="flex items-center justify-between gap-2">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide", meta.text)}>
              <ListChecks className="size-3.5" aria-hidden="true" />
              À retenir
            </span>
            <span className="shrink-0 text-sm font-semibold text-muted-foreground">{stage.ageRange}</span>
          </div>

          <ul className="-mr-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
            {stage.principles.map((principle, principleIndex) => (
              <li key={principleIndex} className="flex items-start gap-2 text-sm leading-6 text-foreground/80">
                <CircleCheck className={cn("mt-0.5 size-4 shrink-0", meta.text)} aria-hidden="true" />
                <span>{principle}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={toggleClassName}
            onClick={() => setFlipped(false)}
            tabIndex={flipped ? 0 : -1}
          >
            <ArrowLeft className="size-4 text-muted-foreground" aria-hidden="true" />
            Retour
          </button>
        </div>
      </motion.div>
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

// Icône contextuelle par éditeur (cf. iOS sourceIcon(for:)).
function SourceIcon({ className, publisher }: { className?: string; publisher: string }) {
  const value = publisher.toLowerCase()
  if (value.includes("assurance")) return <BriefcaseMedical className={className} />
  if (value.includes("oms") || value.includes("organisation")) return <Globe className={className} />
  if (value.includes("nejm")) return <FileText className={className} />
  if (value.includes("hcsp")) return <Landmark className={className} />
  return <FileSearch className={className} />
}

function GuidanceSources() {
  return (
    <section className="flex flex-col gap-3">
      <GuidanceSectionHeader
        icon={FileSearch}
        title="Sources utilisées"
        subtitle="Ressources publiques des repères."
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
        <SourceIcon className="size-[1.05rem]" publisher={source.publisher} />
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

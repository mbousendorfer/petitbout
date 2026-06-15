import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowUpRight,
  BriefcaseMedical,
  Check,
  ChevronRight,
  Droplet,
  Eye,
  FileSearch,
  FileText,
  Globe,
  Grid2x2,
  Landmark,
  ListChecks,
  X,
  type LucideIcon,
} from "lucide-react"

import { Disclaimer } from "@/components/primitives"
import { stageMeta, stageStateFor, type StageMeta, type StageState } from "@/components/guidance-stage-meta"
import {
  guidanceSourcesForStageIndex,
  type GuidanceSource,
  type GuidanceStage,
} from "@/data/guidance"
import { cn } from "@/lib/utils"

// Ligne « fait » de l'étape (Texture, Lait) — petite tuile d'icône teintée,
// libellé en capitales + valeur. Portée depuis iOS (GuidanceStageInfoRow).
function StageInfoRow({
  filled,
  icon: Icon,
  label,
  tint,
  value,
}: {
  filled?: boolean
  icon: LucideIcon
  label: string
  tint: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/10", tint)}
      >
        <Icon className={cn("size-4", filled && "fill-current")} />
      </span>
      <div className="min-w-0">
        <p className="text-eyebrow font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-foreground/85">{value}</p>
      </div>
    </div>
  )
}

// Badge d'état affiché à côté de « Étape N ».
function StageBadge({ state }: { state: StageState }) {
  if (state === "current") {
    return (
      <span className="rounded-full bg-status-tested/[0.14] px-2 py-0.5 text-label font-bold text-status-tested">
        Actuel
      </span>
    )
  }
  if (state === "past") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted-foreground/[0.12] px-2 py-0.5 text-label font-bold text-muted-foreground">
        <Check className="size-3" aria-hidden="true" />
        Terminé
      </span>
    )
  }
  return null
}

export function GuidanceStageCard({
  className,
  currentStageIndex,
  fixedWidth = false,
  index,
  stage,
}: {
  className?: string
  currentStageIndex: number
  /** `true` pour le carrousel (largeur + hauteur fixes), sinon pleine largeur. */
  fixedWidth?: boolean
  index: number
  stage: GuidanceStage
}) {
  const [open, setOpen] = useState(false)
  const state = stageStateFor(index, currentStageIndex)
  const isCurrent = state === "current"
  const isPast = state === "past"
  const meta = stageMeta[index] ?? stageMeta[0]
  const Icon = meta.icon

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4 rounded-hero border bg-card p-4 text-left",
          isCurrent
            ? "border-status-tested/40 shadow-card"
            : isPast
              ? "border-border/30"
              : "border-border/55 shadow-soft",
          isPast && "opacity-60",
          fixedWidth ? "h-[22.5rem] w-[17rem] shrink-0 snap-start" : "w-full",
          className,
        )}
      >
        {/* En-tête — pastille teintée + étape/badge + tranche d'âge. */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn("flex size-[3.25rem] shrink-0 items-center justify-center rounded-full", meta.softBg, meta.text)}
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("text-label font-bold uppercase tracking-[0.1em]", meta.text)}>
                Étape {index + 1}
              </span>
              <StageBadge state={state} />
            </div>
            <p className="mt-1 font-rounded text-2xl font-extrabold leading-none tracking-[-0.01em] text-foreground">
              {stage.ageRange}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.01em] text-foreground">{stage.title}</p>

        <div className="flex flex-col gap-2.5">
          <StageInfoRow icon={Grid2x2} label="Texture" value={stage.texture} tint={meta.text} />
          <StageInfoRow icon={Droplet} label="Lait" value={stage.milk} tint={meta.text} filled />
        </div>

        {fixedWidth && <div className="flex-1" aria-hidden="true" />}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Voir les ${stage.principles.length} repères à retenir pour ${stage.ageRange}`}
          className={cn(
            "flex min-h-[2.875rem] w-full items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            meta.chipBg,
            meta.chipBorder,
            meta.text,
          )}
        >
          <ListChecks className="size-4 shrink-0" aria-hidden="true" />
          À retenir · {stage.principles.length}
          <ChevronRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <GuidanceStageDetailSheet
          index={index}
          meta={meta}
          stage={stage}
          state={state}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// Groupe « À retenir » / « Points de vigilance » du détail — carte teintée avec
// pastilles de coche pleines (porté depuis GuidanceStageDetailSheet.detailGroup).
function DetailGroup({
  badgeBg,
  border,
  icon: Icon,
  items,
  symbol,
  tint,
  title,
}: {
  badgeBg: string
  border: string
  icon: LucideIcon
  items: string[]
  symbol: "check" | "alert"
  tint: string
  title: string
}) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-card border bg-card p-4 shadow-soft", border)}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3.5", tint)} aria-hidden="true" />
        <h3 className={cn("text-label font-bold uppercase tracking-[0.08em]", tint)}>{title}</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item, itemIndex) => (
          <li key={itemIndex} className="flex items-start gap-2.5 text-sm leading-5 text-foreground">
            <span
              aria-hidden="true"
              className={cn("mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-card", badgeBg)}
            >
              {symbol === "check" ? (
                <Check className="size-3" strokeWidth={3} />
              ) : (
                <span className="text-[0.7rem] font-extrabold leading-none">!</span>
              )}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
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

function SourceRow({ last, source }: { last: boolean; source: GuidanceSource }) {
  return (
    <a
      className={cn(
        "group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-status-tested/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-status-tested/60",
        !last && "border-b border-border/40",
      )}
      href={source.url}
      rel="noreferrer"
      target="_blank"
    >
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-status-tested/[0.09] text-status-tested"
      >
        <SourceIcon className="size-4" publisher={source.publisher} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-xs font-semibold text-muted-foreground">{source.publisher}</span>
          <span className="shrink-0 text-label font-medium text-muted-foreground/70">{source.year}</span>
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

// Feuille de détail d'une étape — héros centré + « À retenir » + « Points de
// vigilance » + sources + mention médicale. Reprend le motif de feuille de
// FoodPanel (portail + verrouillage du scroll + fermeture Échap).
function GuidanceStageDetailSheet({
  index,
  meta,
  onClose,
  stage,
  state,
}: {
  index: number
  meta: StageMeta
  onClose: () => void
  stage: GuidanceStage
  state: StageState
}) {
  const Icon = meta.icon
  const isCurrent = state === "current"
  const sources = guidanceSourcesForStageIndex(index)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <>
      <div
        className="sheet-overlay fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
        data-state="open"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${stage.ageRange} — ${stage.title}`}
        data-side="bottom"
        data-state="open"
        className="sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88svh] min-h-[58svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] border-t bg-background shadow-lg lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(820px,calc(100vh-4rem))] lg:w-[min(620px,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[1.75rem] lg:border"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-card/85 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-3">
          <div className="flex flex-col gap-5">
            {/* Héros centré — pastille, étape, tranche d'âge, sous-titre. */}
            <div className="relative overflow-hidden rounded-hero border border-border/40 bg-card px-4 pb-5 pt-7 text-center shadow-soft">
              <div
                aria-hidden="true"
                className={cn("pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b to-transparent", meta.gradientFrom)}
              />
              <div className="relative flex flex-col items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[4.75rem] items-center justify-center rounded-full bg-card shadow-soft ring-1 ring-border/40",
                    meta.text,
                  )}
                >
                  <Icon className="size-8" />
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className={cn("text-label font-bold uppercase tracking-[0.1em]", meta.text)}>
                    Étape {index + 1}
                  </span>
                  {isCurrent && <StageBadge state="current" />}
                </div>
                <p className="font-rounded text-3xl font-extrabold tracking-[-0.01em] text-foreground">{stage.ageRange}</p>
                <p className="text-sm leading-5 text-muted-foreground">{stage.title}</p>
              </div>
            </div>

            <DetailGroup
              title="À retenir"
              icon={ListChecks}
              items={stage.principles}
              symbol="check"
              tint={meta.text}
              badgeBg={meta.solidBg}
              border={meta.chipBorder}
            />

            {stage.watchPoints.length > 0 && (
              <DetailGroup
                title="Points de vigilance"
                icon={Eye}
                items={stage.watchPoints}
                symbol="alert"
                tint="text-status-attention"
                badgeBg="bg-status-attention"
                border="border-status-attention/25"
              />
            )}

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <FileSearch className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-label font-bold uppercase tracking-[0.08em] text-muted-foreground">Sources</h3>
              </div>
              <div className="overflow-hidden rounded-card border bg-card/85 shadow-soft">
                {sources.map((source, sourceIndex) => (
                  <SourceRow key={source.url} source={source} last={sourceIndex === sources.length - 1} />
                ))}
              </div>
            </section>

            <Disclaimer />
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

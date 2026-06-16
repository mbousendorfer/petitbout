import { useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  BriefcaseMedical,
  ChevronLeft,
  FileSearch,
  FileText,
  Globe,
  Landmark,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { guidanceSources, type GuidanceSource } from "@/data/guidance"
import { cn } from "@/lib/utils"

export function GuidanceSourcesPage() {
  const navigate = useNavigate()

  return (
    <>
      <header className="flex items-center gap-1 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground"
          onClick={() => navigate("/guidance")}
          aria-label="Retour aux repères"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="eyebrow">Repères</p>
          <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-normal">
            Sources utilisées
          </h1>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          Ressources publiques utilisées pour construire les repères de diversification.
        </p>
        <div className="overflow-hidden rounded-card border bg-card/85 shadow-soft">
          {guidanceSources.map((source, index) => (
            <SourceRow key={source.url} source={source} last={index === guidanceSources.length - 1} />
          ))}
        </div>
      </section>
    </>
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

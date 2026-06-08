import { guidanceStages } from "@/data/guidance"
import { cn } from "@/lib/utils"

// Barre de progression des 4 étapes de diversification — portée depuis iOS
// (GuidanceStageProgressStrip). Partagée entre la carte « Repère actuel » de
// l'accueil et le hero de la page Repères.
export function StageProgressStrip({ currentStageIndex }: { currentStageIndex: number }) {
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

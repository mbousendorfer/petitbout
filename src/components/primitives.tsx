import { type ReactNode } from "react"
import { Cross, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const disclaimer =
  "Petitbout ne remplace pas l'avis d'un professionnel de santé. En cas de doute, de réaction ou de situation particulière, demande conseil."
export function PageLoading({ label }: { label: string }) {
  return (
    <>
      <Header eyebrow="Chargement" title={label} />
      <Card className="paper-surface">
        <CardContent className="py-8 text-sm text-muted-foreground" aria-live="polite">
          Préparation de la page...
        </CardContent>
      </Card>
    </>
  )
}
export function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("stagger-list", className)}>
      {children}
    </div>
  )
}

export function AnimatedListItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("stagger-list-item", className)}>
      {children}
    </div>
  )
}

export function HeroPanel({
  children,
  className,
  icon: Icon,
}: {
  children: ReactNode
  className?: string
  icon: LucideIcon
}) {
  return (
    <section className={cn("paper-surface soft-ring overflow-hidden rounded-card p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm" aria-hidden="true">
          <Icon className="size-5" />
        </span>
      </div>
    </section>
  )
}

export function SectionHeader({
  action,
  eyebrow,
  title,
}: {
  action?: ReactNode
  eyebrow?: string
  title: string
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
        <h2 className="text-xl font-bold tracking-[-0.01em]">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <Card className="paper-surface">
      <CardContent className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:px-5 sm:py-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{children}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
export function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="flex flex-col gap-1.5 pt-2">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-rounded text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em] text-foreground">
        {title}
      </h1>
    </header>
  )
}

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm",
        compact && "gap-2.5 p-3",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary",
          compact ? "size-7" : "size-8",
        )}
      >
        <Cross className={compact ? "size-3.5" : "size-4"} />
      </span>
      <p className={cn("text-sm leading-6 text-foreground/80", compact && "text-xs leading-5")}>{disclaimer}</p>
    </div>
  )
}

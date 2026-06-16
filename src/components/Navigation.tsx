import { NavLink } from "react-router-dom"
import { Carrot, ChartPie, ChevronRight, FileSearch, Settings, Sprout, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { BabyAvatar } from "@/components/BabyAvatar"

const navigationItems = [
  { to: "/", label: "Aujourd'hui", icon: Sun },
  { to: "/foods", label: "Aliments", icon: Carrot },
  { to: "/discoveries", label: "Progression", icon: ChartPie },
  { to: "/guidance", label: "Repères", icon: FileSearch },
  { to: "/settings", label: "Réglages", icon: Settings },
]

export function DesktopNav({
  ageMonths,
  avatarEmoji,
  childName,
}: {
  ageMonths: number
  avatarEmoji: string
  childName: string
}) {
  const displayName = childName.trim() ? childName.trim() : "bébé"

  return (
    <aside className="sticky top-0 hidden h-dvh py-8 lg:block">
      <nav
        aria-label="Navigation principale"
        className="paper-surface soft-ring flex h-full flex-col rounded-2xl p-3"
      >
        {/* Bandeau de marque : pastille terracotta + germe (clin d'œil à la
            diversification qui pousse) + nom et sous-titre. */}
        <div className="mb-6 flex items-center gap-3 px-2 pt-1.5">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_5px_14px_-5px_hsl(var(--primary)/0.6)]"
          >
            <Sprout className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-rounded text-base font-extrabold leading-none tracking-tight">Petitbout</p>
            <p className="mt-1.5 truncate text-[0.7rem] leading-none text-muted-foreground">
              Suivi doux de diversification
            </p>
          </div>
        </div>

        <p className="eyebrow mb-1.5 px-3 text-[0.625rem]">Menu</p>
        <div className="grid gap-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex min-h-11 items-center gap-2.5 rounded-xl pl-2 pr-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Accent latéral sur l'élément actif. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {/* Icône en pastille : teintée terracotta quand active, sobre sinon
                      (taille fixe → aucun décalage entre états). */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-[1.15rem]" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Carnet de bébé ancré en bas : équilibre la colonne et offre un accès
            direct au profil. */}
        <NavLink
          to="/profile"
          aria-label={`Profil de ${displayName}`}
          className="group mt-auto flex items-center gap-2.5 rounded-xl border border-border/55 bg-card/55 p-2 transition-colors hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <BabyAvatar emoji={avatarEmoji} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold leading-tight tracking-[-0.01em]">{displayName}</span>
            <span className="block truncate text-xs leading-tight text-muted-foreground">{ageMonths} mois</span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground/55 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          />
        </NavLink>
      </nav>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="mobile-bottom-nav mx-auto w-full max-w-2xl border-t bg-background px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 shadow-nav lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-eyebrow font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive && "bg-secondary text-secondary-foreground shadow-sm",
              )
            }
          >
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

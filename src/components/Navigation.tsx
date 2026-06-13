import { NavLink } from "react-router-dom"
import { Carrot, ChartPie, FileSearch, Settings, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  { to: "/", label: "Aujourd'hui", icon: Sun },
  { to: "/foods", label: "Aliments", icon: Carrot },
  { to: "/discoveries", label: "Progression", icon: ChartPie },
  { to: "/guidance", label: "Repères", icon: FileSearch },
  { to: "/settings", label: "Réglages", icon: Settings },
]

export function DesktopNav() {
  return (
    <aside className="sticky top-0 hidden h-dvh py-8 lg:block">
      <nav
        aria-label="Navigation principale"
        className="paper-surface soft-ring flex h-full flex-col rounded-2xl p-3"
      >
        <div className="mb-5 px-3 pt-2">
          <p className="text-lg font-semibold tracking-normal">Petitbout</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Suivi doux de diversification</p>
        </div>
        <div className="grid gap-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive && "bg-secondary text-secondary-foreground shadow-sm",
                )
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-2xl border-t bg-background/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 shadow-nav backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[0.625rem] font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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


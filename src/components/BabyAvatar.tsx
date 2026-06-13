import { cn } from "@/lib/utils"

// Avatar du bébé : emoji sur pastille teintée argile.
// Portage de BabyAvatarView (DiversiOSApp/.../Settings/BabyAvatar.swift) — version emoji seul.
export function BabyAvatar({
  className,
  emoji,
  size = 56,
}: {
  className?: string
  emoji: string
  size?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.52), lineHeight: 1 }}
    >
      {emoji || "👶"}
    </span>
  )
}

// Emojis proposés, repris verbatim de BabyAvatarCatalog (BabyAvatar.swift:34).
const babyAvatarSections: Array<{ title: string; emojis: string[] }> = [
  {
    title: "Bébé",
    emojis: [
      "👶", "👶🏻", "👶🏼", "👶🏽", "👶🏾", "👶🏿",
      "👦", "👦🏻", "👦🏼", "👦🏽", "👦🏾", "👦🏿",
      "👧", "👧🏻", "👧🏼", "👧🏽", "👧🏾", "👧🏿",
      "🧒",
    ],
  },
  {
    title: "Personnages",
    emojis: [
      "🐻", "🐰", "🦊", "🐱", "🐶", "🐼",
      "🦁", "🐯", "🐨", "🐸", "🐵", "🐷",
      "🦄", "🐥", "🐧", "🦉", "🐙", "🦋",
    ],
  },
]

export function BabyAvatarPicker({
  onSelect,
  value,
}: {
  onSelect: (emoji: string) => void
  value: string
}) {
  return (
    // Hauteur plafonnée + scroll vertical contenu : empreinte compacte et fixe,
    // tout en gardant des cibles tactiles ≥44px et un espacement ≥8px.
    <div className="max-h-52 overflow-y-auto overscroll-contain rounded-xl border bg-muted/20 p-3">
      <div className="grid gap-3">
        {babyAvatarSections.map((section) => (
          <div key={section.title} className="grid gap-2">
            <p className="eyebrow sticky top-0 z-10 -mx-3 bg-muted/20 px-3 pb-1 pt-0.5 backdrop-blur-sm">
              {section.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {section.emojis.map((emoji) => {
                const isSelected = value === emoji

                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    aria-pressed={isSelected}
                    aria-label={`Avatar ${emoji}`}
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full border text-[2rem] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-primary/50 bg-primary/16 ring-2 ring-primary/50"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

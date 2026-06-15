import { Calendar, Hand, Leaf, Utensils, type LucideIcon } from "lucide-react"

// Teinte d'une étape, indexée sur sa position — portée depuis iOS
// (guidanceStageTint / guidanceStageIcon) : olive → feuille → ardoise → prune.
// Les classes sont écrites en entier pour rester détectables par Tailwind.
export type StageMeta = {
  icon: LucideIcon
  /** Couleur de teinte (texte/icône). */
  text: string
  /** Pastille d'en-tête : teinte à ~14 %. */
  softBg: string
  /** Fond du bouton « À retenir » : teinte à 10 %. */
  chipBg: string
  /** Contour du bouton « À retenir » : teinte à 20 %. */
  chipBorder: string
  /** Aplat plein (pastille de coche du détail). */
  solidBg: string
  /** Départ du dégradé du héros de détail : teinte à 25 %. */
  gradientFrom: string
}

export const stageMeta: StageMeta[] = [
  {
    icon: Calendar,
    text: "text-category-fat",
    softBg: "bg-category-fat/[0.14]",
    chipBg: "bg-category-fat/10",
    chipBorder: "border-category-fat/25",
    solidBg: "bg-category-fat",
    gradientFrom: "from-category-fat/25",
  },
  {
    icon: Leaf,
    text: "text-status-tested",
    softBg: "bg-status-tested/[0.14]",
    chipBg: "bg-status-tested/10",
    chipBorder: "border-status-tested/25",
    solidBg: "bg-status-tested",
    gradientFrom: "from-status-tested/25",
  },
  {
    icon: Hand,
    text: "text-category-dairy",
    softBg: "bg-category-dairy/[0.14]",
    chipBg: "bg-category-dairy/10",
    chipBorder: "border-category-dairy/25",
    solidBg: "bg-category-dairy",
    gradientFrom: "from-category-dairy/25",
  },
  {
    icon: Utensils,
    text: "text-category-protein",
    softBg: "bg-category-protein/[0.14]",
    chipBg: "bg-category-protein/10",
    chipBorder: "border-category-protein/25",
    solidBg: "bg-category-protein",
    gradientFrom: "from-category-protein/25",
  },
]

export type StageState = "past" | "current" | "upcoming"

export function stageStateFor(index: number, currentStageIndex: number): StageState {
  if (index < currentStageIndex) return "past"
  if (index === currentStageIndex) return "current"
  return "upcoming"
}

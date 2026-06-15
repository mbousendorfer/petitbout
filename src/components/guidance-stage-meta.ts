import { Calendar, Hand, Leaf, Utensils, type LucideIcon } from "lucide-react"

export const stageMeta: Array<{ icon: LucideIcon; text: string; iconBg: string; iconBgCurrent: string }> = [
  { icon: Calendar, text: "text-category-fat", iconBg: "bg-category-fat/10", iconBgCurrent: "bg-category-fat/20" },
  { icon: Leaf, text: "text-status-tested", iconBg: "bg-status-tested/10", iconBgCurrent: "bg-status-tested/20" },
  { icon: Hand, text: "text-category-dairy", iconBg: "bg-category-dairy/10", iconBgCurrent: "bg-category-dairy/20" },
  { icon: Utensils, text: "text-category-protein", iconBg: "bg-category-protein/10", iconBgCurrent: "bg-category-protein/20" },
]

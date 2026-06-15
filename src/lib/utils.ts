import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge that our custom DiversiType tokens are FONT SIZES, not
// colors. Without this, `text-eyebrow` / `text-label` are mistaken for text
// colors and silently dropped when a `cn()` also sets a `text-*` color
// (e.g. the bottom nav: `text-eyebrow` + `text-muted-foreground`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["eyebrow", "label"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        status: {
          tested: "hsl(var(--status-tested))",
          "tested-foreground": "hsl(var(--status-tested-foreground))",
          untested: "hsl(var(--status-untested))",
          "untested-foreground": "hsl(var(--status-untested-foreground))",
          reaction: "hsl(var(--status-reaction))",
          "reaction-foreground": "hsl(var(--status-reaction-foreground))",
          season: "hsl(var(--status-season))",
          "season-foreground": "hsl(var(--status-season-foreground))",
          "season-month": "hsl(var(--status-season-month))",
          "season-month-foreground": "hsl(var(--status-season-month-foreground))",
          attention: "hsl(var(--status-attention))",
          "attention-foreground": "hsl(var(--status-attention-foreground))",
        },
        category: {
          vegetable: "hsl(var(--cat-vegetable))",
          fruit: "hsl(var(--cat-fruit))",
          starch: "hsl(var(--cat-starch))",
          protein: "hsl(var(--cat-protein))",
          dairy: "hsl(var(--cat-dairy))",
          fat: "hsl(var(--cat-fat))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-text)"],
        rounded: ["var(--font-rounded)"],
      },
      fontSize: {
        // Argile micro-type (DiversiType): uppercase eyebrows + small labels.
        // Pure font-size tokens so they stay drop-in with explicit leading-*.
        eyebrow: "0.625rem", // 10px — uppercase micro labels
        label: "0.6875rem", // 11px — small labels / captions
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        // Argile card radii (DiversiRadius): calmer, less pillowy surfaces.
        card: "1.25rem",
        hero: "1.5rem",
      },
      boxShadow: {
        // Argile elevation: short, subtle, warm — replaces the long soft shadows.
        soft: "0 3px 10px -4px hsl(var(--shadow-color) / 0.12)",
        card: "0 6px 18px -10px hsl(var(--shadow-color) / 0.18)",
        nav: "0 -8px 28px -16px hsl(var(--shadow-color) / 0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config

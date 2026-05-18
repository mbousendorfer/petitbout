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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 18px 45px -30px hsl(var(--shadow-color) / 0.38)",
        card: "0 18px 48px -36px hsl(var(--shadow-color) / 0.42)",
        nav: "0 -18px 48px -34px hsl(var(--shadow-color) / 0.48)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config

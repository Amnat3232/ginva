/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // 60-30-10 Color System - Synced with design-tokens.json
        ginva: {
          // 60% PEACE - Backgrounds
          bg: '#050c06',
          'bg-secondary': '#070d07',
          'bg-tertiary': '#0d1c0e',
          'bg-card': '#09160a',

          // 30% LOGIC - Border
          border: '#1a3a1c',

          // 10% ACTION - Primary Accent (Ginva Green)
          green: '#00e676',
          'green-hover': '#00ff85',
          'green-dim': '#00b359',

          // Legacy/secondary accents (kept for backward compatibility)
          orange: '#fa6849',
          red: '#ef4444',
          blue: '#3b82f6',
          yellow: '#eab308',

          // Text colors
          text: '#e8f5e9',
          'text-secondary': '#81c784',
          'text-muted': '#4a6b4c',
        },
      },

      // Typography - Synced with design-tokens.json
      fontFamily: {
        heading: ['"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },

      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },

      // Z-Index Scale (for better management)
      zIndex: {
        'base': '0',
        'dropdown': '10',
        'sticky': '20',
        'modal': '30',
        'popover': '25',
        'tooltip': '50',
        'toast': '60',
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ginva: {
          navy: "#0A1628",
          gold: "#D4AF37",
          cyan: "#00D4AA",
          slate: "#1E293B",
          silver: "#94A3B8",
          red: "#EF4444",
          amber: "#F59E0B",
        },
        primary: "#F59E0B",
        secondary: "#FBBF24",
        cta: "#8B5CF6",
        background: "#0F172A",
        text: "#F8FAFC",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Exo 2", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        thai: ["Kanit", "Prompt", "sans-serif"],
      },
      backgroundImage: {
        "protection-gradient":
          "linear-gradient(135deg, #00D4AA 0%, #0A1628 100%)",
        "gold-shine":
          "linear-gradient(90deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)",
        "glass-bg":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        glass: "10px",
        "glass-lg": "20px",
      },
      zIndex: {
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        dropdown: "100",
        modal: "200",
        tooltip: "300",
      },
    },
  },
  plugins: [],
};

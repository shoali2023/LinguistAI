import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(216 34% 17%)",
        input: "hsl(216 34% 17%)",
        ring: "hsl(185 96% 45%)",
        background: "hsl(222 47% 11%)",
        foreground: "hsl(210 40% 98%)",
        card: "hsl(222 47% 14%)",
        muted: "hsl(217 33% 20%)",
        accent: "hsl(185 96% 45%)",
        danger: "hsl(0 84% 60%)",
        success: "hsl(142 76% 42%)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 40px rgba(15, 23, 42, 0.35)"
      },
      keyframes: {
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.2s ease-in-out infinite"
      }
    }
  },
  plugins: [forms]
};

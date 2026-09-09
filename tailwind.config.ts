import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4ed",
          100: "#ffe4d3",
          200: "#ffc4a6",
          300: "#ff9c6e",
          400: "#ff6d33",
          500: "#f9490c",
          600: "#ea3306",
          700: "#c22308",
          800: "#9a1d0e",
          900: "#7c1c0f",
          950: "#430b04",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c8",
          400: "#8591a9",
          500: "#64728d",
          600: "#4f5b73",
          700: "#414a5e",
          800: "#39404f",
          900: "#1a1e28",
          950: "#0f1116",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;

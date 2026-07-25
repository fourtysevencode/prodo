/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#9D72FF", // Electric Purple
        "secondary": "#00F5FF", // Cyan Neon
        "tertiary": "#4B0082", // Indigo
        "accent": "#7B68EE", // Medium Slate Blue
        "lavender": "#2E1A47", // Deep Violet
        "heart-red": "#FF4D6D",
        "tertiary-container": "#0b0a09",
        "outline": "#2D3261",
        "on-background": "#e5e2e1",
        "primary-container": "#0a0a0a",
        "on-primary": "#313030",
        "on-primary-container": "#7b7979",
        "surface-container-highest": "#353434",
        "inverse-surface": "#e5e2e1",
        "on-tertiary-fixed": "#1d1b1a",
        "on-error": "#690005",
        "background": "#0B0E23",
        "secondary-fixed-dim": "#c6c6c7",
        "on-tertiary-container": "#7c7977",
        "on-secondary-fixed": "#1a1c1c",
        "on-surface": "#E0E0FF",
        "secondary-container": "#454747",
        "on-error-container": "#ffdad6",
        "tertiary-fixed": "#e6e1df",
        "tertiary-fixed-dim": "#cac6c3",
        "on-primary-fixed-variant": "#474646",
        "on-primary-fixed": "#1c1b1b",
        "surface-container-high": "#2b2a2a",
        "primary-fixed-dim": "#c9c6c5",
        "on-surface-variant": "#c4c7c7",
        "surface": "#1A1C3D",
        "inverse-on-surface": "#313030",
        "surface-container-low": "#1c1b1b",
        "error-container": "#93000a",
        "on-secondary-container": "#b4b5b5",
        "error": "#ffb4ab",
        "on-tertiary": "#32302f",
        "secondary-fixed": "#e2e2e2",
        "on-secondary-fixed-variant": "#454747",
        "inverse-primary": "#5f5e5e",
        "outline-variant": "#444748",
        "surface-dim": "#141313",
        "on-secondary": "#2f3131",
        "primary-fixed": "#e5e2e1",
        "on-tertiary-fixed-variant": "#484645",
        "surface-container": "#201f1f",
        "surface-container-lowest": "#0e0e0e",
        "surface-variant": "#353434",
        "surface-tint": "#c9c6c5",
        "surface-bright": "#3a3939",
        "crimson": "#DC143C",
        "amber": "#FFBF00",
        "emerald": "#50C878"
      },
      fontFamily: {
        "sans": ["Quicksand", "sans-serif"],
        "display": ["Nunito", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
        "6xl": "48px",
      },
      spacing: {
        "container-padding": "24px",
        "border-weight": "1px",
        "gutter": "12px",
        "unit": "6px"
      }
    },
  },
  plugins: [],
}

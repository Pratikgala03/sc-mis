import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F3",
        card: "#FFFFFF",
        primary: "#D9C6A5",
        accent: "#7B8B6F",
        success: "#5C8A5C",
        warning: "#D4A24C",
        danger: "#C26D5A",
        text: {
          DEFAULT: "#2D2D2D",
          muted: "#7A7A7A",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

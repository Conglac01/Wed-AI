import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#E8F1FD",
          100: "#D0E4FB",
          200: "#A1C9F7",
          300: "#72AEF3",
          400: "#3E7FDF",
          500: "#1E5FD4",
          600: "#1B55BF",
          700: "#1A4BA8",
          800: "#164094",
          900: "#12357A",
        },
        brand: {
          blue: "#1E5FD4",
          "blue-hover": "#1A4BA8",
          "blue-light": "#E3F2FD",
          green: "#10B981",
          "green-light": "#ECFDF5",
          purple: "#8B5CF6",
          "purple-light": "#F3E8FF",
          orange: "#F59E0B",
          "orange-light": "#FEF3C7",
        },
        surface: {
          form: "#F8F9FB",
          border: "#EBEBEB",
        },
      },
    },
  },
  plugins: [],
};

export default config;

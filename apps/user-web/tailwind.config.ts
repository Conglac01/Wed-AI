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
          500: "#0047CC",
          600: "#0047CC",
          700: "#003399",
          800: "#002B80",
          900: "#002266",
        },
        brand: {
          blue: "#0047CC",
          "blue-hover": "#003399",
          "blue-light": "#E8F1FD",
          green: "#10B981",
          "green-light": "#ECFDF5",
          purple: "#8B5CF6",
          "purple-light": "#F3E8FF",
          orange: "#F59E0B",
          "orange-light": "#FEF3C7",
        },
        salary: {
          DEFAULT: "#E85D04",
        },
        navy: {
          DEFAULT: "#0D1B3E",
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

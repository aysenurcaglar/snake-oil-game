/** @type {import('tailwindcss').Config} */
import typographyPlugin from "@tailwindcss/typography";
import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [typographyPlugin, daisyui],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#a855f7",
          "primary-content": "#ffffff",
          secondary: "#F2E6FE",
          accent: "#F6EEFE",
          neutral: "#ffffff",
          "base-100": "#ffffff",
          info: "#007fbe",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#f43f5e",
        },
      },
    ],
  },
  theme: {
    extend: {
      textColor: {
        DEFAULT: "#ffffff",
      },
    },
  },
};

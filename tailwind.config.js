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
          primary: "#b3ce35",
          secondary: "#f4f8e1",
          accent: "#f7faeb",
          neutral: "#121505",
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
    extend: {},
  },
};

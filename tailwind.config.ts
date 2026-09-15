import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paypal: {
          navy: "#003087",
          dark: "#001C64",
          blue: "#0070BA",
          sky: "#009CDE",
          mist: "#D9E3F0",
          smoke: "#F5F7FA",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 6px 24px rgba(0, 48, 135, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

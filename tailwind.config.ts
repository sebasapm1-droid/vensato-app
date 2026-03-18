import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        vensato: {
          base: "#F7F9F8",
          surface: "#FFFFFF",
          "brand-primary": "#6B9080",
          "text-main": "#1F2924",
          "accent-punch": "#E07A5F",
          "text-secondary": "#728178",
          "border-subtle": "#E4EAE7",
          success: "#4CAF82",
          warning: "#F0B429",
          danger: "#E53E3E",
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        ui: ["var(--font-ui)", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;

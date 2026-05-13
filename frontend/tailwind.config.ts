import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        thinking: {
          "0%, 80%, 100%": { opacity: "0.2", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-4px)" },
        },
      },
      animation: {
        "thinking-1": "thinking 1.4s ease-in-out infinite 0s",
        "thinking-2": "thinking 1.4s ease-in-out infinite 0.2s",
        "thinking-3": "thinking 1.4s ease-in-out infinite 0.4s",
      },
    },
  },
  plugins: [],
};
export default config;

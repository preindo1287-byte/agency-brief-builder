import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Pretendard", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 20px 80px -40px rgba(24, 24, 27, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;

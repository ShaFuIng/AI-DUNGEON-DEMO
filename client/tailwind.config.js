/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "Noto Sans TC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(6, 7, 10, 0.38)",
        ember: "0 0 34px rgba(245, 158, 11, 0.24)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050608",
        foreground: "#f8fafc",
        card: "#09090b",
        border: "rgba(255,255,255,0.1)",
        primary: "#d20a11",
        muted: "#94a3b8",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        fight: "0 20px 40px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        sand: "#eef3ff",
        clay: "#d9e4ff",
        jade: "#2b5bff",
        ember: "#76e2ff"
      },
      boxShadow: {
        glow: "0 25px 50px rgba(0,0,0,0.12)"
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "\"Sora\"", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

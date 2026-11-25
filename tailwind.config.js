/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        displayBn: [
          "var(--font-display-bn)",
          "var(--font-serif-bn)",
          "Noto Serif Bengali",
          "serif",
        ],
        serifBn: ["var(--font-serif-bn)", "Noto Serif Bengali", "serif"],
        sansBn: ["var(--font-sans-bn)", "Hind Siliguri", "sans-serif"],
        masthead: ["var(--font-masthead)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

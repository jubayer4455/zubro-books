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
        serifBn: ["var(--font-serif-bn)", "Noto Serif Bengali", "Tiro Bangla", "serif"],
        sansBn: ["var(--font-sans-bn)", "Hind Siliguri", "sans-serif"],
      },
    },
  },
  plugins: [],
};

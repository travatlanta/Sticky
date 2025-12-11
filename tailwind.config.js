/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef7ee",
          100: "#fdedd6",
          200: "#fad7ac",
          300: "#f6b976",
          400: "#f1923f",
          500: "#ee7518",
          600: "#df5a0e",
          700: "#b9420e",
          800: "#933514",
          900: "#772e13",
          950: "#401408",
        },
      },
    },
  },
  plugins: [],
};

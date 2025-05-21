/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "brand" color scale (blues) – you can tweak shades as needed
        brand: {
          50:  "#eef6ff",
          100: "#dceeff",
          200: "#b2dbff",
          300: "#84c6ff",
          400: "#52acff",
          500: "#2993ec",
          600: "#2563eb", // original "blue-600" or pick your favorite as main
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // "accent" color scale (pinks) – you can tweak these too
        accent: {
          50:  "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6", // original pink-400
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
      },
    },
  },
  plugins: [
    // If you’d like better default form resets, uncomment:
    // require('@tailwindcss/forms'),
    // If you’d like nicer typography defaults, uncomment:
    // require('@tailwindcss/typography'),
  ],
};

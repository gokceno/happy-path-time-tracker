/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "shades-of-uranian-blue-uranian-blue-100": "#e5f3ff",
        "tag-tints-orange": "#fdf2e2",
        "shades-of-coral-coral-100": "#ffdbcc",
        "shades-of-pigment-green-pigment-green-50": "#ebf6ef",
        "shades-of-cavendish-cavendish-100": "#fff5b8",
        "shades-of-dark-08": "rgba(17, 23, 24, 0.08)",
        "secondary-coral": "#ff8a5b",
        "shades-of-teal-teal-300": "#54a7b0",
        "primary-real-white": "#fff",
        "primary-dark-night": "#111718",
        "shades-of-cavendish-cavendish-300": "#ffea66",
        "shades-of-light-white-04": "rgba(255, 255, 255, 0.04)",
        "shades-of-cadet-gray-cadet-gray-500": "#88a7aa",
        "shades-of-light-white-88": "rgba(255, 255, 255, 0.88)",
        "shades-of-teal-teal-400": "#3396a1",
        "shades-of-light-white-64": "rgba(255, 255, 255, 0.64)",
        "shades-of-teal-teal-50": "#e6f2f3",
        "shades-of-cadet-gray-cadet-gray-900": "#394647",
        "primary-light-baby-powder": "#f7f7f2",
        "shades-of-dark-16": "rgba(17, 23, 24, 0.16)",
        "shades-of-cadet-gray-cadet-gray-200": "#c8d7d8",
        "shades-of-dark-04": "rgba(17, 23, 24, 0.04)",
        "shades-of-cadet-gray-cadet-gray-50": "#f3f6f7",
        "shades-of-cadet-gray-cadet-gray-600": "#7c989b",
        "shades-of-cadet-gray-cadet-gray-400": "#a0b9bb",
        "shades-of-non-photo-blue-non-photo-blue-200": "#d6f4f9",
        "shades-of-coral-coral-50": "#fff3ef",
        "shades-of-teal-teal-500": "#007c89",
      },
      fontFamily: {
        "primary-small-body-h5-semibold": "Figtree",
        "primary-small-body-h5-medium": "Figtree",
        "roboto-mono": "'Roboto Mono'",
        "space-mono": "'Space Mono'",
      },
      borderRadius: {
        "9xl": "28px",
        "80xl": "99px",
        "81xl": "100px",
        "12xs": "1px",
        "29xl": "48px",
      },
    },
    fontSize: {
      sm: "0.88rem",
      lgi: "1.19rem",
      base: "1rem",
      "3xl": "1.38rem",
      "4xl": "1.44rem",
      xs: "0.75rem",
      inherit: "inherit",
    },
  },
  corePlugins: {
    preflight: false,
  },
};

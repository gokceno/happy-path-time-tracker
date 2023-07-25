/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "shades-of-cadet-gray-cadet-gray-400": "#a0b9bb",
        "shades-of-cadet-gray-cadet-gray-50": "#f3f6f7",
        "shades-of-uranian-blue-uranian-blue-100": "#e5f3ff",
        "shades-of-non-photo-blue-non-photo-blue-200": "#d6f4f9",
        "shades-of-coral-coral-100": "#ffdbcc",
        "shades-of-cavendish-cavendish-100": "#fff5b8",
        "primary-light-baby-powder": "#f7f7f2",
        "shades-of-dark-16": "rgba(17, 23, 24, 0.16)",
        "shades-of-cadet-gray-cadet-gray-900": "#394647",
        "shades-of-light-white-64": "rgba(255, 255, 255, 0.64)",
        "primary-real-white": "#fff",
        "shades-of-light-white-04": "rgba(255, 255, 255, 0.04)",
        "shades-of-cadet-gray-cadet-gray-500": "#88a7aa",
        "shades-of-light-white-88": "rgba(255, 255, 255, 0.88)",
        "shades-of-teal-teal-400": "#3396a1",
        "shades-of-teal-teal-50": "#e6f2f3",
        "primary-dark-night": "#111718",
        "shades-of-coral-coral-50": "#fff3ef",
        "shades-of-dark-04": "rgba(17, 23, 24, 0.04)",
        "shades-of-dark-08": "rgba(17, 23, 24, 0.08)",
        "secondary-coral": "#ff8a5b",
      },
      fontFamily: {
        "primary-small-body-h5-medium": "Figtree",
        "roboto-mono": "'Roboto Mono'",
      },
      borderRadius: {
        "9xl": "28px",
        "81xl": "100px",
        "12xs": "1px",
        "29xl": "48px",
        "80xl": "99px",
      },
    },
    fontSize: {
      base: "16px",
      sm: "14px",
      lgi: "19px",
      "3xl": "22px",
      "4xl": "23px",
      xs: "12px",
    },
  },
  corePlugins: {
    preflight: false,
  },
};

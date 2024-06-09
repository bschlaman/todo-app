/** @type {import('tailwindcss').Config} */
export const content = ["./src/client/**/*.tsx", "./dist/**/*.html"];
export const theme = {
  extend: {},
  fontFamily: {
    // sans: ["Montserrat Variable", "sans-serif"],
    // serif: ["Merriweather", "serif"],
    // This may not be used if it is overriden by gatsby plugins.
    // Need to set the font directly in `global.css`
    // mono: ["Victor Mono Variable", "monospace"],
  },
};
export const plugins = [];

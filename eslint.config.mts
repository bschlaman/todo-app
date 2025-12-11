import { defineConfig } from "eslint/config";
import globals from "globals";
import css from "@eslint/css";
import ts from "typescript-eslint";
import tailwind from "eslint-plugin-tailwindcss";
import reactPlugin from "eslint-plugin-react";
import prettierConfig from "eslint-plugin-prettier/recommended";

// note that jiti is required to run eslint with nodejs for some reason

export default defineConfig([
  {
    ignores: ["dist"],
  },
  ts.configs.recommended,
  ...tailwind.configs["flat/recommended"],
  prettierConfig, // note this includes eslint-config-prettier
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...reactPlugin.configs.flat["recommended"],
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    rules: {
      "css/no-duplicate-imports": "error",
    },
    extends: ["css/recommended"],
  },
]);

import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import functional from "eslint-plugin-functional/flat";
import imprt from "eslint-plugin-import"; // 'import' is ambiguous & prettier has trouble
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tailwind from "eslint-plugin-tailwindcss";

export default [
  {
    ignores: ["dist"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      functional,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@typescript-eslint": typescriptEslint,
      import: imprt,
    },
    languageOptions: {
      parser: tsParser,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
    },
  },
  ...tailwind.configs["flat/recommended"],
  eslintPluginPrettierRecommended,
];

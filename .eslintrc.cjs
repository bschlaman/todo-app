module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "standard-with-typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  plugins: ["react", "react-hooks", "prettier"],
  parserOptions: { project: "./tsconfig.json" },
  rules: {
    "prettier/prettier": "error",
    "consistent-return": "error",
    "no-else-return": "error",
    "block-scoped-var": "error",
    eqeqeq: "error",
    "no-var": "error",
    "prefer-const": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "standard-with-typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["react", "react-hooks", "prettier", "import"],
  parserOptions: { project: "./tsconfig.json" },
  // required for plugin:import/typescript?
  parser: "@typescript-eslint/parser",
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
  // don't search beyond this directory for config files
  root: true,
};

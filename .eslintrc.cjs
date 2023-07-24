module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "standard-with-typescript",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  plugins: ["react", "react-hooks", "@typescript-eslint", "import"],
  // required for plugin:import/typescript?
  parser: "@typescript-eslint/parser",
  // required by some standard-with-typescript rules;
  // causes bug with symlinks
  parserOptions: { project: "./tsconfig.json" },
  rules: {
    // plugin:prettier/recommended turns this off
    "arrow-body-style": ["error", "as-needed"],
    "consistent-return": "error",
    "no-else-return": "error",
    "block-scoped-var": "error",
    "eqeqeq": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
  // don't search beyond this directory for config files
  root: true,
};
